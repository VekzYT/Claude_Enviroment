class_name ChunkMesher
extends RefCounted
## Turns a chunk's raw voxel bytes into renderable surfaces.
##
## One instance is reused per worker thread. The chunk plus a one block skirt of
## its four neighbours is copied into a flat "padded" byte buffer first, so the
## hot loop can find any neighbour with a single addition instead of a function
## call and a pile of bounds checks. Only faces that touch something see-through
## are emitted, and each corner gets an ambient-occlusion value so the geometry
## reads as solid even before any light touches it.

const CH := 16
const HEIGHT := 128
const PAD_W := CH + 2          # 18
const PAD_LAYER := PAD_W * PAD_W  # 324 bytes per y slice

# Pad offsets of the six neighbours.
const OFF_PX := 1
const OFF_NX := -1
const OFF_PZ := PAD_W
const OFF_NZ := -PAD_W
const OFF_PY := PAD_LAYER
const OFF_NY := -PAD_LAYER

const FACE_OFFSET := [OFF_PX, OFF_NX, OFF_PY, OFF_NY, OFF_PZ, OFF_NZ]

const FACE_NORMAL := [
	Vector3(1, 0, 0), Vector3(-1, 0, 0), Vector3(0, 1, 0),
	Vector3(0, -1, 0), Vector3(0, 0, 1), Vector3(0, 0, -1),
]

## Corner offsets of each face, wound clockwise seen from outside (Godot's
## front-face convention).
const FACE_VERTS := [
	[Vector3i(1, 0, 1), Vector3i(1, 1, 1), Vector3i(1, 1, 0), Vector3i(1, 0, 0)],  # +X
	[Vector3i(0, 0, 0), Vector3i(0, 1, 0), Vector3i(0, 1, 1), Vector3i(0, 0, 1)],  # -X
	[Vector3i(0, 1, 0), Vector3i(1, 1, 0), Vector3i(1, 1, 1), Vector3i(0, 1, 1)],  # +Y
	[Vector3i(0, 0, 0), Vector3i(0, 0, 1), Vector3i(1, 0, 1), Vector3i(1, 0, 0)],  # -Y
	[Vector3i(0, 0, 1), Vector3i(0, 1, 1), Vector3i(1, 1, 1), Vector3i(1, 0, 1)],  # +Z
	[Vector3i(1, 0, 0), Vector3i(1, 1, 0), Vector3i(0, 1, 0), Vector3i(0, 0, 0)],  # -Z
]

const FACE_UVS := [
	[Vector2(0, 1), Vector2(0, 0), Vector2(1, 0), Vector2(1, 1)],  # +X
	[Vector2(0, 1), Vector2(0, 0), Vector2(1, 0), Vector2(1, 1)],  # -X
	[Vector2(0, 0), Vector2(1, 0), Vector2(1, 1), Vector2(0, 1)],  # +Y
	[Vector2(0, 0), Vector2(0, 1), Vector2(1, 1), Vector2(1, 0)],  # -Y
	[Vector2(0, 1), Vector2(0, 0), Vector2(1, 0), Vector2(1, 1)],  # +Z
	[Vector2(0, 1), Vector2(0, 0), Vector2(1, 0), Vector2(1, 1)],  # -Z
]

## Flat shading per face direction so the world has shape without relying on
## the sun alone.
const FACE_SHADE := [0.80, 0.74, 1.0, 0.55, 0.88, 0.68]

## Brightness for ambient-occlusion levels 0 (deep corner) to 3 (open).
const AO_SHADE := [0.48, 0.66, 0.84, 1.0]

## _ao_off[face][vertex] = [side_a, side_b, corner] pad offsets.
var _ao_off: Array = []

var _pad := PackedByteArray()
var _pad_layers := 0


func _init() -> void:
	_build_ao_table()


func _build_ao_table() -> void:
	var axis_off := [OFF_PX, OFF_PY, OFF_PZ]   # offset per axis for the +1 direction
	_ao_off.resize(6)
	for face in 6:
		var normal: Vector3 = FACE_NORMAL[face]
		var normal_axis := 0
		if absf(normal.y) > 0.5:
			normal_axis = 1
		elif absf(normal.z) > 0.5:
			normal_axis = 2
		var per_vertex: Array = []
		for v in 4:
			var o: Vector3i = FACE_VERTS[face][v]
			var comps := [o.x, o.y, o.z]
			var tangents: Array = []
			for axis in 3:
				if axis == normal_axis:
					continue
				# comps[axis] is 0 or 1 -> step -1 or +1 along that axis.
				var step: int = 1 if comps[axis] == 1 else -1
				tangents.append(int(axis_off[axis]) * step)
			var a: int = tangents[0]
			var b: int = tangents[1]
			per_vertex.append(PackedInt32Array([a, b, a + b]))
		_ao_off[face] = per_vertex


# ------------------------------------------------------------------ public

## Builds every surface for a chunk.
##
## data      raw voxels of this chunk
## neighbours [-X, +X, -Z, +Z] raw voxels; an empty array counts as air
## max_y     highest y that contains anything, so empty sky is skipped
##
## Returns { "opaque": Array|null, "transparent": Array|null,
##           "collision": PackedVector3Array }
## where each surface Array is [positions, normals, uvs, colors].
func build(data: PackedByteArray, neighbours: Array, max_y: int) -> Dictionary:
	var top := clampi(max_y + 1, 1, HEIGHT - 1)
	_fill_pad(data, neighbours, top)

	var opaque := _mesh_layer(top, int(BlockDB.LAYER_OPAQUE))
	var collision: PackedVector3Array = opaque["collision"]

	var transparent: Dictionary = {}
	if opaque["saw_other_layer"]:
		transparent = _mesh_layer(top, int(BlockDB.LAYER_TRANSPARENT))
		var tc: PackedVector3Array = transparent["collision"]
		if tc.size() > 0:
			collision.append_array(tc)

	return {
		"opaque": opaque["surface"],
		"transparent": transparent.get("surface", null),
		"collision": collision,
	}


# ----------------------------------------------------------------- padding

func _fill_pad(data: PackedByteArray, neighbours: Array, top: int) -> void:
	# y index -1 .. top+1 maps to pad rows 0 .. top+2
	var layers := top + 3
	var needed := layers * PAD_LAYER
	if _pad.size() < needed:
		_pad.resize(needed)
	_pad_layers = layers

	# One memset beats a byte-by-byte loop by a wide margin.
	_pad.fill(0)

	# Floor sentinel: an opaque layer under y = 0 hides the bottom of the world.
	for i in PAD_LAYER:
		_pad[i] = BlockDB.STONE

	var nx: PackedByteArray = neighbours[0]
	var px: PackedByteArray = neighbours[1]
	var nz: PackedByteArray = neighbours[2]
	var pz: PackedByteArray = neighbours[3]
	var has_nx := nx.size() > 0
	var has_px := px.size() > 0
	var has_nz := nz.size() > 0
	var has_pz := pz.size() > 0

	var y_limit := mini(top + 1, HEIGHT - 1)
	for y in range(0, y_limit + 1):
		var src_y := y << 8              # y * 256
		var dst_y := (y + 1) * PAD_LAYER
		for z in CH:
			var src := src_y | (z << 4)
			var dst := dst_y + (z + 1) * PAD_W + 1
			for x in CH:
				_pad[dst + x] = data[src + x]
			if has_nx:
				_pad[dst - 1] = nx[src + 15]
			if has_px:
				_pad[dst + CH] = px[src]
		if has_nz:
			var src_n := src_y | (15 << 4)
			var dst_n := dst_y + 1
			for x in CH:
				_pad[dst_n + x] = nz[src_n + x]
		if has_pz:
			var src_p := src_y
			var dst_p := dst_y + (CH + 1) * PAD_W + 1
			for x in CH:
				_pad[dst_p + x] = pz[src_p + x]


# ----------------------------------------------------------------- meshing

func _mesh_layer(top: int, layer: int) -> Dictionary:
	var opaque_flags: PackedByteArray = BlockDB.opaque_flags
	var solid_flags: PackedByteArray = BlockDB.solid_flags
	var liquid_flags: PackedByteArray = BlockDB.liquid_flags
	var layer_flags: PackedByteArray = BlockDB.layer_flags
	var uv_rects: Array = BlockDB.uv_rects

	var cap := 4096
	var pos := PackedVector3Array()
	var nrm := PackedVector3Array()
	var uvs := PackedVector2Array()
	var cols := PackedColorArray()
	pos.resize(cap)
	nrm.resize(cap)
	uvs.resize(cap)
	cols.resize(cap)
	var n := 0

	var col_cap := 2048
	var col := PackedVector3Array()
	col.resize(col_cap)
	var cn := 0

	var saw_other := false

	for y in range(0, top + 1):
		var pad_y := (y + 1) * PAD_LAYER
		for z in CH:
			var pad_row := pad_y + (z + 1) * PAD_W + 1
			for x in CH:
				var pi := pad_row + x
				var id := _pad[pi]
				if id == 0:
					continue
				var block_layer := layer_flags[id]
				if block_layer != layer:
					saw_other = true
					continue

				var self_opaque := opaque_flags[id] == 1
				var is_solid := solid_flags[id] == 1
				var is_liquid := liquid_flags[id] == 1
				var rects: Array = uv_rects[id]

				# Liquids sit slightly below the full block so the surface reads
				# as water rather than a solid cube.
				var top_y := 1.0
				if is_liquid and liquid_flags[_pad[pi + OFF_PY]] == 0:
					top_y = 0.875

				for face in 6:
					var nid := _pad[pi + FACE_OFFSET[face]]
					if self_opaque:
						if opaque_flags[nid] == 1:
							continue
					else:
						if nid == id or opaque_flags[nid] == 1:
							continue

					var verts: Array = FACE_VERTS[face]
					var face_uvs: Array = FACE_UVS[face]
					var rect: Rect2 = rects[face]
					var normal: Vector3 = FACE_NORMAL[face]
					var shade: float = FACE_SHADE[face]
					var ao_face: Array = _ao_off[face]
					var nbase: int = pi + FACE_OFFSET[face]

					# Corner shading.
					var b0 := _corner_shade(nbase, ao_face[0], opaque_flags) * shade
					var b1 := _corner_shade(nbase, ao_face[1], opaque_flags) * shade
					var b2 := _corner_shade(nbase, ao_face[2], opaque_flags) * shade
					var b3 := _corner_shade(nbase, ao_face[3], opaque_flags) * shade

					# Corner positions and atlas UVs, written out longhand
					# because a helper call here costs more than the maths.
					var fx := float(x)
					var fy := float(y)
					var fz := float(z)
					var o0: Vector3i = verts[0]
					var o1: Vector3i = verts[1]
					var o2: Vector3i = verts[2]
					var o3: Vector3i = verts[3]
					var p0 := Vector3(fx + o0.x, fy + (top_y if o0.y == 1 else 0.0), fz + o0.z)
					var p1 := Vector3(fx + o1.x, fy + (top_y if o1.y == 1 else 0.0), fz + o1.z)
					var p2 := Vector3(fx + o2.x, fy + (top_y if o2.y == 1 else 0.0), fz + o2.z)
					var p3 := Vector3(fx + o3.x, fy + (top_y if o3.y == 1 else 0.0), fz + o3.z)

					var rx := rect.position.x
					var ry := rect.position.y
					var rw := rect.size.x
					var rh := rect.size.y
					var q0: Vector2 = face_uvs[0]
					var q1: Vector2 = face_uvs[1]
					var q2: Vector2 = face_uvs[2]
					var q3: Vector2 = face_uvs[3]
					var u0 := Vector2(rx + q0.x * rw, ry + q0.y * rh)
					var u1 := Vector2(rx + q1.x * rw, ry + q1.y * rh)
					var u2 := Vector2(rx + q2.x * rw, ry + q2.y * rh)
					var u3 := Vector2(rx + q3.x * rw, ry + q3.y * rh)

					if n + 6 > cap:
						cap *= 2
						pos.resize(cap)
						nrm.resize(cap)
						uvs.resize(cap)
						cols.resize(cap)

					# Flipping the quad's diagonal towards the darker pair keeps
					# ambient occlusion from looking creased.
					if b0 + b2 < b1 + b3:
						pos[n] = p1; uvs[n] = u1; cols[n] = Color(b1, b1, b1)
						pos[n + 1] = p2; uvs[n + 1] = u2; cols[n + 1] = Color(b2, b2, b2)
						pos[n + 2] = p3; uvs[n + 2] = u3; cols[n + 2] = Color(b3, b3, b3)
						pos[n + 3] = p1; uvs[n + 3] = u1; cols[n + 3] = Color(b1, b1, b1)
						pos[n + 4] = p3; uvs[n + 4] = u3; cols[n + 4] = Color(b3, b3, b3)
						pos[n + 5] = p0; uvs[n + 5] = u0; cols[n + 5] = Color(b0, b0, b0)
					else:
						pos[n] = p0; uvs[n] = u0; cols[n] = Color(b0, b0, b0)
						pos[n + 1] = p1; uvs[n + 1] = u1; cols[n + 1] = Color(b1, b1, b1)
						pos[n + 2] = p2; uvs[n + 2] = u2; cols[n + 2] = Color(b2, b2, b2)
						pos[n + 3] = p0; uvs[n + 3] = u0; cols[n + 3] = Color(b0, b0, b0)
						pos[n + 4] = p2; uvs[n + 4] = u2; cols[n + 4] = Color(b2, b2, b2)
						pos[n + 5] = p3; uvs[n + 5] = u3; cols[n + 5] = Color(b3, b3, b3)
					for k in 6:
						nrm[n + k] = normal

					if is_solid:
						if cn + 6 > col_cap:
							col_cap *= 2
							col.resize(col_cap)
						col[cn] = pos[n]
						col[cn + 1] = pos[n + 1]
						col[cn + 2] = pos[n + 2]
						col[cn + 3] = pos[n + 3]
						col[cn + 4] = pos[n + 4]
						col[cn + 5] = pos[n + 5]
						cn += 6

					n += 6

	pos.resize(n)
	nrm.resize(n)
	uvs.resize(n)
	cols.resize(n)
	col.resize(cn)

	var surface = null
	if n > 0:
		surface = [pos, nrm, uvs, cols]
	return {"surface": surface, "collision": col, "saw_other_layer": saw_other}


func _corner_shade(nbase: int, offsets: PackedInt32Array, opaque_flags: PackedByteArray) -> float:
	var i0 := nbase + offsets[0]
	var i1 := nbase + offsets[1]
	var i2 := nbase + offsets[2]
	var pad_size := _pad_layers * PAD_LAYER
	var s1 := 0
	var s2 := 0
	var cr := 0
	if i0 >= 0 and i0 < pad_size:
		s1 = opaque_flags[_pad[i0]]
	if i1 >= 0 and i1 < pad_size:
		s2 = opaque_flags[_pad[i1]]
	if i2 >= 0 and i2 < pad_size:
		cr = opaque_flags[_pad[i2]]
	if s1 == 1 and s2 == 1:
		return AO_SHADE[0]
	return AO_SHADE[3 - (s1 + s2 + cr)]

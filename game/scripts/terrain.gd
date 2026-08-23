extends Node3D
class_name TerrainGrid

# Heightmap terrain: rolling hills, a few mountain masses, and flat pads where
# the hand-placed props live.
#
# This node owns the single source of truth for ground height. The forest
# scatter asks it where the ground is and where the clearings are, so scattered
# props can never drift off the surface the player actually walks on.
#
# Heights are baked into a grid once, then sampled with bilinear interpolation.
# Reading back from the same grid the mesh and the collider were built from is
# what guarantees a tree's base sits exactly on the triangle under it.

const HALF := 240.0
const CELL := 4.0

const HILL_AMP := 10.5
const DETAIL_AMP := 1.9
const RIDGE_AMP := 7.0

# Mountain masses raised inside the playable area. Kept clear of every point of
# interest so no landmark ends up halfway up a cliff.
const MOUNTAIN_CENTERS: Array[Vector2] = [
	Vector2(152.0, -152.0),
	Vector2(-172.0, 158.0),
	Vector2(160.0, 148.0),
	Vector2(-172.0, -158.0),
]
# The third is deliberately broad enough to walk to the top of; the rest are
# steep scenery.
const MOUNTAIN_RADII: Array[float] = [78.0, 62.0, 76.0, 64.0]
const MOUNTAIN_PEAKS: Array[float] = [44.0, 34.0, 29.0, 38.0]

# Flat pads. Radius is fully level; blend is the ramp out to natural ground.
# Height is the pad's elevation — everything sits at 0 except the lookout,
# which is a real mesa the player climbs via its own blend slope.
const POI_CENTERS: Array[Vector2] = [
	Vector2(0.0, 0.0),        # survivor camp / spawn
	Vector2(-40.0, -130.0),   # ranger watchtower
	Vector2(95.0, -85.0),     # abandoned cabin
	Vector2(130.0, 40.0),     # crashed convoy
	Vector2(-120.0, 95.0),    # chapel ruins
	Vector2(-150.0, -30.0),   # radio tower
	Vector2(30.0, 140.0),     # grave clearing
	Vector2(60.0, -30.0),     # pond
	Vector2(-90.0, -95.0),    # rocky lookout (raised)
]
const POI_RADII: Array[float] = [24.0, 15.0, 17.0, 20.0, 21.0, 15.0, 19.0, 27.0, 26.0]
const POI_BLENDS: Array[float] = [18.0, 14.0, 14.0, 16.0, 16.0, 14.0, 16.0, 18.0, 22.0]
const POI_HEIGHTS: Array[float] = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 12.0]
# How bare each pad is. Roads and camps are worn to dirt; the lookout stays
# rocky and the pond keeps some ground cover at its rim.
const POI_DIRT: Array[float] = [1.0, 0.85, 0.8, 0.9, 0.7, 0.8, 0.95, 0.45, 0.0]

# Dirt roads out of camp, graded level like a real cut road.
const ROAD_ENDS: Array[Vector2] = [
	Vector2(0.0, 0.0), Vector2(130.0, 40.0),
	Vector2(0.0, 0.0), Vector2(-120.0, 95.0),
	Vector2(0.0, 0.0), Vector2(-40.0, -130.0),
	Vector2(0.0, 0.0), Vector2(30.0, 140.0),
]
const ROAD_HALF := 6.0
const ROAD_BLEND := 17.0

var heights: PackedFloat32Array = PackedFloat32Array()
# 0 = full ground cover, 1 = bare dirt. Painted into vertex colour so roads and
# clearings are part of the terrain surface instead of flat slabs laid on top.
var dirt: PackedFloat32Array = PackedFloat32Array()
var side: int = 0
var built := false

func _ready() -> void:
	add_to_group("terrain")
	ensure_built()

# Safe to call from anywhere; the first caller pays for the build. This keeps
# the forest scatter from depending on sibling _ready() ordering.
func ensure_built() -> void:
	if built:
		return
	built = true
	side = int(round(HALF * 2.0 / CELL)) + 1
	_bake_heights()
	_build_mesh_and_collider()
	_build_backdrop_mountains()

# ------------------------------------------------------------------ height

func _smoothstep01(t: float) -> float:
	var c: float = clamp(t, 0.0, 1.0)
	return c * c * (3.0 - 2.0 * c)

func _distance_to_segment(p: Vector2, a: Vector2, b: Vector2) -> float:
	var ab: Vector2 = b - a
	var len_sq: float = ab.length_squared()
	if len_sq < 0.0001:
		return p.distance_to(a)
	var t: float = clamp((p - a).dot(ab) / len_sq, 0.0, 1.0)
	return p.distance_to(a + ab * t)

# Returns how strongly this spot is pulled toward a flat pad, and what height
# that pad sits at. Weight 1 means fully level.
func _flatten(p: Vector2) -> Vector2:
	var best_w: float = 0.0
	var best_h: float = 0.0
	for i in POI_CENTERS.size():
		var d: float = p.distance_to(POI_CENTERS[i])
		var r: float = POI_RADII[i]
		var blend: float = POI_BLENDS[i]
		var w: float = 0.0
		if d <= r:
			w = 1.0
		elif d < r + blend:
			w = _smoothstep01(1.0 - (d - r) / blend)
		if w > best_w:
			best_w = w
			best_h = POI_HEIGHTS[i]
	var road_w: float = 0.0
	var seg: int = 0
	while seg + 1 < ROAD_ENDS.size():
		var d: float = _distance_to_segment(p, ROAD_ENDS[seg], ROAD_ENDS[seg + 1])
		var w: float = 0.0
		if d <= ROAD_HALF:
			w = 1.0
		elif d < ROAD_HALF + ROAD_BLEND:
			w = _smoothstep01(1.0 - (d - ROAD_HALF) / ROAD_BLEND)
		if w > road_w:
			road_w = w
		seg += 2
	# Roads always grade to zero, so they blend against the pad they run into
	# rather than fighting it.
	if road_w > best_w:
		return Vector2(road_w, 0.0)
	return Vector2(best_w, best_h)

# Worn-ground mask. Edges are pushed around by noise so a road never reads as
# a ruled line and a clearing never reads as a circle.
func _dirt_at(p: Vector2, edge_noise: FastNoiseLite) -> float:
	var wobble: float = edge_noise.get_noise_2d(p.x, p.y) * 5.5
	var best: float = 0.0
	for i in POI_CENTERS.size():
		if POI_DIRT[i] <= 0.0:
			continue
		var d: float = p.distance_to(POI_CENTERS[i]) + wobble
		var core: float = POI_RADII[i] * 0.8
		var edge: float = POI_RADII[i] + 5.0
		var w: float = 0.0
		if d <= core:
			w = 1.0
		elif d < edge:
			w = _smoothstep01(1.0 - (d - core) / (edge - core))
		w *= POI_DIRT[i]
		if w > best:
			best = w
	var seg: int = 0
	while seg + 1 < ROAD_ENDS.size():
		var d: float = _distance_to_segment(p, ROAD_ENDS[seg], ROAD_ENDS[seg + 1]) + wobble
		var w: float = 0.0
		if d <= ROAD_HALF * 0.8:
			w = 1.0
		elif d < ROAD_HALF + 4.0:
			w = _smoothstep01(1.0 - (d - ROAD_HALF * 0.8) / (ROAD_HALF + 4.0 - ROAD_HALF * 0.8))
		if w > best:
			best = w
		seg += 2
	return best

func _raw_height(x: float, z: float, hills: FastNoiseLite, detail: FastNoiseLite, ridge: FastNoiseLite) -> float:
	var h: float = hills.get_noise_2d(x, z) * HILL_AMP
	h += detail.get_noise_2d(x, z) * DETAIL_AMP
	for i in MOUNTAIN_CENTERS.size():
		var d: float = Vector2(x, z).distance_to(MOUNTAIN_CENTERS[i])
		var r: float = MOUNTAIN_RADII[i]
		if d < r:
			# Squared falloff gives a rounded foot and a defined peak rather
			# than the obvious cone shape a linear falloff produces.
			var t: float = _smoothstep01(1.0 - d / r)
			var mass: float = t * t
			h += MOUNTAIN_PEAKS[i] * mass
			h += ridge.get_noise_2d(x * 1.7, z * 1.7) * RIDGE_AMP * t
	return h

func _bake_heights() -> void:
	var hills := FastNoiseLite.new()
	hills.seed = 4471
	hills.noise_type = FastNoiseLite.TYPE_SIMPLEX
	hills.frequency = 0.0034
	hills.fractal_octaves = 4
	hills.fractal_lacunarity = 2.1

	var detail := FastNoiseLite.new()
	detail.seed = 9931
	detail.noise_type = FastNoiseLite.TYPE_SIMPLEX
	detail.frequency = 0.019
	detail.fractal_octaves = 2

	var ridge := FastNoiseLite.new()
	ridge.seed = 2207
	ridge.noise_type = FastNoiseLite.TYPE_SIMPLEX
	ridge.frequency = 0.011
	ridge.fractal_octaves = 3

	var edge_noise := FastNoiseLite.new()
	edge_noise.seed = 5519
	edge_noise.noise_type = FastNoiseLite.TYPE_SIMPLEX
	edge_noise.frequency = 0.035
	edge_noise.fractal_octaves = 2

	heights.resize(side * side)
	dirt.resize(side * side)
	for iz in side:
		var z: float = -HALF + float(iz) * CELL
		for ix in side:
			var x: float = -HALF + float(ix) * CELL
			var raw: float = _raw_height(x, z, hills, detail, ridge)
			var f: Vector2 = _flatten(Vector2(x, z))
			var blended: float = raw + (f.y - raw) * f.x
			heights[iz * side + ix] = blended
			dirt[iz * side + ix] = _dirt_at(Vector2(x, z), edge_noise)

func _grid_height(ix: int, iz: int) -> float:
	var cx: int = clampi(ix, 0, side - 1)
	var cz: int = clampi(iz, 0, side - 1)
	return heights[cz * side + cx]

# Bilinear sample of the baked grid. Matches the rendered surface exactly.
func height_at(x: float, z: float) -> float:
	if not built:
		ensure_built()
	var fx: float = (x + HALF) / CELL
	var fz: float = (z + HALF) / CELL
	var ix: int = int(floor(fx))
	var iz: int = int(floor(fz))
	var tx: float = fx - float(ix)
	var tz: float = fz - float(iz)
	var h00: float = _grid_height(ix, iz)
	var h10: float = _grid_height(ix + 1, iz)
	var h01: float = _grid_height(ix, iz + 1)
	var h11: float = _grid_height(ix + 1, iz + 1)
	var a: float = h00 + (h10 - h00) * tx
	var b: float = h01 + (h11 - h01) * tx
	return a + (b - a) * tz

# 0 = flat ground, 1 = vertical. Used to keep props off cliff faces.
func slope_at(x: float, z: float) -> float:
	var e: float = CELL
	var hx: float = height_at(x + e, z) - height_at(x - e, z)
	var hz: float = height_at(x, z + e) - height_at(x, z - e)
	var n := Vector3(-hx, 2.0 * e, -hz).normalized()
	return 1.0 - clamp(n.y, 0.0, 1.0)

# Clearings the scatter must avoid: flat pads plus the road corridors.
func in_clearing(p: Vector2, poi_margin: float, road_clearance: float) -> bool:
	for i in POI_CENTERS.size():
		if p.distance_to(POI_CENTERS[i]) < POI_RADII[i] + poi_margin:
			return true
	var seg: int = 0
	while seg + 1 < ROAD_ENDS.size():
		if _distance_to_segment(p, ROAD_ENDS[seg], ROAD_ENDS[seg + 1]) < road_clearance:
			return true
		seg += 2
	return false

# ------------------------------------------------------------------- build

func _build_mesh_and_collider() -> void:
	var vcount: int = side * side
	var verts := PackedVector3Array()
	var norms := PackedVector3Array()
	var uvs := PackedVector2Array()
	var cols := PackedColorArray()
	verts.resize(vcount)
	norms.resize(vcount)
	uvs.resize(vcount)
	cols.resize(vcount)

	for iz in side:
		var z: float = -HALF + float(iz) * CELL
		for ix in side:
			var x: float = -HALF + float(ix) * CELL
			var idx: int = iz * side + ix
			var h: float = heights[idx]
			verts[idx] = Vector3(x, h, z)
			# Central differences give continuous normals across the whole
			# sheet, so hills shade smoothly instead of reading as facets.
			var hl: float = _grid_height(ix - 1, iz)
			var hr: float = _grid_height(ix + 1, iz)
			var hd: float = _grid_height(ix, iz - 1)
			var hu: float = _grid_height(ix, iz + 1)
			norms[idx] = Vector3(hl - hr, 2.0 * CELL, hd - hu).normalized()
			uvs[idx] = Vector2(x, z)
			var dv: float = dirt[idx]
			cols[idx] = Color(dv, dv, dv, 1.0)

	var quads: int = side - 1
	var indices := PackedInt32Array()
	indices.resize(quads * quads * 6)
	var faces := PackedVector3Array()
	faces.resize(quads * quads * 6)
	var i: int = 0
	for iz in quads:
		for ix in quads:
			var v00: int = iz * side + ix
			var v10: int = iz * side + ix + 1
			var v01: int = (iz + 1) * side + ix
			var v11: int = (iz + 1) * side + ix + 1
			# Wind so the surface faces up. Godot builds a triangle's plane as
			# (p1-p3) x (p1-p2); the opposite order points the normal into the
			# ground, which makes the mesh backface-cull from above and lets a
			# body fall straight through the collider.
			indices[i] = v00
			indices[i + 1] = v10
			indices[i + 2] = v01
			indices[i + 3] = v10
			indices[i + 4] = v11
			indices[i + 5] = v01
			faces[i] = verts[v00]
			faces[i + 1] = verts[v10]
			faces[i + 2] = verts[v01]
			faces[i + 3] = verts[v10]
			faces[i + 4] = verts[v11]
			faces[i + 5] = verts[v01]
			i += 6

	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = verts
	arrays[Mesh.ARRAY_NORMAL] = norms
	arrays[Mesh.ARRAY_TEX_UV] = uvs
	arrays[Mesh.ARRAY_COLOR] = cols
	arrays[Mesh.ARRAY_INDEX] = indices

	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)

	var mmi := MeshInstance3D.new()
	mmi.name = "TerrainMesh"
	mmi.mesh = mesh
	mmi.material_override = _terrain_material()
	add_child(mmi)

	_build_skirt(verts)

	var shape := ConcavePolygonShape3D.new()
	shape.set_faces(faces)
	var body := StaticBody3D.new()
	body.name = "TerrainBody"
	var cs := CollisionShape3D.new()
	cs.shape = shape
	body.add_child(cs)
	add_child(body)

# The height grid stops at HALF, which left a hard black gap between the last
# triangle and the sky. This carries the outer edge of the sheet far past the
# view distance, seamlessly, so the ground always meets the horizon.
func _build_skirt(verts: PackedVector3Array) -> void:
	const OUTER := 1500.0
	var k: float = OUTER / HALF
	var ring: PackedInt32Array = PackedInt32Array()
	# Walk the grid boundary once, in order.
	for ix in side:
		ring.append(ix)
	for iz in range(1, side):
		ring.append(iz * side + side - 1)
	for ix in range(side - 2, -1, -1):
		ring.append((side - 1) * side + ix)
	for iz in range(side - 2, 0, -1):
		ring.append(iz * side)

	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in ring.size():
		var a: Vector3 = verts[ring[i]]
		var b: Vector3 = verts[ring[(i + 1) % ring.size()]]
		# Outer points map the square outward, so the seam stays exact.
		var ao := Vector3(a.x * k, -18.0, a.z * k)
		var bo := Vector3(b.x * k, -18.0, b.z * k)
		st.set_color(Color(0.0, 0.0, 0.0, 1.0))
		st.set_uv(Vector2(a.x, a.z))
		st.add_vertex(a)
		st.set_uv(Vector2(bo.x, bo.z))
		st.add_vertex(bo)
		st.set_uv(Vector2(b.x, b.z))
		st.add_vertex(b)
		st.set_uv(Vector2(a.x, a.z))
		st.add_vertex(a)
		st.set_uv(Vector2(ao.x, ao.z))
		st.add_vertex(ao)
		st.set_uv(Vector2(bo.x, bo.z))
		st.add_vertex(bo)
	st.generate_normals()
	var inst := MeshInstance3D.new()
	inst.name = "HorizonSkirt"
	inst.mesh = st.commit()
	inst.material_override = _terrain_material()
	inst.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(inst)

func _terrain_material() -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/terrain.gdshader") as Shader
	mat.set_shader_parameter("ground_albedo", load("res://textures/forest_albedo.jpg"))
	mat.set_shader_parameter("ground_normal", load("res://textures/forest_normal.jpg"))
	mat.set_shader_parameter("ground_rough", load("res://textures/forest_rough.jpg"))
	mat.set_shader_parameter("cliff_albedo", load("res://textures/rock_albedo.jpg"))
	mat.set_shader_parameter("cliff_normal", load("res://textures/rock_normal.jpg"))
	mat.set_shader_parameter("cliff_rough", load("res://textures/rock_rough.jpg"))
	mat.set_shader_parameter("dirt_albedo", load("res://textures/dirt_albedo.jpg"))
	mat.set_shader_parameter("dirt_normal", load("res://textures/dirt_normal.jpg"))
	mat.set_shader_parameter("dirt_rough", load("res://textures/dirt_rough.jpg"))
	mat.set_shader_parameter("dirt_tint", Color(0.60, 0.53, 0.42, 1.0))
	mat.set_shader_parameter("dirt_tile", 8.0)
	mat.set_shader_parameter("ground_tint", Color(0.50, 0.62, 0.36, 1.0))
	mat.set_shader_parameter("cliff_tint", Color(0.58, 0.56, 0.54, 1.0))
	mat.set_shader_parameter("ground_tile", 11.0)
	mat.set_shader_parameter("cliff_tile", 15.0)
	mat.set_shader_parameter("macro_tile", 160.0)
	mat.set_shader_parameter("slope_start", 0.14)
	mat.set_shader_parameter("slope_end", 0.30)
	mat.set_shader_parameter("normal_strength", 1.1)
	return mat

# Far peaks past the play area, purely for skyline. No collision — the player
# is stopped by the boundary long before reaching them.
func _build_backdrop_mountains() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 8812
	# Reusing the terrain material means distant peaks get the same slope-blended
	# rock as the ground instead of reading as flat grey cardboard.
	var mat: ShaderMaterial = _terrain_material()
	var snow := StandardMaterial3D.new()
	snow.albedo_color = Color(0.80, 0.83, 0.88, 1.0)
	snow.roughness = 0.85

	var spots: Array[Vector2] = [
		Vector2(-420.0, -80.0),
		Vector2(-180.0, -470.0),
		Vector2(210.0, -455.0),
		Vector2(470.0, 60.0),
		Vector2(400.0, 330.0),
		Vector2(-120.0, 500.0),
		Vector2(-480.0, 300.0),
	]
	var radii: Array[float] = [150.0, 190.0, 165.0, 205.0, 150.0, 175.0, 160.0]
	for i in spots.size():
		var p: Vector2 = spots[i]
		var peak: float = rng.randf_range(95.0, 165.0)
		var radius: float = radii[i]
		var m: ArrayMesh = _make_peak_mesh(radius, peak, rng)
		var inst := MeshInstance3D.new()
		inst.name = "BackdropPeak%d" % i
		inst.mesh = m
		inst.material_override = mat
		inst.position = Vector3(p.x, -14.0, p.y)
		inst.rotation.y = rng.randf_range(0.0, TAU)
		inst.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(inst)
		if peak > 125.0:
			var cap := MeshInstance3D.new()
			cap.name = "BackdropPeakSnow%d" % i
			cap.mesh = _make_peak_mesh(radius * 0.34, peak * 0.30, rng)
			cap.material_override = snow
			cap.position = Vector3(p.x, -14.0 + peak * 0.70, p.y)
			cap.rotation.y = inst.rotation.y
			cap.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			add_child(cap)

# A radial dome pushed around by noise, so the silhouette is irregular instead
# of the perfect cone a CylinderMesh would give.
func _make_peak_mesh(radius: float, peak: float, rng: RandomNumberGenerator) -> ArrayMesh:
	var n := FastNoiseLite.new()
	n.seed = rng.randi()
	n.noise_type = FastNoiseLite.TYPE_SIMPLEX
	n.frequency = 0.9
	n.fractal_octaves = 3

	var rings: int = 9
	var segs: int = 22
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)

	# rings x segs grid of ring points, plus an apex.
	var pts: Array[Vector3] = []
	for r in range(rings + 1):
		var rt: float = float(r) / float(rings)
		for s in range(segs):
			var a: float = TAU * float(s) / float(segs)
			var warp: float = 1.0 + n.get_noise_2d(cos(a) * 2.0, sin(a) * 2.0) * 0.30
			var rad: float = radius * rt * warp
			var hgt: float = peak * pow(1.0 - rt, 1.7)
			hgt += n.get_noise_2d(cos(a) * 3.0 + rt * 4.0, sin(a) * 3.0) * peak * 0.09 * (1.0 - rt) * rt
			pts.append(Vector3(cos(a) * rad, hgt, sin(a) * rad))
	var apex := Vector3(0.0, peak, 0.0)

	for r in range(rings):
		for s in range(segs):
			var s2: int = (s + 1) % segs
			var a0: Vector3 = pts[r * segs + s]
			var a1: Vector3 = pts[r * segs + s2]
			var b0: Vector3 = pts[(r + 1) * segs + s]
			var b1: Vector3 = pts[(r + 1) * segs + s2]
			# Ring 0 is the apex fan; wound so faces point outward.
			if r == 0:
				st.add_vertex(apex)
				st.add_vertex(b1)
				st.add_vertex(b0)
			else:
				st.add_vertex(a0)
				st.add_vertex(b1)
				st.add_vertex(b0)
				st.add_vertex(a0)
				st.add_vertex(a1)
				st.add_vertex(b1)
	st.generate_normals()
	return st.commit()

extends Node3D

# Populates the terrain with vegetation.
#
# Everything repeated is batched into MultiMeshes, so a forest of a thousand
# trees costs a handful of draw calls. Every placement asks the terrain for the
# ground height and slope, so nothing floats or buries itself on the hills, and
# nothing tries to grow on a cliff face.
#
# Shapes are deliberately not primitives: canopies and boulders are spheres and
# cones pushed around by noise, which is what stops the forest reading as a
# field of cones and boxes. Placement, tilt, scale and tint are all randomised
# per instance from a fixed seed, so it looks organic but rebuilds identically.

@export var terrain_path: NodePath = NodePath("../Terrain")

const MAP_HALF := 232.0

const CONIFER_COUNT := 900
const BROADLEAF_COUNT := 340
const DEAD_TREE_COUNT := 190
const BUSH_COUNT := 620
const ROCK_COUNT := 240
const FERN_PATCHES := 430
const FERNS_PER_PATCH := 6
const GRASS_PATCHES := 700
const GRASS_PER_PATCH := 26
const FLOWER_PATCHES := 260
const FLOWERS_PER_PATCH := 9
const HERO_DEAD_TRUNKS := 14
const HERO_STUMPS := 22

const MAX_TRIES_FACTOR := 30
const ROAD_CLEARANCE := 6.5

# Slope limits. Trees will not root on anything approaching a cliff; small
# ground cover tolerates a bit more.
const TREE_MAX_SLOPE := 0.42
const COVER_MAX_SLOPE := 0.60

const TRUNK_RADIUS_BUCKETS: Array[float] = [0.16, 0.22, 0.28, 0.34, 0.42, 0.52]

const FLOWER_COLORS: Array[Color] = [
	Color(1.00, 1.00, 0.96),
	Color(1.00, 0.86, 0.30),
	Color(0.92, 0.62, 0.78),
	Color(0.72, 0.60, 0.95),
	Color(0.95, 0.45, 0.38),
	Color(0.85, 0.90, 1.00),
]

var rng := RandomNumberGenerator.new()
var terrain: TerrainGrid = null
var tree_collision_body: StaticBody3D = null
var rock_collision_body: StaticBody3D = null
var bucket_shapes: Array[BoxShape3D] = []

# Basis.scaled() multiplies scale in on the left, which shears a mesh whose
# rotation mixes the unevenly scaled axes. Composing on the right scales along
# the mesh's own axes, which is what tilted trunks and branches need.
func _local_scale(rot: Basis, s: Vector3) -> Basis:
	return rot * Basis.IDENTITY.scaled(s)

func _ready() -> void:
	rng.seed = 20260822
	terrain = get_node_or_null(terrain_path) as TerrainGrid
	if terrain == null:
		push_error("ForestScatter: terrain not found at %s; nothing scattered." % terrain_path)
		return
	# Build order between siblings is not guaranteed, so make sure the height
	# grid exists before the first query rather than relying on _ready order.
	terrain.ensure_built()

	_setup_collision_bodies()
	_scatter_conifers()
	_scatter_broadleaf()
	_scatter_dead_trees()
	_scatter_bushes()
	_scatter_ferns()
	_scatter_rocks()
	_scatter_undergrowth()
	_scatter_flowers()
	_place_hero_props()

# ---------------------------------------------------------------- terrain io

func _ground(x: float, z: float) -> float:
	return terrain.height_at(x, z)

func _slope(x: float, z: float) -> float:
	return terrain.slope_at(x, z)

func _in_clearing(p: Vector2, poi_margin: float, road_clearance: float) -> bool:
	return terrain.in_clearing(p, poi_margin, road_clearance)

func _random_point() -> Vector2:
	return Vector2(rng.randf_range(-MAP_HALF, MAP_HALF), rng.randf_range(-MAP_HALF, MAP_HALF))

func _find_spots(count: int, poi_margin: float, road_clearance: float, max_slope: float) -> Array[Vector2]:
	var points: Array[Vector2] = []
	var tries: int = 0
	var limit: int = count * MAX_TRIES_FACTOR
	while points.size() < count and tries < limit:
		tries += 1
		var p: Vector2 = _random_point()
		if _in_clearing(p, poi_margin, road_clearance):
			continue
		if _slope(p.x, p.y) > max_slope:
			continue
		points.append(p)
	return points

# ---------------------------------------------------------------- mesh build

func _noise(seed_value: int, freq: float) -> FastNoiseLite:
	var n := FastNoiseLite.new()
	n.seed = seed_value
	n.noise_type = FastNoiseLite.TYPE_SIMPLEX
	n.frequency = freq
	n.fractal_octaves = 3
	return n

# Takes a primitive and pushes every vertex along its own direction by noise.
# Sampling the noise by position (not index) keeps duplicated seam vertices in
# agreement, so the surface never splits open.
func _deform(source: Mesh, amount: float, freq: float, seed_value: int, squash: float) -> ArrayMesh:
	var n: FastNoiseLite = _noise(seed_value, freq)
	var arrays: Array = source.surface_get_arrays(0)
	var verts: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	for i in verts.size():
		var v: Vector3 = verts[i]
		var d: float = n.get_noise_3d(v.x * 4.0, v.y * 4.0, v.z * 4.0)
		verts[i] = v * (1.0 + d * amount) * Vector3(1.0, squash, 1.0)
	arrays[Mesh.ARRAY_VERTEX] = verts

	var temp := ArrayMesh.new()
	temp.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	var st := SurfaceTool.new()
	st.create_from(temp, 0)
	st.generate_normals()
	return st.commit()

func _trunk_mesh() -> CylinderMesh:
	var m := CylinderMesh.new()
	m.top_radius = 0.5
	m.bottom_radius = 1.0
	m.height = 1.0
	m.radial_segments = 10
	m.rings = 1
	return m

func _cone_source() -> CylinderMesh:
	var m := CylinderMesh.new()
	m.top_radius = 0.04
	m.bottom_radius = 1.0
	m.height = 1.0
	m.radial_segments = 12
	m.rings = 3
	return m

func _sphere_source(segments: int, rings: int) -> SphereMesh:
	var m := SphereMesh.new()
	m.radius = 0.5
	m.height = 1.0
	m.radial_segments = segments
	m.rings = rings
	return m

func _cross_quad_mesh(width: float, height: float) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	_add_quad(st, width, height, false)
	_add_quad(st, width, height, true)
	st.generate_normals()
	return st.commit()

func _add_quad(st: SurfaceTool, w: float, h: float, rotated: bool) -> void:
	var a: Vector3
	var b: Vector3
	var c: Vector3
	var d: Vector3
	if rotated:
		a = Vector3(0.0, 0.0, -w)
		b = Vector3(0.0, 0.0, w)
		c = Vector3(0.0, h, w * 0.15)
		d = Vector3(0.0, h, -w * 0.15)
	else:
		a = Vector3(-w, 0.0, 0.0)
		b = Vector3(w, 0.0, 0.0)
		c = Vector3(w * 0.15, h, 0.0)
		d = Vector3(-w * 0.15, h, 0.0)
	st.set_uv(Vector2(0.0, 1.0))
	st.add_vertex(a)
	st.set_uv(Vector2(1.0, 1.0))
	st.add_vertex(b)
	st.set_uv(Vector2(1.0, 0.0))
	st.add_vertex(c)
	st.set_uv(Vector2(0.0, 1.0))
	st.add_vertex(a)
	st.set_uv(Vector2(1.0, 0.0))
	st.add_vertex(c)
	st.set_uv(Vector2(0.0, 0.0))
	st.add_vertex(d)

# A stem with a small crossed bloom on top. The shader decides which part is
# which from the vertex height.
func _flower_mesh() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	_add_quad(st, 0.012, 0.30, false)
	_add_quad(st, 0.012, 0.30, true)
	var petal_w: float = 0.055
	var lo: float = 0.24
	var hi: float = 0.31
	for pass_index in 2:
		var rotated: bool = pass_index == 1
		var a: Vector3
		var b: Vector3
		var c: Vector3
		var d: Vector3
		if rotated:
			a = Vector3(0.0, lo, -petal_w)
			b = Vector3(0.0, lo, petal_w)
			c = Vector3(0.0, hi, petal_w)
			d = Vector3(0.0, hi, -petal_w)
		else:
			a = Vector3(-petal_w, lo, 0.0)
			b = Vector3(petal_w, lo, 0.0)
			c = Vector3(petal_w, hi, 0.0)
			d = Vector3(-petal_w, hi, 0.0)
		st.set_uv(Vector2(0.0, 1.0))
		st.add_vertex(a)
		st.set_uv(Vector2(1.0, 1.0))
		st.add_vertex(b)
		st.set_uv(Vector2(1.0, 0.0))
		st.add_vertex(c)
		st.set_uv(Vector2(0.0, 1.0))
		st.add_vertex(a)
		st.set_uv(Vector2(1.0, 0.0))
		st.add_vertex(c)
		st.set_uv(Vector2(0.0, 0.0))
		st.add_vertex(d)
	st.generate_normals()
	return st.commit()

# ---------------------------------------------------------------- materials

func _bark_material(tint: Color, uv_scale: Vector2, roughness: float) -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/bark.gdshader") as Shader
	mat.set_shader_parameter("albedo_tex", load("res://textures/bark_albedo.jpg"))
	mat.set_shader_parameter("normal_tex", load("res://textures/bark_normal.jpg"))
	mat.set_shader_parameter("roughness_tex", load("res://textures/bark_rough.jpg"))
	mat.set_shader_parameter("base_tint", tint)
	mat.set_shader_parameter("uv_scale", uv_scale)
	mat.set_shader_parameter("normal_strength", 1.5)
	mat.set_shader_parameter("roughness_value", roughness)
	return mat

func _foliage_material(base: Color, tip: Color, pivot: float, strength: float, speed: float) -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/foliage_wind.gdshader") as Shader
	mat.set_shader_parameter("base_color", base)
	mat.set_shader_parameter("tip_color", tip)
	mat.set_shader_parameter("pivot_height", pivot)
	mat.set_shader_parameter("wind_strength", strength)
	mat.set_shader_parameter("wind_speed", speed)
	mat.set_shader_parameter("wind_frequency", 0.22)
	mat.set_shader_parameter("roughness_value", 0.92)
	return mat

func _rock_material() -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.62, 0.62, 0.63, 1.0)
	mat.albedo_texture = load("res://textures/rock_albedo.jpg")
	mat.normal_enabled = true
	mat.normal_texture = load("res://textures/rock_normal.jpg")
	mat.normal_scale = 1.3
	mat.roughness_texture = load("res://textures/rock_rough.jpg")
	mat.roughness = 0.95
	mat.uv1_triplanar = true
	mat.uv1_scale = Vector3(0.5, 0.5, 0.5)
	return mat

# ---------------------------------------------------------------- multimesh

func _add_multimesh(mesh_name: String, mesh: Mesh, material: Material,
		transforms: Array[Transform3D], colors: Array[Color], cast_shadow: bool) -> void:
	if transforms.is_empty():
		return
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = mesh
	mm.instance_count = transforms.size()
	for i in transforms.size():
		mm.set_instance_transform(i, transforms[i])
		mm.set_instance_color(i, colors[i])
	var mmi := MultiMeshInstance3D.new()
	mmi.name = mesh_name
	mmi.multimesh = mm
	mmi.material_override = material
	if not cast_shadow:
		mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mmi)

# ---------------------------------------------------------------- collision

func _setup_collision_bodies() -> void:
	tree_collision_body = StaticBody3D.new()
	tree_collision_body.name = "TreeCollision"
	add_child(tree_collision_body)
	rock_collision_body = StaticBody3D.new()
	rock_collision_body.name = "RockCollision"
	add_child(rock_collision_body)
	for r in TRUNK_RADIUS_BUCKETS:
		var shape := BoxShape3D.new()
		# Tall enough for any trunk; the overhang sits underground or above the
		# canopy where nothing can reach it, so one shape covers every height.
		shape.size = Vector3(r * 1.6, 34.0, r * 1.6)
		bucket_shapes.append(shape)

func _add_trunk_collision(pos: Vector2, ground_y: float, radius: float) -> void:
	var best: int = 0
	var best_diff: float = absf(TRUNK_RADIUS_BUCKETS[0] - radius)
	for i in TRUNK_RADIUS_BUCKETS.size():
		var diff: float = absf(TRUNK_RADIUS_BUCKETS[i] - radius)
		if diff < best_diff:
			best_diff = diff
			best = i
	var cs := CollisionShape3D.new()
	cs.shape = bucket_shapes[best]
	cs.position = Vector3(pos.x, ground_y + 12.0, pos.y)
	tree_collision_body.add_child(cs)

# ---------------------------------------------------------------- conifers

func _scatter_conifers() -> void:
	var points: Array[Vector2] = _find_spots(CONIFER_COUNT, 2.0, ROAD_CLEARANCE, TREE_MAX_SLOPE)

	var trunk_xf: Array[Transform3D] = []
	var trunk_col: Array[Color] = []
	var tier_xf: Array[Array] = [[], [], [], []]
	var tier_col: Array[Array] = [[], [], [], []]

	for p in points:
		var gy: float = _ground(p.x, p.y)
		var h: float = rng.randf_range(8.0, 19.0)
		var radius: float = 0.10 + h * 0.013
		var yaw: float = rng.randf_range(0.0, TAU)
		# A couple of degrees of lean stops the trunks looking like a pin array.
		var tilt: float = rng.randf_range(0.0, 0.055)
		var tilt_dir: float = rng.randf_range(0.0, TAU)
		var rot: Basis = Basis(Vector3(cos(tilt_dir), 0.0, sin(tilt_dir)), tilt) * Basis(Vector3.UP, yaw)

		trunk_xf.append(Transform3D(_local_scale(rot, Vector3(radius, h, radius)),
			Vector3(p.x, gy + h * 0.5, p.y)))
		var bark: float = rng.randf_range(0.72, 1.16)
		trunk_col.append(Color(bark, bark * 0.97, bark * 0.92, 1.0))

		# Firs get four tight tiers, spruces three broader ones.
		var is_fir: bool = rng.randf() < 0.55
		var slim: float = rng.randf_range(0.8, 1.25)
		var leaf: float = rng.randf_range(0.66, 1.22)
		var leaf_color := Color(leaf * 0.94, leaf, leaf * 0.88, 1.0)
		var tiers: Array[Vector3] = []
		if is_fir:
			tiers = [
				Vector3(0.40, 0.200, 0.30),
				Vector3(0.575, 0.166, 0.27),
				Vector3(0.745, 0.126, 0.24),
				Vector3(0.895, 0.078, 0.20),
			]
		else:
			tiers = [
				Vector3(0.44, 0.232, 0.34),
				Vector3(0.655, 0.176, 0.30),
				Vector3(0.855, 0.108, 0.25),
			]
		for i in tiers.size():
			var t: Vector3 = tiers[i]
			var fw: float = h * t.y * slim
			var fh: float = h * t.z
			var xf := Transform3D(_local_scale(rot, Vector3(fw, fh, fw)),
				Vector3(p.x, gy + h * t.x, p.y))
			tier_xf[i].append(xf)
			tier_col[i].append(leaf_color)

		_add_trunk_collision(p, gy, radius)

	var trunk_mesh: CylinderMesh = _trunk_mesh()
	var bark_mat: ShaderMaterial = _bark_material(Color(0.68, 0.62, 0.55, 1.0), Vector2(1.0, 3.0), 0.95)
	_add_multimesh("ConiferTrunks", trunk_mesh, bark_mat, trunk_xf, trunk_col, true)

	# Two differently deformed cones alternate between tiers so the canopy
	# silhouette never repeats exactly.
	var cone_a: ArrayMesh = _deform(_cone_source(), 0.26, 1.6, 3311, 1.0)
	var cone_b: ArrayMesh = _deform(_cone_source(), 0.30, 2.1, 7742, 1.0)
	var tier_names: Array[String] = ["ConiferCanopy1", "ConiferCanopy2", "ConiferCanopy3", "ConiferCanopy4"]
	var bases: Array[Color] = [
		Color(0.075, 0.135, 0.075, 1.0), Color(0.085, 0.150, 0.082, 1.0),
		Color(0.100, 0.170, 0.092, 1.0), Color(0.115, 0.190, 0.105, 1.0),
	]
	var tips: Array[Color] = [
		Color(0.135, 0.215, 0.105, 1.0), Color(0.155, 0.240, 0.115, 1.0),
		Color(0.180, 0.270, 0.130, 1.0), Color(0.205, 0.300, 0.145, 1.0),
	]
	for i in 4:
		var xf_list: Array[Transform3D] = []
		var col_list: Array[Color] = []
		for v in tier_xf[i]:
			xf_list.append(v)
		for c in tier_col[i]:
			col_list.append(c)
		var tier_mesh: ArrayMesh = cone_a
		if i % 2 == 1:
			tier_mesh = cone_b
		_add_multimesh(tier_names[i], tier_mesh,
			_foliage_material(bases[i], tips[i], 1.0, 0.05 + float(i) * 0.02, 0.9 + float(i) * 0.08),
			xf_list, col_list, i < 3)

# ---------------------------------------------------------------- broadleaf

func _scatter_broadleaf() -> void:
	var points: Array[Vector2] = _find_spots(BROADLEAF_COUNT, 2.0, ROAD_CLEARANCE, TREE_MAX_SLOPE)

	var trunk_xf: Array[Transform3D] = []
	var trunk_col: Array[Color] = []
	var blob_xf: Array[Transform3D] = []
	var blob_col: Array[Color] = []

	for p in points:
		var gy: float = _ground(p.x, p.y)
		var h: float = rng.randf_range(6.0, 12.5)
		var radius: float = 0.13 + h * 0.016
		var yaw: float = rng.randf_range(0.0, TAU)
		var tilt: float = rng.randf_range(0.0, 0.07)
		var tilt_dir: float = rng.randf_range(0.0, TAU)
		var rot: Basis = Basis(Vector3(cos(tilt_dir), 0.0, sin(tilt_dir)), tilt) * Basis(Vector3.UP, yaw)

		# Birches get a pale trunk, oaks a dark one — same mesh, different tint.
		var is_birch: bool = rng.randf() < 0.4
		var trunk_ratio: float = 0.5
		if is_birch:
			trunk_ratio = 0.62
		var trunk_h: float = h * trunk_ratio
		trunk_xf.append(Transform3D(_local_scale(rot, Vector3(radius, trunk_h, radius)),
			Vector3(p.x, gy + trunk_h * 0.5, p.y)))
		var shade: float = rng.randf_range(0.5, 0.8)
		if is_birch:
			shade = rng.randf_range(0.85, 1.2)
		if is_birch:
			trunk_col.append(Color(shade * 1.25, shade * 1.22, shade * 1.12, 1.0))
		else:
			trunk_col.append(Color(shade, shade * 0.92, shade * 0.82, 1.0))

		var leaf: float = rng.randf_range(0.62, 1.2)
		var warm: float = rng.randf_range(0.0, 1.0)
		var leaf_color := Color(leaf * (0.9 + warm * 0.35), leaf, leaf * 0.72, 1.0)
		# Three offset blobs make an irregular crown instead of one ball.
		var crown_y: float = gy + trunk_h + h * 0.16
		var crown_r: float = h * rng.randf_range(0.24, 0.33)
		var blobs: int = 3
		for i in blobs:
			var ang: float = rng.randf_range(0.0, TAU)
			var off: float = 0.0
			var blob_scale: float = 1.0
			if i > 0:
				off = crown_r * rng.randf_range(0.35, 0.62)
				blob_scale = rng.randf_range(0.55, 0.8)
			var s: float = crown_r * blob_scale
			var b := Basis(Vector3.UP, rng.randf_range(0.0, TAU))
			blob_xf.append(Transform3D(_local_scale(b, Vector3(s * 1.15, s * 0.9, s * 1.15)),
				Vector3(p.x + cos(ang) * off, crown_y + rng.randf_range(-0.1, 0.3) * crown_r, p.y + sin(ang) * off)))
			blob_col.append(leaf_color)

		_add_trunk_collision(p, gy, radius)

	var bark_mat: ShaderMaterial = _bark_material(Color(0.7, 0.66, 0.6, 1.0), Vector2(1.0, 2.2), 0.95)
	_add_multimesh("BroadleafTrunks", _trunk_mesh(), bark_mat, trunk_xf, trunk_col, true)
	var blob: ArrayMesh = _deform(_sphere_source(12, 7), 0.30, 1.4, 5150, 0.95)
	_add_multimesh("BroadleafCanopy", blob,
		_foliage_material(Color(0.115, 0.175, 0.085, 1.0), Color(0.235, 0.315, 0.135, 1.0), 1.2, 0.09, 1.15),
		blob_xf, blob_col, true)

# ---------------------------------------------------------------- deadfall

func _scatter_dead_trees() -> void:
	var points: Array[Vector2] = _find_spots(DEAD_TREE_COUNT, 1.0, ROAD_CLEARANCE, TREE_MAX_SLOPE)

	var trunk_xf: Array[Transform3D] = []
	var trunk_col: Array[Color] = []
	var branch_xf: Array[Transform3D] = []
	var branch_col: Array[Color] = []

	for p in points:
		var gy: float = _ground(p.x, p.y)
		var h: float = rng.randf_range(5.5, 14.0)
		var radius: float = 0.09 + h * 0.011
		var yaw: float = rng.randf_range(0.0, TAU)
		var lean: float = rng.randf_range(0.02, 0.16)
		var lean_dir: float = rng.randf_range(0.0, TAU)
		var rot: Basis = Basis(Vector3(cos(lean_dir), 0.0, sin(lean_dir)), lean) * Basis(Vector3.UP, yaw)

		trunk_xf.append(Transform3D(_local_scale(rot, Vector3(radius, h, radius)),
			Vector3(p.x, gy + h * 0.5, p.y)))
		var shade: float = rng.randf_range(0.40, 0.66)
		trunk_col.append(Color(shade, shade * 0.94, shade * 0.86, 1.0))

		for _i in rng.randi_range(2, 5):
			var by: float = rng.randf_range(0.4, 0.92) * h
			var blen: float = rng.randf_range(0.9, 2.8)
			var brad: float = radius * rng.randf_range(0.2, 0.4)
			var byaw: float = rng.randf_range(0.0, TAU)
			var bpitch: float = rng.randf_range(0.85, 1.55)
			var b_rot: Basis = Basis(Vector3.UP, byaw) * Basis(Vector3.RIGHT, bpitch)
			var offset := Vector3(cos(byaw), 0.0, sin(byaw)) * blen * 0.35
			branch_xf.append(Transform3D(_local_scale(b_rot, Vector3(brad, blen, brad)),
				Vector3(p.x, gy + by, p.y) + offset))
			branch_col.append(Color(shade * 0.9, shade * 0.85, shade * 0.78, 1.0))

		_add_trunk_collision(p, gy, radius)

	var dead_mat: ShaderMaterial = _bark_material(Color(0.5, 0.46, 0.4, 1.0), Vector2(1.0, 2.5), 1.0)
	_add_multimesh("DeadTrunks", _trunk_mesh(), dead_mat, trunk_xf, trunk_col, true)
	_add_multimesh("DeadBranches", _trunk_mesh(), dead_mat, branch_xf, branch_col, false)

# ---------------------------------------------------------------- undergrowth

func _scatter_bushes() -> void:
	var points: Array[Vector2] = _find_spots(BUSH_COUNT, 1.0, ROAD_CLEARANCE * 0.7, COVER_MAX_SLOPE)
	var xf: Array[Transform3D] = []
	var col: Array[Color] = []
	for p in points:
		var gy: float = _ground(p.x, p.y)
		var w: float = rng.randf_range(1.0, 2.8)
		var hgt: float = w * rng.randf_range(0.5, 0.85)
		var b := Basis(Vector3.UP, rng.randf_range(0.0, TAU)) * Basis(Vector3.RIGHT, rng.randf_range(-0.12, 0.12))
		xf.append(Transform3D(_local_scale(b, Vector3(w, hgt, w)), Vector3(p.x, gy + hgt * 0.40, p.y)))
		var shade: float = rng.randf_range(0.6, 1.18)
		col.append(Color(shade * 0.93, shade, shade * 0.84, 1.0))
	var bush: ArrayMesh = _deform(_sphere_source(10, 6), 0.34, 1.9, 6614, 0.85)
	_add_multimesh("Bushes", bush,
		_foliage_material(Color(0.095, 0.150, 0.080, 1.0), Color(0.190, 0.265, 0.120, 1.0), 1.0, 0.07, 1.35),
		xf, col, false)

func _scatter_ferns() -> void:
	var centers: Array[Vector2] = _find_spots(FERN_PATCHES, 0.0, ROAD_CLEARANCE * 0.55, COVER_MAX_SLOPE)
	var xf: Array[Transform3D] = []
	var col: Array[Color] = []
	for c in centers:
		for _i in FERNS_PER_PATCH:
			var angle: float = rng.randf_range(0.0, TAU)
			var dist: float = sqrt(rng.randf()) * 2.6
			var p: Vector2 = c + Vector2(cos(angle), sin(angle)) * dist
			var gy: float = _ground(p.x, p.y)
			var s: float = rng.randf_range(0.65, 1.6)
			var b: Basis = _local_scale(Basis(Vector3.UP, rng.randf_range(0.0, TAU)), Vector3(s, s, s))
			xf.append(Transform3D(b, Vector3(p.x, gy, p.y)))
			var shade: float = rng.randf_range(0.66, 1.22)
			col.append(Color(shade * 0.9, shade, shade * 0.8, 1.0))
	_add_multimesh("Ferns", _cross_quad_mesh(0.42, 0.85),
		_foliage_material(Color(0.140, 0.210, 0.095, 1.0), Color(0.300, 0.380, 0.160, 1.0), 0.85, 0.09, 1.5),
		xf, col, false)

func _scatter_undergrowth() -> void:
	var centers: Array[Vector2] = _find_spots(GRASS_PATCHES, 0.0, ROAD_CLEARANCE * 0.5, COVER_MAX_SLOPE)
	var xf: Array[Transform3D] = []
	var col: Array[Color] = []
	for c in centers:
		for _i in GRASS_PER_PATCH:
			var angle: float = rng.randf_range(0.0, TAU)
			var dist: float = sqrt(rng.randf()) * 3.2
			var p: Vector2 = c + Vector2(cos(angle), sin(angle)) * dist
			var gy: float = _ground(p.x, p.y)
			var s: float = rng.randf_range(0.65, 1.7)
			var b: Basis = _local_scale(Basis(Vector3.UP, rng.randf_range(0.0, TAU)), Vector3(s, s, s))
			xf.append(Transform3D(b, Vector3(p.x, gy, p.y)))
			var shade: float = rng.randf_range(0.68, 1.22)
			col.append(Color(shade, shade, shade * 0.9, 1.0))
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/grass_wind.gdshader") as Shader
	mat.set_shader_parameter("root_color", Color(0.150, 0.190, 0.090, 1.0))
	mat.set_shader_parameter("tip_color", Color(0.380, 0.450, 0.190, 1.0))
	mat.set_shader_parameter("blade_height", 0.34)
	_add_multimesh("Undergrowth", _cross_quad_mesh(0.055, 0.34), mat, xf, col, false)

func _scatter_flowers() -> void:
	# Wildflowers favour open, gently sloping ground, so they read as meadow
	# pockets in the clearings rather than an even sprinkle over the map.
	var centers: Array[Vector2] = _find_spots(FLOWER_PATCHES, 0.0, ROAD_CLEARANCE * 0.45, 0.30)
	var xf: Array[Transform3D] = []
	var col: Array[Color] = []
	for c in centers:
		# One species per patch, the way real wildflowers clump.
		var patch_color: Color = FLOWER_COLORS[rng.randi_range(0, FLOWER_COLORS.size() - 1)]
		for _i in FLOWERS_PER_PATCH:
			var angle: float = rng.randf_range(0.0, TAU)
			var dist: float = sqrt(rng.randf()) * 2.0
			var p: Vector2 = c + Vector2(cos(angle), sin(angle)) * dist
			var gy: float = _ground(p.x, p.y)
			var s: float = rng.randf_range(0.7, 1.45)
			var b: Basis = _local_scale(Basis(Vector3.UP, rng.randf_range(0.0, TAU)), Vector3(s, s, s))
			xf.append(Transform3D(b, Vector3(p.x, gy, p.y)))
			var v: float = rng.randf_range(0.82, 1.12)
			col.append(Color(patch_color.r * v, patch_color.g * v, patch_color.b * v, 1.0))
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/flower.gdshader") as Shader
	mat.set_shader_parameter("stem_color", Color(0.12, 0.20, 0.09, 1.0))
	mat.set_shader_parameter("total_height", 0.30)
	mat.set_shader_parameter("bloom_start", 0.72)
	_add_multimesh("Wildflowers", _flower_mesh(), mat, xf, col, false)

# ---------------------------------------------------------------- rocks

func _scatter_rocks() -> void:
	var points: Array[Vector2] = _find_spots(ROCK_COUNT, 0.0, ROAD_CLEARANCE * 0.6, 0.75)
	# Three distinct boulder shapes, picked at random per instance.
	var meshes: Array[ArrayMesh] = [
		_deform(_sphere_source(10, 6), 0.38, 1.5, 1201, 0.72),
		_deform(_sphere_source(9, 5), 0.46, 2.2, 4409, 0.60),
		_deform(_sphere_source(11, 7), 0.32, 1.1, 8836, 0.82),
	]
	var buckets: Array[Array] = [[], [], []]
	var bucket_cols: Array[Array] = [[], [], []]
	var mat: StandardMaterial3D = _rock_material()

	for p in points:
		var gy: float = _ground(p.x, p.y)
		var s: float = rng.randf_range(0.5, 2.6)
		var which: int = rng.randi_range(0, 2)
		var rot := Basis(Vector3.UP, rng.randf_range(0.0, TAU))
		rot = rot * Basis(Vector3.RIGHT, rng.randf_range(-0.35, 0.35))
		rot = rot * Basis(Vector3.FORWARD, rng.randf_range(-0.35, 0.35))
		var sx: float = s * rng.randf_range(0.85, 1.5)
		var sy: float = s * rng.randf_range(0.6, 1.05)
		var sz: float = s * rng.randf_range(0.85, 1.45)
		# Sunk slightly so boulders sit in the ground rather than on it.
		buckets[which].append(Transform3D(_local_scale(rot, Vector3(sx, sy, sz)),
			Vector3(p.x, gy + sy * 0.30, p.y)))
		var shade: float = rng.randf_range(0.7, 1.12)
		bucket_cols[which].append(Color(shade, shade, shade * 1.02, 1.0))

		if s > 1.5:
			var sphere := SphereShape3D.new()
			sphere.radius = maxf(sx, sz) * 0.42
			var cs := CollisionShape3D.new()
			cs.shape = sphere
			cs.position = Vector3(p.x, gy + sy * 0.30, p.y)
			rock_collision_body.add_child(cs)

	for i in 3:
		var xf_list: Array[Transform3D] = []
		var col_list: Array[Color] = []
		for v in buckets[i]:
			xf_list.append(v)
		for c in bucket_cols[i]:
			col_list.append(c)
		_add_multimesh("Boulders%d" % (i + 1), meshes[i], mat, xf_list, col_list, true)

# ---------------------------------------------------------------- hero props

func _place_hero_props() -> void:
	# Real scanned meshes used sparingly as detail anchors. If the glTF import
	# is unavailable the forest simply renders without them rather than taking
	# the whole scene down.
	_place_model("res://models/dead_tree_trunk_02/dead_tree_trunk_02_1k.gltf",
		"HeroDeadTrunk", HERO_DEAD_TRUNKS, 0.8, 1.7, 3.0)
	_place_model("res://models/tree_stump_01/tree_stump_01_1k.gltf",
		"HeroStump", HERO_STUMPS, 0.7, 1.5, 1.0)

func _place_model(path: String, prefix: String, count: int,
		min_scale: float, max_scale: float, road_clearance: float) -> void:
	var packed: PackedScene = load(path) as PackedScene
	if packed == null:
		push_warning("Forest: optional model missing, skipping: %s" % path)
		return
	var points: Array[Vector2] = _find_spots(count, 1.0, road_clearance, 0.35)
	for i in points.size():
		var instance: Node3D = packed.instantiate() as Node3D
		if instance == null:
			return
		add_child(instance)
		instance.name = "%s%d" % [prefix, i]
		var gy: float = _ground(points[i].x, points[i].y)
		instance.position = Vector3(points[i].x, gy - 0.15, points[i].y)
		instance.rotation.y = rng.randf_range(0.0, TAU)
		var s: float = rng.randf_range(min_scale, max_scale)
		instance.scale = Vector3(s, s, s)

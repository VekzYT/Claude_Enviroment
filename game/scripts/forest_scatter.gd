extends Node3D

# Builds the forest at load time.
#
# Every repeated element (trunks, canopy tiers, deadfall, bushes, ferns, rocks,
# undergrowth) is batched into a MultiMesh so a thousand-tree forest costs a
# handful of draw calls instead of thousands of nodes. Trunk collision goes into
# one StaticBody3D holding many shapes, which is far cheaper than one body per
# tree. Placement is seeded, so the forest is identical every run.

const MAP_HALF := 188.0

const PINE_COUNT := 950
const DEAD_TREE_COUNT := 210
const BUSH_COUNT := 520
const ROCK_COUNT := 190
const FERN_PATCHES := 420
const FERNS_PER_PATCH := 6
const GRASS_PATCHES := 620
const GRASS_PER_PATCH := 26
const HERO_DEAD_TRUNKS := 14
const HERO_STUMPS := 20

const MAX_TRIES_FACTOR := 30

# Points of interest kept clear of trees so the player can actually find them.
const POI_CENTERS: Array[Vector2] = [
	Vector2(0.0, 0.0),        # survivor camp / spawn
	Vector2(-40.0, -130.0),   # ranger watchtower
	Vector2(95.0, -85.0),     # abandoned cabin
	Vector2(130.0, 40.0),     # crashed convoy
	Vector2(-120.0, 95.0),    # chapel ruins
	Vector2(-150.0, -30.0),   # radio tower
	Vector2(30.0, 140.0),     # grave clearing
	Vector2(60.0, -30.0),     # forest pond
	Vector2(-90.0, -95.0),    # rocky lookout
]
const POI_RADII: Array[float] = [24.0, 15.0, 17.0, 20.0, 21.0, 15.0, 19.0, 27.0, 26.0]

# Dirt roads radiating out of the camp. Trees stay off them.
const ROAD_A: Array[Vector2] = [Vector2(0.0, 0.0), Vector2(130.0, 40.0)]
const ROAD_B: Array[Vector2] = [Vector2(0.0, 0.0), Vector2(-120.0, 95.0)]
const ROAD_C: Array[Vector2] = [Vector2(0.0, 0.0), Vector2(-40.0, -130.0)]
const ROAD_D: Array[Vector2] = [Vector2(0.0, 0.0), Vector2(30.0, 140.0)]
const ROAD_CLEARANCE := 6.5

const TRUNK_RADIUS_BUCKETS: Array[float] = [0.16, 0.22, 0.28, 0.34, 0.42, 0.52]

var rng := RandomNumberGenerator.new()
var tree_collision_body: StaticBody3D = null
var bucket_shapes: Array[BoxShape3D] = []

# Basis.scaled() multiplies scale in on the *left*, which shears a mesh whose
# rotation mixes the unevenly-scaled axes (leaning trunks, pitched branches,
# tumbled rocks). Composing on the right scales along the mesh's own axes.
func _local_scale(rot: Basis, s: Vector3) -> Basis:
	return rot * Basis.IDENTITY.scaled(s)

func _ready() -> void:
	rng.seed = 20260822
	_setup_collision_body()
	_scatter_pines()
	_scatter_dead_trees()
	_scatter_bushes()
	_scatter_ferns()
	_scatter_rocks()
	_scatter_undergrowth()
	_place_hero_props()

# ---------------------------------------------------------------- placement

func _random_point() -> Vector2:
	return Vector2(
		rng.randf_range(-MAP_HALF, MAP_HALF),
		rng.randf_range(-MAP_HALF, MAP_HALF)
	)

func _distance_to_segment(p: Vector2, a: Vector2, b: Vector2) -> float:
	var ab: Vector2 = b - a
	var len_sq: float = ab.length_squared()
	if len_sq < 0.0001:
		return p.distance_to(a)
	var t: float = clamp((p - a).dot(ab) / len_sq, 0.0, 1.0)
	return p.distance_to(a + ab * t)

func _on_road(p: Vector2, clearance: float) -> bool:
	if _distance_to_segment(p, ROAD_A[0], ROAD_A[1]) < clearance:
		return true
	if _distance_to_segment(p, ROAD_B[0], ROAD_B[1]) < clearance:
		return true
	if _distance_to_segment(p, ROAD_C[0], ROAD_C[1]) < clearance:
		return true
	if _distance_to_segment(p, ROAD_D[0], ROAD_D[1]) < clearance:
		return true
	return false

func _blocked(p: Vector2, poi_margin: float, road_clearance: float) -> bool:
	for i in POI_CENTERS.size():
		if p.distance_to(POI_CENTERS[i]) < POI_RADII[i] + poi_margin:
			return true
	return _on_road(p, road_clearance)

func _find_spot(count: int, poi_margin: float, road_clearance: float) -> Array[Vector2]:
	var points: Array[Vector2] = []
	var tries: int = 0
	var limit: int = count * MAX_TRIES_FACTOR
	while points.size() < count and tries < limit:
		tries += 1
		var p: Vector2 = _random_point()
		if _blocked(p, poi_margin, road_clearance):
			continue
		points.append(p)
	return points

# ---------------------------------------------------------------- mesh build

func _unit_trunk_mesh() -> CylinderMesh:
	# Base radius 1, top radius 0.5, height 1 — scaled per instance.
	var m := CylinderMesh.new()
	m.top_radius = 0.5
	m.bottom_radius = 1.0
	m.height = 1.0
	m.radial_segments = 8
	m.rings = 1
	return m

func _unit_cone_mesh() -> CylinderMesh:
	var m := CylinderMesh.new()
	m.top_radius = 0.03
	m.bottom_radius = 1.0
	m.height = 1.0
	m.radial_segments = 8
	m.rings = 1
	return m

func _unit_sphere_mesh() -> SphereMesh:
	var m := SphereMesh.new()
	m.radius = 0.5
	m.height = 1.0
	m.radial_segments = 8
	m.rings = 5
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
	mat.uv1_scale = Vector3(1.0, 1.0, 1.0)
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

func _setup_collision_body() -> void:
	tree_collision_body = StaticBody3D.new()
	tree_collision_body.name = "TreeCollision"
	add_child(tree_collision_body)
	for r in TRUNK_RADIUS_BUCKETS:
		var shape := BoxShape3D.new()
		# Tall enough to cover any trunk; the overhang is under the floor or
		# above the canopy where nothing can reach it.
		shape.size = Vector3(r * 1.6, 24.0, r * 1.6)
		bucket_shapes.append(shape)

func _add_trunk_collision(pos: Vector2, radius: float) -> void:
	var best: int = 0
	var best_diff: float = abs(TRUNK_RADIUS_BUCKETS[0] - radius)
	for i in TRUNK_RADIUS_BUCKETS.size():
		var diff: float = abs(TRUNK_RADIUS_BUCKETS[i] - radius)
		if diff < best_diff:
			best_diff = diff
			best = i
	var cs := CollisionShape3D.new()
	cs.shape = bucket_shapes[best]
	cs.position = Vector3(pos.x, 10.0, pos.y)
	tree_collision_body.add_child(cs)

# ---------------------------------------------------------------- scatterers

func _scatter_pines() -> void:
	var points: Array[Vector2] = _find_spot(PINE_COUNT, 2.0, ROAD_CLEARANCE)

	var trunk_xf: Array[Transform3D] = []
	var trunk_col: Array[Color] = []
	var tier1_xf: Array[Transform3D] = []
	var tier1_col: Array[Color] = []
	var tier2_xf: Array[Transform3D] = []
	var tier2_col: Array[Color] = []
	var tier3_xf: Array[Transform3D] = []
	var tier3_col: Array[Color] = []

	for p in points:
		var h: float = rng.randf_range(7.0, 16.5)
		var radius: float = 0.10 + h * 0.013
		var yaw: float = rng.randf_range(0.0, TAU)
		var basis_y := Basis(Vector3.UP, yaw)

		var trunk_basis: Basis = _local_scale(basis_y, Vector3(radius, h, radius))
		trunk_xf.append(Transform3D(trunk_basis, Vector3(p.x, h * 0.5, p.y)))
		var bark_shade: float = rng.randf_range(0.78, 1.15)
		trunk_col.append(Color(bark_shade, bark_shade * 0.97, bark_shade * 0.93, 1.0))

		# Narrower, taller canopies read as fir; wider ones as spruce.
		var slim: float = rng.randf_range(0.82, 1.22)
		var leaf_shade: float = rng.randf_range(0.72, 1.18)
		var leaf_color := Color(leaf_shade * 0.95, leaf_shade, leaf_shade * 0.9, 1.0)

		var tiers: Array[Vector3] = [
			Vector3(0.45, 0.195, 0.32),
			Vector3(0.655, 0.152, 0.28),
			Vector3(0.845, 0.098, 0.235),
		]
		for i in tiers.size():
			var t: Vector3 = tiers[i]
			var fw: float = h * t.y * slim
			var fh: float = h * t.z
			var cone_basis: Basis = _local_scale(basis_y, Vector3(fw, fh, fw))
			var xf := Transform3D(cone_basis, Vector3(p.x, h * t.x, p.y))
			if i == 0:
				tier1_xf.append(xf)
				tier1_col.append(leaf_color)
			elif i == 1:
				tier2_xf.append(xf)
				tier2_col.append(leaf_color)
			else:
				tier3_xf.append(xf)
				tier3_col.append(leaf_color)

		_add_trunk_collision(p, radius)

	var trunk_mesh: CylinderMesh = _unit_trunk_mesh()
	var cone_mesh: CylinderMesh = _unit_cone_mesh()
	var bark_mat: ShaderMaterial = _bark_material(Color(0.68, 0.62, 0.55, 1.0), Vector2(1.0, 3.0), 0.95)

	_add_multimesh("PineTrunks", trunk_mesh, bark_mat, trunk_xf, trunk_col, true)
	_add_multimesh("PineCanopyLow", cone_mesh,
		_foliage_material(Color(0.09, 0.15, 0.09, 1.0), Color(0.15, 0.24, 0.12, 1.0), 1.0, 0.05, 0.9),
		tier1_xf, tier1_col, true)
	_add_multimesh("PineCanopyMid", cone_mesh,
		_foliage_material(Color(0.10, 0.17, 0.10, 1.0), Color(0.17, 0.27, 0.13, 1.0), 1.0, 0.07, 1.0),
		tier2_xf, tier2_col, true)
	_add_multimesh("PineCanopyTop", cone_mesh,
		_foliage_material(Color(0.12, 0.19, 0.11, 1.0), Color(0.20, 0.31, 0.15, 1.0), 1.0, 0.10, 1.1),
		tier3_xf, tier3_col, false)

func _scatter_dead_trees() -> void:
	var points: Array[Vector2] = _find_spot(DEAD_TREE_COUNT, 1.0, ROAD_CLEARANCE)

	var trunk_xf: Array[Transform3D] = []
	var trunk_col: Array[Color] = []
	var branch_xf: Array[Transform3D] = []
	var branch_col: Array[Color] = []

	for p in points:
		var h: float = rng.randf_range(5.5, 13.0)
		var radius: float = 0.09 + h * 0.011
		var yaw: float = rng.randf_range(0.0, TAU)
		# A slight lean sells the "long dead and rotting" look.
		var lean: float = rng.randf_range(0.0, 0.10)
		var lean_dir: float = rng.randf_range(0.0, TAU)
		var basis_lean := Basis(Vector3(cos(lean_dir), 0.0, sin(lean_dir)), lean)
		var basis_y: Basis = basis_lean * Basis(Vector3.UP, yaw)

		var trunk_basis: Basis = _local_scale(basis_y, Vector3(radius, h, radius))
		trunk_xf.append(Transform3D(trunk_basis, Vector3(p.x, h * 0.5, p.y)))
		var shade: float = rng.randf_range(0.42, 0.66)
		trunk_col.append(Color(shade, shade * 0.94, shade * 0.86, 1.0))

		var branches: int = rng.randi_range(2, 4)
		for _i in branches:
			var by: float = rng.randf_range(0.45, 0.9) * h
			var blen: float = rng.randf_range(0.9, 2.4)
			var brad: float = radius * rng.randf_range(0.22, 0.4)
			var byaw: float = rng.randf_range(0.0, TAU)
			var bpitch: float = rng.randf_range(0.9, 1.5)
			var b_rot := Basis(Vector3.UP, byaw) * Basis(Vector3.RIGHT, bpitch)
			var b_basis: Basis = _local_scale(b_rot, Vector3(brad, blen, brad))
			var offset := Vector3(cos(byaw), 0.0, sin(byaw)) * blen * 0.35
			branch_xf.append(Transform3D(b_basis, Vector3(p.x, by, p.y) + offset))
			branch_col.append(Color(shade * 0.9, shade * 0.85, shade * 0.78, 1.0))

		_add_trunk_collision(p, radius)

	var trunk_mesh: CylinderMesh = _unit_trunk_mesh()
	var dead_mat: ShaderMaterial = _bark_material(Color(0.5, 0.46, 0.4, 1.0), Vector2(1.0, 2.5), 1.0)
	_add_multimesh("DeadTrunks", trunk_mesh, dead_mat, trunk_xf, trunk_col, true)
	_add_multimesh("DeadBranches", trunk_mesh, dead_mat, branch_xf, branch_col, false)

func _scatter_bushes() -> void:
	var points: Array[Vector2] = _find_spot(BUSH_COUNT, 1.0, ROAD_CLEARANCE * 0.7)
	var xf: Array[Transform3D] = []
	var col: Array[Color] = []
	for p in points:
		var w: float = rng.randf_range(1.1, 2.6)
		var hgt: float = w * rng.randf_range(0.55, 0.85)
		var b: Basis = _local_scale(Basis(Vector3.UP, rng.randf_range(0.0, TAU)), Vector3(w, hgt, w))
		xf.append(Transform3D(b, Vector3(p.x, hgt * 0.42, p.y)))
		var shade: float = rng.randf_range(0.65, 1.15)
		col.append(Color(shade * 0.94, shade, shade * 0.86, 1.0))
	_add_multimesh("Bushes", _unit_sphere_mesh(),
		_foliage_material(Color(0.10, 0.16, 0.09, 1.0), Color(0.19, 0.27, 0.13, 1.0), 1.0, 0.06, 1.3),
		xf, col, false)

func _scatter_ferns() -> void:
	var centers: Array[Vector2] = _find_spot(FERN_PATCHES, 0.0, ROAD_CLEARANCE * 0.55)
	var xf: Array[Transform3D] = []
	var col: Array[Color] = []
	for c in centers:
		for _i in FERNS_PER_PATCH:
			var angle: float = rng.randf_range(0.0, TAU)
			var dist: float = sqrt(rng.randf()) * 2.4
			var p: Vector2 = c + Vector2(cos(angle), sin(angle)) * dist
			var s: float = rng.randf_range(0.7, 1.5)
			var b: Basis = _local_scale(Basis(Vector3.UP, rng.randf_range(0.0, TAU)), Vector3(s, s, s))
			xf.append(Transform3D(b, Vector3(p.x, 0.0, p.y)))
			var shade: float = rng.randf_range(0.7, 1.2)
			col.append(Color(shade * 0.9, shade, shade * 0.82, 1.0))
	_add_multimesh("Ferns", _cross_quad_mesh(0.42, 0.85),
		_foliage_material(Color(0.10, 0.17, 0.09, 1.0), Color(0.21, 0.30, 0.14, 1.0), 0.85, 0.09, 1.5),
		xf, col, false)

func _scatter_rocks() -> void:
	var points: Array[Vector2] = _find_spot(ROCK_COUNT, 0.0, ROAD_CLEARANCE * 0.6)
	var xf: Array[Transform3D] = []
	var col: Array[Color] = []
	for p in points:
		var s: float = rng.randf_range(0.5, 2.2)
		var rot := Basis(Vector3.UP, rng.randf_range(0.0, TAU))
		rot = rot * Basis(Vector3.RIGHT, rng.randf_range(-0.25, 0.25))
		rot = rot * Basis(Vector3.FORWARD, rng.randf_range(-0.25, 0.25))
		var b: Basis = _local_scale(rot, Vector3(s * rng.randf_range(0.9, 1.5), s * rng.randf_range(0.5, 0.9), s * rng.randf_range(0.9, 1.4)))
		xf.append(Transform3D(b, Vector3(p.x, s * 0.22, p.y)))
		var shade: float = rng.randf_range(0.72, 1.1)
		col.append(Color(shade, shade, shade * 1.02, 1.0))
	var box := BoxMesh.new()
	box.size = Vector3(1.0, 1.0, 1.0)
	_add_multimesh("Rocks", box, _rock_material(), xf, col, true)

func _scatter_undergrowth() -> void:
	var centers: Array[Vector2] = _find_spot(GRASS_PATCHES, 0.0, ROAD_CLEARANCE * 0.5)
	var xf: Array[Transform3D] = []
	var col: Array[Color] = []
	for c in centers:
		for _i in GRASS_PER_PATCH:
			var angle: float = rng.randf_range(0.0, TAU)
			var dist: float = sqrt(rng.randf()) * 3.1
			var p: Vector2 = c + Vector2(cos(angle), sin(angle)) * dist
			var s: float = rng.randf_range(0.7, 1.6)
			var b: Basis = _local_scale(Basis(Vector3.UP, rng.randf_range(0.0, TAU)), Vector3(s, s, s))
			xf.append(Transform3D(b, Vector3(p.x, 0.0, p.y)))
			var shade: float = rng.randf_range(0.7, 1.2)
			col.append(Color(shade, shade, shade * 0.92, 1.0))
	var mat: ShaderMaterial = ShaderMaterial.new()
	mat.shader = load("res://shaders/grass_wind.gdshader") as Shader
	mat.set_shader_parameter("root_color", Color(0.10, 0.14, 0.08, 1.0))
	mat.set_shader_parameter("tip_color", Color(0.25, 0.31, 0.14, 1.0))
	mat.set_shader_parameter("blade_height", 0.34)
	_add_multimesh("Undergrowth", _cross_quad_mesh(0.055, 0.34), mat, xf, col, false)

# ---------------------------------------------------------------- hero props

func _place_hero_props() -> void:
	# Real scanned meshes, used sparingly as detail anchors. If the glTF import
	# is unavailable for any reason the forest simply renders without them
	# rather than taking the whole scene down.
	_place_model("res://models/dead_tree_trunk_02/dead_tree_trunk_02_1k.gltf",
		"HeroDeadTrunk", HERO_DEAD_TRUNKS, 0.8, 1.6, 3.0)
	_place_model("res://models/tree_stump_01/tree_stump_01_1k.gltf",
		"HeroStump", HERO_STUMPS, 0.7, 1.4, 1.0)

func _place_model(path: String, prefix: String, count: int,
		min_scale: float, max_scale: float, road_clearance: float) -> void:
	var packed: PackedScene = load(path) as PackedScene
	if packed == null:
		push_warning("Forest: optional model missing, skipping: %s" % path)
		return
	var points: Array[Vector2] = _find_spot(count, 1.0, road_clearance)
	for i in points.size():
		var instance: Node3D = packed.instantiate() as Node3D
		if instance == null:
			return
		add_child(instance)
		instance.name = "%s%d" % [prefix, i]
		instance.position = Vector3(points[i].x, 0.0, points[i].y)
		instance.rotation.y = rng.randf_range(0.0, TAU)
		var s: float = rng.randf_range(min_scale, max_scale)
		instance.scale = Vector3(s, s, s)

extends Node3D

@export var tree_pine_scene: PackedScene
@export var tree_round_scene: PackedScene
@export var rock_scene: PackedScene

const TREE_COUNT := 90
const ROCK_COUNT := 22
const GRASS_COUNT := 4200
const SHORE_MARGIN := 3.0
const MAX_ATTEMPTS_PER_ITEM := 40

const ISLAND_CENTERS: Array[Vector2] = [
	Vector2(0, 0),
	Vector2(42.1, 35.4),
	Vector2(-54.5, 19.8),
	Vector2(-17.8, -48.9),
	Vector2(45.96, -38.6),
]
const ISLAND_RADII: Array[float] = [62.0, 18.0, 15.0, 20.0, 14.0]

const EXCLUSION_CENTERS: Array[Vector2] = [
	Vector2(0, 0),
	Vector2(36, 24),
	Vector2(-34, -22),
	Vector2(-50, 18),
	Vector2(-16, -44),
	Vector2(30, -40),
	Vector2(0, 46),
	Vector2(0, 33),
	Vector2(-35, 0),
	Vector2(-35, -12),
]
const EXCLUSION_RADII: Array[float] = [30.0, 9.0, 9.0, 6.0, 6.0, 7.0, 13.0, 8.0, 12.0, 8.0]

const GRASS_EXCLUSION_CENTERS: Array[Vector2] = [
	Vector2(36, 24),
	Vector2(-34, -22),
	Vector2(-50, 18),
	Vector2(-16, -44),
	Vector2(30, -40),
	Vector2(0, 46),
	Vector2(0, 33),
	Vector2(-35, 0),
	Vector2(-35, -12),
]
const GRASS_EXCLUSION_RADII: Array[float] = [9.0, 9.0, 6.0, 6.0, 7.0, 13.0, 8.0, 12.0, 8.0]

var rng := RandomNumberGenerator.new()

func _ready() -> void:
	rng.seed = 20260801
	scatter_trees_and_rocks()
	scatter_grass()

func _pick_land_point(margin: float) -> Vector2:
	var total_weight: float = 0.0
	for radius in ISLAND_RADII:
		total_weight += radius * radius
	var roll: float = rng.randf() * total_weight
	var acc: float = 0.0
	var chosen_index: int = 0
	for i in range(ISLAND_RADII.size()):
		acc += ISLAND_RADII[i] * ISLAND_RADII[i]
		if roll <= acc:
			chosen_index = i
			break
	var max_r: float = max(ISLAND_RADII[chosen_index] - margin, 0.5)
	var r: float = sqrt(rng.randf()) * max_r
	var angle: float = rng.randf_range(0.0, TAU)
	return ISLAND_CENTERS[chosen_index] + Vector2(cos(angle), sin(angle)) * r

func _is_excluded(point: Vector2, centers: Array[Vector2], radii: Array[float]) -> bool:
	for i in range(centers.size()):
		if point.distance_to(centers[i]) < radii[i]:
			return true
	return false

func scatter_trees_and_rocks() -> void:
	var placed: int = 0
	var tries: int = 0
	while placed < TREE_COUNT and tries < TREE_COUNT * MAX_ATTEMPTS_PER_ITEM:
		tries += 1
		var point: Vector2 = _pick_land_point(SHORE_MARGIN + 2.0)
		if _is_excluded(point, EXCLUSION_CENTERS, EXCLUSION_RADII):
			continue
		var scene: PackedScene = tree_pine_scene if rng.randf() < 0.6 else tree_round_scene
		var instance: Node3D = scene.instantiate() as Node3D
		add_child(instance)
		instance.position = Vector3(point.x, 0.0, point.y)
		instance.rotation.y = rng.randf_range(0.0, TAU)
		var s: float = rng.randf_range(0.8, 1.3)
		instance.scale = Vector3(s, s, s)
		placed += 1

	var rocks_placed: int = 0
	tries = 0
	while rocks_placed < ROCK_COUNT and tries < ROCK_COUNT * MAX_ATTEMPTS_PER_ITEM:
		tries += 1
		var point: Vector2 = _pick_land_point(SHORE_MARGIN)
		if _is_excluded(point, EXCLUSION_CENTERS, EXCLUSION_RADII):
			continue
		var instance: Node3D = rock_scene.instantiate() as Node3D
		add_child(instance)
		instance.position = Vector3(point.x, 0.0, point.y)
		instance.rotation.y = rng.randf_range(0.0, TAU)
		var s: float = rng.randf_range(0.7, 1.4)
		instance.scale = Vector3(s, s, s)
		rocks_placed += 1

func _add_blade_quad(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, d: Vector3) -> void:
	st.add_vertex(a)
	st.add_vertex(b)
	st.add_vertex(c)
	st.add_vertex(a)
	st.add_vertex(c)
	st.add_vertex(d)

func _build_grass_blade_mesh() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var w: float = 0.05
	var h: float = 0.32
	_add_blade_quad(st, Vector3(-w, 0.0, 0.0), Vector3(w, 0.0, 0.0), Vector3(w * 0.15, h, 0.0), Vector3(-w * 0.15, h, 0.0))
	_add_blade_quad(st, Vector3(0.0, 0.0, -w), Vector3(0.0, 0.0, w), Vector3(0.0, h, w * 0.15), Vector3(0.0, h, -w * 0.15))
	st.generate_normals()
	return st.commit()

func scatter_grass() -> void:
	var blade_mesh: ArrayMesh = _build_grass_blade_mesh()
	var shader: Shader = load("res://shaders/grass_wind.gdshader") as Shader
	var mat := ShaderMaterial.new()
	mat.shader = shader
	mat.set_shader_parameter("base_color", Color(0.24, 0.42, 0.16, 1))
	mat.set_shader_parameter("blade_height", 0.32)
	blade_mesh.surface_set_material(0, mat)

	var multimesh := MultiMesh.new()
	multimesh.transform_format = MultiMesh.TRANSFORM_3D
	multimesh.use_colors = true
	multimesh.mesh = blade_mesh
	multimesh.instance_count = GRASS_COUNT

	var index: int = 0
	var tries: int = 0
	while index < GRASS_COUNT and tries < GRASS_COUNT * 3:
		tries += 1
		var point: Vector2 = _pick_land_point(1.0)
		if _is_excluded(point, GRASS_EXCLUSION_CENTERS, GRASS_EXCLUSION_RADII):
			continue
		var angle: float = rng.randf_range(0.0, TAU)
		var s: float = rng.randf_range(0.75, 1.5)
		var blade_basis := Basis(Vector3.UP, angle)
		blade_basis = blade_basis.scaled(Vector3(s, s, s))
		var xform := Transform3D(blade_basis, Vector3(point.x, 0.0, point.y))
		multimesh.set_instance_transform(index, xform)
		var shade: float = rng.randf_range(0.75, 1.15)
		multimesh.set_instance_color(index, Color(shade, shade, shade, 1.0))
		index += 1

	if index < multimesh.instance_count:
		multimesh.instance_count = index

	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = multimesh
	mmi.name = "GrassField"
	add_child(mmi)

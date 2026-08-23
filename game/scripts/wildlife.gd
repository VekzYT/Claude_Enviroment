extends Node3D

# Scatters animals across the forest at load, keeping them off the roads, the
# cleared pads and anything too steep to graze on -- the same tests the trees
# use, so the herds end up in the same places the woodland is.

@export var terrain_path: NodePath = NodePath("../Terrain")
@export var deer_count := 14
@export var boar_count := 8

const MAP_HALF := 200.0
const MAX_SLOPE := 0.34

var rng := RandomNumberGenerator.new()
var terrain: Node = null

func _ready() -> void:
	rng.seed = 771144
	terrain = get_node_or_null(terrain_path)
	if terrain == null:
		terrain = get_tree().get_first_node_in_group("terrain")
	if terrain == null:
		push_error("Wildlife: no terrain; nothing spawned.")
		return
	if terrain.has_method("ensure_built"):
		terrain.call("ensure_built")

	var animal_scene: PackedScene = load("res://scenes/animal.tscn") as PackedScene
	_spawn(animal_scene, deer_count, "deer", 40, 1.9, 7.6, Color(0.46, 0.33, 0.21))
	_spawn(animal_scene, boar_count, "boar", 52, 1.5, 6.2, Color(0.24, 0.20, 0.18))

func _spawn(scene: PackedScene, count: int, species: String, health: int,
		walk: float, run: float, tint: Color) -> void:
	var placed := 0
	var tries := 0
	while placed < count and tries < count * 60:
		tries += 1
		var spot := Vector2(
			rng.randf_range(-MAP_HALF, MAP_HALF), rng.randf_range(-MAP_HALF, MAP_HALF))
		if terrain.has_method("in_clearing") and bool(terrain.call("in_clearing", spot, 6.0, 9.0)):
			continue
		if terrain.has_method("slope_at") and float(terrain.call("slope_at", spot.x, spot.y)) > MAX_SLOPE:
			continue
		var animal: Node3D = scene.instantiate() as Node3D
		animal.set("species", species)
		animal.set("max_health", health)
		animal.set("walk_speed", walk)
		animal.set("run_speed", run)
		animal.set("body_tint", tint.lightened(rng.randf_range(-0.0, 0.16)))
		add_child(animal)
		var ground: float = 0.0
		if terrain.has_method("height_at"):
			ground = float(terrain.call("height_at", spot.x, spot.y))
		animal.global_position = Vector3(spot.x, ground + 0.1, spot.y)
		animal.rotation.y = rng.randf_range(0.0, TAU)
		placed += 1

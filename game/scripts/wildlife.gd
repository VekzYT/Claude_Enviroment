extends Node3D

# Scatters animals across the forest at load, keeping them off the roads, the
# cleared pads and anything too steep to graze on -- the same tests the trees
# use, so the herds end up in the same places the woodland is.

@export var terrain_path: NodePath = NodePath("../Terrain")
@export var deer_count := 14
@export var boar_count := 8
@export var hare_count := 16
@export var elk_count := 5

const MAP_HALF := 215.0
const MAX_SLOPE := 0.34
# No two animals start closer than this, so the forest reads as sparsely
# populated rather than as a few knots of wildlife.
const MIN_SEPARATION := 34.0

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
	# Run speeds matter against the player's 9.5 m/s sprint. A deer is a fair
	# race, an elk you will lose, and a hare you will never catch on foot --
	# that one is there to make the bow worth buying.
	_spawn(animal_scene, deer_count, "deer", 40, 1.9, 8.6, 1.0, Color(0.46, 0.33, 0.21))
	_spawn(animal_scene, boar_count, "boar", 52, 1.5, 6.4, 0.78, Color(0.24, 0.20, 0.18))
	_spawn(animal_scene, elk_count, "elk", 78, 1.7, 9.8, 0.92, Color(0.34, 0.25, 0.17))
	_spawn(animal_scene, hare_count, "hare", 10, 1.7, 13.5, 1.65, Color(0.55, 0.47, 0.36))

func _spawn(scene: PackedScene, count: int, species: String, health: int,
		walk: float, run: float, wariness: float, tint: Color) -> void:
	var placed := 0
	var tries := 0
	var separation: float = MIN_SEPARATION
	while placed < count and tries < count * 200:
		tries += 1
		# Relax the spacing rather than fail to place: better a slightly tighter
		# herd than eight animals where twenty-two were asked for.
		if tries % (count * 40) == 0:
			separation *= 0.72
		var spot := Vector2(
			rng.randf_range(-MAP_HALF, MAP_HALF), rng.randf_range(-MAP_HALF, MAP_HALF))
		if terrain.has_method("in_clearing") and bool(terrain.call("in_clearing", spot, 6.0, 9.0)):
			continue
		if terrain.has_method("slope_at") and float(terrain.call("slope_at", spot.x, spot.y)) > MAX_SLOPE:
			continue
		if not _far_enough(spot, separation):
			continue
		var animal: Node3D = scene.instantiate() as Node3D
		animal.set("species", species)
		animal.set("max_health", health)
		animal.set("walk_speed", walk)
		animal.set("run_speed", run)
		animal.set("wariness", wariness)
		animal.set("body_tint", tint.lightened(rng.randf_range(-0.0, 0.16)))
		add_child(animal)
		var ground: float = 0.0
		if terrain.has_method("height_at"):
			ground = float(terrain.call("height_at", spot.x, spot.y))
		animal.global_position = Vector3(spot.x, ground + 0.1, spot.y)
		animal.rotation.y = rng.randf_range(0.0, TAU)
		placed += 1

# True when this spot is clear of every animal already placed.
func _far_enough(spot: Vector2, separation: float) -> bool:
	for node in get_children():
		var other := node as Node3D
		if other == null:
			continue
		if Vector2(other.global_position.x, other.global_position.z).distance_to(spot) < separation:
			return false
	return true

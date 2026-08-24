extends Area3D

# Something you have set down out of your pack: a piece of flint, a stack of
# firewood. Press E to pick it back up.
#
# Flint and firewood next to each other are also the recipe for a fire: strike
# the flint with the axe and it lights whatever wood is within reach.

const PICKUP_RANGE := 2.4
# How far a stack of wood may be from the flint and still catch.
const SPARK_RANGE := 2.0

@export var kind := "flint"

var built := false

func _ready() -> void:
	add_to_group("interactable")
	add_to_group("placed_item")
	_build()

func _mat(colour: Color, rough: float) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = colour
	m.roughness = rough
	return m

func _mesh(size: Vector3, pos: Vector3, mat: Material, rot: Basis = Basis.IDENTITY) -> void:
	var mesh := BoxMesh.new()
	mesh.size = Vector3.ONE
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.transform = Transform3D(rot * Basis.IDENTITY.scaled(size), pos)
	node.material_override = mat
	add_child(node)

func _build() -> void:
	if built:
		return
	built = true
	var rng := RandomNumberGenerator.new()
	rng.randomize()

	if kind == "flint":
		var stone: StandardMaterial3D = _mat(Color(0.30, 0.31, 0.34), 0.7)
		var face: StandardMaterial3D = _mat(Color(0.46, 0.47, 0.50), 0.45)
		_mesh(Vector3(0.30, 0.17, 0.24), Vector3.ZERO, stone,
			Basis(Vector3.UP, rng.randf_range(0.0, TAU)))
		_mesh(Vector3(0.18, 0.09, 0.15), Vector3(0.06, 0.09, 0.03), face,
			Basis(Vector3.UP, rng.randf_range(0.0, TAU)))
	else:
		var bark: StandardMaterial3D = _mat(Color(0.42, 0.30, 0.19), 0.95)
		var cut: StandardMaterial3D = _mat(Color(0.66, 0.52, 0.34), 0.9)
		# A little stack of split logs, crossed.
		for i in 5:
			var across: bool = i % 2 == 1
			var y: float = 0.06 + float(i) * 0.075
			var turn: float = PI * 0.5 if across else 0.0
			var rot: Basis = Basis(Vector3.UP, turn + rng.randf_range(-0.12, 0.12))
			_mesh(Vector3(0.7, 0.11, 0.11), Vector3(rng.randf_range(-0.05, 0.05), y - 0.2,
				rng.randf_range(-0.05, 0.05)), bark if i % 3 else cut, rot)

	var cs := CollisionShape3D.new()
	var box := BoxShape3D.new()
	# Deliberately taller than the item so looking down at it still connects.
	box.size = Vector3(0.7, 0.7, 0.7) if kind == "flint" else Vector3(1.1, 0.9, 1.0)
	cs.shape = box
	cs.position = Vector3(0, 0.15, 0)
	add_child(cs)

func interact_point() -> Vector3:
	return global_position + Vector3(0.0, 0.18, 0.0)

func prompt_for(_player: Node) -> String:
	if kind == "flint":
		return "Take the flint"
	return "Take the firewood"

func interact(_player: Node) -> void:
	if kind == "flint":
		GameState.add_flint(1)
	else:
		GameState.add_wood(3)
	Sound.play_ui("pickup_flint" if kind == "flint" else "pickup_wood", -8.0)
	queue_free()

# Struck with the axe. If there is firewood beside it, that is a fire.
func hit(_damage: int) -> void:
	if kind != "flint":
		return
	var fuel: Node3D = null
	for other in get_tree().get_nodes_in_group("placed_item"):
		if other == self or not is_instance_valid(other):
			continue
		if String(other.get("kind")) != "wood":
			continue
		if global_position.distance_to((other as Node3D).global_position) <= SPARK_RANGE:
			fuel = other
			break

	if fuel == null:
		Effects.spawn_leaf_burst(global_position + Vector3(0, 0.2, 0), Color(1.0, 0.82, 0.4), 6)
		Sound.play_3d("axe_hit_stone", global_position, -4.0)
		GameState.announce("Sparks, but nothing to catch. Set firewood down beside it.")
		return

	var spot: Vector3 = (fuel as Node3D).global_position
	fuel.queue_free()
	var fire: Node3D = load("res://scenes/campfire.tscn").instantiate() as Node3D
	get_tree().current_scene.add_child(fire)
	fire.global_position = spot
	Effects.spawn_leaf_burst(spot + Vector3(0, 0.3, 0), Color(1.0, 0.72, 0.3), 22)
	Sound.play_3d("fire_ignite", spot, -4.0)
	GameState.announce("The fire catches. You can cook on it now.")
	GameState.report_fire_lit()
	queue_free()

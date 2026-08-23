extends Area3D

# The chopping block outside the cabin. Carry a felled log here, drop it on the
# block, then split it with the axe. Wood only exists on the far side of that:
# felling a tree gets you a log, and a log is not firewood until it is bucked.

const SPLITS_PER_LOG := 4
const WOOD_PER_SPLIT := 3

@export var block_top := 0.62
@export var block_centre: Vector3 = Vector3(-6.25, 0.0, 6.6)

var loaded := false
var splits_left := 0
var log_tint: Color = Color(0.46, 0.35, 0.23)
var round_node: Node3D = null
var shake := 0.0

func _ready() -> void:
	add_to_group("interactable")
	add_to_group("chopping_block")
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	# Kept tight to the block so the volume does not reach around the axe
	# standing in the top of it and swallow that prompt instead.
	box.size = Vector3(1.15, 1.05, 1.15)
	shape.shape = box
	shape.position = Vector3(0, 0.46, 0)
	add_child(shape)

func _process(delta: float) -> void:
	if shake > 0.001:
		shake = move_toward(shake, 0.0, delta * 5.0)
		if round_node != null:
			round_node.position.y = block_top + 0.17 + shake * 0.05
			round_node.rotation.z = shake * randf_range(-0.06, 0.06)

func prompt_for(player: Node) -> String:
	if bool(player.get("carrying_log")):
		if loaded:
			return ""
		return "Drop the log on the block"
	if loaded:
		return ""
	return ""

func interact(player: Node) -> void:
	if loaded or not bool(player.get("carrying_log")):
		return
	log_tint = player.call("release_log")
	loaded = true
	splits_left = SPLITS_PER_LOG
	_build_round()
	GameState.announce("Log on the block. Split it with the axe.")
	Sound.play_3d("land", global_position + Vector3(0, block_top, 0), -2.0)

func _build_round() -> void:
	if round_node != null:
		round_node.queue_free()
	round_node = Node3D.new()
	round_node.name = "LogRound"
	round_node.position = Vector3(0, block_top + 0.17, 0)
	add_child(round_node)

	var bark := StandardMaterial3D.new()
	bark.albedo_color = log_tint
	bark.roughness = 0.94
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.3
	mesh.bottom_radius = 0.32
	mesh.height = 0.34
	mesh.radial_segments = 10
	var body := MeshInstance3D.new()
	body.name = "Round"
	body.mesh = mesh
	body.material_override = bark
	round_node.add_child(body)

	var cut := StandardMaterial3D.new()
	cut.albedo_color = Color(0.74, 0.62, 0.44)
	cut.roughness = 0.9
	var top := MeshInstance3D.new()
	top.name = "CutTop"
	var disc := CylinderMesh.new()
	disc.top_radius = 0.29
	disc.bottom_radius = 0.29
	disc.height = 0.03
	disc.radial_segments = 10
	top.mesh = disc
	top.material_override = cut
	top.position = Vector3(0, 0.18, 0)
	round_node.add_child(top)

# Called by the player when an axe swing lands on the block. Returns how much
# wood the swing produced; zero means there was nothing on the block to hit.
func split(hit_point: Vector3) -> int:
	if not loaded:
		GameState.announce("Nothing on the block. Fell a tree and carry it back.")
		return 0
	splits_left -= 1
	shake = 1.0
	Effects.spawn_wood_chips(hit_point, Vector3.UP)
	Sound.play_3d("knife_hit", hit_point, 0.0)
	GameState.add_wood(WOOD_PER_SPLIT)
	if splits_left <= 0:
		loaded = false
		_scatter_split_wood()
		if round_node != null:
			round_node.queue_free()
			round_node = null
		GameState.announce("Log split. +%d wood." % (WOOD_PER_SPLIT * SPLITS_PER_LOG))
	else:
		# Each split takes a bite out of the round, so progress is visible.
		if round_node != null:
			round_node.scale = Vector3(1.0, 1.0, 1.0) * (0.55 + 0.45 * float(splits_left) / float(SPLITS_PER_LOG))
	return WOOD_PER_SPLIT

# A few halves tumbling off the block when the last swing lands.
func _scatter_split_wood() -> void:
	var bark := StandardMaterial3D.new()
	bark.albedo_color = log_tint
	bark.roughness = 0.94
	for i in 3:
		var piece := MeshInstance3D.new()
		var mesh := CylinderMesh.new()
		mesh.top_radius = 0.11
		mesh.bottom_radius = 0.12
		mesh.height = 0.34
		mesh.radial_segments = 8
		piece.mesh = mesh
		piece.material_override = bark
		piece.rotation_degrees = Vector3(90, randf_range(-40, 40), 0)
		piece.position = Vector3(0, block_top + 0.2, 0)
		add_child(piece)
		var away := Vector3(randf_range(-0.8, 0.8), 0.0, randf_range(-0.8, 0.8)).normalized()
		var tween: Tween = create_tween()
		tween.set_parallel(true)
		tween.tween_property(piece, "position",
			Vector3(away.x * 0.85, 0.12, away.z * 0.85), 0.42).set_ease(Tween.EASE_OUT)
		tween.tween_property(piece, "rotation_degrees",
			Vector3(90, randf_range(-90, 90), randf_range(-25, 25)), 0.42)

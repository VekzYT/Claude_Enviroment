extends Area3D

# The map itself: a sheet of paper weighted down on the cabin table, and the
# thing you interact with to open the map screen.

@export var map_screen_path: NodePath

var screen: Node = null

func _ready() -> void:
	add_to_group("interactable")
	_build()

func _build() -> void:
	var paper := StandardMaterial3D.new()
	paper.albedo_color = Color(0.86, 0.80, 0.63)
	paper.roughness = 0.95
	var ink := StandardMaterial3D.new()
	ink.albedo_color = Color(0.30, 0.24, 0.16)
	ink.roughness = 0.95

	var box := BoxMesh.new()
	box.size = Vector3.ONE

	var sheet := MeshInstance3D.new()
	sheet.name = "Sheet"
	sheet.mesh = box
	sheet.material_override = paper
	sheet.scale = Vector3(0.78, 0.014, 0.58)
	sheet.rotation_degrees = Vector3(0, 12, 0)
	add_child(sheet)

	# A few ink strokes so it reads as a chart and not a napkin.
	for i in 3:
		var line := MeshInstance3D.new()
		line.mesh = box
		line.material_override = ink
		line.scale = Vector3(0.42 - i * 0.08, 0.004, 0.012)
		line.position = Vector3(-0.04 + i * 0.03, 0.009, -0.12 + i * 0.11)
		line.rotation_degrees = Vector3(0, 12 + i * 9, 0)
		add_child(line)

	# Something heavy holding one corner flat.
	var stone := MeshInstance3D.new()
	stone.name = "Weight"
	stone.mesh = box
	var rock := StandardMaterial3D.new()
	rock.albedo_color = Color(0.34, 0.34, 0.32)
	rock.roughness = 0.9
	stone.material_override = rock
	stone.scale = Vector3(0.11, 0.07, 0.09)
	stone.position = Vector3(0.21, 0.04, 0.14)
	stone.rotation_degrees = Vector3(0, 22, 0)
	add_child(stone)

	var shape := CollisionShape3D.new()
	var area := BoxShape3D.new()
	# Hugs the sheet on the table top. A tall box centred above it looked fine
	# from across the room but was impossible to hit up close, because looking
	# down at the map sent the ray over the top of the volume.
	area.size = Vector3(0.9, 0.16, 0.72)
	shape.shape = area
	shape.position = Vector3(0, 0.03, 0)
	add_child(shape)

func prompt_for(_player: Node) -> String:
	return "Read the map"

func interact(_player: Node) -> void:
	if screen == null:
		screen = get_node_or_null(map_screen_path)
	if screen == null:
		screen = get_tree().get_first_node_in_group("map_screen")
	if screen == null:
		return
	var first_time: bool = not GameState.map_known
	GameState.learn_map()
	screen.call("open_map")
	if first_time:
		GameState.announce("Map memorised. Press M to open it anywhere.")

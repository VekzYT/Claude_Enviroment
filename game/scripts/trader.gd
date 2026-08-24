extends Area3D

# Maren, who runs the stall in Elmswood. She is the only way into the trade
# screen, and the only source of a bow in the valley.
#
# The body is boxes on pivots, same as the animals -- it costs nothing, it
# matches the look of everything else, and it means she can breathe and glance
# about without an imported rig.

@export var skin: Color = Color(0.72, 0.55, 0.42)
@export var coat: Color = Color(0.32, 0.29, 0.22)

var body_root: Node3D = null
var head_pivot: Node3D = null
var arm_left: Node3D = null
var arm_right: Node3D = null
var idle := 0.0
var screen: Node = null

func _ready() -> void:
	add_to_group("interactable")
	add_to_group("trader")
	idle = randf() * TAU
	_build()

func _mat(colour: Color, rough: float = 0.94) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = colour
	m.roughness = rough
	return m

func _part(parent: Node3D, pos: Vector3, size: Vector3, mat: Material,
		rot_deg: Vector3 = Vector3.ZERO) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = Vector3.ONE
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.material_override = mat
	node.position = pos
	node.rotation_degrees = rot_deg
	node.scale = size
	parent.add_child(node)
	return node

func _build() -> void:
	var skin_mat: StandardMaterial3D = _mat(skin)
	var coat_mat: StandardMaterial3D = _mat(coat)
	var dark: StandardMaterial3D = _mat(coat.darkened(0.45))
	var hair: StandardMaterial3D = _mat(Color(0.24, 0.17, 0.12))

	body_root = Node3D.new()
	body_root.name = "Body"
	add_child(body_root)

	# Legs, torso, then a coat over the top of it.
	for side in [-1.0, 1.0]:
		_part(body_root, Vector3(0.14 * side, 0.42, 0), Vector3(0.22, 0.84, 0.24), dark)
		_part(body_root, Vector3(0.14 * side, 0.04, 0.04), Vector3(0.24, 0.12, 0.34), dark)
	_part(body_root, Vector3(0, 1.18, 0), Vector3(0.54, 0.72, 0.32), coat_mat)
	_part(body_root, Vector3(0, 0.92, 0), Vector3(0.58, 0.34, 0.36), dark)

	head_pivot = Node3D.new()
	head_pivot.name = "HeadPivot"
	head_pivot.position = Vector3(0, 1.56, 0)
	body_root.add_child(head_pivot)
	_part(head_pivot, Vector3(0, 0.06, 0), Vector3(0.26, 0.3, 0.26), skin_mat)
	_part(head_pivot, Vector3(0, 0.2, -0.01), Vector3(0.29, 0.12, 0.29), hair)
	# A scarf, so she is not just a head on a coat.
	_part(head_pivot, Vector3(0, -0.12, 0.0), Vector3(0.32, 0.14, 0.32), mat_scarf())

	arm_left = Node3D.new()
	arm_left.position = Vector3(-0.36, 1.42, 0)
	body_root.add_child(arm_left)
	_part(arm_left, Vector3(0, -0.28, 0), Vector3(0.17, 0.62, 0.19), coat_mat)
	_part(arm_left, Vector3(0, -0.62, 0), Vector3(0.15, 0.14, 0.16), skin_mat)

	arm_right = Node3D.new()
	arm_right.position = Vector3(0.36, 1.42, 0)
	body_root.add_child(arm_right)
	_part(arm_right, Vector3(0, -0.28, 0), Vector3(0.17, 0.62, 0.19), coat_mat)
	_part(arm_right, Vector3(0, -0.62, 0), Vector3(0.15, 0.14, 0.16), skin_mat)

	# The interaction volume. Generous, and low enough that looking slightly
	# down at her from a stride away still connects -- the mistake the map table
	# and the campfire both made was sitting the volume where the ray was not.
	var cs := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(1.5, 2.2, 1.5)
	cs.shape = box
	cs.position = Vector3(0, 1.1, 0)
	add_child(cs)

func mat_scarf() -> StandardMaterial3D:
	return _mat(Color(0.55, 0.23, 0.19))

func _process(delta: float) -> void:
	idle += delta
	if body_root == null:
		return
	# Breathing, a slow glance around the square, and arms that drift.
	body_root.position.y = sin(idle * 1.5) * 0.012
	head_pivot.rotation.y = sin(idle * 0.4) * 0.32
	head_pivot.rotation.x = sin(idle * 0.7) * 0.06
	arm_left.rotation.x = sin(idle * 1.1) * 0.07
	arm_right.rotation.x = sin(idle * 1.1 + 1.4) * 0.07

# Chest height. Without this the interaction cone measures the angle and the
# range to the point between her boots, which is not where anyone looks.
func interact_point() -> Vector3:
	return global_position + Vector3(0.0, 1.25, 0.0)

func prompt_for(_player: Node) -> String:
	return "Trade with Maren"

func interact(_player: Node) -> void:
	if screen == null or not is_instance_valid(screen):
		screen = get_tree().get_first_node_in_group("trade_screen")
	if screen == null:
		return
	screen.call("open_trade")

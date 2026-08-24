extends Node3D

# A door leaf hung in a built doorway. This node is the hinge: the leaf is
# offset half its width away from it, so rotating this node swings the door
# about its edge the way a door actually moves, rather than spinning it around
# its own middle.
#
# The leaf carries its own StaticBody3D. Rotating a collider every frame is
# fine here because it only moves while the door is opening.

const OPEN_ANGLE := 1.45
const SWING_SPEED := 5.0

@export var leaf_size := Vector3(1.05, 1.94, 0.24)
@export var wood_mat: Material = null
@export var trim_mat: Material = null

var is_open := false
var swing := 0.0
var leaf: StaticBody3D = null

func _ready() -> void:
	add_to_group("interactable")
	add_to_group("built_door")
	_build()

func _mesh(parent: Node3D, size: Vector3, pos: Vector3, mat: Material) -> void:
	var mesh := BoxMesh.new()
	mesh.size = Vector3.ONE
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.transform = Transform3D(Basis.IDENTITY.scaled(size), pos)
	node.material_override = mat
	parent.add_child(node)

func _build() -> void:
	if wood_mat == null:
		var m := StandardMaterial3D.new()
		m.albedo_color = Color(0.44, 0.32, 0.20)
		m.roughness = 0.95
		wood_mat = m
	if trim_mat == null:
		var t := StandardMaterial3D.new()
		t.albedo_color = Color(0.28, 0.20, 0.13)
		t.roughness = 0.95
		trim_mat = t

	leaf = StaticBody3D.new()
	leaf.name = "Leaf"
	add_child(leaf)

	# Offset so the hinge edge sits on this node.
	var mid := Vector3(leaf_size.x * 0.5, 0.0, 0.0)
	_mesh(leaf, leaf_size, mid, wood_mat)
	for i in 3:
		_mesh(leaf, Vector3(leaf_size.x * 0.9, 0.09, leaf_size.z + 0.04),
			mid + Vector3(0, -leaf_size.y * 0.35 + leaf_size.y * 0.35 * float(i), 0), trim_mat)
	# Two braces and a handle, so it reads as a door and not a plank.
	_mesh(leaf, Vector3(0.1, leaf_size.y * 0.94, leaf_size.z + 0.05),
		mid + Vector3(-leaf_size.x * 0.4, 0, 0), trim_mat)
	_mesh(leaf, Vector3(0.1, leaf_size.y * 0.94, leaf_size.z + 0.05),
		mid + Vector3(leaf_size.x * 0.4, 0, 0), trim_mat)
	_mesh(leaf, Vector3(0.08, 0.08, leaf_size.z + 0.16),
		mid + Vector3(leaf_size.x * 0.32, 0, 0), trim_mat)

	var cs := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = leaf_size
	cs.shape = shape
	cs.position = mid
	leaf.add_child(cs)

	# The volume you actually aim at, centred on the leaf and generous.
	var area := Area3D.new()
	area.name = "DoorTrigger"
	area.add_to_group("interactable")
	area.set_meta("door", get_path())
	var trigger := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(leaf_size.x + 0.4, leaf_size.y, leaf_size.z + 0.8)
	trigger.shape = box
	trigger.position = mid
	area.add_child(trigger)
	area.set_script(load("res://scripts/door_trigger.gd"))
	add_child(area)

func _process(delta: float) -> void:
	var wanted: float = OPEN_ANGLE if is_open else 0.0
	if absf(swing - wanted) < 0.001:
		return
	swing = move_toward(swing, wanted, SWING_SPEED * delta)
	rotation.y = swing

func toggle() -> void:
	is_open = not is_open
	Sound.play_3d("door_open" if is_open else "door_close", global_position, -6.0)

func interact_point() -> Vector3:
	return global_position + Vector3(0.0, 0.2, 0.0)

func prompt_for(_player: Node) -> String:
	return "Close the door" if is_open else "Open the door"

func interact(_player: Node) -> void:
	toggle()

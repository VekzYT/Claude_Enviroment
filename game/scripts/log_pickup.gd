extends Area3D

# A felled trunk lying where the tree came down. Picking it up does not put it
# in a pocket -- you shoulder it, and until you put it down again you cannot
# swing anything. Getting it back to the chopping block is the whole point.

@export var trunk_radius := 0.34
@export var trunk_length := 3.4
@export var tint: Color = Color(0.46, 0.35, 0.23)

var taken := false
var settle := 0.0

func _ready() -> void:
	add_to_group("interactable")
	_build()

func _build() -> void:
	var mesh := CylinderMesh.new()
	mesh.top_radius = trunk_radius * 0.86
	mesh.bottom_radius = trunk_radius
	mesh.height = trunk_length
	mesh.radial_segments = 10

	var bark := StandardMaterial3D.new()
	bark.albedo_color = tint
	bark.roughness = 0.94

	var body := MeshInstance3D.new()
	body.name = "Trunk"
	body.mesh = mesh
	body.material_override = bark
	# Lying on its side, running along local Z.
	body.rotation_degrees = Vector3(90, 0, 0)
	add_child(body)

	# Pale sawn faces at both ends so it reads as cut rather than snapped.
	var cut := StandardMaterial3D.new()
	cut.albedo_color = Color(0.72, 0.60, 0.42)
	cut.roughness = 0.9
	for side in [-1.0, 1.0]:
		var face := MeshInstance3D.new()
		face.name = "CutFace%d" % int(side)
		var disc := CylinderMesh.new()
		disc.top_radius = trunk_radius * 0.92
		disc.bottom_radius = trunk_radius * 0.92
		disc.height = 0.04
		disc.radial_segments = 10
		face.mesh = disc
		face.material_override = cut
		face.rotation_degrees = Vector3(90, 0, 0)
		face.position = Vector3(0, 0, side * trunk_length * 0.5)
		add_child(face)

	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(trunk_radius * 2.4, trunk_radius * 2.4, trunk_length)
	shape.shape = box
	add_child(shape)

func _process(delta: float) -> void:
	if taken:
		return
	# A short settle so a log that has just dropped does not look frozen.
	if settle < 1.0:
		settle = minf(settle + delta * 2.4, 1.0)
		rotation.z = deg_to_rad(sin(settle * PI * 3.0) * (1.0 - settle) * 5.0)

func prompt_for(_player: Node) -> String:
	if taken:
		return ""
	return "Shoulder the log"

func interact(player: Node) -> void:
	if taken:
		return
	if not player.call("take_log", tint):
		return
	taken = true
	var tween: Tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "scale", Vector3(0.01, 0.01, 0.01), 0.18)
	tween.tween_property(self, "position:y", position.y + 0.4, 0.18)
	tween.chain().tween_callback(queue_free)

extends Area3D

# A cut of meat off a downed animal. Raw until it has been over a fire.

@export var cooked := false

var taken := false
var bob := 0.0
var home_y := 0.0

func _ready() -> void:
	add_to_group("interactable")
	_build()
	home_y = position.y
	bob = randf() * TAU

func _build() -> void:
	var flesh := StandardMaterial3D.new()
	if cooked:
		flesh.albedo_color = Color(0.36, 0.20, 0.11)
	else:
		flesh.albedo_color = Color(0.62, 0.22, 0.22)
	flesh.roughness = 0.72

	var fat := StandardMaterial3D.new()
	fat.albedo_color = Color(0.84, 0.78, 0.66)
	fat.roughness = 0.8

	var box := BoxMesh.new()
	box.size = Vector3.ONE
	var body := MeshInstance3D.new()
	body.name = "Cut"
	body.mesh = box
	body.material_override = flesh
	body.scale = Vector3(0.26, 0.1, 0.18)
	body.rotation_degrees = Vector3(0, 14, -6)
	add_child(body)

	# A rind along one edge, so it reads as a cut rather than a red brick.
	var rind := MeshInstance3D.new()
	rind.mesh = box
	rind.material_override = fat
	rind.scale = Vector3(0.26, 0.03, 0.05)
	rind.position = Vector3(0, 0.045, -0.07)
	rind.rotation_degrees = Vector3(0, 14, -6)
	add_child(rind)

	var shape := CollisionShape3D.new()
	var area := BoxShape3D.new()
	area.size = Vector3(0.44, 0.4, 0.44)
	shape.shape = area
	add_child(shape)

func _process(delta: float) -> void:
	if taken:
		return
	bob += delta
	position.y = home_y + sin(bob * 1.6) * 0.012

func prompt_for(_player: Node) -> String:
	if taken:
		return ""
	if cooked:
		return "Take the cooked meat"
	return "Take the raw meat"

func interact(_player: Node) -> void:
	if taken:
		return
	taken = true
	if cooked:
		GameState.add_cooked_meat(1)
		GameState.announce("Cooked meat taken.")
	else:
		GameState.add_raw_meat(1)
		GameState.announce("Raw meat taken. Cook it over a fire.")
	Sound.play_ui("pickup_meat", -8.0)
	var tween: Tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "position:y", position.y + 0.4, 0.18)
	tween.tween_property(self, "scale", Vector3(0.01, 0.01, 0.01), 0.18)
	tween.chain().tween_callback(queue_free)

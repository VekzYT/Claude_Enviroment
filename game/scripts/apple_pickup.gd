extends Area3D

# An apple shaken out of a broadleaf canopy when it comes down. Picked up into
# the pack rather than eaten on the spot, so you can carry a few and decide
# when to spend one.

var taken := false
var bob := 0.0
var home_y := 0.0

func _ready() -> void:
	add_to_group("interactable")
	_build()
	home_y = position.y
	bob = randf() * TAU

func _build() -> void:
	var skin := StandardMaterial3D.new()
	skin.albedo_color = Color(0.62, 0.12, 0.10)
	skin.roughness = 0.42
	var stalk_mat := StandardMaterial3D.new()
	stalk_mat.albedo_color = Color(0.26, 0.20, 0.12)
	stalk_mat.roughness = 0.9
	var leaf_mat := StandardMaterial3D.new()
	leaf_mat.albedo_color = Color(0.30, 0.46, 0.20)
	leaf_mat.roughness = 0.9
	leaf_mat.cull_mode = BaseMaterial3D.CULL_DISABLED

	var body := MeshInstance3D.new()
	body.name = "Body"
	var sphere := SphereMesh.new()
	sphere.radius = 0.07
	# Slightly squashed, which is most of what makes a sphere read as fruit.
	sphere.height = 0.125
	sphere.radial_segments = 12
	sphere.rings = 7
	body.mesh = sphere
	body.material_override = skin
	add_child(body)

	var stalk := MeshInstance3D.new()
	stalk.name = "Stalk"
	var stick := CylinderMesh.new()
	stick.top_radius = 0.006
	stick.bottom_radius = 0.008
	stick.height = 0.05
	stick.radial_segments = 5
	stalk.mesh = stick
	stalk.material_override = stalk_mat
	stalk.position = Vector3(0, 0.078, 0)
	stalk.rotation_degrees = Vector3(0, 0, 12)
	add_child(stalk)

	var leaf := MeshInstance3D.new()
	leaf.name = "Leaf"
	var quad := QuadMesh.new()
	quad.size = Vector2(0.07, 0.035)
	leaf.mesh = quad
	leaf.material_override = leaf_mat
	leaf.position = Vector3(0.04, 0.095, 0)
	leaf.rotation_degrees = Vector3(-70, 0, 18)
	add_child(leaf)

	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	# Generous compared with the fruit itself, so it is not fiddly to look at.
	box.size = Vector3(0.42, 0.42, 0.42)
	shape.shape = box
	add_child(shape)

func _process(delta: float) -> void:
	if taken:
		return
	bob += delta
	position.y = home_y + sin(bob * 1.7) * 0.015
	rotation.y += delta * 0.5

func prompt_for(_player: Node) -> String:
	if taken:
		return ""
	return "Take the apple"

func interact(_player: Node) -> void:
	if taken:
		return
	taken = true
	GameState.add_apples(1)
	GameState.announce("Apple picked up.")
	Sound.play_ui("pickup_food", -8.0)
	var tween: Tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "position:y", position.y + 0.5, 0.2)
	tween.tween_property(self, "scale", Vector3(0.01, 0.01, 0.01), 0.2)
	tween.chain().tween_callback(queue_free)

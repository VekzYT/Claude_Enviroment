extends CharacterBody3D

# Tomas, a pedlar doing the rounds. He turns up outside your cabin on day 2,
# walks a slow circuit around it for the rest of the week, and is gone on day
# 10 -- which is the day the horde is due, so his leaving is the last warning
# you get.
#
# He is the only trade in the valley. Everything he sells is something you
# cannot make yourself: a bow, arrows for it, and a lamp.
#
# The body is boxes on pivots, the same construction as the animals, so he
# costs about as much to have walking about as a deer does.

const ARRIVE_DAY := 2
const LEAVE_DAY := 10
const GRAVITY := 9.8
const HOME := Vector3(-14.0, 0.0, 4.0)
# Far enough out that he circles the cabin rather than standing in the doorway.
const ROAM_INNER := 7.0
const ROAM_OUTER := 13.0
const ARRIVE_DISTANCE := 1.0
const NOTICE := 6.0
const WALK_SPEED := 1.35

enum State { WALKING, RESTING }

var state: int = State.WALKING
var target := Vector3.ZERO
var timer := 0.0
var idle := 0.0
var here := false
var rng := RandomNumberGenerator.new()
var terrain: Node = null
var player: Node3D = null
var screen: Node = null

var body_root: Node3D = null
var head_pivot: Node3D = null
var arm_left: Node3D = null
var arm_right: Node3D = null
var legs: Array[Node3D] = []
var step_phase := 0.0

func _ready() -> void:
	add_to_group("pedlar")
	rng.randomize()
	idle = rng.randf() * TAU
	terrain = get_tree().get_first_node_in_group("terrain")
	_build()
	GameState.day_changed.connect(_on_day_changed)
	_apply_day(GameState.day)

func _on_day_changed(day: int) -> void:
	_apply_day(day)

func _apply_day(day: int) -> void:
	if day >= LEAVE_DAY:
		if here:
			GameState.announce("The pedlar has packed up and gone. You are on your own now.")
		_set_here(false)
		return
	if day >= ARRIVE_DAY:
		if not here:
			_arrive()
		return
	_set_here(false)

func _set_here(value: bool) -> void:
	here = value
	visible = value
	# Out of the interactable group entirely while he is away, so the
	# interaction cone cannot find a pedlar who has not turned up yet.
	if value:
		if not is_in_group("interactable"):
			add_to_group("interactable")
	else:
		if is_in_group("interactable"):
			remove_from_group("interactable")
	set_physics_process(value)

func _arrive() -> void:
	# Walks in from the road side of the clearing rather than appearing in the
	# middle of it.
	var a: float = rng.randf_range(0.0, TAU)
	var spot := Vector3(HOME.x + cos(a) * ROAM_OUTER, 0.0, HOME.z + sin(a) * ROAM_OUTER)
	spot.y = _ground(spot.x, spot.z)
	global_position = spot + Vector3(0, 0.2, 0)
	_set_here(true)
	_pick_target()
	timer = rng.randf_range(3.0, 7.0)
	GameState.announce("A pedlar has come by the cabin. Press E to see what he has.")
	Sound.play_ui("ui_discover", -5.0)

func _ground(x: float, z: float) -> float:
	if terrain == null:
		return 0.0
	return float(terrain.call("height_at", x, z))

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
	var coat: StandardMaterial3D = _mat(Color(0.33, 0.26, 0.18))
	var dark: StandardMaterial3D = _mat(Color(0.19, 0.15, 0.11))
	var skin: StandardMaterial3D = _mat(Color(0.70, 0.53, 0.40))
	var hair: StandardMaterial3D = _mat(Color(0.26, 0.20, 0.14))
	var strap: StandardMaterial3D = _mat(Color(0.44, 0.30, 0.18))

	body_root = Node3D.new()
	body_root.name = "Body"
	add_child(body_root)

	for side in [-1.0, 1.0]:
		var hip := Node3D.new()
		hip.position = Vector3(0.13 * side, 0.86, 0.0)
		body_root.add_child(hip)
		_part(hip, Vector3(0, -0.42, 0), Vector3(0.21, 0.84, 0.23), dark)
		_part(hip, Vector3(0, -0.82, 0.04), Vector3(0.23, 0.12, 0.32), dark)
		legs.append(hip)

	_part(body_root, Vector3(0, 1.16, 0), Vector3(0.54, 0.72, 0.32), coat)
	_part(body_root, Vector3(0, 0.90, 0), Vector3(0.58, 0.32, 0.36), dark)

	# The pack on his back is what makes him read as a pedlar and not a farmer.
	_part(body_root, Vector3(0, 1.24, 0.28), Vector3(0.46, 0.56, 0.28), strap)
	_part(body_root, Vector3(0, 1.46, 0.30), Vector3(0.50, 0.14, 0.32), dark)
	for side in [-1.0, 1.0]:
		_part(body_root, Vector3(0.20 * side, 1.28, 0.06), Vector3(0.07, 0.62, 0.06),
			strap, Vector3(0, 0, 6 * side))
	# A bedroll lashed across the top of it.
	_part(body_root, Vector3(0, 1.58, 0.28), Vector3(0.52, 0.16, 0.16), _mat(Color(0.50, 0.42, 0.30)))

	head_pivot = Node3D.new()
	head_pivot.name = "HeadPivot"
	head_pivot.position = Vector3(0, 1.56, 0)
	body_root.add_child(head_pivot)
	_part(head_pivot, Vector3(0, 0.06, 0), Vector3(0.26, 0.30, 0.26), skin)
	_part(head_pivot, Vector3(0, 0.20, -0.01), Vector3(0.29, 0.12, 0.29), hair)
	# A wide brim, which is most of his silhouette at a distance.
	_part(head_pivot, Vector3(0, 0.26, 0), Vector3(0.52, 0.05, 0.52), dark)
	_part(head_pivot, Vector3(0, 0.32, 0), Vector3(0.28, 0.12, 0.28), dark)

	arm_left = Node3D.new()
	arm_left.position = Vector3(-0.36, 1.42, 0)
	body_root.add_child(arm_left)
	_part(arm_left, Vector3(0, -0.28, 0), Vector3(0.17, 0.62, 0.19), coat)
	_part(arm_left, Vector3(0, -0.62, 0), Vector3(0.15, 0.14, 0.16), skin)

	arm_right = Node3D.new()
	arm_right.position = Vector3(0.36, 1.42, 0)
	body_root.add_child(arm_right)
	_part(arm_right, Vector3(0, -0.28, 0), Vector3(0.17, 0.62, 0.19), coat)
	_part(arm_right, Vector3(0, -0.62, 0), Vector3(0.15, 0.14, 0.16), skin)
	# A walking staff in his right hand.
	_part(arm_right, Vector3(0.02, -0.42, -0.02), Vector3(0.05, 1.7, 0.05),
		_mat(Color(0.40, 0.29, 0.18)))

	var cs := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.34
	capsule.height = 1.8
	cs.shape = capsule
	cs.position = Vector3(0, 0.9, 0)
	add_child(cs)

	_set_here(false)

func _pick_target() -> void:
	var a: float = rng.randf_range(0.0, TAU)
	var r: float = rng.randf_range(ROAM_INNER, ROAM_OUTER)
	var spot := Vector3(HOME.x + cos(a) * r, 0.0, HOME.z + sin(a) * r)
	spot.y = _ground(spot.x, spot.z)
	target = spot

func _physics_process(delta: float) -> void:
	if not here:
		return
	if not is_on_floor():
		velocity.y -= GRAVITY * delta

	if player == null or not is_instance_valid(player):
		player = get_tree().get_first_node_in_group("player")

	timer -= delta
	var moving := false

	# He stops to talk when you come close, which is also what stops him
	# strolling away mid-sentence while the stall is open.
	var close: bool = player != null and global_position.distance_to(player.global_position) < NOTICE
	if close or GameState.trade_open:
		if player != null:
			var to_player: Vector3 = player.global_position - global_position
			var face: float = atan2(-to_player.x, -to_player.z)
			rotation.y = lerp_angle(rotation.y, face, clampf(delta * 4.0, 0.0, 1.0))
		velocity.x = move_toward(velocity.x, 0.0, 14.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 14.0 * delta)
	elif state == State.RESTING:
		velocity.x = move_toward(velocity.x, 0.0, 14.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 14.0 * delta)
		if timer <= 0.0:
			state = State.WALKING
			_pick_target()
			timer = rng.randf_range(10.0, 22.0)
	else:
		var flat: Vector3 = target - global_position
		flat.y = 0.0
		if flat.length() < ARRIVE_DISTANCE or timer <= 0.0:
			state = State.RESTING
			timer = rng.randf_range(4.0, 10.0)
		else:
			var dir: Vector3 = flat.normalized()
			# Turn first, then go, or he slides sideways while facing the old way.
			var facing: float = atan2(-dir.x, -dir.z)
			rotation.y = lerp_angle(rotation.y, facing, clampf(delta * 5.0, 0.0, 1.0))
			var nose: Vector3 = -global_transform.basis.z
			var gate: float = clampf((nose.dot(dir) - 0.3) / 0.5, 0.0, 1.0)
			var wanted: float = WALK_SPEED * (0.05 + 0.95 * gate)
			velocity.x = move_toward(velocity.x, dir.x * wanted, WALK_SPEED * 5.0 * delta)
			velocity.z = move_toward(velocity.z, dir.z * wanted, WALK_SPEED * 5.0 * delta)
			moving = true

	move_and_slide()
	_animate(delta, moving)

func _animate(delta: float, moving: bool) -> void:
	idle += delta
	var pace: float = Vector2(velocity.x, velocity.z).length()
	step_phase += delta * (2.0 + pace * 3.4)
	body_root.position.y = sin(idle * 1.4) * 0.011

	if moving and pace > 0.12:
		var swing: float = clampf(pace / WALK_SPEED, 0.0, 1.0) * 0.5
		for i in legs.size():
			legs[i].rotation.x = sin(step_phase + (0.0 if i == 0 else PI)) * swing
		arm_left.rotation.x = sin(step_phase + PI) * swing * 0.7
		# The staff arm plants rather than swinging freely.
		arm_right.rotation.x = -0.12 + sin(step_phase) * swing * 0.2
		head_pivot.rotation.y = lerp(head_pivot.rotation.y, 0.0, delta * 4.0)
	else:
		for leg in legs:
			leg.rotation.x = lerp(leg.rotation.x, 0.0, delta * 6.0)
		arm_left.rotation.x = sin(idle * 1.1) * 0.06
		arm_right.rotation.x = -0.12 + sin(idle * 1.1 + 1.2) * 0.05
		head_pivot.rotation.y = sin(idle * 0.5) * 0.28

# Chest height. Measuring the interaction cone to a person's origin aims it at
# the ground between their boots, which is not where anyone looks.
func interact_point() -> Vector3:
	return global_position + Vector3(0.0, 1.25, 0.0)

func prompt_for(_player: Node) -> String:
	if not here:
		return ""
	return "Trade with the pedlar"

func interact(_player: Node) -> void:
	if not here:
		return
	if screen == null or not is_instance_valid(screen):
		screen = get_tree().get_first_node_in_group("trade_screen")
	if screen == null:
		return
	screen.call("open_trade")

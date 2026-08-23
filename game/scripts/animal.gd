extends CharacterBody3D

# A grazing animal. It wanders between nearby points, stops to feed, notices
# you if you get close, and bolts if you hit it. Two or three axe blows kill it
# and it leaves meat where it drops.
#
# It exposes hit(damage), which is all the player's melee code needs -- that
# path already damages anything with the method, so nothing player-side had to
# change to make animals killable.

const GRAVITY := 9.8
const WANDER_RADIUS := 22.0
const ARRIVE_DISTANCE := 1.4
const NOTICE_DISTANCE := 11.0
const FLEE_TIME := 6.0

enum State { GRAZE, WANDER, FLEE, DEAD }

@export var species := "deer"
@export var max_health := 40
@export var walk_speed := 1.9
@export var run_speed := 7.4
@export var body_tint: Color = Color(0.44, 0.32, 0.21)

var health := 0
var state: int = State.GRAZE
var target := Vector3.ZERO
var home := Vector3.ZERO
var state_timer := 0.0
var flee_timer := 0.0
var step_phase := 0.0
var rng := RandomNumberGenerator.new()
var player: Node3D = null
var legs: Array[Node3D] = []
var head_pivot: Node3D = null
var body_root: Node3D = null

func _ready() -> void:
	add_to_group("animal")
	rng.randomize()
	health = max_health
	home = global_position
	_build()
	_pick_new_target()
	state_timer = rng.randf_range(1.5, 4.0)

# --- shape -------------------------------------------------------------------

func _material(colour: Color, roughness: float = 0.92) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = colour
	mat.roughness = roughness
	return mat

func _part(parent: Node3D, position: Vector3, size: Vector3, mat: Material,
		rotation_deg: Vector3 = Vector3.ZERO) -> MeshInstance3D:
	var box := BoxMesh.new()
	box.size = Vector3.ONE
	var node := MeshInstance3D.new()
	node.mesh = box
	node.material_override = mat
	node.position = position
	node.scale = size
	node.rotation_degrees = rotation_deg
	parent.add_child(node)
	return node

func _build() -> void:
	var hide_mat: StandardMaterial3D = _material(body_tint)
	var pale: StandardMaterial3D = _material(body_tint.lightened(0.28))
	var dark: StandardMaterial3D = _material(body_tint.darkened(0.45))

	body_root = Node3D.new()
	body_root.name = "Body"
	add_child(body_root)

	var tall: float = 0.86
	var length: float = 1.25
	if species == "boar":
		tall = 0.62
		length = 1.12

	_part(body_root, Vector3(0, tall, 0), Vector3(0.46, 0.5, length), hide_mat)
	_part(body_root, Vector3(0, tall - 0.06, -length * 0.42), Vector3(0.42, 0.42, 0.3), hide_mat)
	_part(body_root, Vector3(0, tall + 0.06, length * 0.44), Vector3(0.34, 0.3, 0.26), hide_mat)

	# The neck and head hang off a pivot so the animal can drop its head to graze.
	head_pivot = Node3D.new()
	head_pivot.name = "HeadPivot"
	head_pivot.position = Vector3(0, tall + 0.14, -length * 0.5)
	body_root.add_child(head_pivot)
	var neck_len: float = 0.42
	if species == "boar":
		neck_len = 0.2
	_part(head_pivot, Vector3(0, 0, -neck_len * 0.5), Vector3(0.24, 0.26, neck_len), hide_mat)
	_part(head_pivot, Vector3(0, 0.02, -neck_len - 0.14), Vector3(0.22, 0.22, 0.34), hide_mat)
	_part(head_pivot, Vector3(0, -0.02, -neck_len - 0.31), Vector3(0.15, 0.14, 0.12), dark)

	if species == "deer":
		# Ears out to the sides, and a pair of simple antlers.
		for side in [-1.0, 1.0]:
			_part(head_pivot, Vector3(0.11 * side, 0.12, -neck_len - 0.06),
				Vector3(0.1, 0.13, 0.07), pale, Vector3(0, 0, 26 * side))
			_part(head_pivot, Vector3(0.07 * side, 0.26, -neck_len - 0.02),
				Vector3(0.045, 0.3, 0.045), dark, Vector3(-12, 0, 22 * side))
			_part(head_pivot, Vector3(0.15 * side, 0.38, -neck_len - 0.02),
				Vector3(0.04, 0.16, 0.04), dark, Vector3(-8, 0, 44 * side))
		_part(body_root, Vector3(0, tall + 0.18, length * 0.55), Vector3(0.14, 0.18, 0.1), pale)
	else:
		# Tusks and a bristly ridge.
		for side in [-1.0, 1.0]:
			_part(head_pivot, Vector3(0.08 * side, -0.06, -neck_len - 0.3),
				Vector3(0.035, 0.11, 0.035), pale, Vector3(-24, 0, 12 * side))
		_part(body_root, Vector3(0, tall + 0.27, -0.05), Vector3(0.1, 0.14, length * 0.7), dark)

	# Four legs on their own pivots, so they can swing.
	var leg_len: float = tall - 0.24
	for i in 4:
		var side: float = -1.0
		if i % 2 == 1:
			side = 1.0
		var front: float = -1.0
		if i >= 2:
			front = 1.0
		var pivot := Node3D.new()
		pivot.name = "Leg%d" % i
		pivot.position = Vector3(0.17 * side, tall - 0.24, length * 0.3 * front)
		body_root.add_child(pivot)
		_part(pivot, Vector3(0, -leg_len * 0.5, 0), Vector3(0.11, leg_len, 0.11), hide_mat)
		_part(pivot, Vector3(0, -leg_len + 0.03, 0), Vector3(0.13, 0.1, 0.15), dark)
		legs.append(pivot)

	var shape := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.36
	capsule.height = tall + 0.5
	shape.shape = capsule
	shape.position = Vector3(0, (tall + 0.5) * 0.5, 0)
	add_child(shape)

# --- behaviour ---------------------------------------------------------------

func _pick_new_target() -> void:
	var angle: float = rng.randf_range(0.0, TAU)
	var distance: float = rng.randf_range(4.0, WANDER_RADIUS)
	target = home + Vector3(cos(angle) * distance, 0.0, sin(angle) * distance)

func _physics_process(delta: float) -> void:
	if state == State.DEAD:
		if not is_on_floor():
			velocity.y -= GRAVITY * delta
			move_and_slide()
		return

	if not is_on_floor():
		velocity.y -= GRAVITY * delta
	else:
		velocity.y = 0.0

	if player == null or not is_instance_valid(player):
		player = get_tree().get_first_node_in_group("player") as Node3D

	state_timer -= delta
	if flee_timer > 0.0:
		flee_timer -= delta
		if flee_timer <= 0.0 and state == State.FLEE:
			state = State.GRAZE
			state_timer = rng.randf_range(2.0, 5.0)

	# Something too close is reason enough to move off, hit or not.
	if state != State.FLEE and player != null:
		var near: float = global_position.distance_to(player.global_position)
		if near < NOTICE_DISTANCE * 0.45:
			_spook()

	var speed := 0.0
	var direction := Vector3.ZERO

	match state:
		State.GRAZE:
			if state_timer <= 0.0:
				state = State.WANDER
				_pick_new_target()
				state_timer = rng.randf_range(4.0, 9.0)
		State.WANDER:
			direction = _flat(target - global_position)
			speed = walk_speed
			if direction.length() < ARRIVE_DISTANCE or state_timer <= 0.0:
				state = State.GRAZE
				state_timer = rng.randf_range(2.5, 6.0)
		State.FLEE:
			if player != null:
				direction = _flat(global_position - player.global_position)
			speed = run_speed

	if direction.length() > 0.01:
		direction = direction.normalized()
		velocity.x = move_toward(velocity.x, direction.x * speed, speed * 4.0 * delta)
		velocity.z = move_toward(velocity.z, direction.z * speed, speed * 4.0 * delta)
		# Turn to face where it is going rather than snapping.
		var facing: float = atan2(direction.x, direction.z)
		rotation.y = lerp_angle(rotation.y, facing, clampf(delta * 5.0, 0.0, 1.0))
	else:
		velocity.x = move_toward(velocity.x, 0.0, 12.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 12.0 * delta)

	move_and_slide()
	_animate(delta)

func _flat(v: Vector3) -> Vector3:
	return Vector3(v.x, 0.0, v.z)

func _spook() -> void:
	if state == State.DEAD:
		return
	state = State.FLEE
	flee_timer = FLEE_TIME

func _animate(delta: float) -> void:
	var speed: float = Vector2(velocity.x, velocity.z).length()
	step_phase += delta * (2.0 + speed * 1.6)
	var swing: float = clampf(speed / run_speed, 0.0, 1.0) * 0.7
	for i in legs.size():
		# Diagonal pairs move together, which is what makes a four-legged walk
		# read as a walk rather than a shuffle.
		var offset: float = PI
		if i == 0 or i == 3:
			offset = 0.0
		legs[i].rotation.x = sin(step_phase * 2.0 + offset) * swing

	if head_pivot != null:
		if speed < 0.35 and state == State.GRAZE:
			# Head down, feeding.
			head_pivot.rotation.x = lerp_angle(head_pivot.rotation.x, deg_to_rad(58.0), delta * 2.2)
		else:
			head_pivot.rotation.x = lerp_angle(head_pivot.rotation.x, deg_to_rad(-4.0), delta * 4.0)

	if body_root != null:
		body_root.position.y = absf(sin(step_phase * 2.0)) * 0.035 * swing

# --- damage ------------------------------------------------------------------

# The player's melee calls this on anything that has it.
func hit(damage: int) -> void:
	if state == State.DEAD:
		return
	health -= damage
	_spook()
	Effects.spawn_blood(global_position + Vector3(0, 0.8, 0), Vector3.UP)
	if health <= 0:
		_die()
	else:
		Sound.play_3d("bot_alert", global_position, -6.0)

func _die() -> void:
	state = State.DEAD
	velocity = Vector3.ZERO
	Sound.play_3d("bot_death", global_position, -4.0)
	GameState.announce("%s down. Take the meat." % species.capitalize())

	# Topple onto its side, then leave meat where it fell.
	var tween: Tween = create_tween()
	tween.tween_property(self, "rotation:z", deg_to_rad(84.0), 0.7).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(self, "position:y", position.y + 0.12, 0.25)
	tween.tween_interval(0.4)
	tween.tween_callback(_drop_meat)
	tween.tween_property(self, "scale", Vector3(0.02, 0.02, 0.02), 0.4)
	tween.tween_callback(queue_free)

func _drop_meat() -> void:
	var count: int = 2
	if species == "boar":
		count = 3
	var meat_scene: PackedScene = load("res://scenes/meat_pickup.tscn") as PackedScene
	for i in count:
		var meat: Node3D = meat_scene.instantiate() as Node3D
		get_parent().add_child(meat)
		var angle: float = TAU * float(i) / float(count) + rng.randf_range(-0.4, 0.4)
		meat.global_position = global_position + Vector3(
			cos(angle) * rng.randf_range(0.3, 0.9), 0.16, sin(angle) * rng.randf_range(0.3, 0.9))

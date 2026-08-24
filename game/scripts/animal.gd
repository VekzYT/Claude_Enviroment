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
const NOTICE_DISTANCE := 16.0
const ALERT_DISTANCE := 24.0

# How big each animal is built, as a multiple of the deer. Applied to the whole
# body at once rather than to each box, so proportions cannot drift apart.
const BODY_SCALE := {
	"deer": 1.0, "boar": 1.0, "hare": 0.34, "elk": 1.26,
}
const FLEE_TIME := 7.0
# How far ahead it checks for a trunk before walking into one.
const FEELER_LENGTH := 2.2

enum State { GRAZE, WANDER, ALERT, FLEE, DEAD }

@export var species := "deer"
@export var max_health := 40
@export var walk_speed := 1.9
@export var run_speed := 7.4
@export var body_tint: Color = Color(0.44, 0.32, 0.21)
# Multiplies how far off it spots you. A hare is jumpy, a boar barely cares.
@export var wariness := 1.0

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
	elif species == "hare":
		tall = 0.74
		length = 0.92
	body_root.scale = Vector3.ONE * float(BODY_SCALE.get(species, 1.0))

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
	elif species == "hare":
		neck_len = 0.14
	_part(head_pivot, Vector3(0, 0, -neck_len * 0.5), Vector3(0.24, 0.26, neck_len), hide_mat)
	_part(head_pivot, Vector3(0, 0.02, -neck_len - 0.14), Vector3(0.22, 0.22, 0.34), hide_mat)
	_part(head_pivot, Vector3(0, -0.02, -neck_len - 0.31), Vector3(0.15, 0.14, 0.12), dark)

	if species == "hare":
		# All ears. They are most of what you see of one before it goes.
		for side in [-1.0, 1.0]:
			_part(head_pivot, Vector3(0.07 * side, 0.30, -neck_len - 0.02),
				Vector3(0.09, 0.52, 0.06), pale, Vector3(-8, 0, 13 * side))
		_part(body_root, Vector3(0, tall + 0.10, length * 0.5),
			Vector3(0.2, 0.2, 0.18), pale)
	elif species == "deer" or species == "elk":
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

	var body_size: float = float(BODY_SCALE.get(species, 1.0))
	var shape := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.36 * body_size
	capsule.height = (tall + 0.5) * body_size
	shape.shape = capsule
	shape.position = Vector3(0, (tall + 0.5) * 0.5 * body_size, 0)
	add_child(shape)

# --- behaviour ---------------------------------------------------------------

func _pick_new_target() -> void:
	var terrain: Node = get_tree().get_first_node_in_group("terrain")
	for attempt in 6:
		var angle: float = rng.randf_range(0.0, TAU)
		var distance: float = rng.randf_range(5.0, WANDER_RADIUS)
		var spot: Vector3 = home + Vector3(cos(angle) * distance, 0.0, sin(angle) * distance)
		# Do not set off toward a cliff it cannot climb.
		if terrain != null and terrain.has_method("slope_at"):
			if float(terrain.call("slope_at", spot.x, spot.z)) > 0.45:
				continue
		target = spot
		return
	target = home

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

	# Notices you at a distance and watches; bolts if you keep coming.
	if state != State.FLEE and player != null:
		var near: float = global_position.distance_to(player.global_position)
		# Crouching shrinks both of these, which is the whole point of it:
		# walk up on a deer and it bolts at sixteen metres, crawl and you can
		# get inside seven.
		var stealth: float = 1.0
		if player.has_method("stealth_factor"):
			stealth = float(player.call("stealth_factor"))
		var notice_at: float = NOTICE_DISTANCE * wariness * stealth
		var alert_at: float = ALERT_DISTANCE * wariness * stealth
		if near < notice_at:
			_spook()
		elif near < alert_at and state != State.ALERT:
			state = State.ALERT
			state_timer = rng.randf_range(1.4, 2.8)
		elif near > alert_at * 1.3 and state == State.ALERT:
			state = State.GRAZE
			state_timer = rng.randf_range(2.0, 5.0)

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
		State.ALERT:
			# Head up, standing still, watching whatever it heard.
			if player != null:
				var toward: Vector3 = _flat(player.global_position - global_position)
				if toward.length() > 0.1:
					var look: float = atan2(-toward.normalized().x, -toward.normalized().z)
					rotation.y = lerp_angle(rotation.y, look, clampf(delta * 2.4, 0.0, 1.0))
			if state_timer <= 0.0:
				state = State.GRAZE
				state_timer = rng.randf_range(2.0, 5.0)
		State.FLEE:
			if player != null:
				direction = _flat(global_position - player.global_position)
			speed = run_speed

	if direction.length() > 0.01:
		direction = direction.normalized()
		direction = _steer_around(direction)

		# Turn first, then go. Without this the body lerps toward the new
		# heading while the velocity has already snapped to it, and for a
		# moment the animal slides backwards with its legs cycling forwards.
		var facing: float = atan2(-direction.x, -direction.z)
		rotation.y = lerp_angle(rotation.y, facing, clampf(delta * 7.0, 0.0, 1.0))

		var nose: Vector3 = -global_transform.basis.z
		var alignment: float = clampf(nose.dot(direction), 0.0, 1.0)
		# Barely moves until it is pointing more or less the right way.
		var gate: float = clampf((alignment - 0.35) / 0.45, 0.0, 1.0)
		var wanted: float = speed * (0.06 + 0.94 * gate)
		velocity.x = move_toward(velocity.x, direction.x * wanted, speed * 5.0 * delta)
		velocity.z = move_toward(velocity.z, direction.z * wanted, speed * 5.0 * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, 12.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 12.0 * delta)

	move_and_slide()
	_animate(delta)

# Looks a short way ahead and slides along whatever it finds, so an animal
# stops pressing into a trunk with its legs cycling.
func _steer_around(direction: Vector3) -> Vector3:
	var space: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	var eye: Vector3 = global_position + Vector3(0, 0.55, 0)
	var query := PhysicsRayQueryParameters3D.create(eye, eye + direction * FEELER_LENGTH)
	query.exclude = [get_rid()]
	var hit: Dictionary = space.intersect_ray(query)
	if hit.is_empty():
		return direction
	# Turn away from the surface, and give up on this target so it picks a new
	# one rather than grinding along the obstacle forever.
	var normal: Vector3 = _flat(hit.get("normal", Vector3.UP))
	if normal.length() < 0.05:
		return direction
	var slid: Vector3 = _flat(direction - normal.normalized() * direction.dot(normal.normalized()))
	if slid.length() < 0.15:
		slid = Vector3(-direction.z, 0.0, direction.x)
	if state == State.WANDER:
		state_timer = minf(state_timer, 0.4)
	return slid.normalized()

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
	if speed < 0.25:
		swing = 0.0
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
	elif species == "elk":
		count = 4
	elif species == "hare":
		count = 1
	var meat_scene: PackedScene = load("res://scenes/meat_pickup.tscn") as PackedScene
	for i in count:
		var meat: Node3D = meat_scene.instantiate() as Node3D
		get_parent().add_child(meat)
		var angle: float = TAU * float(i) / float(count) + rng.randf_range(-0.4, 0.4)
		meat.global_position = global_position + Vector3(
			cos(angle) * rng.randf_range(0.3, 0.9), 0.16, sin(angle) * rng.randf_range(0.3, 0.9))

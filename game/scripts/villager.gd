extends CharacterBody3D

# Somebody who lives in Elmswood. Not a trader and not a threat -- they exist so
# the village reads as inhabited rather than as a set of empty buildings.
#
# Two kinds of life: WALKERS pick a spot inside the walls and stroll to it,
# stopping now and then to look around; STANDERS keep a post -- leaning at a
# stall, working a bench -- and turn to watch you when you get close.
#
# The body is boxes on pivots, the same construction as the animals and the
# trader, so a villager costs about as much as a deer.

const GRAVITY := 9.8
const ARRIVE := 0.8
const NOTICE := 7.0

enum Mode { WALK, STAND }
enum State { MOVING, PAUSED }

@export var mode: int = Mode.WALK
@export var home := Vector3.ZERO
@export var roam_radius := 12.0
@export var walk_speed := 1.5
@export var coat: Color = Color(0.34, 0.30, 0.24)
@export var skin: Color = Color(0.72, 0.55, 0.42)
@export var post_facing := 0.0
# What a stander is busy with, which drives how their arms move.
@export var task := "idle"

var state: int = State.MOVING
var target := Vector3.ZERO
var timer := 0.0
var idle := 0.0
var rng := RandomNumberGenerator.new()
var terrain: Node = null
var player: Node3D = null

var body_root: Node3D = null
var head_pivot: Node3D = null
var arm_left: Node3D = null
var arm_right: Node3D = null
var legs: Array[Node3D] = []
var step_phase := 0.0

func _ready() -> void:
	add_to_group("villager")
	rng.randomize()
	idle = rng.randf() * TAU
	terrain = get_tree().get_first_node_in_group("terrain")
	if home == Vector3.ZERO:
		home = global_position
	_build()
	if mode == Mode.WALK:
		_pick_target()
	else:
		state = State.PAUSED
		rotation.y = post_facing
	timer = rng.randf_range(1.0, 4.0)

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
	var coat_mat: StandardMaterial3D = _mat(coat)
	var dark: StandardMaterial3D = _mat(coat.darkened(0.45))
	var skin_mat: StandardMaterial3D = _mat(skin)
	var hair: StandardMaterial3D = _mat(Color(0.20, 0.15, 0.11).lerp(coat.darkened(0.6), rng.randf()))

	body_root = Node3D.new()
	body_root.name = "Body"
	add_child(body_root)

	# Legs hang off pivots so they can swing when walking.
	for side in [-1.0, 1.0]:
		var hip := Node3D.new()
		hip.position = Vector3(0.13 * side, 0.86, 0.0)
		body_root.add_child(hip)
		_part(hip, Vector3(0, -0.42, 0), Vector3(0.21, 0.84, 0.23), dark)
		_part(hip, Vector3(0, -0.82, 0.04), Vector3(0.23, 0.12, 0.32), dark)
		legs.append(hip)

	_part(body_root, Vector3(0, 1.16, 0), Vector3(0.52, 0.70, 0.31), coat_mat)
	_part(body_root, Vector3(0, 0.90, 0), Vector3(0.56, 0.32, 0.35), dark)

	head_pivot = Node3D.new()
	head_pivot.position = Vector3(0, 1.54, 0)
	body_root.add_child(head_pivot)
	_part(head_pivot, Vector3(0, 0.06, 0), Vector3(0.25, 0.29, 0.25), skin_mat)
	_part(head_pivot, Vector3(0, 0.20, -0.01), Vector3(0.28, 0.11, 0.28), hair)

	arm_left = Node3D.new()
	arm_left.position = Vector3(-0.35, 1.40, 0)
	body_root.add_child(arm_left)
	_part(arm_left, Vector3(0, -0.27, 0), Vector3(0.16, 0.60, 0.18), coat_mat)
	_part(arm_left, Vector3(0, -0.60, 0), Vector3(0.14, 0.13, 0.15), skin_mat)

	arm_right = Node3D.new()
	arm_right.position = Vector3(0.35, 1.40, 0)
	body_root.add_child(arm_right)
	_part(arm_right, Vector3(0, -0.27, 0), Vector3(0.16, 0.60, 0.18), coat_mat)
	_part(arm_right, Vector3(0, -0.60, 0), Vector3(0.14, 0.13, 0.15), skin_mat)

	var cs := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.3
	capsule.height = 1.7
	cs.shape = capsule
	cs.position = Vector3(0, 0.85, 0)
	add_child(cs)

func _ground(x: float, z: float) -> float:
	if terrain == null:
		return 0.0
	return float(terrain.call("height_at", x, z))

func _pick_target() -> void:
	for attempt in 8:
		var a: float = rng.randf_range(0.0, TAU)
		var r: float = sqrt(rng.randf()) * roam_radius
		var spot := Vector3(home.x + cos(a) * r, 0.0, home.z + sin(a) * r)
		spot.y = _ground(spot.x, spot.z)
		target = spot
		return
	target = home

func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity.y -= GRAVITY * delta

	if player == null or not is_instance_valid(player):
		player = get_tree().get_first_node_in_group("player")

	timer -= delta
	var moving := false

	if mode == Mode.STAND:
		# Turn to face whoever walks up, then drift back to the post.
		var face: float = post_facing
		if player != null and global_position.distance_to(player.global_position) < NOTICE:
			var to_player: Vector3 = player.global_position - global_position
			face = atan2(-to_player.x, -to_player.z)
		rotation.y = lerp_angle(rotation.y, face, clampf(delta * 3.0, 0.0, 1.0))
		velocity.x = move_toward(velocity.x, 0.0, 12.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 12.0 * delta)
	else:
		if state == State.PAUSED:
			velocity.x = move_toward(velocity.x, 0.0, 12.0 * delta)
			velocity.z = move_toward(velocity.z, 0.0, 12.0 * delta)
			if timer <= 0.0:
				state = State.MOVING
				_pick_target()
				timer = rng.randf_range(6.0, 16.0)
		else:
			var flat: Vector3 = target - global_position
			flat.y = 0.0
			if flat.length() < ARRIVE or timer <= 0.0:
				state = State.PAUSED
				timer = rng.randf_range(2.0, 6.0)
			else:
				var dir: Vector3 = flat.normalized()
				# Turn first, then go, or the body lerps toward the new heading
				# while the velocity has already snapped to it and they moonwalk.
				var facing: float = atan2(-dir.x, -dir.z)
				rotation.y = lerp_angle(rotation.y, facing, clampf(delta * 6.0, 0.0, 1.0))
				var nose: Vector3 = -global_transform.basis.z
				var gate: float = clampf((nose.dot(dir) - 0.3) / 0.5, 0.0, 1.0)
				var wanted: float = walk_speed * (0.05 + 0.95 * gate)
				velocity.x = move_toward(velocity.x, dir.x * wanted, walk_speed * 5.0 * delta)
				velocity.z = move_toward(velocity.z, dir.z * wanted, walk_speed * 5.0 * delta)
				moving = true

	move_and_slide()
	_animate(delta, moving)

func _animate(delta: float, moving: bool) -> void:
	idle += delta
	var pace: float = Vector2(velocity.x, velocity.z).length()
	step_phase += delta * (2.0 + pace * 3.4)

	# Breathing, always.
	body_root.position.y = sin(idle * 1.4) * 0.011

	if moving and pace > 0.15:
		var swing: float = clampf(pace / walk_speed, 0.0, 1.0) * 0.55
		for i in legs.size():
			var phase: float = step_phase + (0.0 if i == 0 else PI)
			legs[i].rotation.x = sin(phase) * swing
		arm_left.rotation.x = sin(step_phase + PI) * swing * 0.8
		arm_right.rotation.x = sin(step_phase) * swing * 0.8
		head_pivot.rotation.y = lerp(head_pivot.rotation.y, 0.0, delta * 4.0)
	else:
		for leg in legs:
			leg.rotation.x = lerp(leg.rotation.x, 0.0, delta * 6.0)
		match task:
			"work":
				# Hammering or sorting something on a bench.
				arm_right.rotation.x = -0.9 + sin(idle * 4.2) * 0.5
				arm_left.rotation.x = -0.7 + sin(idle * 4.2 + 0.6) * 0.25
			"talk":
				arm_right.rotation.x = -0.4 + sin(idle * 2.6) * 0.35
				arm_left.rotation.x = sin(idle * 1.3) * 0.1
				head_pivot.rotation.y = sin(idle * 1.9) * 0.22
			_:
				arm_left.rotation.x = sin(idle * 1.1) * 0.07
				arm_right.rotation.x = sin(idle * 1.1 + 1.4) * 0.07
				head_pivot.rotation.y = sin(idle * 0.45) * 0.3

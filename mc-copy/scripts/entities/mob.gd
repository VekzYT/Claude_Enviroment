class_name Mob
extends CharacterBody3D
## A "Gloomkin": a slow, boxy night creature that shuffles toward the player and
## crumbles away in daylight. Its body is built from primitives in code so the
## game needs no model files.

signal died(mob: Mob)

const MAX_HEALTH := 12.0
const SPEED := 2.7
const CHASE_RANGE := 26.0
const ATTACK_RANGE := 1.5
const ATTACK_DAMAGE := 3.0
const ATTACK_COOLDOWN := 1.2
const GRAVITY := 26.0
const JUMP_VELOCITY := 8.0
const DESPAWN_RANGE := 72.0

var world: VoxelWorld
var player: Node3D
var health := MAX_HEALTH

var _attack_timer := 0.0
var _wander_dir := Vector3.ZERO
var _wander_timer := 0.0
var _burn := 0.0
var _knock := Vector3.ZERO
var _hurt_flash := 0.0
var _sky_check := 0.0
var _sky_open := false

var _body_mat: StandardMaterial3D
var _leg_left: MeshInstance3D
var _leg_right: MeshInstance3D
var _walk_phase := 0.0
var _shape: CollisionShape3D


func _ready() -> void:
	add_to_group("mobs")
	collision_layer = 4
	collision_mask = 1
	floor_max_angle = deg_to_rad(50)
	_build_body()
	_pick_wander()


func setup(p_world: VoxelWorld, p_player: Node3D) -> void:
	world = p_world
	player = p_player


func _build_body() -> void:
	_shape = CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.32
	capsule.height = 1.6
	_shape.shape = capsule
	_shape.position = Vector3(0, 0.8, 0)
	add_child(_shape)

	_body_mat = StandardMaterial3D.new()
	_body_mat.albedo_color = Color(0.24, 0.30, 0.34)
	_body_mat.roughness = 1.0
	_body_mat.specular_mode = BaseMaterial3D.SPECULAR_DISABLED

	var torso := MeshInstance3D.new()
	var torso_mesh := BoxMesh.new()
	torso_mesh.size = Vector3(0.62, 0.78, 0.38)
	torso.mesh = torso_mesh
	torso.material_override = _body_mat
	torso.position = Vector3(0, 1.02, 0)
	add_child(torso)

	var head := MeshInstance3D.new()
	var head_mesh := BoxMesh.new()
	head_mesh.size = Vector3(0.46, 0.44, 0.44)
	head.mesh = head_mesh
	var head_mat := StandardMaterial3D.new()
	head_mat.albedo_color = Color(0.19, 0.24, 0.28)
	head_mat.roughness = 1.0
	head.material_override = head_mat
	head.position = Vector3(0, 1.60, 0)
	add_child(head)

	var eye_mat := StandardMaterial3D.new()
	eye_mat.albedo_color = Color(1.0, 0.72, 0.22)
	eye_mat.emission_enabled = true
	eye_mat.emission = Color(1.0, 0.62, 0.15)
	eye_mat.emission_energy_multiplier = 3.0
	eye_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	for side in [-1.0, 1.0]:
		var eye := MeshInstance3D.new()
		var eye_mesh := BoxMesh.new()
		eye_mesh.size = Vector3(0.11, 0.07, 0.04)
		eye.mesh = eye_mesh
		eye.material_override = eye_mat
		eye.position = Vector3(0.11 * side, 1.64, -0.23)
		add_child(eye)

	_leg_left = _make_leg(-0.16)
	_leg_right = _make_leg(0.16)


func _make_leg(offset_x: float) -> MeshInstance3D:
	var leg := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = Vector3(0.22, 0.64, 0.24)
	leg.mesh = mesh
	leg.material_override = _body_mat
	leg.position = Vector3(offset_x, 0.32, 0)
	add_child(leg)
	return leg


# ------------------------------------------------------------------ update

func _physics_process(delta: float) -> void:
	_attack_timer = maxf(0.0, _attack_timer - delta)
	_hurt_flash = maxf(0.0, _hurt_flash - delta * 3.0)
	_body_mat.albedo_color = Color(0.24, 0.30, 0.34).lerp(Color(0.95, 0.35, 0.30), _hurt_flash)

	if player == null or world == null:
		return

	var to_player := player.global_position - global_position
	var flat := Vector3(to_player.x, 0.0, to_player.z)
	var distance := flat.length()

	if distance > DESPAWN_RANGE:
		_vanish()
		return

	if not is_on_floor():
		velocity.y = maxf(velocity.y - GRAVITY * delta, -60.0)
	else:
		velocity.y = -2.0

	var desired := Vector3.ZERO
	if distance < CHASE_RANGE and absf(to_player.y) < 12.0:
		desired = flat.normalized()
		if distance < ATTACK_RANGE and _attack_timer <= 0.0:
			_attack_timer = ATTACK_COOLDOWN
			if player.has_method("take_damage"):
				player.take_damage(ATTACK_DAMAGE, "a gloomkin")
	else:
		_wander_timer -= delta
		if _wander_timer <= 0.0:
			_pick_wander()
		desired = _wander_dir

	var target := desired * SPEED
	velocity.x = move_toward(velocity.x, target.x + _knock.x, 26.0 * delta)
	velocity.z = move_toward(velocity.z, target.z + _knock.z, 26.0 * delta)
	_knock = _knock.lerp(Vector3.ZERO, minf(1.0, delta * 4.0))

	_try_step_up(desired)
	move_and_slide()

	if desired.length_squared() > 0.01:
		var want_yaw := atan2(desired.x, desired.z)
		rotation.y = lerp_angle(rotation.y, want_yaw, minf(1.0, delta * 8.0))

	_animate(delta)
	_burn_in_daylight(delta)


func _try_step_up(desired: Vector3) -> void:
	if not is_on_floor() or desired.length_squared() < 0.01:
		return
	var ahead := global_position + desired.normalized() * 0.65
	var foot := floori(global_position.y + 0.1)
	if world.is_solid_at(floori(ahead.x), foot, floori(ahead.z)) \
			and not world.is_solid_at(floori(ahead.x), foot + 1, floori(ahead.z)) \
			and not world.is_solid_at(floori(ahead.x), foot + 2, floori(ahead.z)):
		velocity.y = JUMP_VELOCITY


func _pick_wander() -> void:
	_wander_timer = randf_range(2.0, 5.0)
	if randf() < 0.35:
		_wander_dir = Vector3.ZERO
	else:
		var a := randf() * TAU
		_wander_dir = Vector3(sin(a), 0.0, cos(a))


func _animate(delta: float) -> void:
	var speed := Vector2(velocity.x, velocity.z).length()
	_walk_phase += delta * (2.0 + speed * 2.4)
	var swing := sin(_walk_phase) * minf(0.5, speed * 0.16)
	_leg_left.rotation.x = swing
	_leg_right.rotation.x = -swing


func _burn_in_daylight(delta: float) -> void:
	var sky := get_tree().get_first_node_in_group("day_night")
	if sky == null or not sky.has_method("sun_altitude"):
		return
	# Scanning the column above is not free, so only redo it twice a second.
	_sky_check -= delta
	if _sky_check <= 0.0:
		_sky_check = 0.5
		_sky_open = _has_open_sky()
	# Only burns under open sky, so caves stay dangerous all day.
	if sky.sun_altitude() > 0.15 and _sky_open:
		_burn += delta
		_hurt_flash = 0.6
		if _burn > 1.2:
			_burn = 0.0
			take_damage(3.0, Vector3.ZERO)
	else:
		_burn = 0.0


func _has_open_sky() -> bool:
	var bx := floori(global_position.x)
	var bz := floori(global_position.z)
	var by := floori(global_position.y) + 2
	for y in range(by, VoxelWorld.HEIGHT):
		if BlockDB.is_opaque(world.get_block(bx, y, bz)):
			return false
	return true


# ----------------------------------------------------------------- damage

func take_damage(amount: float, knockback: Vector3 = Vector3.ZERO) -> void:
	health -= amount
	_hurt_flash = 1.0
	_knock = Vector3(knockback.x, 0.0, knockback.z).normalized() * 6.0
	velocity.y = maxf(velocity.y, 3.2)
	if health <= 0.0:
		_die()


func _die() -> void:
	died.emit(self)
	queue_free()


func _vanish() -> void:
	died.emit(self)
	queue_free()

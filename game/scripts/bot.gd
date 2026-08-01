extends CharacterBody3D

enum State { PATROL, CHASE, ATTACK, DEAD }

const GRAVITY := 9.8
const LOSE_SIGHT_DELAY := 1.5
const REACTION_DELAY := 0.6

@export var max_health := 100
@export var move_speed := 3.0
@export var chase_speed := 4.5
@export var detection_radius := 16.0
@export var attack_range := 12.0
@export var patrol_radius := 5.0
@export var fire_cooldown := 1.5
@export var respawn_time := 6.0
@export var damage_per_hit := 8
@export var base_spread := 0.4
@export var spread_per_distance := 0.05

@export var shirt_color: Color = Color(0.28, 0.33, 0.2, 1)
@export var pants_color: Color = Color(0.22, 0.24, 0.18, 1)
@export var gear_color: Color = Color(0.55, 0.08, 0.06, 1)
@export var skin_color: Color = Color(0.82, 0.62, 0.48, 1)

const SHIRT_DEFAULT := Color(0.28, 0.33, 0.2, 1)
const PANTS_DEFAULT := Color(0.22, 0.24, 0.18, 1)
const GEAR_DEFAULT := Color(0.55, 0.08, 0.06, 1)
const SKIN_DEFAULT := Color(0.82, 0.62, 0.48, 1)

@onready var head: Node3D = $Head
@onready var muzzle: Node3D = $Muzzle
@onready var mesh_root: Node3D = $MeshRoot
@onready var collision: CollisionShape3D = $CollisionShape3D
@onready var leg_left: MeshInstance3D = $MeshRoot/LegLeft
@onready var leg_right: MeshInstance3D = $MeshRoot/LegRight

var state: int = State.PATROL
var health: int
var spawn_position: Vector3
var patrol_target: Vector3
var patrol_wait := 0.0
var fire_timer := 0.0
var lost_sight_timer := 0.0
var strafe_sign := 1.0
var walk_cycle_time := 0.0
var player: Node3D = null

func _ready() -> void:
	health = max_health
	spawn_position = global_position
	player = get_tree().get_first_node_in_group("player")
	apply_color_variant()
	pick_new_patrol_target()

func apply_color_variant() -> void:
	var is_default: bool = shirt_color.is_equal_approx(SHIRT_DEFAULT) \
		and pants_color.is_equal_approx(PANTS_DEFAULT) \
		and gear_color.is_equal_approx(GEAR_DEFAULT) \
		and skin_color.is_equal_approx(SKIN_DEFAULT)
	if is_default:
		return
	for child in mesh_root.get_children():
		if not (child is MeshInstance3D):
			continue
		var mesh_instance: MeshInstance3D = child
		var mat: StandardMaterial3D = mesh_instance.get_surface_override_material(0)
		if mat == null:
			continue
		var new_mat: StandardMaterial3D = mat.duplicate()
		if mat.albedo_color.is_equal_approx(SHIRT_DEFAULT):
			new_mat.albedo_color = shirt_color
		elif mat.albedo_color.is_equal_approx(PANTS_DEFAULT):
			new_mat.albedo_color = pants_color
		elif mat.albedo_color.is_equal_approx(GEAR_DEFAULT):
			new_mat.albedo_color = gear_color
		elif mat.albedo_color.is_equal_approx(SKIN_DEFAULT):
			new_mat.albedo_color = skin_color
		mesh_instance.set_surface_override_material(0, new_mat)

func _physics_process(delta: float) -> void:
	if state == State.DEAD:
		return

	if not is_on_floor():
		velocity.y -= GRAVITY * delta
	else:
		velocity.y = 0.0

	match state:
		State.PATROL:
			process_patrol(delta)
		State.CHASE:
			process_chase(delta)
		State.ATTACK:
			process_attack(delta)

	move_and_slide()
	update_state(delta)
	update_walk_animation(delta)

func update_walk_animation(delta: float) -> void:
	var horizontal_speed: float = Vector2(velocity.x, velocity.z).length()
	if horizontal_speed > 0.2:
		walk_cycle_time += delta * 8.0 * clamp(horizontal_speed / move_speed, 0.5, 1.8)
	var swing: float = sin(walk_cycle_time) * 25.0
	leg_left.rotation_degrees.x = swing
	leg_right.rotation_degrees.x = -swing

func pick_new_patrol_target() -> void:
	var angle: float = randf_range(0.0, TAU)
	var radius: float = randf_range(1.5, patrol_radius)
	patrol_target = spawn_position + Vector3(cos(angle) * radius, 0.0, sin(angle) * radius)
	patrol_wait = randf_range(1.0, 2.5)

func process_patrol(delta: float) -> void:
	var to_target: Vector3 = patrol_target - global_position
	to_target.y = 0.0
	if to_target.length() < 0.6:
		velocity.x = 0.0
		velocity.z = 0.0
		patrol_wait -= delta
		if patrol_wait <= 0.0:
			pick_new_patrol_target()
	else:
		var dir: Vector3 = avoid_obstacles(to_target.normalized())
		velocity.x = dir.x * move_speed
		velocity.z = dir.z * move_speed
		face_direction(dir, delta)

func process_chase(delta: float) -> void:
	if player == null:
		return
	var to_target: Vector3 = player.global_position - global_position
	to_target.y = 0.0
	if to_target.length() > 0.01:
		var dir: Vector3 = avoid_obstacles(to_target.normalized())
		velocity.x = dir.x * chase_speed
		velocity.z = dir.z * chase_speed
		face_direction(to_target.normalized(), delta)

func process_attack(delta: float) -> void:
	if player == null:
		return

	var to_target: Vector3 = player.global_position - global_position
	to_target.y = 0.0
	var forward: Vector3 = to_target.normalized() if to_target.length() > 0.01 else Vector3.FORWARD
	face_direction(forward, delta)

	var strafe_dir: Vector3 = avoid_obstacles(forward.rotated(Vector3.UP, PI / 2.0) * strafe_sign)
	velocity.x = strafe_dir.x * move_speed * 0.6
	velocity.z = strafe_dir.z * move_speed * 0.6

	fire_timer -= delta
	if fire_timer <= 0.0 and has_line_of_sight(get_player_eye_position()):
		fire_timer = fire_cooldown
		fire_at_player()
		strafe_sign *= -1.0

func avoid_obstacles(dir: Vector3) -> Vector3:
	if dir.length_squared() < 0.0001:
		return dir
	var space_state: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	var check_from: Vector3 = global_position + Vector3(0.0, 0.9, 0.0)
	var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(check_from, check_from + dir * 1.1)
	query.exclude = [get_rid()]
	var result: Dictionary = space_state.intersect_ray(query)
	if result.is_empty():
		return dir
	var normal: Vector3 = result.normal
	var slide_dir: Vector3 = (dir - normal * dir.dot(normal))
	if slide_dir.length_squared() < 0.01:
		slide_dir = dir.rotated(Vector3.UP, PI / 2.0)
	return slide_dir.normalized()

func face_direction(dir: Vector3, delta: float) -> void:
	if dir.length_squared() < 0.0001:
		return
	var desired_basis: Basis = Basis.looking_at(dir, Vector3.UP)
	var desired_yaw: float = desired_basis.get_euler().y
	rotation.y = lerp_angle(rotation.y, desired_yaw, delta * 6.0)

func get_player_eye_position() -> Vector3:
	return player.global_position + Vector3(0.0, 1.6, 0.0)

func has_line_of_sight(target_pos: Vector3) -> bool:
	var space_state: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(head.global_position, target_pos)
	query.exclude = [get_rid()]
	var result: Dictionary = space_state.intersect_ray(query)
	if result.is_empty():
		return true
	return result.collider == player

func fire_at_player() -> void:
	var distance: float = global_position.distance_to(player.global_position)
	var spread_amount: float = base_spread + distance * spread_per_distance
	var spread := Vector3(
		randf_range(-spread_amount, spread_amount),
		randf_range(-spread_amount * 0.6, spread_amount * 0.6),
		randf_range(-spread_amount, spread_amount)
	)
	var target_pos: Vector3 = get_player_eye_position() + spread
	var space_state: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(head.global_position, target_pos)
	query.exclude = [get_rid()]
	var result: Dictionary = space_state.intersect_ray(query)

	var hit_point: Vector3 = target_pos
	if not result.is_empty():
		hit_point = result.position
		if result.collider == player and player.has_method("take_damage"):
			player.take_damage(damage_per_hit)
			var normal: Vector3 = result.normal
			Effects.spawn_blood(hit_point, normal)

	Effects.spawn_tracer(muzzle.global_position, hit_point, false)
	Sound.play_3d("bot_shot", muzzle.global_position, -2.0)

func update_state(delta: float) -> void:
	if state == State.DEAD or player == null:
		return

	var to_player: Vector3 = player.global_position - global_position
	var dist: float = to_player.length()
	var can_see: bool = dist <= detection_radius and has_line_of_sight(get_player_eye_position())

	if can_see:
		lost_sight_timer = 0.0
		if state == State.PATROL:
			Sound.play_3d("bot_alert", global_position, -3.0)
		if dist <= attack_range:
			if state != State.ATTACK:
				fire_timer = max(fire_timer, REACTION_DELAY)
			state = State.ATTACK
		else:
			state = State.CHASE
	elif state == State.CHASE or state == State.ATTACK:
		lost_sight_timer += delta
		if lost_sight_timer >= LOSE_SIGHT_DELAY:
			state = State.PATROL
			pick_new_patrol_target()
	elif state != State.PATROL:
		state = State.PATROL
		pick_new_patrol_target()

func hit(damage: int = 1) -> void:
	if state == State.DEAD:
		return
	health -= damage
	if health <= 0:
		die()
	else:
		play_hit_flinch()

func play_hit_flinch() -> void:
	var tween: Tween = create_tween()
	tween.tween_property(mesh_root, "rotation:x", -0.18, 0.05)
	tween.tween_property(mesh_root, "rotation:x", 0.0, 0.18)

func die() -> void:
	state = State.DEAD
	velocity = Vector3.ZERO
	collision.disabled = true
	GameState.add_point()
	play_death_animation()
	Sound.play_3d("bot_death", global_position, -1.0)
	get_tree().create_timer(respawn_time).timeout.connect(respawn)

func play_death_animation() -> void:
	var tween: Tween = create_tween()
	tween.set_trans(Tween.TRANS_CUBIC)
	tween.tween_property(mesh_root, "rotation:x", deg_to_rad(78.0), 0.4)
	tween.parallel().tween_property(mesh_root, "position:y", -0.55, 0.4)
	tween.tween_callback(func() -> void:
		mesh_root.visible = false
	)

func respawn() -> void:
	health = max_health
	global_position = spawn_position
	rotation.y = 0.0
	mesh_root.visible = true
	mesh_root.rotation = Vector3.ZERO
	mesh_root.position = Vector3.ZERO
	collision.disabled = false
	lost_sight_timer = 0.0
	state = State.PATROL
	pick_new_patrol_target()

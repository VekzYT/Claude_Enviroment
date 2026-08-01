extends CharacterBody3D

const SPEED := 6.0
const SPRINT_SPEED := 9.5
const JUMP_VELOCITY := 4.8
const MOUSE_SENSITIVITY := 0.0025
const GRAVITY := 9.8

const HIP_FOV := 75.0
const AIM_FOV := 50.0
const GUN_AIM_POSITION := Vector3(0.0, -0.19, -0.42)

const BOB_FREQUENCY := 9.0
const BOB_AMPLITUDE := 0.045
const BOB_SIDE_AMPLITUDE := 0.03

const RELOAD_DURATION := 1.6

const MAX_HEALTH := 100
const RESPAWN_DELAY := 2.0

@onready var head: Node3D = $Head
@onready var camera: Camera3D = $Head/Camera3D
@onready var gun: Node3D = $Head/Camera3D/Gun
@onready var magazine: MeshInstance3D = $Head/Camera3D/Gun/Magazine
@onready var muzzle_flash: MeshInstance3D = $Head/Camera3D/Gun/MuzzleFlash
@onready var ray: RayCast3D = $Head/Camera3D/RayCast3D

var can_shoot := true
var is_reloading := false
var reload_progress := 1.0
var reload_dip := Vector3.ZERO
var reload_rot := Vector3.ZERO

var camera_base_position: Vector3
var gun_hip_position: Vector3
var gun_hip_rotation: Vector3
var magazine_base_position: Vector3

var mouse_delta := Vector2.ZERO
var sway_offset := Vector2.ZERO
var bob_time := 0.0
var bob_fade := 0.0
var recoil_kick := 0.0
var aim_blend := 0.0

var health := MAX_HEALTH
var is_dead := false
var spawn_position: Vector3

func _ready() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	add_to_group("player")
	camera_base_position = camera.position
	gun_hip_position = gun.position
	gun_hip_rotation = gun.rotation
	magazine_base_position = magazine.position
	spawn_position = global_position
	GameState.set_player_health(health)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * MOUSE_SENSITIVITY)
		head.rotate_x(-event.relative.y * MOUSE_SENSITIVITY)
		head.rotation.x = clamp(head.rotation.x, deg_to_rad(-89), deg_to_rad(89))
		mouse_delta += event.relative

	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_ESCAPE:
			Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
		elif event.keycode == KEY_R and not is_reloading:
			start_reload()

	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if Input.get_mouse_mode() != Input.MOUSE_MODE_CAPTURED:
				Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
			else:
				shoot()

func _physics_process(delta: float) -> void:
	if is_dead:
		velocity.x = 0.0
		velocity.z = 0.0
		move_and_slide()
		return

	if not is_on_floor():
		velocity.y -= GRAVITY * delta

	if Input.is_physical_key_pressed(KEY_SPACE) and is_on_floor():
		velocity.y = JUMP_VELOCITY

	var input_dir := Vector2.ZERO
	if Input.is_physical_key_pressed(KEY_W):
		input_dir.y -= 1
	if Input.is_physical_key_pressed(KEY_S):
		input_dir.y += 1
	if Input.is_physical_key_pressed(KEY_A):
		input_dir.x -= 1
	if Input.is_physical_key_pressed(KEY_D):
		input_dir.x += 1
	input_dir = input_dir.normalized()

	var speed: float = SPRINT_SPEED if Input.is_physical_key_pressed(KEY_SHIFT) else SPEED
	var direction := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

	if direction:
		velocity.x = direction.x * speed
		velocity.z = direction.z * speed
	else:
		velocity.x = move_toward(velocity.x, 0, speed)
		velocity.z = move_toward(velocity.z, 0, speed)

	move_and_slide()

	var horizontal_speed := Vector2(velocity.x, velocity.z).length()
	var moving := is_on_floor() and horizontal_speed > 0.3

	update_view_bob(delta, moving, horizontal_speed, input_dir.x)
	update_aim(delta)
	update_reload(delta)
	update_gun_transform(delta)

	mouse_delta = Vector2.ZERO

func update_view_bob(delta: float, moving: bool, horizontal_speed: float, strafe_axis: float) -> void:
	if moving:
		bob_time += delta * BOB_FREQUENCY * clamp(horizontal_speed / SPEED, 0.6, 1.6)
		bob_fade = move_toward(bob_fade, 1.0, delta * 4.0)
	else:
		bob_fade = move_toward(bob_fade, 0.0, delta * 4.0)

	var bob_offset := Vector3(
		sin(bob_time * 0.5) * BOB_SIDE_AMPLITUDE,
		abs(sin(bob_time)) * BOB_AMPLITUDE,
		0.0
	) * bob_fade

	camera.position = camera_base_position + bob_offset
	camera.rotation.z = lerp(camera.rotation.z, -strafe_axis * deg_to_rad(1.5), delta * 5.0)

func update_aim(delta: float) -> void:
	var aim_held := Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT) and not is_reloading
	aim_blend = move_toward(aim_blend, 1.0 if aim_held else 0.0, delta * 6.0)
	camera.fov = lerp(HIP_FOV, AIM_FOV, aim_blend)

func start_reload() -> void:
	is_reloading = true
	reload_progress = 0.0
	can_shoot = false

func update_reload(delta: float) -> void:
	if is_reloading:
		reload_progress = min(reload_progress + delta / RELOAD_DURATION, 1.0)
		if reload_progress >= 1.0:
			is_reloading = false
			can_shoot = true

	var t: float = clamp(reload_progress, 0.0, 1.0)
	var reload_curve: float = sin(t * PI) if t < 1.0 else 0.0

	var mag_drop := 0.0
	if t < 0.5:
		mag_drop = clamp(t * 2.0, 0.0, 1.0)
	else:
		mag_drop = clamp((1.0 - t) * 2.0, 0.0, 1.0)

	magazine.position = magazine_base_position + Vector3(0, -mag_drop * 0.22, 0)

	reload_dip = Vector3(0, -reload_curve * 0.22, reload_curve * 0.05)
	reload_rot = Vector3(reload_curve * deg_to_rad(-25), reload_curve * deg_to_rad(15), 0)

func update_gun_transform(delta: float) -> void:
	recoil_kick = move_toward(recoil_kick, 0.0, delta * 6.0)

	var sway_target := Vector2(-mouse_delta.x, -mouse_delta.y) * 0.0012
	sway_offset = sway_offset.lerp(sway_target, delta * 8.0)
	sway_offset = sway_offset.limit_length(0.05)

	var gun_bob := Vector3(
		sin(bob_time * 0.5) * 0.02,
		abs(sin(bob_time)) * 0.025,
		0.0
	) * bob_fade

	var recoil_pos := Vector3(0, 0, recoil_kick * 0.12)
	var recoil_rot := Vector3(-recoil_kick * deg_to_rad(8), 0, 0)

	var sway_scale := 1.0 - aim_blend * 0.7

	var target_position := gun_hip_position.lerp(GUN_AIM_POSITION, aim_blend)
	target_position += (Vector3(sway_offset.x, sway_offset.y, 0) + gun_bob + recoil_pos + reload_dip) * sway_scale

	var target_rotation := gun_hip_rotation
	target_rotation += (Vector3(sway_offset.y * 0.6, -sway_offset.x * 0.6, sway_offset.x * 0.4) + recoil_rot + reload_rot) * sway_scale

	gun.position = target_position
	gun.rotation = target_rotation

func take_damage(amount: int) -> void:
	if is_dead:
		return
	health = max(health - amount, 0)
	GameState.set_player_health(health)
	if health <= 0:
		die()

func die() -> void:
	is_dead = true
	can_shoot = false
	get_tree().create_timer(RESPAWN_DELAY).timeout.connect(respawn)

func respawn() -> void:
	is_dead = false
	can_shoot = true
	health = MAX_HEALTH
	GameState.set_player_health(health)
	global_position = spawn_position
	velocity = Vector3.ZERO

func shoot() -> void:
	if not can_shoot or is_reloading or is_dead:
		return
	can_shoot = false
	recoil_kick = 1.0

	muzzle_flash.visible = true
	get_tree().create_timer(0.06).timeout.connect(func() -> void:
		muzzle_flash.visible = false
	)
	get_tree().create_timer(0.15).timeout.connect(func() -> void:
		if not is_reloading:
			can_shoot = true
	)

	var hit_point: Vector3 = ray.to_global(ray.target_position)
	if ray.is_colliding():
		hit_point = ray.get_collision_point()
		var target: Object = ray.get_collider()
		if target and target.has_method("hit"):
			target.hit()

	Effects.spawn_tracer(muzzle_flash.global_position, hit_point, true)

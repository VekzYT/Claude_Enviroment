extends CharacterBody3D

const SPEED := 6.0
const SPRINT_SPEED := 9.5
const JUMP_VELOCITY := 4.8
const MOUSE_SENSITIVITY := 0.0025
const GRAVITY := 9.8

const HIP_FOV := 75.0

const BOB_FREQUENCY := 9.0
const BOB_AMPLITUDE := 0.045
const BOB_SIDE_AMPLITUDE := 0.03

const SWITCH_DURATION := 0.3
const MELEE_DURATION := 0.35

const MAX_HEALTH := 100
const RESPAWN_DELAY := 2.0

const WEAPON_SNIPER := 0
const WEAPON_HANDGUN := 1
const WEAPON_KNIFE := 2

@onready var head: Node3D = $Head
@onready var camera: Camera3D = $Head/Camera3D
@onready var ray: RayCast3D = $Head/Camera3D/RayCast3D

@onready var weapon_sniper: Node3D = $Head/Camera3D/WeaponSniper
@onready var weapon_handgun: Node3D = $Head/Camera3D/WeaponHandgun
@onready var weapon_knife: Node3D = $Head/Camera3D/WeaponKnife

@onready var sniper_muzzle: MeshInstance3D = $Head/Camera3D/WeaponSniper/MuzzleFlash
@onready var sniper_magazine: MeshInstance3D = $Head/Camera3D/WeaponSniper/Magazine
@onready var handgun_muzzle: MeshInstance3D = $Head/Camera3D/WeaponHandgun/MuzzleFlash
@onready var handgun_magazine: MeshInstance3D = $Head/Camera3D/WeaponHandgun/Magazine

var weapon_nodes: Array = []
var weapon_muzzles: Array = []
var weapon_magazines: Array = []
var weapon_hip_positions: Array = []
var weapon_hip_rotations: Array = []
var magazine_base_positions: Array = []

var weapon_damage: Array = [100, 25, 50]
var weapon_fire_cooldown: Array = [1.3, 0.28, 0.45]
var weapon_reload_time: Array = [2.4, 1.0, 0.0]
var weapon_is_melee: Array = [false, false, true]
var weapon_full_scope: Array = [true, false, false]
var weapon_ads_fov: Array = [16.0, 55.0, 75.0]
var weapon_melee_range: Array = [0.0, 0.0, 2.2]

var current_weapon_index := WEAPON_HANDGUN
var switch_out_index := WEAPON_HANDGUN
var switch_in_index := WEAPON_HANDGUN
var is_switching := false
var switch_progress := 1.0
var weapon_panel_visible := false

var can_shoot := true
var is_reloading := false
var reload_progress := 1.0
var reload_dip := Vector3.ZERO
var reload_rot := Vector3.ZERO

var is_meleeing := false
var melee_progress := 1.0
var melee_hit_done := false

var camera_base_position: Vector3

var mouse_delta := Vector2.ZERO
var sway_offset := Vector2.ZERO
var bob_time := 0.0
var bob_fade := 0.0
var recoil_kick := 0.0
var aim_blend := 0.0
var is_scoped := false

var health := MAX_HEALTH
var is_dead := false
var spawn_position: Vector3

func _ready() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	add_to_group("player")

	weapon_nodes = [weapon_sniper, weapon_handgun, weapon_knife]
	weapon_muzzles = [sniper_muzzle, handgun_muzzle, null]
	weapon_magazines = [sniper_magazine, handgun_magazine, null]

	for i in weapon_nodes.size():
		var node: Node3D = weapon_nodes[i]
		weapon_hip_positions.append(node.position)
		weapon_hip_rotations.append(node.rotation)
		node.visible = i == current_weapon_index

	for i in weapon_magazines.size():
		var mag: MeshInstance3D = weapon_magazines[i]
		if mag:
			magazine_base_positions.append(mag.position)
		else:
			magazine_base_positions.append(Vector3.ZERO)

	camera_base_position = camera.position
	spawn_position = global_position
	GameState.set_player_health(health)
	GameState.set_current_weapon(current_weapon_index)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * MOUSE_SENSITIVITY)
		head.rotate_x(-event.relative.y * MOUSE_SENSITIVITY)
		head.rotation.x = clamp(head.rotation.x, deg_to_rad(-89), deg_to_rad(89))
		mouse_delta += event.relative

	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_ESCAPE:
			Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
		elif event.keycode == KEY_R:
			start_reload()
		elif event.keycode == KEY_E:
			toggle_weapon_panel()
		elif event.keycode == KEY_1:
			request_switch(WEAPON_SNIPER)
		elif event.keycode == KEY_2:
			request_switch(WEAPON_HANDGUN)
		elif event.keycode == KEY_3:
			request_switch(WEAPON_KNIFE)

	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if Input.get_mouse_mode() != Input.MOUSE_MODE_CAPTURED:
				Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
			else:
				primary_action()
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			request_switch(current_weapon_index - 1)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			request_switch(current_weapon_index + 1)

func toggle_weapon_panel() -> void:
	weapon_panel_visible = not weapon_panel_visible
	GameState.set_weapon_panel_open(weapon_panel_visible)

func request_switch(new_index: int) -> void:
	if is_dead:
		return
	var wrapped: int = wrapi(new_index, 0, weapon_nodes.size())
	if wrapped == current_weapon_index or is_switching:
		return
	switch_out_index = current_weapon_index
	switch_in_index = wrapped
	is_switching = true
	switch_progress = 0.0
	is_reloading = false
	is_meleeing = false
	can_shoot = false
	GameState.set_current_weapon(wrapped)

func active_weapon_index() -> int:
	if is_switching:
		return switch_out_index if switch_progress < 0.5 else switch_in_index
	return current_weapon_index

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
	update_switch(delta)
	update_aim(delta)
	update_reload(delta)
	update_melee(delta)
	update_weapon_transform(delta)

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

func update_switch(delta: float) -> void:
	if not is_switching:
		return
	switch_progress = min(switch_progress + delta / SWITCH_DURATION, 1.0)
	if switch_progress >= 1.0:
		current_weapon_index = switch_in_index
		is_switching = false
		can_shoot = true

func update_aim(delta: float) -> void:
	var idx: int = active_weapon_index()
	var is_melee: bool = weapon_is_melee[idx]
	var full_scope: bool = weapon_full_scope[idx]

	var aim_held: bool = Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT) and not is_reloading and not is_switching and not is_melee
	aim_blend = move_toward(aim_blend, 1.0 if aim_held else 0.0, delta * 6.0)

	var target_fov: float = weapon_ads_fov[idx]
	camera.fov = lerp(HIP_FOV, target_fov, aim_blend)

	var scoped: bool = full_scope and aim_blend > 0.85
	if scoped != is_scoped:
		is_scoped = scoped
		GameState.set_scope_active(is_scoped)

func start_reload() -> void:
	var idx: int = active_weapon_index()
	if weapon_is_melee[idx] or is_switching or is_reloading:
		return
	is_reloading = true
	reload_progress = 0.0
	can_shoot = false

func update_reload(delta: float) -> void:
	if is_reloading:
		var idx: int = current_weapon_index
		var duration: float = weapon_reload_time[idx]
		reload_progress = min(reload_progress + delta / duration, 1.0)
		if reload_progress >= 1.0:
			is_reloading = false
			can_shoot = true

	var t: float = clamp(reload_progress, 0.0, 1.0)
	var reload_curve: float = sin(t * PI) if t < 1.0 else 0.0

	var mag_drop: float = 0.0
	if t < 0.5:
		mag_drop = clamp(t * 2.0, 0.0, 1.0)
	else:
		mag_drop = clamp((1.0 - t) * 2.0, 0.0, 1.0)

	var active_idx: int = active_weapon_index()
	var mag: MeshInstance3D = weapon_magazines[active_idx]
	if mag:
		var base: Vector3 = magazine_base_positions[active_idx]
		mag.position = base + Vector3(0, -mag_drop * 0.22, 0)

	reload_dip = Vector3(0, -reload_curve * 0.22, reload_curve * 0.05)
	reload_rot = Vector3(reload_curve * deg_to_rad(-25), reload_curve * deg_to_rad(15), 0)

func primary_action() -> void:
	if is_dead or is_switching:
		return
	var idx: int = current_weapon_index
	var is_melee: bool = weapon_is_melee[idx]
	if is_melee:
		start_melee()
	else:
		shoot()

func start_melee() -> void:
	if is_meleeing or is_switching:
		return
	is_meleeing = true
	melee_progress = 0.0
	melee_hit_done = false

func update_melee(delta: float) -> void:
	if not is_meleeing:
		return
	melee_progress = min(melee_progress + delta / MELEE_DURATION, 1.0)
	if not melee_hit_done and melee_progress >= 0.35:
		melee_hit_done = true
		perform_melee_hit()
	if melee_progress >= 1.0:
		is_meleeing = false

func perform_melee_hit() -> void:
	var idx: int = current_weapon_index
	var melee_range: float = weapon_melee_range[idx]
	var space_state: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	var from: Vector3 = camera.global_position
	var to: Vector3 = from + (-camera.global_transform.basis.z) * melee_range
	var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(from, to)
	query.exclude = [get_rid()]
	var result: Dictionary = space_state.intersect_ray(query)
	if not result.is_empty():
		var target: Object = result.collider
		if target and target.has_method("hit"):
			target.hit(weapon_damage[idx])

func shoot() -> void:
	if not can_shoot or is_reloading:
		return
	var idx: int = current_weapon_index
	can_shoot = false
	recoil_kick = 1.0

	var muzzle: MeshInstance3D = weapon_muzzles[idx]
	if muzzle:
		muzzle.visible = true
		get_tree().create_timer(0.06).timeout.connect(func() -> void:
			muzzle.visible = false
		)

	var cooldown: float = weapon_fire_cooldown[idx]
	get_tree().create_timer(cooldown).timeout.connect(func() -> void:
		if not is_reloading:
			can_shoot = true
	)

	var hit_point: Vector3 = ray.to_global(ray.target_position)
	if ray.is_colliding():
		hit_point = ray.get_collision_point()
		var target: Object = ray.get_collider()
		if target and target.has_method("hit"):
			target.hit(weapon_damage[idx])

	var muzzle_position: Vector3 = muzzle.global_position if muzzle else camera.global_position
	Effects.spawn_tracer(muzzle_position, hit_point, true)

func update_weapon_transform(delta: float) -> void:
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

	var idx: int = active_weapon_index()
	var is_melee: bool = weapon_is_melee[idx]
	var full_scope: bool = weapon_full_scope[idx]

	var switch_curve: float = sin(switch_progress * PI) if is_switching else 0.0
	var switch_dip := Vector3(0, -switch_curve * 0.35, 0)

	var melee_offset := Vector3.ZERO
	var melee_rot := Vector3.ZERO
	if is_meleeing:
		var m: float = sin(clamp(melee_progress, 0.0, 1.0) * PI)
		melee_offset = Vector3(-m * 0.08, -m * 0.05, -m * 0.22)
		melee_rot = Vector3(m * deg_to_rad(-10), m * deg_to_rad(45), m * deg_to_rad(-20))

	var sway_scale: float = 1.0 - aim_blend * 0.7
	if is_scoped:
		sway_scale = 0.0

	var base_position: Vector3 = weapon_hip_positions[idx]
	var base_rotation: Vector3 = weapon_hip_rotations[idx]

	var aim_position: Vector3 = base_position
	if not is_melee and not full_scope:
		aim_position = base_position.lerp(Vector3(0.0, -0.19, -0.42), aim_blend)

	var target_position: Vector3 = aim_position + switch_dip
	var target_rotation: Vector3 = base_rotation

	if is_melee:
		target_position += melee_offset + (Vector3(sway_offset.x, sway_offset.y, 0) + gun_bob) * sway_scale
		target_rotation += melee_rot + (Vector3(sway_offset.y * 0.6, -sway_offset.x * 0.6, sway_offset.x * 0.4)) * sway_scale
	else:
		target_position += (Vector3(sway_offset.x, sway_offset.y, 0) + gun_bob + recoil_pos + reload_dip) * sway_scale
		target_rotation += (Vector3(sway_offset.y * 0.6, -sway_offset.x * 0.6, sway_offset.x * 0.4) + recoil_rot + reload_rot) * sway_scale

	for i in weapon_nodes.size():
		var node: Node3D = weapon_nodes[i]
		node.visible = (i == idx) and not is_scoped

	var active_node: Node3D = weapon_nodes[idx]
	active_node.position = target_position
	active_node.rotation = target_rotation

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

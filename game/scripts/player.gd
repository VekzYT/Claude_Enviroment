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

const KNIFE_DASH_SPEED := 13.0
const KNIFE_DASH_DURATION := 0.18
const KNIFE_COOLDOWN := 1.1

const MAX_HEALTH := 100
const RESPAWN_DELAY := 2.0

# Sprinting costs stamina and it only comes back once you ease off, so a chase
# has a shape instead of being a permanently-held key.
const STAMINA_DRAIN := 0.28
const STAMINA_REGEN := 0.20
const STAMINA_REGEN_DELAY := 0.9
const STAMINA_SPRINT_FLOOR := 0.12

# How hard the ground pulls you to a stop. The old code fed `speed` straight to
# move_toward(), which is a per-call step, not a rate -- so you stopped dead in
# a single frame and the amount depended on the frame rate.
const GROUND_FRICTION := 34.0
const AIR_FRICTION := 2.5

const WEAPON_SNIPER := 0
const WEAPON_HANDGUN := 1
const WEAPON_KNIFE := 2
const ITEM_HANDS := 3
const ITEM_AXE := 4

const AXE_SWING_DURATION := 0.62
const HAND_SWING_DURATION := 0.34
const AXE_CHOP_DAMAGE := 1
const INTERACT_RANGE := 3.2

@onready var head: Node3D = $Head
@onready var camera: Camera3D = $Head/Camera3D
@onready var ray: RayCast3D = $Head/Camera3D/RayCast3D

@onready var weapon_sniper: Node3D = $Head/Camera3D/WeaponSniper
@onready var weapon_handgun: Node3D = $Head/Camera3D/WeaponHandgun
@onready var weapon_knife: Node3D = $Head/Camera3D/WeaponKnife
@onready var hands: Node3D = $Head/Camera3D/Hands
@onready var arm_left: Node3D = $Head/Camera3D/Hands/LeftArm
@onready var arm_right: Node3D = $Head/Camera3D/Hands/RightArm
@onready var weapon_axe: Node3D = $Head/Camera3D/WeaponAxe

@onready var sniper_muzzle: MeshInstance3D = $Head/Camera3D/WeaponSniper/MuzzleFlash
@onready var sniper_magazine: MeshInstance3D = $Head/Camera3D/WeaponSniper/Magazine
@onready var sniper_bolt: MeshInstance3D = $Head/Camera3D/WeaponSniper/BoltHandle
@onready var handgun_muzzle: MeshInstance3D = $Head/Camera3D/WeaponHandgun/MuzzleFlash
@onready var handgun_magazine: MeshInstance3D = $Head/Camera3D/WeaponHandgun/Magazine
@onready var handgun_slide: MeshInstance3D = $Head/Camera3D/WeaponHandgun/Slide

var weapon_nodes: Array = []
var weapon_muzzles: Array = []
var weapon_magazines: Array = []
var weapon_hip_positions: Array = []
var weapon_hip_rotations: Array = []
var magazine_base_positions: Array = []

var weapon_damage: Array = [100, 25, 999, 0, 40]
var weapon_fire_cooldown: Array = [1.3, 0.28, 0.45, 0.5, 0.62]
var weapon_reload_time: Array = [2.4, 1.0, 0.0, 0.0, 0.0]
var weapon_is_melee: Array = [false, false, true, true, true]
var weapon_full_scope: Array = [true, false, false, false, false]
var weapon_ads_fov: Array = [16.0, 55.0, 75.0, 75.0, 75.0]
var weapon_melee_range: Array = [0.0, 0.0, 2.2, 1.5, 3.1]
var weapon_titles: Array = ["Sniper", "Handgun", "Knife", "Bare hands", "Axe"]

# You start with nothing but your hands. Everything else has to be found.
var owned: Array[bool] = [false, false, false, true, false]

var current_weapon_index := ITEM_HANDS
var switch_out_index := ITEM_HANDS
var switch_in_index := ITEM_HANDS
var is_switching := false
var switch_progress := 1.0

var can_shoot := true
var is_reloading := false
var reload_progress := 1.0
var reload_dip := Vector3.ZERO
var reload_rot := Vector3.ZERO

var is_meleeing := false
var melee_progress := 1.0
var melee_hit_done := false
var knife_dash_timer := 0.0
var knife_dash_direction := Vector3.ZERO
var knife_cooldown_timer := 0.0

var camera_base_position: Vector3
var sniper_bolt_base_position: Vector3
var handgun_slide_base_position: Vector3
var idle_time := 0.0
var camera_kick := 0.0
var footstep_step := 0
var was_on_floor := true
var stamina := 1.0
var stamina_idle := 0.0
var jump_held := false
var winded := false

var mouse_delta := Vector2.ZERO
var sway_offset := Vector2.ZERO
var bob_time := 0.0
var bob_fade := 0.0
var recoil_kick := 0.0
var aim_blend := 0.0
var is_scoped := false

var forest: Node = null
var interact_target: Node = null
var hands_base_position: Vector3
var hands_base_rotation: Vector3
var chop_shake := 0.0

# Where the palm sits inside an arm pivot's own space, and the two points on
# the haft the hands close around. Together these let the arms reach for the
# axe wherever the swing animation has thrown it.
const ARM_HAND_LOCAL := Vector3(0.0, 0.002, -0.44)
const GRIP_HIGH := Vector3(0.0, 0.23, 0.0)
const GRIP_LOW := Vector3(0.0, -0.06, 0.0)
const ARM_TWIST_L := 52.0
const ARM_TWIST_R := -52.0

var arm_left_rest: Transform3D
var arm_right_rest: Transform3D
var grip_blend := 0.0

var health := MAX_HEALTH
var is_dead := false
var spawn_position: Vector3

func _ready() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	add_to_group("player")

	weapon_nodes = [weapon_sniper, weapon_handgun, weapon_knife, hands, weapon_axe]
	weapon_muzzles = [sniper_muzzle, handgun_muzzle, null, null, null]
	weapon_magazines = [sniper_magazine, handgun_magazine, null, null, null]

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

	hands_base_position = hands.position
	hands_base_rotation = hands.rotation
	arm_left_rest = arm_left.transform
	arm_right_rest = arm_right.transform
	# Hands are always on screen; the "hands" slot just means nothing is held.
	hands.visible = true
	forest = get_tree().get_first_node_in_group("forest")

	camera_base_position = camera.position
	sniper_bolt_base_position = sniper_bolt.position
	handgun_slide_base_position = handgun_slide.position
	spawn_position = global_position
	GameState.set_player_health(health)
	GameState.set_current_weapon(current_weapon_index)
	GameState.set_held_item(weapon_titles[current_weapon_index])

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
		var sensitivity: float = MOUSE_SENSITIVITY * Settings.mouse_sensitivity
		rotate_y(-event.relative.x * sensitivity)
		head.rotate_x(-event.relative.y * sensitivity)
		head.rotation.x = clamp(head.rotation.x, deg_to_rad(-89), deg_to_rad(89))
		mouse_delta += event.relative

	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_R:
			start_reload()
		elif event.keycode == KEY_E:
			try_interact()
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
			cycle_item(-1)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			cycle_item(1)

# Scrolling walks the carried items only, so an empty pack never cycles through
# guns the player has not found.
func carried() -> Array[int]:
	var list: Array[int] = []
	for i in owned.size():
		if owned[i]:
			list.append(i)
	return list

func cycle_item(step: int) -> void:
	var list: Array[int] = carried()
	if list.size() <= 1:
		return
	var at: int = list.find(current_weapon_index)
	if at < 0:
		at = 0
	request_switch(list[wrapi(at + step, 0, list.size())])

func request_switch(new_index: int) -> void:
	if is_dead:
		return
	var wrapped: int = wrapi(new_index, 0, weapon_nodes.size())
	if not owned[wrapped]:
		return
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
	GameState.set_held_item(weapon_titles[wrapped])
	Sound.play_ui("weapon_switch", -6.0)

# Looks for a pickup under the crosshair each frame and reports it to the HUD.
func update_interaction() -> void:
	var space: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	var from: Vector3 = camera.global_position
	var to: Vector3 = from + (-camera.global_transform.basis.z) * INTERACT_RANGE
	var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(from, to)
	query.exclude = [get_rid()]
	query.collide_with_areas = true
	var result: Dictionary = space.intersect_ray(query)
	var found: Node = null
	if not result.is_empty():
		var hit: Object = result.collider
		if hit is Node and (hit as Node).is_in_group("pickup"):
			found = hit as Node
	if found != interact_target:
		interact_target = found
		if found == null:
			GameState.set_interact_prompt("")
		else:
			GameState.set_interact_prompt("[E]  Pick up %s" % String(found.get("item_title")))

func try_interact() -> void:
	if is_dead or interact_target == null:
		return
	var id: int = int(interact_target.get("item_id"))
	give_item(id)
	if interact_target.has_method("consume"):
		interact_target.call("consume")
	interact_target = null
	GameState.set_interact_prompt("")

func give_item(id: int) -> void:
	if id < 0 or id >= owned.size() or owned[id]:
		return
	owned[id] = true
	GameState.announce("Picked up: %s" % weapon_titles[id])
	Sound.play_ui("weapon_switch", -4.0)
	request_switch(id)

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

	if is_on_floor() and not was_on_floor:
		Sound.play_3d("land", global_position, -6.0)
	was_on_floor = is_on_floor()

	# Edge-triggered: holding space used to re-fire every frame you touched down.
	var jump_pressed: bool = Input.is_physical_key_pressed(KEY_SPACE)
	if jump_pressed and not jump_held and is_on_floor():
		velocity.y = JUMP_VELOCITY
		stamina = maxf(stamina - 0.08, 0.0)
		stamina_idle = 0.0
		Sound.play_3d("jump", global_position, -6.0)
	jump_held = jump_pressed

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

	var direction := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	var wants_sprint: bool = Input.is_physical_key_pressed(KEY_SHIFT) and direction.length_squared() > 0.01
	var speed: float = SPEED
	if update_stamina(delta, wants_sprint):
		speed = SPRINT_SPEED

	if knife_cooldown_timer > 0.0:
		knife_cooldown_timer = max(knife_cooldown_timer - delta, 0.0)
	if current_weapon_index == WEAPON_KNIFE:
		GameState.set_knife_cooldown(clamp(knife_cooldown_timer / KNIFE_COOLDOWN, 0.0, 1.0))

	if knife_dash_timer > 0.0:
		knife_dash_timer = max(knife_dash_timer - delta, 0.0)
		velocity.x = knife_dash_direction.x * KNIFE_DASH_SPEED
		velocity.z = knife_dash_direction.z * KNIFE_DASH_SPEED
	elif direction:
		velocity.x = move_toward(velocity.x, direction.x * speed, speed * 12.0 * delta)
		velocity.z = move_toward(velocity.z, direction.z * speed, speed * 12.0 * delta)
	else:
		var friction: float = GROUND_FRICTION
		if not is_on_floor():
			friction = AIR_FRICTION
		velocity.x = move_toward(velocity.x, 0.0, friction * delta)
		velocity.z = move_toward(velocity.z, 0.0, friction * delta)

	move_and_slide()

	var horizontal_speed := Vector2(velocity.x, velocity.z).length()
	var moving := is_on_floor() and horizontal_speed > 0.3

	update_interaction()
	update_view_bob(delta, moving, horizontal_speed, input_dir.x)
	update_switch(delta)
	update_aim(delta)
	update_reload(delta)
	update_melee(delta)
	update_weapon_transform(delta)
	update_hands(delta)

	mouse_delta = Vector2.ZERO

# Returns true if the player is actually sprinting this frame. Sprinting needs
# a real stamina reserve, and once it bottoms out you stay winded until it has
# recovered a bit -- otherwise you can tap shift forever at zero.
func update_stamina(delta: float, wants_sprint: bool) -> bool:
	var sprinting: bool = wants_sprint and not winded and stamina > 0.0
	if sprinting:
		stamina = maxf(stamina - STAMINA_DRAIN * delta, 0.0)
		stamina_idle = 0.0
		if stamina <= 0.0:
			winded = true
	else:
		stamina_idle += delta
		if stamina_idle >= STAMINA_REGEN_DELAY:
			stamina = minf(stamina + STAMINA_REGEN * delta, 1.0)
		if winded and stamina >= STAMINA_SPRINT_FLOOR:
			winded = false
	GameState.set_stamina(stamina)
	return sprinting

func update_view_bob(delta: float, moving: bool, horizontal_speed: float, strafe_axis: float) -> void:
	if moving:
		bob_time += delta * BOB_FREQUENCY * clamp(horizontal_speed / SPEED, 0.6, 1.6)
		bob_fade = move_toward(bob_fade, 1.0, delta * 4.0)
		var step: int = int(bob_time / PI)
		if step != footstep_step:
			footstep_step = step
			Sound.play_3d("footstep", global_position, -10.0)
	else:
		bob_fade = move_toward(bob_fade, 0.0, delta * 4.0)

	var bob_offset := Vector3(
		sin(bob_time * 0.5) * BOB_SIDE_AMPLITUDE,
		abs(sin(bob_time)) * BOB_AMPLITUDE,
		0.0
	) * bob_fade

	camera.position = camera_base_position + bob_offset
	camera.rotation.z = lerp(camera.rotation.z, -strafe_axis * deg_to_rad(1.5), delta * 5.0)

	camera_kick = move_toward(camera_kick, 0.0, delta * 7.0)
	camera.rotation.x = camera_kick

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
	Sound.play_ui("bolt_cycle" if idx == WEAPON_SNIPER else "reload_click", -4.0)

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

	if active_idx == WEAPON_SNIPER:
		sniper_bolt.position = sniper_bolt_base_position + Vector3(0, reload_curve * 0.025, reload_curve * 0.06)
		sniper_bolt.rotation_degrees = Vector3(0, 0, reload_curve * 35.0)
	elif active_idx == WEAPON_HANDGUN:
		handgun_slide.position = handgun_slide_base_position + Vector3(0, 0, reload_curve * 0.05)

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
	var idx: int = current_weapon_index
	if idx == WEAPON_KNIFE and knife_cooldown_timer > 0.0:
		return
	is_meleeing = true
	melee_progress = 0.0
	melee_hit_done = false
	if idx == WEAPON_KNIFE:
		# Only the knife lunges; an axe swing plants your feet.
		knife_dash_timer = KNIFE_DASH_DURATION
		knife_dash_direction = -transform.basis.z
		knife_cooldown_timer = KNIFE_COOLDOWN
	Sound.play_3d("knife_swing", camera.global_position, -4.0)

func update_melee(delta: float) -> void:
	chop_shake = move_toward(chop_shake, 0.0, delta * 6.0)
	if not is_meleeing:
		return
	var span: float = MELEE_DURATION
	if current_weapon_index == ITEM_AXE:
		span = AXE_SWING_DURATION
	elif current_weapon_index == ITEM_HANDS:
		span = HAND_SWING_DURATION
	melee_progress = min(melee_progress + delta / span, 1.0)
	var strike_at: float = 0.35
	if current_weapon_index == ITEM_AXE:
		strike_at = 0.52
	if not melee_hit_done and melee_progress >= strike_at:
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
	if result.is_empty():
		return
	var target: Object = result.collider

	# A tree is not a node of its own -- it is instances inside a MultiMesh --
	# so resolve the shape we struck back to the trunk it belongs to.
	if idx == ITEM_AXE and target is CollisionObject3D:
		var body: CollisionObject3D = target as CollisionObject3D
		var owner_id: int = body.shape_find_owner(int(result.shape))
		var shape_node: Object = body.shape_owner_get_owner(owner_id)
		if forest == null:
			forest = get_tree().get_first_node_in_group("forest")
		var outcome: Dictionary = {}
		if forest != null:
			outcome = forest.call("chop", shape_node, AXE_CHOP_DAMAGE)
		if bool(outcome.get("hit", false)):
			Effects.spawn_wood_chips(result.position, result.normal)
			Sound.play_3d("knife_hit", result.position, -1.0)
			camera_kick += deg_to_rad(3.4)
			chop_shake = 1.0
			GameState.trigger_hit_marker()
			if bool(outcome.get("felled", false)):
				GameState.add_wood(4)
				GameState.announce("Timber!")
				Sound.play_3d("land", result.position, 2.0)
				camera_kick += deg_to_rad(6.0)
			else:
				GameState.add_wood(1)
			return

	if idx == ITEM_HANDS and target is CollisionObject3D:
		var bare_body: CollisionObject3D = target as CollisionObject3D
		var bare_owner: int = bare_body.shape_find_owner(int(result.shape))
		var bare_shape: Object = bare_body.shape_owner_get_owner(bare_owner)
		if forest == null:
			forest = get_tree().get_first_node_in_group("forest")
		if forest != null and bool(forest.call("is_tree", bare_shape)):
			Sound.play_3d("knife_hit", result.position, -12.0)
			camera_kick += deg_to_rad(1.2)
			GameState.announce("You need an axe to fell this.")
			return

	if target and target.has_method("hit"):
		target.hit(weapon_damage[idx])
		var normal: Vector3 = result.normal
		Effects.spawn_blood(result.position, normal)
		Sound.play_3d("knife_hit", result.position, -2.0)
		camera_kick += deg_to_rad(5.0)
		GameState.trigger_hit_marker()

func shoot() -> void:
	if not can_shoot or is_reloading:
		return
	var idx: int = current_weapon_index
	can_shoot = false
	recoil_kick = 1.0
	camera_kick += deg_to_rad(4.5) if idx == WEAPON_SNIPER else deg_to_rad(2.0)

	var muzzle: MeshInstance3D = weapon_muzzles[idx]
	if muzzle:
		muzzle.visible = true
		get_tree().create_timer(0.06).timeout.connect(func() -> void:
			muzzle.visible = false
		)

	var shot_position: Vector3 = muzzle.global_position if muzzle else camera.global_position
	Sound.play_3d("sniper_shot" if idx == WEAPON_SNIPER else "handgun_shot", shot_position, -2.0)

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
			Effects.spawn_blood(hit_point, ray.get_collision_normal())
			GameState.trigger_hit_marker()

	var muzzle_position: Vector3 = muzzle.global_position if muzzle else camera.global_position
	Effects.spawn_tracer(muzzle_position, hit_point, true)

# The hands are always on screen. They breathe when idle, close into a grip
# when something is held, and ride along with a swing.
func update_hands(delta: float) -> void:
	var idx: int = active_weapon_index()
	var holding: bool = idx != ITEM_HANDS

	var target_pos: Vector3 = hands_base_position
	var target_rot: Vector3 = hands_base_rotation
	if holding:
		# Bring both hands in and forward onto the haft.
		target_pos += Vector3(-0.035, 0.045, -0.045)
		target_rot += Vector3(deg_to_rad(-6.0), 0.0, 0.0)

	var breathe: float = sin(idle_time * 1.6) * 0.006
	var breathe_side: float = sin(idle_time * 0.9) * 0.004
	target_pos += Vector3(breathe_side, breathe, 0.0)

	var hand_bob := Vector3(
		sin(bob_time * 0.5) * 0.022,
		absf(sin(bob_time)) * 0.028,
		0.0
	) * bob_fade
	target_pos += hand_bob
	target_pos += Vector3(sway_offset.x, sway_offset.y, 0.0) * 0.8
	target_rot += Vector3(sway_offset.y * 0.5, -sway_offset.x * 0.5, sway_offset.x * 0.3)

	if is_meleeing and idx == ITEM_HANDS:
		var ht: float = clamp(melee_progress, 0.0, 1.0)
		var punch: float = 0.0
		if ht < 0.26:
			punch = -(ht / 0.26) * 0.06
		elif ht < 0.46:
			punch = lerp(-0.06, 0.26, (ht - 0.26) / 0.20)
		else:
			punch = lerp(0.26, 0.0, (ht - 0.46) / 0.54)
		target_pos += Vector3(0.0, punch * 0.18, -punch)
		target_rot += Vector3(deg_to_rad(-punch * 26.0), 0.0, 0.0)

	if is_meleeing and idx == ITEM_AXE:
		var at: float = clamp(melee_progress, 0.0, 1.0)
		var drive: float = 0.0
		if at < 0.30:
			drive = -(at / 0.30) * 0.09
		elif at < 0.52:
			drive = lerp(-0.09, 0.20, (at - 0.30) / 0.22)
		else:
			drive = lerp(0.20, 0.0, (at - 0.52) / 0.48)
		target_pos += Vector3(0.0, -drive * 0.5, -drive)
		target_rot += Vector3(deg_to_rad(-drive * 40.0), 0.0, 0.0)

	# A short jolt when the edge bites, so contact is felt in the arms too.
	if chop_shake > 0.001:
		var j: float = chop_shake * 0.03
		target_pos += Vector3(randf_range(-j, j), randf_range(-j, j), 0.0)

	hands.position = hands.position.lerp(target_pos, clampf(delta * 14.0, 0.0, 1.0))
	hands.rotation = hands.rotation.lerp(target_rot, clampf(delta * 14.0, 0.0, 1.0))

	# With the axe out, both hands leave their resting pose and take hold of the
	# haft. update_weapon_transform() has already placed the axe for this frame,
	# so the grip points below are exactly where the wood is right now.
	var want_grip: float = 0.0
	if idx == ITEM_AXE:
		want_grip = 1.0
	grip_blend = move_toward(grip_blend, want_grip, delta * 5.0)

	var to_hands: Transform3D = hands.transform.affine_inverse()
	var axe_xf: Transform3D = weapon_axe.transform
	pose_arm(arm_left, arm_left_rest, to_hands * (axe_xf * GRIP_LOW), ARM_TWIST_L, delta)
	pose_arm(arm_right, arm_right_rest, to_hands * (axe_xf * GRIP_HIGH), ARM_TWIST_R, delta)
	# The fingers close as the hands arrive, so the grip is a fist on the haft
	# rather than an open palm resting against it.
	arm_left.call("set_grip", grip_blend)
	arm_right.call("set_grip", grip_blend)

# Aims the arm at `grip` from its resting shoulder and stretches it along its
# own length so the palm lands on the haft, then eases the current pose toward
# that. The shoulder stays put on purpose: solving for it instead walks it up
# to within a few centimetres of the lens and the forearm swallows the screen.
func pose_arm(arm: Node3D, rest: Transform3D, grip: Vector3, twist: float, delta: float) -> void:
	var target: Transform3D = rest
	if grip_blend > 0.001:
		var to_grip: Vector3 = grip - rest.origin
		var reach_len: float = to_grip.length()
		if reach_len > 0.05:
			var dir: Vector3 = to_grip / reach_len
			var up: Vector3 = Vector3.UP
			if absf(dir.dot(up)) > 0.97:
				up = Vector3.BACK
			var basis: Basis = Basis.looking_at(dir, up)
			basis = basis * Basis(Vector3(0.0, 0.0, 1.0), deg_to_rad(twist))
			# Scale on the right so it acts along the arm's own -Z, not the
			# camera's: Basis.scaled() would multiply on the left and shear.
			var stretch: float = clampf(reach_len / -ARM_HAND_LOCAL.z, 0.55, 1.5)
			basis = basis * Basis.IDENTITY.scaled(Vector3(1.0, 1.0, stretch))
			var reach := Transform3D(basis, rest.origin)
			target = rest.interpolate_with(reach, grip_blend)
	arm.transform = arm.transform.interpolate_with(target, clampf(delta * 16.0, 0.0, 1.0))

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
	if is_meleeing and idx == ITEM_AXE:
		# Overhead chop: wind back over the shoulder, drive down through the
		# cut, then a slow recover with the weight of the head carrying through.
		var at: float = clamp(melee_progress, 0.0, 1.0)
		var pitch: float = 0.0
		var lift: float = 0.0
		var reach: float = 0.0
		if at < 0.30:
			var w: float = at / 0.30
			w = w * w * (3.0 - 2.0 * w)
			pitch = lerp(0.0, 62.0, w)
			lift = lerp(0.0, 0.12, w)
			reach = lerp(0.0, 0.10, w)
		elif at < 0.52:
			var w2: float = (at - 0.30) / 0.22
			w2 = w2 * w2
			pitch = lerp(62.0, -74.0, w2)
			lift = lerp(0.12, -0.16, w2)
			reach = lerp(0.10, -0.26, w2)
		else:
			var w3: float = (at - 0.52) / 0.48
			w3 = w3 * w3 * (3.0 - 2.0 * w3)
			pitch = lerp(-74.0, 0.0, w3)
			lift = lerp(-0.16, 0.0, w3)
			reach = lerp(-0.26, 0.0, w3)
		melee_offset = Vector3(0.0, lift, reach)
		melee_rot = Vector3(deg_to_rad(pitch), deg_to_rad(pitch * 0.10), deg_to_rad(-pitch * 0.16))
	elif is_meleeing:
		var mt: float = clamp(melee_progress, 0.0, 1.0)
		var swing_angle: float = 0.0
		var thrust: float = 0.0
		if mt < 0.3:
			var p: float = mt / 0.3
			swing_angle = lerp(20.0, -10.0, p)
			thrust = lerp(0.05, -0.05, p)
		elif mt < 0.55:
			var p: float = (mt - 0.3) / 0.25
			swing_angle = lerp(-10.0, -60.0, p)
			thrust = lerp(-0.05, -0.28, p)
		else:
			var p: float = (mt - 0.55) / 0.45
			swing_angle = lerp(-60.0, 0.0, p)
			thrust = lerp(-0.28, 0.0, p)
		melee_offset = Vector3(0.0, -abs(swing_angle) * 0.001, thrust)
		melee_rot = Vector3(deg_to_rad(swing_angle * 0.15), deg_to_rad(swing_angle), deg_to_rad(swing_angle * 0.3))

	idle_time += delta
	var idle_sway := Vector3(sin(idle_time * 0.6) * 0.004, sin(idle_time * 0.9) * 0.003, 0.0)

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
		target_position += melee_offset + (Vector3(sway_offset.x, sway_offset.y, 0) + gun_bob + idle_sway) * sway_scale
		target_rotation += melee_rot + (Vector3(sway_offset.y * 0.6, -sway_offset.x * 0.6, sway_offset.x * 0.4)) * sway_scale
	else:
		target_position += (Vector3(sway_offset.x, sway_offset.y, 0) + gun_bob + recoil_pos + reload_dip + idle_sway) * sway_scale
		target_rotation += (Vector3(sway_offset.y * 0.6, -sway_offset.x * 0.6, sway_offset.x * 0.4) + recoil_rot + reload_rot) * sway_scale

	for i in weapon_nodes.size():
		var node: Node3D = weapon_nodes[i]
		if i == ITEM_HANDS:
			continue
		node.visible = (i == idx) and not is_scoped

	if idx == ITEM_HANDS:
		# update_hands() owns the arms; writing here would just be overwritten.
		return
	var active_node: Node3D = weapon_nodes[idx]
	active_node.position = target_position
	active_node.rotation = target_rotation

func take_damage(amount: int) -> void:
	if is_dead:
		return
	health = max(health - amount, 0)
	GameState.set_player_health(health)
	Sound.play_ui("player_hurt", -3.0)
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

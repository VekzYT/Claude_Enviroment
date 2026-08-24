extends CharacterBody3D

const SPEED := 6.0
const SPRINT_SPEED := 9.5
# Crouching is for closing on animals. It does not change the collision shape,
# only how fast you move, how low you look from, and how far off you are
# noticed -- so there is no way to stand up inside a rafter and get stuck.
const CROUCH_SPEED := 2.5
const CROUCH_DROP := 0.62
const CROUCH_LERP := 11.0
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

# Hunger runs down over about three days of ordinary walking, faster if you
# sprint. Empty, it starts costing health rather than killing you outright.
const HUNGER_DRAIN := 1.0 / (3.0 * 480.0)
const HUNGER_SPRINT_EXTRA := 2.2
const HUNGER_STARVE_DAMAGE := 2.0
const APPLE_RESTORE := 0.22
const COOKED_RESTORE := 0.42
const RAW_RESTORE := 0.08

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
const ITEM_BOW := 5

const AXE_SWING_DURATION := 0.62
const HAND_SWING_DURATION := 0.34
const AXE_CHOP_DAMAGE := 1
const INTERACT_RANGE := 3.2
# The forgiving fallback: a little shorter than the ray, and about 40 degrees
# off centre.
const INTERACT_REACH := 3.0
const INTERACT_COS := 0.76

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
@onready var weapon_bow: Node3D = $Head/Camera3D/WeaponBow

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

var weapon_damage: Array = [100, 25, 999, 0, 40, 46]
var weapon_fire_cooldown: Array = [1.3, 0.28, 0.45, 0.5, 0.62, 0.75]
var weapon_reload_time: Array = [2.4, 1.0, 0.0, 0.0, 0.0, 0.0]
var weapon_is_melee: Array = [false, false, true, true, true, false]
var weapon_full_scope: Array = [true, false, false, false, false, false]
var weapon_ads_fov: Array = [16.0, 55.0, 75.0, 75.0, 75.0, 58.0]
var weapon_melee_range: Array = [0.0, 0.0, 2.2, 1.5, 3.1, 0.0]
var weapon_titles: Array = ["Sniper", "Handgun", "Knife", "Bare hands", "Axe", "Bow"]

# You start with nothing but your hands. Everything else has to be found.
var owned: Array[bool] = [false, false, false, true, false, false]

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
var hunger := 1.0
var starve_tick := 0.0
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

# A shouldered log is not an inventory item -- it occupies both arms, so the
# axe goes away and nothing can be swung until it is put down.
const LOG_CARRY_SPEED := 0.62
var carrying_log := false
var crouching := false
# Eased rather than snapped, so dropping into a crouch is a movement of the
# camera and not a teleport.
var crouch_blend := 0.0
var carried_log_tint: Color = Color(0.46, 0.35, 0.23)
var carried_log_node: Node3D = null
var log_pickup_scene: PackedScene = preload("res://scenes/log_pickup.tscn")

var health := MAX_HEALTH
var is_dead := false
var spawn_position: Vector3

func _ready() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	add_to_group("player")

	weapon_nodes = [weapon_sniper, weapon_handgun, weapon_knife, hands, weapon_axe, weapon_bow]
	weapon_muzzles = [sniper_muzzle, handgun_muzzle, null, null, null, null]
	weapon_magazines = [sniper_magazine, handgun_magazine, null, null, null, null]

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
	GameState.bow_acquired.connect(func() -> void: give_item(ITEM_BOW))

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
			# With a panel up, E backs out of it rather than reaching through
			# the screen at whatever the crosshair was last pointing at.
			if screen_is_open():
				close_map_screen()
				close_pack_screen()
				close_trade_screen()
				get_viewport().set_input_as_handled()
			else:
				try_interact()
		elif event.keycode == KEY_M:
			# The player owns the toggle. If the screen also listened for M we
			# would open and close on the same press, so the screens only keep
			# ESC and this consumes the key either way.
			toggle_map_screen()
			get_viewport().set_input_as_handled()
		elif event.keycode == KEY_TAB or event.keycode == KEY_I:
			toggle_pack_screen()
			get_viewport().set_input_as_handled()
		elif event.keycode == KEY_F:
			eat_apple()
		elif event.keycode == KEY_1:
			request_switch(WEAPON_SNIPER)
		elif event.keycode == KEY_2:
			request_switch(WEAPON_HANDGUN)
		elif event.keycode == KEY_3:
			request_switch(WEAPON_KNIFE)
		elif event.keycode == KEY_4:
			request_switch(ITEM_BOW)

	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if GameState.map_open or GameState.inventory_open:
				return
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

# Looks for something interactable under the crosshair each frame and asks it
# what it would like the prompt to say. Anything in the "interactable" group
# with prompt_for()/interact() works, which is how the axe, a felled log, the
# chopping block and the map all share one key.
func update_interaction() -> void:
	var space: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	var from: Vector3 = camera.global_position
	var to: Vector3 = from + (-camera.global_transform.basis.z) * INTERACT_RANGE
	var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(from, to)
	query.collide_with_areas = true
	var skip: Array[RID] = [get_rid()]
	var found: Node = null
	var prompt := ""
	# Trigger volumes overlap -- the chopping block's reaches around the axe
	# standing in it. An interactable with nothing to say is treated as
	# transparent and the ray carries on past it rather than blocking whatever
	# is actually behind it.
	for attempt in 4:
		query.exclude = skip
		var result: Dictionary = space.intersect_ray(query)
		if result.is_empty():
			break
		var hit: Object = result.collider
		if hit is Node and (hit as Node).is_in_group("interactable"):
			var candidate: Node = hit as Node
			if candidate.has_method("prompt_for"):
				prompt = String(candidate.call("prompt_for", self))
				if prompt != "":
					found = candidate
					break
			if hit is CollisionObject3D:
				skip.append((hit as CollisionObject3D).get_rid())
				continue
		break
	# A ray alone is unforgiving: a flat thing on a table has to be hit at one
	# precise distance-and-pitch combination, and every other stance sails over
	# it into the floor. If the ray found nothing, fall back to whatever is
	# nearby and roughly in front of you.
	if found == null:
		var near: Array = _interactable_in_view(from, -camera.global_transform.basis.z)
		if not near.is_empty():
			found = near[0]
			prompt = String(near[1])

	interact_target = found
	if prompt == "":
		GameState.set_interact_prompt("")
	else:
		GameState.set_interact_prompt("[E]  %s" % prompt)

# Picks the interactable that is closest to straight ahead, within reach and
# within a generous cone. Returns [node, prompt] or an empty array.
func _interactable_in_view(from: Vector3, facing: Vector3) -> Array:
	var best: Node = null
	var best_prompt := ""
	var best_score := -1.0
	for node in get_tree().get_nodes_in_group("interactable"):
		var body := node as Node3D
		if body == null or not is_instance_valid(body):
			continue
		# Aim at the point the thing wants to be aimed at, not at its origin.
		# A person's origin is between her feet, so judging both the angle and
		# the range from there asks you to look at the ground in front of her.
		var focus: Vector3 = body.global_position
		if body.has_method("interact_point"):
			focus = body.call("interact_point")
		var to_it: Vector3 = focus - from
		var away: float = to_it.length()
		if away < 0.05:
			continue
		# Range is judged mostly on ground distance, so kneeling-height things
		# are not pushed out of reach by the camera being head-high.
		var reach_check: float = Vector3(to_it.x, to_it.y * 0.45, to_it.z).length()
		if reach_check > INTERACT_REACH:
			continue
		var aim: float = facing.dot(to_it / away)
		if aim < INTERACT_COS:
			continue
		if not body.has_method("prompt_for"):
			continue
		var text: String = String(body.call("prompt_for", self))
		if text == "":
			continue
		# Prefer things you are looking straight at, then things that are close.
		var score: float = aim - reach_check * 0.06
		if score > best_score:
			best_score = score
			best = body
			best_prompt = text
	if best == null:
		return []
	return [best, best_prompt]

func try_interact() -> void:
	if is_dead:
		return
	if interact_target != null and interact_target.has_method("interact"):
		interact_target.call("interact", self)
		interact_target = null
		GameState.set_interact_prompt("")
		return
	# Nothing in front of you, but you are holding a log: set it down here.
	if carrying_log:
		drop_log()

# Called by a log lying on the ground. Refuses if both arms are already full.
func take_log(tint: Color) -> bool:
	if carrying_log or is_dead:
		return false
	carrying_log = true
	carried_log_tint = tint
	GameState.set_carrying_log(true)
	GameState.announce("Log on your shoulder. Take it to the chopping block.")
	Sound.play_ui("weapon_switch", -4.0)
	_show_carried_log(true)
	return true

# Hands the log over without spawning one back into the world -- used by the
# chopping block, which takes possession of it.
func release_log() -> Color:
	carrying_log = false
	GameState.set_carrying_log(false)
	_show_carried_log(false)
	return carried_log_tint

func drop_log() -> void:
	if not carrying_log:
		return
	var tint: Color = release_log()
	var dropped: Node3D = log_pickup_scene.instantiate() as Node3D
	dropped.set("tint", tint)
	var host: Node = get_parent()
	if host == null:
		host = get_tree().current_scene
	host.add_child(dropped)
	# Set down just in front of you, lying across your facing.
	var forward: Vector3 = -global_transform.basis.z
	dropped.global_position = global_position + forward * 1.5 + Vector3(0, 0.35, 0)
	dropped.rotation.y = rotation.y + deg_to_rad(90.0)
	GameState.announce("Log set down.")

func _show_carried_log(shown: bool) -> void:
	if carried_log_node != null:
		carried_log_node.queue_free()
		carried_log_node = null
	if not shown:
		return
	# Held across both shoulders, angled off to one side the way you would
	# actually carry something this heavy.
	var holder := Node3D.new()
	holder.name = "CarriedLog"
	# Low across the chest and pushed out, so it obstructs the bottom of the
	# frame the way a log actually would without blocking where you are going.
	holder.position = Vector3(0.02, -0.30, -0.74)
	holder.rotation_degrees = Vector3(-5, 13, -8)
	camera.add_child(holder)

	var bark := StandardMaterial3D.new()
	# Darkened a little: unlit flat colour reads much paler in full sun than
	# the same tint does on the trunk it came off.
	bark.albedo_color = carried_log_tint.darkened(0.18)
	bark.roughness = 0.96
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.088
	mesh.bottom_radius = 0.10
	mesh.height = 1.5
	mesh.radial_segments = 9
	var trunk := MeshInstance3D.new()
	trunk.name = "Trunk"
	trunk.mesh = mesh
	trunk.material_override = bark
	trunk.rotation_degrees = Vector3(0, 0, 90)
	holder.add_child(trunk)

	var cut := StandardMaterial3D.new()
	cut.albedo_color = Color(0.74, 0.62, 0.44)
	cut.roughness = 0.9
	for side in [-1.0, 1.0]:
		var face := MeshInstance3D.new()
		var disc := CylinderMesh.new()
		disc.top_radius = 0.092
		disc.bottom_radius = 0.092
		disc.height = 0.02
		disc.radial_segments = 9
		face.mesh = disc
		face.material_override = cut
		face.rotation_degrees = Vector3(0, 0, 90)
		face.position = Vector3(side * 0.75, 0, 0)
		holder.add_child(face)

	# A few ridges so the trunk is not a smooth tube in the light.
	var ridge := StandardMaterial3D.new()
	ridge.albedo_color = carried_log_tint.darkened(0.42)
	ridge.roughness = 0.98
	var ridge_box := BoxMesh.new()
	ridge_box.size = Vector3.ONE
	for i in 3:
		var strip := MeshInstance3D.new()
		var angle: float = deg_to_rad(-40.0 + i * 46.0)
		strip.mesh = ridge_box
		strip.material_override = ridge
		strip.position = Vector3(-0.1 + i * 0.16, cos(angle) * 0.094, sin(angle) * 0.094)
		strip.rotation = Vector3(angle, 0.0, 0.0)
		strip.scale = Vector3(1.02, 0.012, 0.05)
		holder.add_child(strip)

	carried_log_node = holder

func give_item(id: int) -> void:
	if id < 0 or id >= owned.size() or owned[id]:
		return
	owned[id] = true
	GameState.announce("Picked up: %s" % weapon_titles[id])
	Sound.play_ui("weapon_switch", -4.0)
	request_switch(id)

# Once the chart on the cabin table has been read, the map travels with you.
# Opening a screen is the same keystroke as closing it, so both of these are
# toggles rather than one-way doors. Every earlier version consumed the key on
# the way in and then had nothing left to close with.
func toggle_map_screen() -> void:
	var screen: Node = get_tree().get_first_node_in_group("map_screen")
	if screen == null:
		return
	if GameState.map_open:
		screen.call("close_map")
		return
	if not GameState.map_known:
		GameState.announce("No map yet. There is a chart on the table inside the cabin.")
		return
	close_pack_screen()
	screen.call("open_map")

func toggle_pack_screen() -> void:
	var screen: Node = get_tree().get_first_node_in_group("inventory_screen")
	if screen == null:
		return
	if GameState.inventory_open:
		screen.call("close_pack")
		return
	close_map_screen()
	screen.call("open_pack")

# Only one full-screen panel at a time; opening either shuts the other.
func close_map_screen() -> void:
	if not GameState.map_open:
		return
	var screen: Node = get_tree().get_first_node_in_group("map_screen")
	if screen != null:
		screen.call("close_map")

func close_pack_screen() -> void:
	if not GameState.inventory_open:
		return
	var screen: Node = get_tree().get_first_node_in_group("inventory_screen")
	if screen != null:
		screen.call("close_pack")

# True while any full-screen panel has the mouse, which is when the world
# should ignore clicks and interact presses.
func screen_is_open() -> bool:
	return GameState.map_open or GameState.inventory_open or GameState.trade_open

func close_trade_screen() -> void:
	if not GameState.trade_open:
		return
	var screen: Node = get_tree().get_first_node_in_group("trade_screen")
	if screen != null:
		screen.call("close_trade")

func open_map_screen() -> void:
	if GameState.map_open:
		return
	toggle_map_screen()

func open_pack_screen() -> void:
	if GameState.inventory_open:
		return
	toggle_pack_screen()

# How loudly you are moving, as a multiplier on how far off an animal notices
# you. Standing still counts for a lot: a crouched player who has stopped is
# nearly invisible, and a sprinting one is spotted half again as far out.
func stealth_factor() -> float:
	var pace: float = Vector2(velocity.x, velocity.z).length()
	var factor: float = 1.0
	if crouching:
		factor = 0.42 if pace < 0.4 else 0.58
	elif pace > SPEED + 0.6:
		factor = 1.45
	elif pace < 0.4:
		factor = 0.8
	return factor

func is_crouching() -> bool:
	return crouching

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
	crouching = Input.is_physical_key_pressed(KEY_CTRL) and not carrying_log
	var wants_sprint: bool = Input.is_physical_key_pressed(KEY_SHIFT) and direction.length_squared() > 0.01
	# A log on your shoulder is too heavy to run with, and you cannot sprint
	# out of a crouch without standing up first.
	if carrying_log or crouching:
		wants_sprint = false
	var speed: float = SPEED
	if update_stamina(delta, wants_sprint):
		speed = SPRINT_SPEED
	if crouching:
		speed = CROUCH_SPEED
	if carrying_log:
		speed *= LOG_CARRY_SPEED

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

	update_hunger(delta, wants_sprint and moving)
	update_interaction()
	update_view_bob(delta, moving, horizontal_speed, input_dir.x)
	update_switch(delta)
	update_aim(delta)
	update_reload(delta)
	update_melee(delta)
	update_bow(delta)
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

func update_hunger(delta: float, sprinting: bool) -> void:
	var drain: float = HUNGER_DRAIN
	if sprinting:
		drain *= HUNGER_SPRINT_EXTRA
	hunger = maxf(hunger - drain * delta, 0.0)
	GameState.set_hunger(hunger)
	if hunger > 0.0:
		starve_tick = 0.0
		return
	# Starving: a slow bleed, so you have time to do something about it.
	starve_tick += delta
	if starve_tick >= 4.0:
		starve_tick = 0.0
		take_damage(int(HUNGER_STARVE_DAMAGE))
		GameState.announce("You are starving.")

# Eats the best thing in the pack: cooked meat first, then fruit, and raw meat
# only as a last resort -- it barely helps and it is not pleasant.
func eat_apple() -> bool:
	if GameState.cooked_meat > 0:
		GameState.add_cooked_meat(-1)
		_feed(COOKED_RESTORE, "You eat the cooked meat.")
		return true
	if GameState.apples > 0:
		GameState.add_apples(-1)
		_feed(APPLE_RESTORE, "You eat an apple.")
		return true
	if GameState.raw_meat > 0:
		GameState.add_raw_meat(-1)
		_feed(RAW_RESTORE, "You force down the raw meat.")
		return true
	GameState.announce("No food in your pack.")
	return false

func _feed(amount: float, message: String) -> void:
	hunger = minf(hunger + amount, 1.0)
	GameState.set_hunger(hunger)
	GameState.announce(message)
	Sound.play_ui("weapon_switch", -12.0)
	var guide: Node = get_tree().get_first_node_in_group("objectives")
	if guide != null:
		guide.call("note_ate")

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
	) * bob_fade * (1.0 - 0.65 * crouch_blend)

	crouch_blend = move_toward(crouch_blend, 1.0 if crouching else 0.0, delta * CROUCH_LERP)
	camera.position = camera_base_position + bob_offset - Vector3(0.0, CROUCH_DROP * crouch_blend, 0.0)
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
	if idx == ITEM_BOW:
		loose_arrow()
		return
	var is_melee: bool = weapon_is_melee[idx]
	if is_melee:
		start_melee()
	else:
		shoot()

const ARROW_SCENE: PackedScene = preload("res://scenes/arrow.tscn")
const BOW_DRAW_TIME := 0.42

var bow_draw := 0.0
var bow_cooldown := 0.0

func loose_arrow() -> void:
	if bow_cooldown > 0.0:
		return
	if GameState.arrows <= 0:
		GameState.announce("No arrows. Maren sells them in Elmswood.")
		Sound.play_ui("reload_click", -10.0)
		return
	GameState.add_arrows(-1)
	bow_cooldown = float(weapon_fire_cooldown[ITEM_BOW])
	bow_draw = 1.0

	var arrow: Node3D = ARROW_SCENE.instantiate() as Node3D
	get_tree().current_scene.add_child(arrow)
	# Out of the camera rather than off the bow model, so where you are looking
	# is where it goes. The model sits off to one side of the crosshair.
	var origin: Vector3 = camera.global_position + camera.global_transform.basis.z * -0.5
	arrow.call("launch", origin, -camera.global_transform.basis.z,
		int(weapon_damage[ITEM_BOW]), self)
	Sound.play_3d("knife_swing", global_position, -6.0)
	camera_kick += deg_to_rad(1.2)

# The bow is drawn back as it recovers, so the string and the nocked arrow show
# the shot being readied rather than snapping between two poses.
func update_bow(delta: float) -> void:
	if bow_cooldown > 0.0:
		bow_cooldown = maxf(bow_cooldown - delta, 0.0)
	bow_draw = move_toward(bow_draw, 0.0, delta / BOW_DRAW_TIME)
	if weapon_bow == null:
		return
	var nocked: Node3D = weapon_bow.get_node_or_null("NockedArrow")
	var string_root: Node3D = weapon_bow.get_node_or_null("String")
	var ready_shot: bool = GameState.arrows > 0 and bow_cooldown <= 0.0
	if nocked != null:
		nocked.visible = ready_shot and current_weapon_index == ITEM_BOW
		nocked.position.z = -0.16 + bow_draw * 0.1
	if string_root != null:
		string_root.position.z = bow_draw * 0.06

func start_melee() -> void:
	if is_meleeing or is_switching:
		return
	if carrying_log:
		GameState.announce("Both hands are full.")
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
	# Areas have to be included or the chopping block -- which is an Area3D --
	# is invisible to the swing and a loaded log can never be split. Pickups are
	# Areas too, so anything that is not the block is stepped over rather than
	# swallowing the blow.
	var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(from, to)
	query.collide_with_areas = true
	var skip: Array[RID] = [get_rid()]
	var result: Dictionary = {}
	for attempt in 4:
		query.exclude = skip
		result = space_state.intersect_ray(query)
		if result.is_empty():
			return
		var struck: Object = result.collider
		if struck is Area3D and not (struck as Node).is_in_group("chopping_block"):
			skip.append((struck as Area3D).get_rid())
			result = {}
			continue
		break
	if result.is_empty():
		return
	var target: Object = result.collider

	# The chopping block comes first: with a log on it, a swing here is what
	# actually produces wood.
	if idx == ITEM_AXE and target is Node and (target as Node).is_in_group("chopping_block"):
		if int((target as Node).call("split", result.position)) > 0:
			camera_kick += deg_to_rad(4.0)
			chop_shake = 1.0
			GameState.trigger_hit_marker()
		return

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
				GameState.report_tree_felled()
				GameState.announce("Timber! Carry the log to your block.")
				Sound.play_3d("land", result.position, 2.0)
				camera_kick += deg_to_rad(6.0)
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
		var sweep: float = 0.0
		if at < 0.30:
			sweep = (at / 0.30) * 0.10
		elif at < 0.56:
			sweep = lerp(0.10, -0.16, (at - 0.30) / 0.26)
		else:
			sweep = lerp(-0.16, 0.0, (at - 0.56) / 0.44)
		target_pos += Vector3(sweep, -absf(sweep) * 0.28, -absf(sweep) * 0.5)
		target_rot += Vector3(0.0, deg_to_rad(-sweep * 46.0), deg_to_rad(sweep * 22.0))

	# A short jolt when the edge bites, so contact is felt in the arms too.
	if chop_shake > 0.001:
		var j: float = chop_shake * 0.03
		target_pos += Vector3(randf_range(-j, j), randf_range(-j, j), 0.0)

	var settle: float = 14.0
	if carrying_log:
		# Braced under the load: hands up and turned palm-up, and slower to
		# settle so it trudges rather than bobbing.
		target_pos += Vector3(0.0, 0.30, 0.16)
		target_rot += Vector3(deg_to_rad(-34.0), 0.0, 0.0)
		settle = 9.0

	hands.position = hands.position.lerp(target_pos, clampf(delta * settle, 0.0, 1.0))
	hands.rotation = hands.rotation.lerp(target_rot, clampf(delta * settle, 0.0, 1.0))

	# With the axe out, both hands leave their resting pose and take hold of the
	# haft. update_weapon_transform() has already placed the axe for this frame,
	# so the grip points below are exactly where the wood is right now.
	var want_grip: float = 0.0
	if idx == ITEM_AXE and not carrying_log:
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
		# Horizontal felling stroke: cock back over the right shoulder, sweep
		# across the body to the left through the cut, then drift back to
		# guard. Yaw carries the arc; roll lays the bit over so the edge leads.
		var at: float = clamp(melee_progress, 0.0, 1.0)
		var yaw: float = 0.0
		var roll: float = 0.0
		var pitch: float = 0.0
		var across: float = 0.0
		var reach: float = 0.0
		if at < 0.30:
			# Wind up, decelerating into the top of the backswing.
			var w: float = at / 0.30
			w = w * w * (3.0 - 2.0 * w)
			yaw = lerp(0.0, -54.0, w)
			roll = lerp(0.0, -34.0, w)
			pitch = lerp(0.0, 16.0, w)
			across = lerp(0.0, 0.18, w)
			reach = lerp(0.0, 0.12, w)
		elif at < 0.56:
			# The stroke itself, accelerating right to left across the body.
			var w2: float = (at - 0.30) / 0.26
			w2 = w2 * w2
			yaw = lerp(-54.0, 76.0, w2)
			roll = lerp(-34.0, 30.0, w2)
			pitch = lerp(16.0, -12.0, w2)
			across = lerp(0.18, -0.30, w2)
			reach = lerp(0.12, -0.22, w2)
		else:
			# Follow through and recover.
			var w3: float = (at - 0.56) / 0.44
			w3 = w3 * w3 * (3.0 - 2.0 * w3)
			yaw = lerp(76.0, 0.0, w3)
			roll = lerp(30.0, 0.0, w3)
			pitch = lerp(-12.0, 0.0, w3)
			across = lerp(-0.30, 0.0, w3)
			reach = lerp(-0.22, 0.0, w3)
		melee_offset = Vector3(across, -absf(yaw) * 0.0009, reach)
		melee_rot = Vector3(deg_to_rad(pitch), deg_to_rad(yaw), deg_to_rad(roll))
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
		node.visible = (i == idx) and not is_scoped and not carrying_log

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

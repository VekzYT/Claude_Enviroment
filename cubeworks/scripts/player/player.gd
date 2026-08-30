class_name Player
extends CharacterBody3D
## First person controller: walking, sprinting, crouching, swimming, jumping,
## fall damage, and breaking and placing blocks through the voxel raycast.

signal health_changed(current: float, maximum: float)
signal died
signal target_changed(info: Dictionary)
signal break_progress_changed(progress: float)
signal status_message(text: String)

const MAX_HEALTH := 20.0

const WALK_SPEED := 4.6
const SPRINT_SPEED := 6.9
const CROUCH_SPEED := 1.9
const SWIM_SPEED := 3.6
const ACCEL_GROUND := 14.0
const ACCEL_AIR := 3.2
const FRICTION := 12.0

const GRAVITY := 26.0
const WATER_GRAVITY := 4.5
const JUMP_VELOCITY := 8.2
const SWIM_UP_SPEED := 3.4
const TERMINAL_VELOCITY := 60.0

const STAND_HEIGHT := 1.8
const CROUCH_HEIGHT := 1.35
const STAND_EYE := 1.62
const CROUCH_EYE := 1.18
const RADIUS := 0.3

const REACH := 5.0
const PLACE_COOLDOWN := 0.16
const ATTACK_COOLDOWN := 0.35
const ATTACK_DAMAGE := 4.0
const ATTACK_REACH := 3.6

const SAFE_FALL := 3.5
const REGEN_DELAY := 7.0
const REGEN_RATE := 0.5

@onready var body_shape: CollisionShape3D = $Body
@onready var head: Node3D = $Head
@onready var camera: Camera3D = $Head/Camera
@onready var held_item: MeshInstance3D = $Head/Camera/HeldItem

var world: VoxelWorld
var inventory := Inventory.new()

var input_enabled := false
var frozen := true          ## true until the spawn chunk has finished loading

var health := MAX_HEALTH
var yaw := 0.0
var pitch := 0.0

var _crouching := false
var _sprinting := false
var _in_water := false
var _head_in_water := false
var _fall_peak := 0.0
var _was_on_floor := true
var _place_timer := 0.0
var _attack_timer := 0.0
var _regen_timer := 0.0

var _target := {}
var _break_target := Vector3i.ZERO
var _break_progress := 0.0

var _highlight: MeshInstance3D
var _held_id := -1
var _swing := 0.0
var _bob := 0.0

var _capsule: CapsuleShape3D


func _ready() -> void:
	add_to_group("player")
	collision_layer = 2
	collision_mask = 1
	floor_max_angle = deg_to_rad(50)
	floor_snap_length = 0.3

	_capsule = CapsuleShape3D.new()
	_capsule.radius = RADIUS
	_capsule.height = STAND_HEIGHT
	body_shape.shape = _capsule
	body_shape.position = Vector3(0, STAND_HEIGHT * 0.5, 0)

	camera.fov = GameState.field_of_view
	camera.near = 0.05
	camera.far = maxf(160.0, GameState.render_distance * 16.0 + 48.0)

	_build_highlight()
	_refresh_held_item()
	inventory.changed.connect(_refresh_held_item)
	health_changed.emit(health, MAX_HEALTH)


func _build_highlight() -> void:
	_highlight = MeshInstance3D.new()
	_highlight.name = "BlockHighlight"
	_highlight.top_level = true
	_highlight.visible = false
	_highlight.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF

	var im := ImmediateMesh.new()
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = Color(0.05, 0.05, 0.06, 0.9)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.vertex_color_use_as_albedo = false
	mat.no_depth_test = false
	mat.render_priority = 1

	var e := 0.503   # half a block plus a hair, so the frame floats just clear
	var c := [
		Vector3(-e, -e, -e), Vector3(e, -e, -e), Vector3(e, -e, e), Vector3(-e, -e, e),
		Vector3(-e, e, -e), Vector3(e, e, -e), Vector3(e, e, e), Vector3(-e, e, e),
	]
	var edges := [
		[0, 1], [1, 2], [2, 3], [3, 0],
		[4, 5], [5, 6], [6, 7], [7, 4],
		[0, 4], [1, 5], [2, 6], [3, 7],
	]
	im.surface_begin(Mesh.PRIMITIVE_LINES, mat)
	for edge in edges:
		im.surface_add_vertex(c[edge[0]])
		im.surface_add_vertex(c[edge[1]])
	im.surface_end()

	_highlight.mesh = im
	add_child(_highlight)


func setup(p_world: VoxelWorld) -> void:
	world = p_world


func teleport(pos: Vector3) -> void:
	global_position = pos
	velocity = Vector3.ZERO
	_fall_peak = pos.y


func unfreeze() -> void:
	frozen = false
	_fall_peak = global_position.y


# ------------------------------------------------------------------- input

func _unhandled_input(event: InputEvent) -> void:
	if not input_enabled:
		return

	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		var motion := event as InputEventMouseMotion
		var sens: float = GameState.mouse_sensitivity
		yaw -= motion.relative.x * sens
		var dy: float = motion.relative.y * sens
		pitch += dy if GameState.invert_y else -dy
		pitch = clampf(pitch, -1.55, 1.55)
		return

	if event.is_action_pressed("hotbar_next"):
		inventory.scroll_selection(1)
	elif event.is_action_pressed("hotbar_prev"):
		inventory.scroll_selection(-1)
	elif event.is_action_pressed("drop_item"):
		var dropped := inventory.drop_selected(Input.is_key_pressed(KEY_SHIFT))
		if dropped["count"] > 0:
			status_message.emit("Dropped %d x %s" % [dropped["count"], BlockDB.get_name_of(dropped["id"])])
	else:
		for i in range(1, 10):
			if event.is_action_pressed("hotbar_%d" % i):
				inventory.select(i - 1)
				return


# ------------------------------------------------------------------ update

func _process(delta: float) -> void:
	_update_look_target()
	_update_breaking(delta)
	_update_held_item(delta)


func _physics_process(delta: float) -> void:
	rotation.y = yaw
	head.rotation.x = pitch

	_place_timer = maxf(0.0, _place_timer - delta)
	_attack_timer = maxf(0.0, _attack_timer - delta)

	if frozen or world == null:
		velocity = Vector3.ZERO
		return

	_update_water_state()
	_update_crouch(delta)
	_apply_movement(delta)
	_handle_placing()
	_regenerate(delta)


func _update_water_state() -> void:
	var feet := global_position + Vector3(0, 0.15, 0)
	var eye := head.global_position
	_in_water = BlockDB.is_liquid(world.get_block(floori(feet.x), floori(feet.y), floori(feet.z)))
	_head_in_water = BlockDB.is_liquid(world.get_block(floori(eye.x), floori(eye.y), floori(eye.z)))


func _update_crouch(delta: float) -> void:
	var want_crouch := input_enabled and Input.is_action_pressed("crouch")
	if not want_crouch and _crouching and not _has_headroom():
		want_crouch = true
	_crouching = want_crouch

	var target_height := CROUCH_HEIGHT if _crouching else STAND_HEIGHT
	var target_eye := CROUCH_EYE if _crouching else STAND_EYE
	_capsule.height = lerpf(_capsule.height, target_height, minf(1.0, delta * 14.0))
	body_shape.position.y = _capsule.height * 0.5
	head.position.y = lerpf(head.position.y, target_eye, minf(1.0, delta * 14.0))


func _has_headroom() -> bool:
	var p := global_position
	for dz in [-RADIUS, RADIUS]:
		for dx in [-RADIUS, RADIUS]:
			var bx := floori(p.x + dx)
			var bz := floori(p.z + dz)
			for by in [floori(p.y + 1.2), floori(p.y + STAND_HEIGHT - 0.05)]:
				if world.is_solid_at(bx, by, bz):
					return false
	return true


func _apply_movement(delta: float) -> void:
	# If the ground under our feet has not streamed in yet, hang in the air
	# rather than dropping through a hole that is only there for a moment.
	if not world.has_data_at(global_position):
		velocity = Vector3.ZERO
		_fall_peak = global_position.y
		return

	var on_floor := is_on_floor()

	# Vertical motion.
	if _in_water:
		velocity.y = move_toward(velocity.y, -1.4, WATER_GRAVITY * delta)
		if input_enabled and Input.is_action_pressed("jump"):
			velocity.y = move_toward(velocity.y, SWIM_UP_SPEED, 18.0 * delta)
		_fall_peak = global_position.y
	else:
		if not on_floor:
			velocity.y = maxf(velocity.y - GRAVITY * delta, -TERMINAL_VELOCITY)
		elif input_enabled and Input.is_action_pressed("jump"):
			velocity.y = JUMP_VELOCITY
			_fall_peak = global_position.y
		elif velocity.y < 0.0:
			velocity.y = -2.0

	# Horizontal motion.
	var input_dir := Vector2.ZERO
	if input_enabled:
		input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var wish := (transform.basis * Vector3(input_dir.x, 0.0, input_dir.y))
	wish.y = 0.0
	if wish.length_squared() > 1.0:
		wish = wish.normalized()

	_sprinting = input_enabled and Input.is_action_pressed("sprint") and not _crouching \
			and input_dir.y < -0.1
	var speed := WALK_SPEED
	if _in_water:
		speed = SWIM_SPEED
	elif _crouching:
		speed = CROUCH_SPEED
	elif _sprinting:
		speed = SPRINT_SPEED

	var target := wish * speed
	var accel := ACCEL_GROUND if (on_floor or _in_water) else ACCEL_AIR
	if wish.length_squared() < 0.01:
		accel = FRICTION if (on_floor or _in_water) else ACCEL_AIR
	velocity.x = move_toward(velocity.x, target.x, accel * speed * delta)
	velocity.z = move_toward(velocity.z, target.z, accel * speed * delta)

	# Sneaking keeps you on the ledge instead of walking off it.
	if _crouching and on_floor and not _in_water:
		_apply_ledge_guard(delta)

	if global_position.y > _fall_peak or on_floor or _in_water:
		_fall_peak = maxf(_fall_peak, global_position.y)

	move_and_slide()

	# Field of view nudge while sprinting.
	var want_fov: float = GameState.field_of_view + (8.0 if _sprinting else 0.0)
	camera.fov = lerpf(camera.fov, want_fov, minf(1.0, delta * 8.0))

	_handle_landing()

	if global_position.y < -8.0:
		take_damage(4.0, "the void")
		teleport(Vector3(global_position.x, VoxelWorld.HEIGHT - 6, global_position.z))


func _apply_ledge_guard(delta: float) -> void:
	var probe := 0.32
	var next_x := global_position + Vector3(velocity.x * delta * 1.5 + signf(velocity.x) * probe, 0, 0)
	if not _ground_under(next_x):
		velocity.x = 0.0
	var next_z := global_position + Vector3(0, 0, velocity.z * delta * 1.5 + signf(velocity.z) * probe)
	if not _ground_under(next_z):
		velocity.z = 0.0


func _ground_under(pos: Vector3) -> bool:
	var by := floori(pos.y - 0.2)
	for dz in [-RADIUS * 0.8, RADIUS * 0.8]:
		for dx in [-RADIUS * 0.8, RADIUS * 0.8]:
			if world.is_solid_at(floori(pos.x + dx), by, floori(pos.z + dz)):
				return true
	return false


func _handle_landing() -> void:
	var on_floor := is_on_floor()
	if on_floor and not _was_on_floor:
		var drop := _fall_peak - global_position.y
		if drop > SAFE_FALL and not _in_water:
			take_damage(floorf(drop - SAFE_FALL), "the fall")
		_fall_peak = global_position.y
	elif on_floor or _in_water:
		_fall_peak = global_position.y
	_was_on_floor = on_floor


func _regenerate(delta: float) -> void:
	_regen_timer += delta
	if health < MAX_HEALTH and _regen_timer >= REGEN_DELAY:
		health = minf(MAX_HEALTH, health + REGEN_RATE)
		_regen_timer = REGEN_DELAY - 3.0
		health_changed.emit(health, MAX_HEALTH)


# ------------------------------------------------------- block interaction

func _update_look_target() -> void:
	if world == null or frozen:
		return
	var origin := camera.global_position
	var dir := -camera.global_transform.basis.z
	var hit := world.raycast(origin, dir, REACH)
	_target = hit
	if hit["hit"]:
		_highlight.visible = true
		_highlight.global_position = Vector3(hit["block"]) + Vector3(0.5, 0.5, 0.5)
	else:
		_highlight.visible = false
	target_changed.emit(hit)


func _update_breaking(delta: float) -> void:
	if not input_enabled or world == null or frozen:
		_set_break_progress(0.0)
		return

	if not Input.is_action_pressed("break_block"):
		_set_break_progress(0.0)
		return

	if _try_attack():
		return

	if not _target.get("hit", false):
		_set_break_progress(0.0)
		return

	var block: Vector3i = _target["block"]
	var id: int = _target["id"]
	if not BlockDB.is_breakable(id):
		_set_break_progress(0.0)
		return

	if block != _break_target:
		_break_target = block
		_break_progress = 0.0

	var duration: float = maxf(0.05, BlockDB.break_time(id))
	_break_progress += delta / duration
	_swing = maxf(_swing, 0.35)
	if _break_progress >= 1.0:
		_break_block(block, id)
		_break_progress = 0.0
	break_progress_changed.emit(_break_progress)


func _set_break_progress(value: float) -> void:
	if is_equal_approx(_break_progress, value) and value == 0.0:
		return
	_break_progress = value
	break_progress_changed.emit(_break_progress)


func _break_block(block: Vector3i, id: int) -> void:
	if not world.set_block(block.x, block.y, block.z, BlockDB.AIR):
		return
	_swing = 1.0
	var drop: int = BlockDB.drop_of(id)
	if drop != BlockDB.AIR:
		var left := inventory.add(drop, 1)
		if left > 0:
			status_message.emit("Your pack is full")


func _try_attack() -> bool:
	if _attack_timer > 0.0:
		return false
	var space := get_world_3d().direct_space_state
	var from := camera.global_position
	var to := from - camera.global_transform.basis.z * ATTACK_REACH
	var query := PhysicsRayQueryParameters3D.create(from, to)
	query.collision_mask = 4
	query.exclude = [get_rid()]
	var hit := space.intersect_ray(query)
	if hit.is_empty():
		return false
	var target = hit.get("collider")
	if target != null and target.has_method("take_damage"):
		_attack_timer = ATTACK_COOLDOWN
		_swing = 1.0
		var knock: Vector3 = (target.global_position - global_position).normalized()
		target.take_damage(ATTACK_DAMAGE, knock)
		return true
	return false


func _handle_placing() -> void:
	if not input_enabled or world == null or frozen:
		return
	if not Input.is_action_pressed("place_block"):
		return
	if _place_timer > 0.0:
		return
	if not _target.get("hit", false):
		return

	var id := inventory.selected_id()
	if id == BlockDB.AIR or not BlockDB.is_placeable(id):
		return

	var cell: Vector3i = _target["place"]
	if cell.y < 0 or cell.y >= VoxelWorld.HEIGHT:
		return
	var existing := world.get_block(cell.x, cell.y, cell.z)
	if existing != BlockDB.AIR and not BlockDB.is_liquid(existing):
		return
	if _cell_blocked_by_body(cell):
		status_message.emit("No room there")
		return

	if world.set_block(cell.x, cell.y, cell.z, id):
		inventory.consume_selected(1)
		_place_timer = PLACE_COOLDOWN
		_swing = 1.0


## Stops you sealing yourself (or a creature) inside a block.
func _cell_blocked_by_body(cell: Vector3i) -> bool:
	var box := AABB(Vector3(cell), Vector3.ONE)

	var height: float = _capsule.height
	var player_box := AABB(
		global_position - Vector3(RADIUS, 0.0, RADIUS),
		Vector3(RADIUS * 2.0, height, RADIUS * 2.0))
	if box.intersects(player_box.grow(-0.02)):
		return true

	for mob in get_tree().get_nodes_in_group("mobs"):
		if mob is Node3D:
			var mob_box := AABB(mob.global_position - Vector3(0.35, 0.0, 0.35), Vector3(0.7, 1.7, 0.7))
			if box.intersects(mob_box.grow(-0.02)):
				return true
	return false


# ------------------------------------------------------------- held item

func _refresh_held_item() -> void:
	var id := inventory.selected_id()
	if id == _held_id:
		return
	_held_id = id
	if id == BlockDB.AIR:
		held_item.visible = false
		held_item.mesh = null
		return
	held_item.visible = true
	held_item.mesh = BlockMesh.build_cube(id)
	held_item.material_override = BlockDB.material_transparent \
			if BlockDB.layer_flags[id] == BlockDB.LAYER_TRANSPARENT else BlockDB.material_opaque


func _update_held_item(delta: float) -> void:
	if not held_item.visible:
		return
	_swing = maxf(0.0, _swing - delta * 4.2)
	var speed := Vector2(velocity.x, velocity.z).length()
	_bob += delta * speed * 1.6
	var bob_x := sin(_bob) * 0.012 * minf(speed, 7.0) * 0.4
	var bob_y := absf(cos(_bob)) * 0.012 * minf(speed, 7.0) * 0.4

	var swing := sin(_swing * PI) * 0.35
	held_item.position = Vector3(0.38 + bob_x, -0.30 + bob_y - swing * 0.24, -0.74 + swing * 0.10)
	held_item.rotation = Vector3(-0.18 - swing * 0.9, 0.72, 0.18)
	held_item.scale = Vector3.ONE * 0.145


# ----------------------------------------------------------------- damage

func take_damage(amount: float, cause: String = "") -> void:
	if amount <= 0.0 or health <= 0.0:
		return
	health = maxf(0.0, health - amount)
	_regen_timer = 0.0
	health_changed.emit(health, MAX_HEALTH)
	if not cause.is_empty():
		status_message.emit("Hurt by %s" % cause)
	if health <= 0.0:
		died.emit()


func heal(amount: float) -> void:
	health = minf(MAX_HEALTH, health + amount)
	health_changed.emit(health, MAX_HEALTH)


func revive_at(pos: Vector3) -> void:
	health = MAX_HEALTH
	health_changed.emit(health, MAX_HEALTH)
	teleport(pos)


func is_head_underwater() -> bool:
	return _head_in_water


func get_looking_at() -> Dictionary:
	return _target

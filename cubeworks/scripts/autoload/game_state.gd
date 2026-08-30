extends Node
## Global game settings and the bridge between the menu and the running world.
##
## Registered as the "GameState" autoload. It also builds the whole InputMap at
## startup so the project needs no hand-edited input section in project.godot.

signal settings_changed

const DEFAULT_RENDER_DISTANCE := 7
const MIN_RENDER_DISTANCE := 3
const MAX_RENDER_DISTANCE := 16

## Seed of the world that is about to be (or currently is) loaded.
var world_seed: int = 0
## File name (without extension) of the current save slot.
var world_name: String = "world"
## When true the game scene restores from disk instead of starting fresh.
var load_existing: bool = false

## How many chunks are kept loaded around the player in every direction.
var render_distance: int = DEFAULT_RENDER_DISTANCE
var mouse_sensitivity: float = 0.0022
var invert_y: bool = false
var field_of_view: float = 75.0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_register_input_actions()
	_load_settings()
	# Closing the window has to save first, and that has to work from every
	# scene, so it is handled here rather than inside the game scene.
	get_tree().set_auto_accept_quit(false)


func _notification(what: int) -> void:
	if what != NOTIFICATION_WM_CLOSE_REQUEST:
		return
	var scene := get_tree().current_scene
	if scene != null and scene.has_method("save_now"):
		scene.save_now(false)
	get_tree().quit()


## ---------------------------------------------------------------- input map

func _register_input_actions() -> void:
	_add_key("move_forward", KEY_W)
	_add_key("move_back", KEY_S)
	_add_key("move_left", KEY_A)
	_add_key("move_right", KEY_D)
	_add_key("jump", KEY_SPACE)
	_add_key("sprint", KEY_SHIFT)
	_add_key("crouch", KEY_CTRL)
	_add_key("inventory", KEY_E)
	_add_key("pause", KEY_ESCAPE)
	_add_key("drop_item", KEY_Q)
	_add_key("debug_info", KEY_F3)
	_add_key("toggle_fullscreen", KEY_F11)

	_add_mouse("break_block", MOUSE_BUTTON_LEFT)
	_add_mouse("place_block", MOUSE_BUTTON_RIGHT)
	_add_mouse("hotbar_next", MOUSE_BUTTON_WHEEL_DOWN)
	_add_mouse("hotbar_prev", MOUSE_BUTTON_WHEEL_UP)

	const NUM_KEYS := [KEY_1, KEY_2, KEY_3, KEY_4, KEY_5, KEY_6, KEY_7, KEY_8, KEY_9]
	for i in NUM_KEYS.size():
		_add_key("hotbar_%d" % (i + 1), NUM_KEYS[i])


func _ensure_action(action: String) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)


func _add_key(action: String, keycode: Key) -> void:
	_ensure_action(action)
	for ev in InputMap.action_get_events(action):
		if ev is InputEventKey and ev.physical_keycode == keycode:
			return
	var event := InputEventKey.new()
	event.physical_keycode = keycode
	InputMap.action_add_event(action, event)


func _add_mouse(action: String, button: MouseButton) -> void:
	_ensure_action(action)
	for ev in InputMap.action_get_events(action):
		if ev is InputEventMouseButton and ev.button_index == button:
			return
	var event := InputEventMouseButton.new()
	event.button_index = button
	InputMap.action_add_event(action, event)


## ------------------------------------------------------------------ helpers

## Turns any text into a stable 63-bit seed. Empty text produces a random one.
func seed_from_text(text: String) -> int:
	var trimmed := text.strip_edges()
	if trimmed.is_empty():
		return randi() | (randi() << 32) & 0x7FFFFFFFFFFFFFFF
	if trimmed.is_valid_int():
		return int(trimmed)
	return abs(trimmed.hash()) * 2654435761 & 0x7FFFFFFFFFFFFFFF


func start_new_world(name: String, seed_text: String) -> void:
	world_name = _sanitise(name)
	world_seed = seed_from_text(seed_text)
	load_existing = false
	# The save state is prepared here, before the game scene loads, because the
	# world node reads the seed the moment it enters the tree.
	SaveManager.begin_new_world(world_name, world_seed)
	get_tree().change_scene_to_file("res://scenes/game.tscn")


func load_world(name: String) -> bool:
	var clean := _sanitise(name)
	if not SaveManager.load_world(clean):
		return false
	world_name = clean
	world_seed = SaveManager.world_seed
	load_existing = true
	get_tree().change_scene_to_file("res://scenes/game.tscn")
	return true


func return_to_menu() -> void:
	get_tree().paused = false
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")


func _sanitise(name: String) -> String:
	var out := ""
	for c in name.strip_edges():
		if c.is_valid_identifier() or c.to_lower() in "abcdefghijklmnopqrstuvwxyz0123456789 -_":
			out += c
	out = out.strip_edges()
	return out if not out.is_empty() else "world"


## ----------------------------------------------------------------- settings

const SETTINGS_PATH := "user://settings.cfg"

func save_settings() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("video", "render_distance", render_distance)
	cfg.set_value("video", "fov", field_of_view)
	cfg.set_value("input", "mouse_sensitivity", mouse_sensitivity)
	cfg.set_value("input", "invert_y", invert_y)
	cfg.save(SETTINGS_PATH)
	settings_changed.emit()


func _load_settings() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(SETTINGS_PATH) != OK:
		return
	render_distance = clampi(int(cfg.get_value("video", "render_distance", DEFAULT_RENDER_DISTANCE)),
			MIN_RENDER_DISTANCE, MAX_RENDER_DISTANCE)
	field_of_view = clampf(float(cfg.get_value("video", "fov", 75.0)), 60.0, 110.0)
	mouse_sensitivity = clampf(float(cfg.get_value("input", "mouse_sensitivity", 0.0022)), 0.0004, 0.01)
	invert_y = bool(cfg.get_value("input", "invert_y", false))


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("toggle_fullscreen"):
		var mode := DisplayServer.window_get_mode()
		if mode == DisplayServer.WINDOW_MODE_FULLSCREEN:
			DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
		else:
			DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
		get_viewport().set_input_as_handled()

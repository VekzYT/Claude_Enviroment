extends Node3D
## The running game: wires the world, the player, the interface and the save
## file together, and owns the pause / inventory / death states.

const AUTOSAVE_SECONDS := 90.0

@onready var world: VoxelWorld = $World
@onready var sky: DayNight = $Sky
@onready var player: Player = $Player
@onready var spawner: Node = $MobSpawner
@onready var hud: Control = $UI/HUD
@onready var inventory_ui: Control = $UI/InventoryUI
@onready var pause_menu: Control = $UI/PauseMenu

var _autosave := AUTOSAVE_SECONDS
var _paused := false
var _inventory_open := false
var _spawn_point := Vector3.ZERO


func _ready() -> void:
	randomize()
	# The pause menu really does pause: the tree stops, so chunk streaming,
	# physics and creatures all stand still. These two keep running so Esc can
	# be pressed again and the menu's buttons stay clickable.
	process_mode = Node.PROCESS_MODE_ALWAYS

	world.render_distance = GameState.render_distance
	world.setup(player)
	player.setup(world)

	sky.configure_fog(GameState.render_distance)
	sky.time_of_day = SaveManager.time_of_day

	spawner.setup(world, player, sky)

	hud.setup(player, world, sky)
	player.died.connect(_on_player_died)
	inventory_ui.bind(player.inventory)
	inventory_ui.closed.connect(_on_inventory_closed)
	pause_menu.process_mode = Node.PROCESS_MODE_ALWAYS
	pause_menu.setup(self)

	_place_player()

	world.spawn_area_ready.connect(_on_spawn_ready)
	hud.set_loading(true)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


func _place_player() -> void:
	if GameState.load_existing and SaveManager.has_player_state:
		_spawn_point = SaveManager.player_position
		player.teleport(_spawn_point)
		player.yaw = SaveManager.player_yaw
		player.pitch = SaveManager.player_pitch
		player.health = SaveManager.player_health
		player.health_changed.emit(player.health, Player.MAX_HEALTH)
		if SaveManager.inventory_data.size() > 0:
			player.inventory.from_data(SaveManager.inventory_data)
	else:
		_spawn_point = world.find_spawn(Vector2i.ZERO)
		player.teleport(_spawn_point)
		player.inventory.give_starter_kit()
		player.inventory.select(0)


func _on_spawn_ready() -> void:
	hud.set_loading(false)
	# A new world drops the player neatly onto the surface. A loaded one keeps
	# the position it saved -- unless the terrain has swallowed it, in which
	# case dig them out rather than suffocating them.
	var here := player.global_position
	if not GameState.load_existing or world.is_position_blocked(here):
		here = world.settle_on_ground(here)
		player.teleport(here)
	_spawn_point = here
	player.unfreeze()
	if not _paused and not _inventory_open:
		_capture_mouse()
	hud.show_status("Welcome to Cubeworks")


# ------------------------------------------------------------------- input

func _unhandled_input(event: InputEvent) -> void:
	if hud.is_death_visible():
		return

	if event.is_action_pressed("pause"):
		if _inventory_open:
			inventory_ui.close()
		else:
			set_paused(not _paused)
		get_viewport().set_input_as_handled()
		return

	if event.is_action_pressed("inventory") and not _paused:
		if _inventory_open:
			inventory_ui.close()
		else:
			_open_inventory()
		get_viewport().set_input_as_handled()
		return

	if event.is_action_pressed("debug_info"):
		hud.toggle_debug()
		get_viewport().set_input_as_handled()


func _open_inventory() -> void:
	_inventory_open = true
	inventory_ui.open()
	_release_mouse()
	player.input_enabled = false


func _on_inventory_closed() -> void:
	_inventory_open = false
	if not _paused:
		_capture_mouse()
		player.input_enabled = true


func set_paused(value: bool) -> void:
	_paused = value
	pause_menu.visible = value
	sky.paused = value
	get_tree().paused = value
	if value:
		_release_mouse()
		player.input_enabled = false
	else:
		_capture_mouse()
		player.input_enabled = true


func _on_player_died() -> void:
	# Hand the mouse back so the blackout screen's buttons can be clicked.
	_release_mouse()


func _capture_mouse() -> void:
	if player.frozen:
		return
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	player.input_enabled = true


func _release_mouse() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	player.input_enabled = false


# ------------------------------------------------------------------ update

func _process(delta: float) -> void:
	if _paused or player.frozen:
		return
	_autosave -= delta
	if _autosave <= 0.0:
		_autosave = AUTOSAVE_SECONDS
		save_now(false)


# --------------------------------------------------------------- lifecycle

func collect_state() -> void:
	SaveManager.world_seed = GameState.world_seed
	SaveManager.world_name = GameState.world_name
	SaveManager.time_of_day = sky.time_of_day
	SaveManager.player_position = player.global_position
	SaveManager.player_yaw = player.yaw
	SaveManager.player_pitch = player.pitch
	SaveManager.player_health = player.health
	SaveManager.inventory_data = player.inventory.to_data()
	SaveManager.has_player_state = true


func save_now(announce: bool = true) -> bool:
	collect_state()
	var ok: bool = SaveManager.save_world()
	if announce:
		hud.show_status("World saved" if ok else "Could not save the world")
	return ok


func save_and_quit() -> void:
	save_now(false)
	get_tree().paused = false
	GameState.return_to_menu()


func quit_requested() -> void:
	get_tree().paused = false


func quit_to_desktop() -> void:
	save_now(false)
	get_tree().paused = false
	get_tree().quit()


func respawn_player() -> void:
	var spot := world.find_spawn(Vector2i(floori(_spawn_point.x), floori(_spawn_point.z)))
	player.revive_at(spot)
	_capture_mouse()
	hud.show_status("You come to your senses")

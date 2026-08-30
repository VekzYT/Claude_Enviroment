extends Control
## Everything drawn on top of the 3D view: reticle, hotbar, health, break
## progress, status messages, the debug readout, the loading and death screens.
##
## The whole layout is built in code so there is nothing fiddly to wire up by
## hand in the editor.

const HEALTH_SEGMENTS := 10

var player: Player
var world: VoxelWorld
var day_night: Node

var hotbar: Hotbar
var _crosshair: Crosshair
var _break_bar: ColorRect
var _break_fill: ColorRect
var _health_back: Panel
var _health_fill: ColorRect
var _health_label: Label
var _selected_label: Label
var _status_label: Label
var _debug_label: Label
var _debug_panel: PanelContainer
var _damage_flash: ColorRect
var _water_tint: ColorRect
var _loading: PanelContainer
var _death: Control
var _hint_label: Label

var _status_timer := 0.0
var _selected_timer := 0.0
var _damage_alpha := 0.0
var _fps_accum := 0.0
var _fps_shown := 0.0
var _last_health := 20.0
var _debug_timer := 0.0
var _hint_timer := 40.0


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_build()


func setup(p_player: Player, p_world: VoxelWorld, p_day_night: Node) -> void:
	player = p_player
	world = p_world
	day_night = p_day_night

	hotbar.bind(player.inventory)
	player.health_changed.connect(_on_health_changed)
	player.break_progress_changed.connect(_on_break_progress)
	player.status_message.connect(show_status)
	player.inventory.selection_changed.connect(_on_selection_changed)
	player.died.connect(show_death_screen)
	_on_health_changed(player.health, Player.MAX_HEALTH)


# ------------------------------------------------------------------ layout

func _build() -> void:
	_water_tint = ColorRect.new()
	_water_tint.color = Color(0.10, 0.32, 0.62, 0.35)
	_water_tint.set_anchors_preset(Control.PRESET_FULL_RECT)
	_water_tint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_water_tint.visible = false
	add_child(_water_tint)

	_damage_flash = ColorRect.new()
	_damage_flash.color = Color(0.65, 0.05, 0.05, 0.0)
	_damage_flash.set_anchors_preset(Control.PRESET_FULL_RECT)
	_damage_flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_damage_flash)

	_crosshair = Crosshair.new()
	_crosshair.size = Vector2(48, 48)
	add_child(_crosshair)
	_crosshair.set_anchors_and_offsets_preset(Control.PRESET_CENTER, Control.PRESET_MODE_KEEP_SIZE)

	_build_break_bar()
	_build_bottom()
	_build_status()
	_build_debug()
	_build_loading()
	_build_death()


func _build_break_bar() -> void:
	_break_bar = ColorRect.new()
	_break_bar.color = Color(0, 0, 0, 0.55)
	_break_bar.custom_minimum_size = Vector2(120, 8)
	_break_bar.size = Vector2(120, 8)
	_break_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_break_bar.visible = false
	add_child(_break_bar)
	_break_bar.set_anchors_and_offsets_preset(Control.PRESET_CENTER, Control.PRESET_MODE_KEEP_SIZE)
	_break_bar.position.y += 34

	_break_fill = ColorRect.new()
	_break_fill.color = UITheme.ACCENT
	_break_fill.position = Vector2(2, 2)
	_break_fill.size = Vector2(0, 4)
	_break_fill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_break_bar.add_child(_break_fill)


func _build_bottom() -> void:
	var column := VBoxContainer.new()
	column.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM, Control.PRESET_MODE_MINSIZE)
	column.alignment = BoxContainer.ALIGNMENT_CENTER
	column.add_theme_constant_override("separation", 6)
	column.mouse_filter = Control.MOUSE_FILTER_PASS
	column.grow_horizontal = Control.GROW_DIRECTION_BOTH
	column.grow_vertical = Control.GROW_DIRECTION_BEGIN
	column.offset_bottom = -14
	add_child(column)

	_selected_label = UITheme.make_label("", 17, UITheme.TEXT)
	_selected_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_selected_label.modulate.a = 0.0
	column.add_child(_selected_label)

	# Health bar.
	var health_row := HBoxContainer.new()
	health_row.alignment = BoxContainer.ALIGNMENT_CENTER
	health_row.add_theme_constant_override("separation", 8)
	column.add_child(health_row)

	_health_back = Panel.new()
	_health_back.custom_minimum_size = Vector2(240, 16)
	var back_style := UITheme.panel(UITheme.HEALTH_BACK, UITheme.EDGE_SOFT, 8, 1)
	back_style.content_margin_left = 0
	back_style.content_margin_right = 0
	back_style.content_margin_top = 0
	back_style.content_margin_bottom = 0
	_health_back.add_theme_stylebox_override("panel", back_style)
	health_row.add_child(_health_back)

	_health_fill = ColorRect.new()
	_health_fill.color = UITheme.HEALTH
	_health_fill.position = Vector2(2, 2)
	_health_fill.size = Vector2(236, 12)
	_health_fill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_health_back.add_child(_health_fill)

	# Ten notches so a glance tells you roughly how hurt you are.
	for i in range(1, HEALTH_SEGMENTS):
		var notch := ColorRect.new()
		notch.color = Color(0, 0, 0, 0.55)
		notch.size = Vector2(2, 16)
		notch.position = Vector2(240.0 * float(i) / HEALTH_SEGMENTS, 0)
		notch.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_health_back.add_child(notch)

	_health_label = UITheme.make_label("20 / 20", 14, UITheme.TEXT)
	health_row.add_child(_health_label)

	hotbar = Hotbar.new()
	column.add_child(hotbar)

	_hint_label = UITheme.make_label(
		"WASD move  ·  Space jump  ·  Shift sprint  ·  Ctrl sneak  ·  LMB break  ·  RMB place  ·  E pack  ·  F3 info",
		13, UITheme.TEXT_DIM)
	_hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(_hint_label)


func _build_status() -> void:
	_status_label = UITheme.make_label("", 18, UITheme.ACCENT)
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP, Control.PRESET_MODE_MINSIZE)
	_status_label.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_status_label.offset_top = 64
	_status_label.modulate.a = 0.0
	add_child(_status_label)


func _build_debug() -> void:
	_debug_panel = PanelContainer.new()
	_debug_panel.add_theme_stylebox_override("panel", UITheme.panel(UITheme.BG_DEEP, UITheme.EDGE_SOFT, 4, 1))
	_debug_panel.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT, Control.PRESET_MODE_MINSIZE)
	_debug_panel.position = Vector2(12, 12)
	_debug_panel.visible = false
	_debug_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_debug_panel)

	_debug_label = UITheme.make_label("", 14, UITheme.TEXT)
	_debug_label.add_theme_constant_override("outline_size", 0)
	_debug_panel.add_child(_debug_label)


func _build_loading() -> void:
	_loading = PanelContainer.new()
	_loading.add_theme_stylebox_override("panel", UITheme.panel(UITheme.BG_DEEP, UITheme.ACCENT_DIM, 8, 2))
	_loading.set_anchors_and_offsets_preset(Control.PRESET_CENTER, Control.PRESET_MODE_MINSIZE)
	_loading.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_loading.grow_vertical = Control.GROW_DIRECTION_BOTH
	add_child(_loading)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 6)
	_loading.add_child(box)
	var title := UITheme.make_label("Shaping the world", 24, UITheme.ACCENT)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(title)
	var sub := UITheme.make_label("Carving hills, filling seas, planting woods...", 15, UITheme.TEXT_DIM)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(sub)


func _build_death() -> void:
	_death = Control.new()
	_death.set_anchors_preset(Control.PRESET_FULL_RECT)
	_death.visible = false
	_death.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(_death)

	var shade := ColorRect.new()
	shade.color = Color(0.35, 0.04, 0.04, 0.55)
	shade.set_anchors_preset(Control.PRESET_FULL_RECT)
	_death.add_child(shade)

	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UITheme.panel(UITheme.BG_DEEP, UITheme.DANGER, 8, 2))
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER, Control.PRESET_MODE_MINSIZE)
	panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	panel.grow_vertical = Control.GROW_DIRECTION_BOTH
	_death.add_child(panel)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 14)
	panel.add_child(box)

	var title := UITheme.make_label("You blacked out", 30, UITheme.DANGER)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(title)

	var note := UITheme.make_label("Your pack is untouched. Take a breath and head back out.",
			15, UITheme.TEXT_DIM)
	note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(note)

	var respawn := Button.new()
	respawn.text = "Wake up"
	UITheme.style_button(respawn, true)
	respawn.pressed.connect(func() -> void:
		hide_death_screen()
		var game := get_tree().current_scene
		if game != null and game.has_method("respawn_player"):
			game.respawn_player())
	box.add_child(respawn)

	var quit := Button.new()
	quit.text = "Save and leave"
	UITheme.style_button(quit)
	quit.pressed.connect(func() -> void:
		var game := get_tree().current_scene
		if game != null and game.has_method("save_and_quit"):
			game.save_and_quit())
	box.add_child(quit)


# ------------------------------------------------------------------ update

func _process(delta: float) -> void:
	_fps_accum += delta
	if _fps_accum > 0.25:
		_fps_accum = 0.0
		_fps_shown = Engine.get_frames_per_second()

	if _status_timer > 0.0:
		_status_timer -= delta
		_status_label.modulate.a = clampf(_status_timer, 0.0, 1.0)
	if _selected_timer > 0.0:
		_selected_timer -= delta
		_selected_label.modulate.a = clampf(_selected_timer, 0.0, 1.0)

	if _hint_timer > 0.0:
		_hint_timer -= delta
		if _hint_timer <= 3.0:
			_hint_label.modulate.a = clampf(_hint_timer / 3.0, 0.0, 1.0)
		if _hint_timer <= 0.0:
			_hint_label.visible = false

	if _damage_alpha > 0.0:
		_damage_alpha = maxf(0.0, _damage_alpha - delta * 1.6)
		_damage_flash.color.a = _damage_alpha * 0.45

	if player != null:
		_water_tint.visible = player.is_head_underwater()

	if _debug_panel.visible:
		_debug_timer -= delta
		if _debug_timer <= 0.0:
			_debug_timer = 0.25
			_update_debug()


func _update_debug() -> void:
	if player == null or world == null:
		return
	var p := player.global_position
	var chunk := VoxelWorld.world_to_chunk(p)
	var biome_name := "-"
	if world.generator != null:
		var h := world.generator.surface_height(floori(p.x), floori(p.z))
		biome_name = TerrainGenerator.BIOME_NAMES[world.generator.biome_at(floori(p.x), floori(p.z), h)]

	var looking := "nothing"
	var target := player.get_looking_at()
	if target.get("hit", false):
		var b: Vector3i = target["block"]
		looking = "%s at %d, %d, %d" % [BlockDB.get_name_of(target["id"]), b.x, b.y, b.z]

	var clock := "-"
	if day_night != null and day_night.has_method("clock_string"):
		clock = day_night.clock_string()

	_debug_label.text = "\n".join([
		"MC Copy v1.0  ·  %.0f fps" % _fps_shown,
		"seed %d" % GameState.world_seed,
		"pos %.1f, %.1f, %.1f" % [p.x, p.y, p.z],
		"chunk %d, %d  ·  biome %s" % [chunk.x, chunk.y, biome_name],
		"looking at %s" % looking,
		"chunks loaded %d  ·  meshed %d" % [world.chunks.size(), world.stat_meshed],
		"edited blocks %d" % SaveManager.edit_count(),
		"time %s  ·  day %d" % [clock, SaveManager.day_count],
		"draw dist %d chunks" % world.render_distance,
	])


# ----------------------------------------------------------------- signals

func _on_health_changed(current: float, maximum: float) -> void:
	var ratio := clampf(current / maximum, 0.0, 1.0)
	_health_fill.size.x = 236.0 * ratio
	_health_fill.color = UITheme.HEALTH.lerp(Color(0.95, 0.62, 0.2), 1.0 - ratio)
	_health_label.text = "%d / %d" % [roundi(current), roundi(maximum)]
	if current < _last_health:
		_damage_alpha = 1.0
	_last_health = current


func _on_break_progress(progress: float) -> void:
	_break_bar.visible = progress > 0.001
	_break_fill.size.x = 116.0 * clampf(progress, 0.0, 1.0)


func _on_selection_changed(index: int) -> void:
	if player == null:
		return
	var id := player.inventory.slot_id(index)
	_selected_label.text = BlockDB.get_name_of(id) if id > 0 else "empty hand"
	_selected_timer = 2.0
	_selected_label.modulate.a = 1.0


func show_status(text: String) -> void:
	_status_label.text = text
	_status_timer = 2.5
	_status_label.modulate.a = 1.0


func set_loading(visible_now: bool) -> void:
	_loading.visible = visible_now


func toggle_debug() -> void:
	_debug_panel.visible = not _debug_panel.visible


func set_hints_visible(value: bool) -> void:
	_hint_label.visible = value


func show_death_screen() -> void:
	_death.visible = true
	mouse_filter = Control.MOUSE_FILTER_STOP


func hide_death_screen() -> void:
	_death.visible = false
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func is_death_visible() -> bool:
	return _death.visible

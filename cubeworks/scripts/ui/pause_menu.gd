extends Control
## Pause screen with the settings that matter: draw distance, mouse look and
## field of view, plus saving and leaving.

var game: Node
var _distance_label: Label
var _sens_label: Label
var _fov_label: Label


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false
	_build()


func setup(p_game: Node) -> void:
	game = p_game


func _build() -> void:
	var shade := ColorRect.new()
	shade.color = Color(0.03, 0.04, 0.06, 0.72)
	shade.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(shade)

	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UITheme.panel(UITheme.BG_DEEP, UITheme.ACCENT_DIM, 10, 2))
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER, Control.PRESET_MODE_MINSIZE)
	panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	panel.grow_vertical = Control.GROW_DIRECTION_BOTH
	panel.custom_minimum_size = Vector2(420, 0)
	add_child(panel)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	panel.add_child(box)

	var title := UITheme.make_label("Paused", 30, UITheme.ACCENT)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(title)

	var seed_label := UITheme.make_label("", 13, UITheme.TEXT_DIM)
	seed_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	seed_label.text = "world \"%s\"  ·  seed %d" % [GameState.world_name, GameState.world_seed]
	box.add_child(seed_label)

	var resume := Button.new()
	resume.text = "Back to the world"
	UITheme.style_button(resume, true)
	resume.pressed.connect(func() -> void: game.set_paused(false))
	box.add_child(resume)

	box.add_child(_separator())

	# Draw distance.
	_distance_label = UITheme.make_label("", 15)
	box.add_child(_distance_label)
	var distance := HSlider.new()
	distance.min_value = GameState.MIN_RENDER_DISTANCE
	distance.max_value = GameState.MAX_RENDER_DISTANCE
	distance.step = 1
	distance.value = GameState.render_distance
	distance.custom_minimum_size = Vector2(0, 20)
	distance.value_changed.connect(_on_distance_changed)
	box.add_child(distance)
	_update_distance_label()

	# Mouse sensitivity.
	_sens_label = UITheme.make_label("", 15)
	box.add_child(_sens_label)
	var sens := HSlider.new()
	sens.min_value = 0.4
	sens.max_value = 4.0
	sens.step = 0.1
	sens.value = GameState.mouse_sensitivity * 1000.0
	sens.custom_minimum_size = Vector2(0, 20)
	sens.value_changed.connect(_on_sensitivity_changed)
	box.add_child(sens)
	_update_sens_label()

	# Field of view.
	_fov_label = UITheme.make_label("", 15)
	box.add_child(_fov_label)
	var fov := HSlider.new()
	fov.min_value = 60
	fov.max_value = 110
	fov.step = 1
	fov.value = GameState.field_of_view
	fov.custom_minimum_size = Vector2(0, 20)
	fov.value_changed.connect(_on_fov_changed)
	box.add_child(fov)
	_update_fov_label()

	# A plain toggle button reads far better than the default checkbox glyph,
	# which all but vanishes against a dark panel.
	var invert := Button.new()
	invert.toggle_mode = true
	invert.button_pressed = GameState.invert_y
	invert.text = _invert_text()
	UITheme.style_button(invert)
	invert.toggled.connect(func(on: bool) -> void:
		GameState.invert_y = on
		GameState.save_settings()
		invert.text = _invert_text())
	box.add_child(invert)

	box.add_child(_separator())

	var save_button := Button.new()
	save_button.text = "Save now"
	UITheme.style_button(save_button)
	save_button.pressed.connect(func() -> void: game.save_now(true))
	box.add_child(save_button)

	var leave := Button.new()
	leave.text = "Save and return to menu"
	UITheme.style_button(leave)
	leave.pressed.connect(func() -> void: game.save_and_quit())
	box.add_child(leave)

	var quit := Button.new()
	quit.text = "Save and quit to desktop"
	UITheme.style_button(quit)
	quit.pressed.connect(func() -> void: game.quit_to_desktop())
	box.add_child(quit)


func _invert_text() -> String:
	return "Invert vertical look: %s" % ("on" if GameState.invert_y else "off")


func _separator() -> Control:
	var line := ColorRect.new()
	line.color = UITheme.EDGE_SOFT
	line.custom_minimum_size = Vector2(0, 1)
	return line


func _on_distance_changed(value: float) -> void:
	GameState.render_distance = int(value)
	GameState.save_settings()
	_update_distance_label()
	if game != null and game.world != null:
		game.world.render_distance = int(value)
		game.sky.configure_fog(int(value))


func _on_sensitivity_changed(value: float) -> void:
	GameState.mouse_sensitivity = value / 1000.0
	GameState.save_settings()
	_update_sens_label()


func _on_fov_changed(value: float) -> void:
	GameState.field_of_view = value
	GameState.save_settings()
	_update_fov_label()


func _update_distance_label() -> void:
	_distance_label.text = "Draw distance: %d chunks (%d blocks)" % [
		GameState.render_distance, GameState.render_distance * 16]


func _update_sens_label() -> void:
	_sens_label.text = "Mouse sensitivity: %.1f" % (GameState.mouse_sensitivity * 1000.0)


func _update_fov_label() -> void:
	_fov_label.text = "Field of view: %d" % int(GameState.field_of_view)

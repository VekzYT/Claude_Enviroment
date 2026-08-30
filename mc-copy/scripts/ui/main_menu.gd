extends Control
## Title screen: start a new world with a chosen seed, or continue a saved one.

var _name_edit: LineEdit
var _seed_edit: LineEdit
var _world_list: VBoxContainer
var _message: Label


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_build()
	_refresh_world_list()


func _build() -> void:
	var background := TextureRect.new()
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_SCALE
	var gradient := Gradient.new()
	gradient.set_color(0, Color(0.07, 0.11, 0.20))
	gradient.set_color(1, Color(0.20, 0.34, 0.52))
	gradient.add_point(0.55, Color(0.12, 0.20, 0.34))
	var grad_tex := GradientTexture2D.new()
	grad_tex.gradient = gradient
	grad_tex.fill_from = Vector2(0, 0)
	grad_tex.fill_to = Vector2(0, 1)
	grad_tex.width = 8
	grad_tex.height = 256
	background.texture = grad_tex
	add_child(background)

	var root := VBoxContainer.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_CENTER, Control.PRESET_MODE_MINSIZE)
	root.grow_horizontal = Control.GROW_DIRECTION_BOTH
	root.grow_vertical = Control.GROW_DIRECTION_BOTH
	root.add_theme_constant_override("separation", 6)
	root.alignment = BoxContainer.ALIGNMENT_CENTER
	add_child(root)

	var title := UITheme.make_label("MC COPY", 58, UITheme.ACCENT)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(title)

	var tagline := UITheme.make_label("dig, build, and last the night", 17, UITheme.TEXT)
	tagline.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(tagline)

	# A strip of block art so the menu shows what the world is made of.
	var strip := HBoxContainer.new()
	strip.alignment = BoxContainer.ALIGNMENT_CENTER
	strip.add_theme_constant_override("separation", 6)
	root.add_child(strip)
	for id in [BlockDB.GRASS, BlockDB.STONE, BlockDB.SAND, BlockDB.WOOD, BlockDB.LEAVES,
			BlockDB.WATER, BlockDB.BRICK, BlockDB.LAMP]:
		var icon := TextureRect.new()
		icon.texture = BlockDB.icon_of(id)
		icon.custom_minimum_size = Vector2(40, 40)
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		strip.add_child(icon)

	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 14)
	root.add_child(spacer)

	var columns := HBoxContainer.new()
	columns.add_theme_constant_override("separation", 18)
	columns.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_child(columns)
	columns.add_child(_build_new_panel())
	columns.add_child(_build_load_panel())

	_message = UITheme.make_label("", 15, UITheme.ACCENT)
	_message.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(_message)

	var quit := Button.new()
	quit.text = "Quit"
	UITheme.style_button(quit)
	quit.pressed.connect(func() -> void: get_tree().quit())
	var quit_row := HBoxContainer.new()
	quit_row.alignment = BoxContainer.ALIGNMENT_CENTER
	quit_row.add_child(quit)
	root.add_child(quit_row)


func _build_new_panel() -> Control:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UITheme.panel(UITheme.BG_PANEL, UITheme.EDGE, 8, 2))
	panel.custom_minimum_size = Vector2(340, 0)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 8)
	panel.add_child(box)

	box.add_child(UITheme.make_label("New world", 22, UITheme.ACCENT))

	box.add_child(UITheme.make_label("Name", 14, UITheme.TEXT_DIM))
	_name_edit = LineEdit.new()
	_name_edit.text = _suggest_name()
	_name_edit.max_length = 24
	UITheme.style_line_edit(_name_edit)
	box.add_child(_name_edit)

	box.add_child(UITheme.make_label("Seed (any text, blank for random)", 14, UITheme.TEXT_DIM))
	_seed_edit = LineEdit.new()
	_seed_edit.placeholder_text = "leave blank to surprise yourself"
	_seed_edit.max_length = 32
	UITheme.style_line_edit(_seed_edit)
	box.add_child(_seed_edit)

	var distance_label := UITheme.make_label(
		"Draw distance: %d chunks" % GameState.render_distance, 14, UITheme.TEXT_DIM)
	box.add_child(distance_label)
	var distance := HSlider.new()
	distance.min_value = GameState.MIN_RENDER_DISTANCE
	distance.max_value = GameState.MAX_RENDER_DISTANCE
	distance.step = 1
	distance.value = GameState.render_distance
	distance.value_changed.connect(func(v: float) -> void:
		GameState.render_distance = int(v)
		GameState.save_settings()
		distance_label.text = "Draw distance: %d chunks" % int(v))
	box.add_child(distance)

	var start := Button.new()
	start.text = "Shape the world"
	UITheme.style_button(start, true)
	start.pressed.connect(_on_start_pressed)
	box.add_child(start)
	return panel


func _build_load_panel() -> Control:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UITheme.panel(UITheme.BG_PANEL, UITheme.EDGE, 8, 2))
	panel.custom_minimum_size = Vector2(340, 260)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 8)
	panel.add_child(box)

	box.add_child(UITheme.make_label("Continue", 22, UITheme.ACCENT))

	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(310, 190)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	box.add_child(scroll)

	_world_list = VBoxContainer.new()
	_world_list.add_theme_constant_override("separation", 6)
	_world_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(_world_list)
	return panel


func _refresh_world_list() -> void:
	for child in _world_list.get_children():
		child.queue_free()

	var worlds: Array = SaveManager.list_worlds()
	if worlds.is_empty():
		_world_list.add_child(UITheme.make_label("No saved worlds yet.", 14, UITheme.TEXT_DIM))
		return

	for world_name in worlds:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 6)

		var load_button := Button.new()
		load_button.text = world_name
		load_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		load_button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		UITheme.style_button(load_button)
		load_button.pressed.connect(_on_load_pressed.bind(world_name))
		row.add_child(load_button)

		var delete := Button.new()
		delete.text = "X"
		UITheme.style_button(delete)
		delete.tooltip_text = "Delete this world"
		delete.pressed.connect(_on_delete_pressed.bind(world_name))
		row.add_child(delete)

		_world_list.add_child(row)


func _suggest_name() -> String:
	var base := "world"
	var existing: Array = SaveManager.list_worlds()
	var n := 1
	while existing.has("%s%d" % [base, n]):
		n += 1
	return "%s%d" % [base, n]


func _on_start_pressed() -> void:
	var world_name: String = _name_edit.text.strip_edges()
	if world_name.is_empty():
		world_name = _suggest_name()
	if SaveManager.world_exists(world_name):
		_message.text = "A world called \"%s\" already exists. Pick another name." % world_name
		return
	GameState.start_new_world(world_name, _seed_edit.text)


func _on_load_pressed(world_name: String) -> void:
	if not GameState.load_world(world_name):
		_message.text = "That save could not be read."


func _on_delete_pressed(world_name: String) -> void:
	SaveManager.delete_world(world_name)
	_refresh_world_list()
	_message.text = "Deleted \"%s\"." % world_name

extends CanvasLayer

# The pack. Opens on Tab or I, and is the one place that shows everything you
# are carrying at once -- gear in hand, materials, food and how you are doing.

const PANEL := Vector2(560, 520)

var root: Control
var panel: PanelContainer
var slot_rows: VBoxContainer
var apple_value: Label
var wood_value: Label
var supply_value: Label
var hunger_fill: ColorRect
var hunger_text: Label
var condition_fill: ColorRect
var condition_text: Label
var day_line: Label
var hint: Label
var open := false
var player: Node = null

func _ready() -> void:
	layer = 8
	_build()
	visible = false
	GameState.apples_changed.connect(func(_c: int) -> void: _refresh())
	GameState.wood_changed.connect(func(_c: int) -> void: _refresh())
	GameState.hunger_changed.connect(func(_f: float) -> void: _refresh())
	GameState.health_changed.connect(func(_h: int) -> void: _refresh())
	GameState.supply_collected.connect(func(_c: int, _t: int) -> void: _refresh())

func _label(text: String, font: Font, size: int, colour: Color, align: int = HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", colour)
	l.horizontal_alignment = align
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

func _rect(colour: Color, size: Vector2) -> ColorRect:
	var r := ColorRect.new()
	r.color = colour
	r.size = size
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r

func _row(separation: int) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", separation)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return h

func _bar(width: float, height: float, colour: Color) -> Array:
	var holder := Control.new()
	holder.custom_minimum_size = Vector2(width, height)
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var back := Panel.new()
	back.add_theme_stylebox_override("panel", UITheme.flat(Color(0.03, 0.035, 0.03, 0.92), 2))
	back.set_anchors_preset(Control.PRESET_FULL_RECT)
	back.mouse_filter = Control.MOUSE_FILTER_IGNORE
	holder.add_child(back)
	var fill: ColorRect = _rect(colour, Vector2(width - 2.0, height - 2.0))
	fill.position = Vector2(1, 1)
	holder.add_child(fill)
	return [holder, fill]

func _build() -> void:
	root = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	var dimmer: ColorRect = _rect(Color(0, 0, 0, 0.72), Vector2.ZERO)
	dimmer.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(dimmer)

	panel = PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UITheme.panel(Color(0.10, 0.10, 0.086, 0.98), UITheme.LINE, 3))
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.position = -PANEL * 0.5
	panel.custom_minimum_size = PANEL
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(panel)

	var canvas := Control.new()
	canvas.custom_minimum_size = PANEL
	canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	panel.add_child(canvas)

	var title: Label = _label("PACK", UITheme.display(), 26, UITheme.TEXT)
	title.position = Vector2(24, 8)
	canvas.add_child(title)

	day_line = _label("", UITheme.body(), 15, UITheme.ACCENT, HORIZONTAL_ALIGNMENT_RIGHT)
	day_line.position = Vector2(PANEL.x - 300, 14)
	day_line.size = Vector2(276, 20)
	canvas.add_child(day_line)

	var rule: ColorRect = _rect(UITheme.LINE_SOFT, Vector2(PANEL.x - 48, 1))
	rule.position = Vector2(24, 48)
	canvas.add_child(rule)

	canvas.add_child(_section("IN HAND", 64))
	slot_rows = VBoxContainer.new()
	slot_rows.add_theme_constant_override("separation", 6)
	slot_rows.position = Vector2(24, 88)
	slot_rows.custom_minimum_size = Vector2(PANEL.x - 48, 0)
	slot_rows.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.add_child(slot_rows)

	canvas.add_child(_section("MATERIALS", 210))
	var wood_row: Array = _stack_row("Wood", UITheme.WOOD, 234)
	canvas.add_child(wood_row[0])
	wood_value = wood_row[1]
	var apple_row: Array = _stack_row("Apples", Color(0.62, 0.16, 0.13), 272)
	canvas.add_child(apple_row[0])
	apple_value = apple_row[1]
	var supply_row: Array = _stack_row("Supply caches", UITheme.GOOD, 310)
	canvas.add_child(supply_row[0])
	supply_value = supply_row[1]

	canvas.add_child(_section("CONDITION", 366))

	var hunger_label: Label = _label("Food", UITheme.body_light(), 15, UITheme.TEXT_DIM)
	hunger_label.position = Vector2(24, 392)
	canvas.add_child(hunger_label)
	hunger_text = _label("", UITheme.body_bold(), 15, UITheme.TEXT, HORIZONTAL_ALIGNMENT_RIGHT)
	hunger_text.position = Vector2(PANEL.x - 180, 392)
	hunger_text.size = Vector2(156, 18)
	canvas.add_child(hunger_text)
	var hunger_bar: Array = _bar(PANEL.x - 48, 12, Color(0.72, 0.55, 0.24))
	(hunger_bar[0] as Control).position = Vector2(24, 414)
	hunger_fill = hunger_bar[1]
	canvas.add_child(hunger_bar[0])

	var cond_label: Label = _label("Health", UITheme.body_light(), 15, UITheme.TEXT_DIM)
	cond_label.position = Vector2(24, 438)
	canvas.add_child(cond_label)
	condition_text = _label("", UITheme.body_bold(), 15, UITheme.TEXT, HORIZONTAL_ALIGNMENT_RIGHT)
	condition_text.position = Vector2(PANEL.x - 180, 438)
	condition_text.size = Vector2(156, 18)
	canvas.add_child(condition_text)
	var cond_bar: Array = _bar(PANEL.x - 48, 12, UITheme.GOOD)
	(cond_bar[0] as Control).position = Vector2(24, 460)
	condition_fill = cond_bar[1]
	canvas.add_child(cond_bar[0])

	hint = _label("F to eat an apple      TAB or I to close", UITheme.body_light(), 13,
		UITheme.TEXT_FAINT, HORIZONTAL_ALIGNMENT_CENTER)
	hint.position = Vector2(24, PANEL.y - 32)
	hint.size = Vector2(PANEL.x - 48, 18)
	canvas.add_child(hint)

func _section(text: String, y: float) -> Label:
	var l: Label = _label(text, UITheme.body_light(), 13, UITheme.TEXT_FAINT)
	l.position = Vector2(24, y)
	return l

func _stack_row(name_text: String, swatch: Color, y: float) -> Array:
	var holder := Control.new()
	holder.position = Vector2(24, y)
	holder.custom_minimum_size = Vector2(PANEL.x - 48, 28)
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var chip := Panel.new()
	chip.custom_minimum_size = Vector2(26, 26)
	chip.size = Vector2(26, 26)
	chip.add_theme_stylebox_override("panel", UITheme.panel(swatch.darkened(0.6), swatch, 2))
	chip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	holder.add_child(chip)
	var name_label: Label = _label(name_text, UITheme.body(), 17, UITheme.TEXT)
	name_label.position = Vector2(38, 3)
	holder.add_child(name_label)
	var value: Label = _label("0", UITheme.body_bold(), 18, UITheme.ACCENT, HORIZONTAL_ALIGNMENT_RIGHT)
	value.position = Vector2(PANEL.x - 190, 3)
	value.size = Vector2(140, 22)
	holder.add_child(value)
	return [holder, value]

func _refresh() -> void:
	if not open:
		return
	if player == null or not is_instance_valid(player):
		player = get_tree().get_first_node_in_group("player")

	for child in slot_rows.get_children():
		child.queue_free()

	if GameState.carrying_log:
		slot_rows.add_child(_slot_row("Log", "Both hands. Take it to the chopping block.", UITheme.WOOD, true))
	elif player != null:
		var carried: Array = player.call("carried")
		var titles: Array = player.get("weapon_titles")
		var held: int = int(GameState.current_weapon)
		for id in carried:
			var index: int = int(id)
			var is_held: bool = index == held
			var note := "Stowed"
			if is_held:
				note = "In your hands"
			slot_rows.add_child(_slot_row(String(titles[index]), note, _tint_for(index), is_held))

	wood_value.text = "%d" % GameState.wood
	apple_value.text = "%d" % GameState.apples
	supply_value.text = "%d / %d" % [GameState.supplies_collected, GameState.SUPPLIES_TOTAL]

	var hunger: float = GameState.hunger
	hunger_fill.size.x = (PANEL.x - 50.0) * hunger
	if hunger > 0.5:
		hunger_fill.color = Color(0.72, 0.55, 0.24)
		hunger_text.text = "Fed"
	elif hunger > 0.22:
		hunger_fill.color = UITheme.WARN
		hunger_text.text = "Hungry"
	else:
		hunger_fill.color = UITheme.BAD
		hunger_text.text = "Starving"

	var health: float = clampf(float(GameState.player_health) / 100.0, 0.0, 1.0)
	condition_fill.size.x = (PANEL.x - 50.0) * health
	condition_text.text = "%d / 100" % GameState.player_health
	if health > 0.55:
		condition_fill.color = UITheme.GOOD
	elif health > 0.25:
		condition_fill.color = UITheme.WARN
	else:
		condition_fill.color = UITheme.BAD

	var left: int = GameState.days_until_horde()
	if left > 0:
		day_line.text = "DAY %d   ·   %d DAYS LEFT" % [GameState.day, left]
	else:
		day_line.text = "DAY %d   ·   THEY ARE HERE" % GameState.day

func _tint_for(index: int) -> Color:
	if index == 4:
		return Color(0.78, 0.58, 0.32)
	return Color(0.72, 0.55, 0.43)

func _slot_row(name_text: String, note: String, swatch: Color, highlighted: bool) -> Control:
	var box := PanelContainer.new()
	var border: Color = UITheme.LINE_SOFT
	if highlighted:
		border = UITheme.ACCENT_DIM
	box.add_theme_stylebox_override("panel", UITheme.panel(UITheme.BG, border, 2))
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var row: HBoxContainer = _row(10)
	box.add_child(row)
	var chip := Panel.new()
	chip.custom_minimum_size = Vector2(24, 24)
	chip.add_theme_stylebox_override("panel", UITheme.panel(swatch.darkened(0.6), swatch, 2))
	chip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(chip)
	var name_label: Label = _label(name_text, UITheme.display(), 18, UITheme.TEXT)
	name_label.custom_minimum_size = Vector2(180, 0)
	row.add_child(name_label)
	row.add_child(_label(note, UITheme.body_light(), 14, UITheme.TEXT_DIM))
	return box

func open_pack() -> void:
	open = true
	visible = true
	GameState.set_inventory_open(true)
	Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
	_refresh()
	panel.modulate.a = 0.0
	panel.scale = Vector2(0.98, 0.98)
	var tween: Tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(panel, "modulate:a", 1.0, 0.14)
	tween.tween_property(panel, "scale", Vector2.ONE, 0.16).set_ease(Tween.EASE_OUT)
	Sound.play_ui("ui_toggle", -10.0)

func close_pack() -> void:
	open = false
	visible = false
	GameState.set_inventory_open(false)
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _unhandled_input(event: InputEvent) -> void:
	if not open:
		return
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_TAB or event.keycode == KEY_I or event.keycode == KEY_ESCAPE:
			close_pack()
			get_viewport().set_input_as_handled()
		elif event.keycode == KEY_F:
			var eater: Node = get_tree().get_first_node_in_group("player")
			if eater != null:
				eater.call("eat_apple")
			get_viewport().set_input_as_handled()

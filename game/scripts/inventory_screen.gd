extends CanvasLayer

# The pack. Opens on Tab or I, and is the one place that shows everything you
# are carrying at once -- what is in your hands, every supply you have to your
# name, and how close you are to starving.
#
# Items are drawn rather than swatched. A coloured square next to the word
# "Axe" is a placeholder; a little axe is an inventory.

const PANEL := Vector2(680, 700)
const GEAR_ROW := 36.0
const GEAR_ROWS := 4
const CELL := Vector2(202, 82)

var root: Control
var panel: PanelContainer
var slot_rows: VBoxContainer
var grid: Control
var cells: Dictionary = {}
var hunger_fill: ColorRect
var hunger_text: Label
var condition_fill: ColorRect
var condition_text: Label
var day_line: Label
var carry_note: Label
var hint: Label
var open := false
var player: Node = null

func _ready() -> void:
	layer = 8
	add_to_group("inventory_screen")
	_build()
	visible = false
	GameState.apples_changed.connect(func(_c: int) -> void: _refresh())
	GameState.wood_changed.connect(func(_c: int) -> void: _refresh())
	GameState.hunger_changed.connect(func(_f: float) -> void: _refresh())
	GameState.health_changed.connect(func(_h: int) -> void: _refresh())
	GameState.coins_changed.connect(func(_c: int) -> void: _refresh())
	GameState.meat_changed.connect(func(_r: int, _c: int) -> void: _refresh())
	GameState.carry_changed.connect(func(_c: bool) -> void: _refresh())
	GameState.weapon_changed.connect(func(_i: int) -> void: _refresh())
	GameState.arrows_changed.connect(func(_c: int) -> void: _refresh())
	GameState.flint_changed.connect(func(_c: int) -> void: _refresh())

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
	# STOP so a click that misses a Place button is swallowed here rather than
	# reaching the player, who would take the mouse back and strand the pack.
	root.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(root)

	var dimmer: ColorRect = _rect(Color(0, 0, 0, 0.72), Vector2.ZERO)
	dimmer.set_anchors_preset(Control.PRESET_FULL_RECT)
	dimmer.mouse_filter = Control.MOUSE_FILTER_STOP
	root.add_child(dimmer)

	panel = PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UITheme.panel(Color(0.10, 0.10, 0.086, 0.98), UITheme.LINE, 3))
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.position = -PANEL * 0.5
	panel.custom_minimum_size = PANEL
	root.add_child(panel)

	var canvas := Control.new()
	canvas.custom_minimum_size = PANEL
	canvas.mouse_filter = Control.MOUSE_FILTER_PASS
	panel.add_child(canvas)

	var title: Label = _label("PACK", UITheme.display(), 26, UITheme.TEXT)
	title.position = Vector2(24, 8)
	canvas.add_child(title)

	day_line = _label("", UITheme.body(), 15, UITheme.ACCENT, HORIZONTAL_ALIGNMENT_RIGHT)
	day_line.position = Vector2(PANEL.x - 324, 14)
	day_line.size = Vector2(300, 20)
	canvas.add_child(day_line)

	var rule: ColorRect = _rect(UITheme.LINE_SOFT, Vector2(PANEL.x - 48, 1))
	rule.position = Vector2(24, 48)
	canvas.add_child(rule)

	canvas.add_child(_section("IN HAND", 64))
	carry_note = _label("", UITheme.body_light(), 13, UITheme.TEXT_FAINT, HORIZONTAL_ALIGNMENT_RIGHT)
	carry_note.position = Vector2(PANEL.x - 324, 66)
	carry_note.size = Vector2(300, 18)
	canvas.add_child(carry_note)

	slot_rows = VBoxContainer.new()
	slot_rows.add_theme_constant_override("separation", 4)
	slot_rows.position = Vector2(24, 88)
	slot_rows.custom_minimum_size = Vector2(PANEL.x - 48, 0)
	slot_rows.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.add_child(slot_rows)

	var supplies_y: float = 88.0 + GEAR_ROW * float(GEAR_ROWS) + 20.0
	canvas.add_child(_section("SUPPLIES", supplies_y))

	grid = Control.new()
	grid.position = Vector2(24, supplies_y + 22.0)
	grid.mouse_filter = Control.MOUSE_FILTER_PASS
	canvas.add_child(grid)

	# Two rows of three. Everything the world can hand you has a home here, so
	# an empty slot reads as "none yet" rather than the item not existing.
	_add_cell("wood", 0, 0, "Wood", "wood", UITheme.WOOD, "wood")
	_add_cell("apples", 1, 0, "Apples", "apple", Color(0.72, 0.20, 0.16))
	_add_cell("raw", 2, 0, "Raw meat", "meat_raw", Color(0.74, 0.32, 0.31))
	_add_cell("cooked", 3, 0, "Cooked meat", "meat_cooked", Color(0.60, 0.38, 0.22))
	_add_cell("arrows", 4, 0, "Arrows", "arrow", Color(0.70, 0.66, 0.58))
	_add_cell("flint", 5, 0, "Flint", "flint", Color(0.55, 0.57, 0.60), "flint")
	_add_cell("coins", 6, 0, "Coins", "coin", UITheme.ACCENT)

	# Three rows of slots now, not two. Worth deriving rather than hard-coding:
	# the last time this was a literal the condition bars slid off the panel the
	# moment a slot was added.
	var rows: int = int(ceil(float(cells.size()) / 3.0))
	var cond_y: float = supplies_y + 22.0 + CELL.y * float(rows) \
		+ 10.0 * float(maxi(rows - 1, 0)) + 18.0
	canvas.add_child(_section("CONDITION", cond_y))

	var hunger_label: Label = _label("Food", UITheme.body_light(), 15, UITheme.TEXT_DIM)
	hunger_label.position = Vector2(24, cond_y + 24.0)
	canvas.add_child(hunger_label)
	hunger_text = _label("", UITheme.body_bold(), 15, UITheme.TEXT, HORIZONTAL_ALIGNMENT_RIGHT)
	hunger_text.position = Vector2(PANEL.x - 204, cond_y + 24.0)
	hunger_text.size = Vector2(180, 18)
	canvas.add_child(hunger_text)
	var hunger_bar: Array = _bar(PANEL.x - 48, 12, Color(0.72, 0.55, 0.24))
	(hunger_bar[0] as Control).position = Vector2(24, cond_y + 46.0)
	hunger_fill = hunger_bar[1]
	canvas.add_child(hunger_bar[0])

	var health_label: Label = _label("Health", UITheme.body_light(), 15, UITheme.TEXT_DIM)
	health_label.position = Vector2(24, cond_y + 68.0)
	canvas.add_child(health_label)
	condition_text = _label("", UITheme.body_bold(), 15, UITheme.TEXT, HORIZONTAL_ALIGNMENT_RIGHT)
	condition_text.position = Vector2(PANEL.x - 204, cond_y + 68.0)
	condition_text.size = Vector2(180, 18)
	canvas.add_child(condition_text)
	var cond_bar: Array = _bar(PANEL.x - 48, 12, UITheme.GOOD)
	(cond_bar[0] as Control).position = Vector2(24, cond_y + 90.0)
	condition_fill = cond_bar[1]
	canvas.add_child(cond_bar[0])

	hint = _label("F  eat        Place  set an item down in front of you        TAB / I / ESC  close",
		UITheme.body_light(), 13, UITheme.TEXT_FAINT, HORIZONTAL_ALIGNMENT_CENTER)
	hint.position = Vector2(24, PANEL.y - 30)
	hint.size = Vector2(PANEL.x - 48, 18)
	canvas.add_child(hint)

func _section(text: String, y: float) -> Label:
	var l: Label = _label(text, UITheme.body_light(), 13, UITheme.TEXT_FAINT)
	l.position = Vector2(24, y)
	return l

# One supply slot: icon, name, and a big count that greys out at zero.
func _add_cell(id: String, index: int, _unused: int, name_text: String, icon: String,
		tint: Color, placeable: String = "") -> void:
	var col: int = index % 3
	var row: int = index / 3
	var holder := Control.new()
	holder.position = Vector2(float(col) * (CELL.x + 12.0), float(row) * (CELL.y + 10.0))
	holder.custom_minimum_size = CELL
	holder.size = CELL
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	grid.add_child(holder)

	var back := Panel.new()
	back.add_theme_stylebox_override("panel", UITheme.panel(Color(0.07, 0.075, 0.065, 0.95), UITheme.LINE_SOFT, 2))
	back.set_anchors_preset(Control.PRESET_FULL_RECT)
	back.mouse_filter = Control.MOUSE_FILTER_IGNORE
	holder.add_child(back)

	var icon_node := ItemIcon.new(icon, tint, 44.0)
	icon_node.position = Vector2(12, 18)
	holder.add_child(icon_node)

	var name_label: Label = _label(name_text, UITheme.body(), 15, UITheme.TEXT_DIM)
	name_label.position = Vector2(66, 16)
	name_label.size = Vector2(CELL.x - 78, 18)
	holder.add_child(name_label)

	var value: Label = _label("0", UITheme.display(), 26, UITheme.TEXT)
	value.position = Vector2(66, 36)
	value.size = Vector2(CELL.x - 78, 32)
	holder.add_child(value)

	# Anything that can be set down in the world gets a button that closes the
	# pack and hands you a ghost to place it with, rather than a drop that
	# leaves the thing wherever your feet happen to be.
	var place_button: Button = null
	if placeable != "":
		place_button = Button.new()
		place_button.text = "Place"
		place_button.theme = UITheme.menu_theme()
		place_button.position = Vector2(CELL.x - 74, CELL.y - 34)
		place_button.custom_minimum_size = Vector2(62, 26)
		place_button.size = Vector2(62, 26)
		place_button.add_theme_font_size_override("font_size", 13)
		place_button.pressed.connect(func() -> void: _place(placeable))
		holder.add_child(place_button)
		holder.mouse_filter = Control.MOUSE_FILTER_PASS

	cells[id] = {"value": value, "icon": icon_node, "name": name_label, "back": back,
		"place": place_button}

# Hands the item to the builder's ghost and gets out of the way.
func _place(item: String) -> void:
	var builder: Node = get_tree().get_first_node_in_group("builder")
	if builder == null:
		return
	close_pack()
	builder.call("begin_placing", item)

func _set_cell(id: String, text: String, filled: bool) -> void:
	var cell: Dictionary = cells[id]
	var value: Label = cell["value"]
	var icon_node: Control = cell["icon"]
	var back: Panel = cell["back"]
	value.text = text
	# An empty slot stays legible but clearly reads as empty.
	value.add_theme_color_override("font_color", UITheme.TEXT if filled else UITheme.TEXT_FAINT)
	icon_node.modulate.a = 1.0 if filled else 0.28
	var place_button: Variant = cell.get("place")
	if place_button != null:
		(place_button as Button).disabled = not filled
	back.add_theme_stylebox_override("panel", UITheme.panel(
		Color(0.09, 0.10, 0.085, 0.95) if filled else Color(0.06, 0.065, 0.058, 0.95),
		UITheme.LINE if filled else UITheme.LINE_SOFT, 2))

func _icon_for(index: int) -> String:
	match index:
		5:
			return "bow"
		0:
			return "rifle"
		1:
			return "pistol"
		2:
			return "knife"
		4:
			return "axe"
		_:
			return "hands"

func _refresh() -> void:
	if not open:
		return
	if player == null or not is_instance_valid(player):
		player = get_tree().get_first_node_in_group("player")

	for child in slot_rows.get_children():
		child.queue_free()

	var rows: int = 0
	if GameState.carrying_log:
		slot_rows.add_child(_slot_row("Log", "Both hands. Take it to the chopping block.",
			"log", UITheme.WOOD, true))
		rows += 1
		carry_note.text = "Hands full"
	else:
		carry_note.text = ""
		if player != null:
			var carried: Array = player.call("carried")
			var titles: Array = player.get("weapon_titles")
			var held: int = int(GameState.current_weapon)
			for id in carried:
				var index: int = int(id)
				var is_held: bool = index == held
				slot_rows.add_child(_slot_row(String(titles[index]),
					"In your hands" if is_held else "Stowed",
					_icon_for(index), _tint_for(index), is_held))
				rows += 1

	_set_cell("wood", "%d" % GameState.wood, GameState.wood > 0)
	_set_cell("apples", "%d" % GameState.apples, GameState.apples > 0)
	_set_cell("raw", "%d" % GameState.raw_meat, GameState.raw_meat > 0)
	_set_cell("cooked", "%d" % GameState.cooked_meat, GameState.cooked_meat > 0)
	_set_cell("arrows", "%d" % GameState.arrows, GameState.arrows > 0)
	_set_cell("flint", "%d" % GameState.flint, GameState.flint > 0)
	_set_cell("coins", "%d" % GameState.coins, GameState.coins > 0)

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
	return Color(0.72, 0.62, 0.52)

func _slot_row(name_text: String, note: String, icon: String, swatch: Color, highlighted: bool) -> Control:
	var box := PanelContainer.new()
	box.custom_minimum_size = Vector2(0, GEAR_ROW - 4.0)
	box.add_theme_stylebox_override("panel", UITheme.panel(
		Color(0.09, 0.10, 0.085, 0.95) if highlighted else UITheme.BG,
		UITheme.ACCENT_DIM if highlighted else UITheme.LINE_SOFT, 2))
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var row: HBoxContainer = _row(10)
	box.add_child(row)
	row.add_child(ItemIcon.new(icon, swatch, 24.0))
	var name_label: Label = _label(name_text, UITheme.display(), 18, UITheme.TEXT)
	name_label.custom_minimum_size = Vector2(200, 0)
	row.add_child(name_label)
	row.add_child(_label(note, UITheme.body_light(), 14,
		UITheme.ACCENT if highlighted else UITheme.TEXT_DIM))
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
	Sound.play_ui("ui_open", -9.0)

func close_pack() -> void:
	open = false
	visible = false
	GameState.set_inventory_open(false)
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _unhandled_input(event: InputEvent) -> void:
	if not open:
		return
	if event is InputEventKey and event.pressed:
		# Tab, I and E are the player's toggle keys and get consumed there.
		if event.keycode == KEY_ESCAPE:
			close_pack()
			get_viewport().set_input_as_handled()
		elif event.keycode == KEY_F:
			var eater: Node = get_tree().get_first_node_in_group("player")
			if eater != null:
				eater.call("eat_apple")
			get_viewport().set_input_as_handled()

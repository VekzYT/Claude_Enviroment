extends CanvasLayer

# The pack. Opens on Tab or I, and is the one place that shows everything you
# are carrying at once -- what is in your hands, every supply you have picked
# up, and how close you are to starving.
#
# Items are drawn rather than swatched. A coloured square next to the word
# "Axe" is a placeholder; a little axe is an inventory.

const PANEL := Vector2(680, 620)
const GEAR_ROW := 36.0
const GEAR_ROWS := 4
const CELL := Vector2(202, 82)

# A hand-drawn item glyph. Everything is expressed as a fraction of the box so
# the same icon works at 24px in a gear row and at 40px in a supply slot.
class ItemIcon extends Control:
	var kind: String = "crate"
	var tint: Color = Color(0.8, 0.8, 0.8)

	func _init(k: String, t: Color, s: float) -> void:
		kind = k
		tint = t
		custom_minimum_size = Vector2(s, s)
		size = Vector2(s, s)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _p(x: float, y: float) -> Vector2:
		var s: float = minf(size.x, size.y)
		return Vector2(x * s, y * s)

	func _poly(pts: Array, c: Color) -> void:
		var out := PackedVector2Array()
		for pt in pts:
			out.append(_p(pt[0], pt[1]))
		draw_colored_polygon(out, c)

	func _stroke(a: Array, b: Array, c: Color, w: float) -> void:
		var s: float = minf(size.x, size.y)
		draw_line(_p(a[0], a[1]), _p(b[0], b[1]), c, w * s, true)

	func _draw() -> void:
		var s: float = minf(size.x, size.y)
		var dark: Color = tint.darkened(0.55)
		var light: Color = tint.lightened(0.3)
		var steel := Color(0.72, 0.75, 0.79)
		var wood := Color(0.46, 0.33, 0.20)
		match kind:
			"axe":
				_poly([[0.34, 0.90], [0.44, 0.90], [0.66, 0.22], [0.56, 0.20]], wood)
				_poly([[0.58, 0.10], [0.86, 0.20], [0.80, 0.44], [0.50, 0.32]], steel.darkened(0.25))
				_poly([[0.80, 0.16], [0.88, 0.21], [0.82, 0.42], [0.75, 0.39]], steel)
			"knife":
				_poly([[0.30, 0.86], [0.42, 0.86], [0.44, 0.60], [0.32, 0.60]], wood)
				_poly([[0.32, 0.60], [0.44, 0.60], [0.62, 0.14], [0.40, 0.30]], steel)
			"rifle":
				_poly([[0.08, 0.62], [0.86, 0.44], [0.88, 0.54], [0.10, 0.72]], Color(0.28, 0.24, 0.21))
				_poly([[0.08, 0.62], [0.30, 0.57], [0.34, 0.84], [0.14, 0.80]], wood)
				draw_rect(Rect2(_p(0.44, 0.34), Vector2(0.26 * s, 0.10 * s)), steel.darkened(0.3))
			"pistol":
				_poly([[0.16, 0.40], [0.84, 0.40], [0.84, 0.54], [0.16, 0.54]], Color(0.26, 0.26, 0.28))
				_poly([[0.24, 0.54], [0.44, 0.54], [0.38, 0.86], [0.20, 0.86]], Color(0.20, 0.20, 0.22))
			"hands":
				_poly([[0.14, 0.82], [0.14, 0.44], [0.24, 0.28], [0.34, 0.44], [0.34, 0.82]], tint)
				_poly([[0.50, 0.82], [0.50, 0.40], [0.62, 0.24], [0.74, 0.40], [0.74, 0.82]], light)
			"log":
				_poly([[0.20, 0.34], [0.80, 0.34], [0.80, 0.68], [0.20, 0.68]], wood)
				draw_circle(_p(0.80, 0.51), 0.17 * s, wood.lightened(0.18))
				draw_circle(_p(0.80, 0.51), 0.09 * s, wood.darkened(0.3))
				_stroke([0.30, 0.44], [0.68, 0.44], wood.darkened(0.35), 0.035)
			"apple":
				draw_circle(_p(0.44, 0.60), 0.26 * s, tint)
				draw_circle(_p(0.60, 0.60), 0.24 * s, tint.darkened(0.12))
				_stroke([0.52, 0.36], [0.55, 0.20], Color(0.32, 0.24, 0.14), 0.045)
				_poly([[0.55, 0.24], [0.74, 0.16], [0.66, 0.32]], Color(0.32, 0.52, 0.24))
			"meat_raw":
				_poly([[0.22, 0.60], [0.30, 0.34], [0.62, 0.28], [0.76, 0.50],
					[0.66, 0.76], [0.34, 0.78]], tint)
				draw_circle(_p(0.46, 0.54), 0.11 * s, light)
				_poly([[0.66, 0.72], [0.84, 0.80], [0.78, 0.88], [0.62, 0.80]], Color(0.90, 0.88, 0.82))
			"meat_cooked":
				_poly([[0.22, 0.60], [0.30, 0.34], [0.62, 0.28], [0.76, 0.50],
					[0.66, 0.76], [0.34, 0.78]], dark)
				_stroke([0.32, 0.44], [0.62, 0.38], Color(0.14, 0.10, 0.08), 0.05)
				_stroke([0.34, 0.60], [0.68, 0.54], Color(0.14, 0.10, 0.08), 0.05)
				_poly([[0.66, 0.72], [0.84, 0.80], [0.78, 0.88], [0.62, 0.80]], Color(0.86, 0.84, 0.78))
			"wood":
				_poly([[0.16, 0.78], [0.30, 0.26], [0.40, 0.28], [0.28, 0.80]], wood)
				_poly([[0.44, 0.80], [0.56, 0.24], [0.66, 0.26], [0.56, 0.82]], wood.lightened(0.15))
				_poly([[0.66, 0.78], [0.78, 0.32], [0.86, 0.36], [0.76, 0.80]], wood.darkened(0.2))
			_:
				draw_rect(Rect2(_p(0.18, 0.26), Vector2(0.64 * s, 0.52 * s)), tint.darkened(0.4))
				draw_rect(Rect2(_p(0.18, 0.26), Vector2(0.64 * s, 0.52 * s)), tint, false, 0.035 * s)
				_stroke([0.18, 0.26], [0.82, 0.78], tint, 0.035)
				_stroke([0.82, 0.26], [0.18, 0.78], tint, 0.035)

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
	GameState.supply_collected.connect(func(_c: int, _t: int) -> void: _refresh())
	GameState.meat_changed.connect(func(_r: int, _c: int) -> void: _refresh())
	GameState.carry_changed.connect(func(_c: bool) -> void: _refresh())
	GameState.weapon_changed.connect(func(_i: int) -> void: _refresh())

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
	grid.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.add_child(grid)

	# Two rows of three. Everything the world can hand you has a home here, so
	# an empty slot reads as "none yet" rather than the item not existing.
	_add_cell("wood", 0, 0, "Wood", "wood", UITheme.WOOD)
	_add_cell("apples", 1, 0, "Apples", "apple", Color(0.72, 0.20, 0.16))
	_add_cell("raw", 2, 0, "Raw meat", "meat_raw", Color(0.74, 0.32, 0.31))
	_add_cell("cooked", 3, 0, "Cooked meat", "meat_cooked", Color(0.60, 0.38, 0.22))
	_add_cell("log", 4, 0, "Log", "log", UITheme.WOOD)
	_add_cell("supplies", 5, 0, "Supply caches", "crate", UITheme.GOOD)

	var cond_y: float = supplies_y + 22.0 + CELL.y * 2.0 + 10.0 + 18.0
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

	hint = _label("F  eat the best food you have        TAB / I / ESC  close",
		UITheme.body_light(), 13, UITheme.TEXT_FAINT, HORIZONTAL_ALIGNMENT_CENTER)
	hint.position = Vector2(24, PANEL.y - 30)
	hint.size = Vector2(PANEL.x - 48, 18)
	canvas.add_child(hint)

func _section(text: String, y: float) -> Label:
	var l: Label = _label(text, UITheme.body_light(), 13, UITheme.TEXT_FAINT)
	l.position = Vector2(24, y)
	return l

# One supply slot: icon, name, and a big count that greys out at zero.
func _add_cell(id: String, index: int, _unused: int, name_text: String, icon: String, tint: Color) -> void:
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

	cells[id] = {"value": value, "icon": icon_node, "name": name_label, "back": back}

func _set_cell(id: String, text: String, filled: bool) -> void:
	var cell: Dictionary = cells[id]
	var value: Label = cell["value"]
	var icon_node: Control = cell["icon"]
	var back: Panel = cell["back"]
	value.text = text
	# An empty slot stays legible but clearly reads as empty.
	value.add_theme_color_override("font_color", UITheme.TEXT if filled else UITheme.TEXT_FAINT)
	icon_node.modulate.a = 1.0 if filled else 0.28
	back.add_theme_stylebox_override("panel", UITheme.panel(
		Color(0.09, 0.10, 0.085, 0.95) if filled else Color(0.06, 0.065, 0.058, 0.95),
		UITheme.LINE if filled else UITheme.LINE_SOFT, 2))

func _icon_for(index: int) -> String:
	match index:
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
	_set_cell("log", "1" if GameState.carrying_log else "0", GameState.carrying_log)
	_set_cell("supplies", "%d / %d" % [GameState.supplies_collected, GameState.SUPPLIES_TOTAL],
		GameState.supplies_collected > 0)

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
		# Tab, I and E are the player's toggle keys and get consumed there.
		if event.keycode == KEY_ESCAPE:
			close_pack()
			get_viewport().set_input_as_handled()
		elif event.keycode == KEY_F:
			var eater: Node = get_tree().get_first_node_in_group("player")
			if eater != null:
				eater.call("eat_apple")
			get_viewport().set_input_as_handled()

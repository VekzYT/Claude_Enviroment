extends CanvasLayer

# The pedlar's pack. Two columns: what he will take off you on the left, what
# he will sell you on the right.
#
# Unlike the map and the pack, this one is clicked rather than keyed, so it uses
# real Buttons and leaves the mouse visible. Every row re-evaluates itself after
# each transaction, so a row you can no longer afford greys out immediately
# instead of letting you press a button that quietly does nothing.

const PANEL := Vector2(860, 600)
const ROW := Vector2(376, 62)

# What he pays. Cooked meat is worth more than raw because she does not have
# to do anything with it.
const SELL_TABLE := [
	{"id": "wood", "name": "Wood", "icon": "wood", "price": 3,
		"tint": Color(0.62, 0.46, 0.26)},
	{"id": "raw", "name": "Raw meat", "icon": "meat_raw", "price": 6,
		"tint": Color(0.74, 0.32, 0.31)},
	{"id": "cooked", "name": "Cooked meat", "icon": "meat_cooked", "price": 11,
		"tint": Color(0.60, 0.38, 0.22)},
	{"id": "apple", "name": "Apples", "icon": "apple", "price": 2,
		"tint": Color(0.72, 0.20, 0.16)},
]

# What he carries. Each is something you cannot make for yourself.
const BUY_TABLE := [
	{"id": "bow", "name": "Hunting bow", "icon": "bow", "price": 70,
		"tint": Color(0.66, 0.50, 0.30),
		"note": "The only way to take a hare. Press 4 to draw it."},
	{"id": "arrows", "name": "Arrows  ×6", "icon": "arrow", "price": 14,
		"tint": Color(0.70, 0.66, 0.58),
		"note": "You can pull them back out of whatever you hit."},
	{"id": "lamp", "name": "Oil lamp", "icon": "lamp", "price": 45,
		"tint": Color(0.92, 0.78, 0.42),
		"note": "Press L for light. Everything in the forest sees you coming."},
]
const ARROW_BUNDLE := 6

var root: Control
var panel: PanelContainer
var coin_label: Label
var sell_rows: Dictionary = {}
var buy_rows: Dictionary = {}
var note: Label
var open := false

func _ready() -> void:
	layer = 9
	add_to_group("trade_screen")
	_build()
	visible = false
	GameState.coins_changed.connect(func(_c: int) -> void: _refresh())
	GameState.wood_changed.connect(func(_c: int) -> void: _refresh())
	GameState.meat_changed.connect(func(_r: int, _c: int) -> void: _refresh())
	GameState.apples_changed.connect(func(_c: int) -> void: _refresh())
	GameState.arrows_changed.connect(func(_c: int) -> void: _refresh())
	GameState.flashlight_acquired.connect(func() -> void: _refresh())

func _label(text: String, font: Font, size: int, colour: Color,
		align: int = HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", colour)
	l.horizontal_alignment = align
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

func _rect(colour: Color) -> ColorRect:
	var r := ColorRect.new()
	r.color = colour
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r

func _build() -> void:
	root = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	# STOP, not IGNORE: the backdrop has to swallow clicks that miss a button.
	# Anything that falls through reaches the player, who takes the mouse back
	# and leaves the stall open but dead.
	root.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(root)

	var dimmer: ColorRect = _rect(Color(0, 0, 0, 0.74))
	dimmer.set_anchors_preset(Control.PRESET_FULL_RECT)
	dimmer.mouse_filter = Control.MOUSE_FILTER_STOP
	root.add_child(dimmer)

	panel = PanelContainer.new()
	panel.add_theme_stylebox_override("panel",
		UITheme.panel(Color(0.10, 0.10, 0.086, 0.98), UITheme.LINE, 3))
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.position = -PANEL * 0.5
	panel.custom_minimum_size = PANEL
	root.add_child(panel)

	var canvas := Control.new()
	canvas.custom_minimum_size = PANEL
	canvas.mouse_filter = Control.MOUSE_FILTER_PASS
	panel.add_child(canvas)

	var title: Label = _label("TOMAS  ·  PEDLAR", UITheme.display(), 24, UITheme.TEXT)
	title.position = Vector2(28, 12)
	canvas.add_child(title)

	coin_label = _label("", UITheme.display(), 24, UITheme.ACCENT, HORIZONTAL_ALIGNMENT_RIGHT)
	coin_label.position = Vector2(PANEL.x - 288, 12)
	coin_label.size = Vector2(260, 30)
	canvas.add_child(coin_label)

	var rule: ColorRect = _rect(UITheme.LINE_SOFT)
	rule.position = Vector2(28, 52)
	rule.size = Vector2(PANEL.x - 56, 1)
	canvas.add_child(rule)

	var left: Label = _label("HE BUYS", UITheme.body_light(), 13, UITheme.TEXT_FAINT)
	left.position = Vector2(28, 68)
	canvas.add_child(left)
	var right: Label = _label("HE SELLS", UITheme.body_light(), 13, UITheme.TEXT_FAINT)
	right.position = Vector2(PANEL.x * 0.5 + 14, 68)
	canvas.add_child(right)

	# A divider, so the two halves read as two halves.
	var split: ColorRect = _rect(UITheme.LINE_SOFT)
	split.position = Vector2(PANEL.x * 0.5 - 1, 68)
	split.size = Vector2(1, 420)
	canvas.add_child(split)

	for i in SELL_TABLE.size():
		var entry: Dictionary = SELL_TABLE[i]
		var row: Dictionary = _make_row(canvas,
			Vector2(28, 94 + float(i) * (ROW.y + 10.0)),
			String(entry["name"]), String(entry["icon"]), Color(entry["tint"]),
			"Sell")
		row["price"] = int(entry["price"])
		var id: String = String(entry["id"])
		(row["button"] as Button).pressed.connect(func() -> void: _sell(id))
		sell_rows[id] = row

	for i in BUY_TABLE.size():
		var item: Dictionary = BUY_TABLE[i]
		var row: Dictionary = _make_row(canvas,
			Vector2(PANEL.x * 0.5 + 14, 94 + float(i) * (ROW.y + 10.0)),
			String(item["name"]), String(item["icon"]), Color(item["tint"]), "Buy")
		row["price"] = int(item["price"])
		var id: String = String(item["id"])
		(row["button"] as Button).pressed.connect(func() -> void: _buy(id))
		buy_rows[id] = row

	note = _label("", UITheme.body_light(), 14, UITheme.TEXT_DIM)
	note.position = Vector2(PANEL.x * 0.5 + 14, 94 + (ROW.y + 10.0) * 3.0 + 8.0)
	note.size = Vector2(ROW.x, 92)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	canvas.add_child(note)

	var close := Button.new()
	close.text = "Done"
	close.theme = UITheme.menu_theme()
	close.position = Vector2(PANEL.x * 0.5 - 70, PANEL.y - 62)
	close.custom_minimum_size = Vector2(140, 40)
	close.size = Vector2(140, 40)
	close.pressed.connect(close_trade)
	canvas.add_child(close)

	var hint: Label = _label("E or ESC  close", UITheme.body_light(), 13, UITheme.TEXT_FAINT,
		HORIZONTAL_ALIGNMENT_CENTER)
	hint.position = Vector2(28, PANEL.y - 22)
	hint.size = Vector2(PANEL.x - 56, 18)
	canvas.add_child(hint)

# One trade line: icon, name, what you have or what it costs, and a button.
func _make_row(parent: Control, at: Vector2, name_text: String, icon: String,
		tint: Color, verb: String) -> Dictionary:
	var holder := Control.new()
	holder.position = at
	holder.custom_minimum_size = ROW
	holder.size = ROW
	holder.mouse_filter = Control.MOUSE_FILTER_PASS
	parent.add_child(holder)

	var back := Panel.new()
	back.add_theme_stylebox_override("panel",
		UITheme.panel(Color(0.07, 0.075, 0.065, 0.95), UITheme.LINE_SOFT, 2))
	back.set_anchors_preset(Control.PRESET_FULL_RECT)
	back.mouse_filter = Control.MOUSE_FILTER_IGNORE
	holder.add_child(back)

	# Reuses the pack's drawn glyphs, so an arrow looks the same in the shop as
	# it does in your bag.
	var icon_node := ItemIcon.new(icon, tint, 38.0)
	icon_node.position = Vector2(12, 12)
	holder.add_child(icon_node)

	var name_label: Label = _label(name_text, UITheme.body(), 16, UITheme.TEXT)
	name_label.position = Vector2(60, 9)
	name_label.size = Vector2(200, 20)
	holder.add_child(name_label)

	var detail: Label = _label("", UITheme.body_light(), 13, UITheme.TEXT_DIM)
	detail.position = Vector2(60, 31)
	detail.size = Vector2(200, 18)
	holder.add_child(detail)

	var button := Button.new()
	button.text = verb
	button.theme = UITheme.menu_theme()
	button.position = Vector2(ROW.x - 102, 13)
	button.custom_minimum_size = Vector2(90, 36)
	button.size = Vector2(90, 36)
	holder.add_child(button)

	return {"holder": holder, "back": back, "icon": icon_node,
		"name": name_label, "detail": detail, "button": button}

func _held(id: String) -> int:
	match id:
		"wood":
			return GameState.wood
		"raw":
			return GameState.raw_meat
		"cooked":
			return GameState.cooked_meat
		"apple":
			return GameState.apples
	return 0

func _take(id: String) -> void:
	match id:
		"wood":
			GameState.add_wood(-1)
		"raw":
			GameState.add_raw_meat(-1)
		"cooked":
			GameState.add_cooked_meat(-1)
		"apple":
			GameState.add_apples(-1)

func _sell(id: String) -> void:
	if _held(id) <= 0:
		return
	var row: Dictionary = sell_rows[id]
	var price: int = int(row["price"])
	_take(id)
	GameState.add_coins(price)
	Sound.play_ui("ui_buy", -8.0)
	note.text = "Sold for %d coins." % price
	_refresh()

# One place that handles every purchase, so a new line of stock is a row in
# BUY_TABLE rather than another near-copy of this function.
func _buy(id: String) -> void:
	var item: Dictionary = _buy_entry(id)
	if item.is_empty() or _already_owned(id):
		return
	if not GameState.spend_coins(int(item["price"])):
		return
	match id:
		"bow":
			GameState.give_bow()
		"arrows":
			GameState.add_arrows(ARROW_BUNDLE)
		"lamp":
			GameState.give_flashlight()
	Sound.play_ui("ui_buy", -5.0)
	note.text = String(item["note"])
	_refresh()

func _buy_entry(id: String) -> Dictionary:
	for item in BUY_TABLE:
		if String(item["id"]) == id:
			return item
	return {}

# Arrows restock; the bow and the lamp are bought once.
func _already_owned(id: String) -> bool:
	match id:
		"bow":
			return GameState.bow_owned
		"lamp":
			return GameState.flashlight_owned
	return false

# Greys a row out and turns its button off in one place, so a disabled row
# always looks disabled.
func _set_row(row: Dictionary, detail_text: String, enabled: bool) -> void:
	(row["detail"] as Label).text = detail_text
	var button: Button = row["button"]
	button.disabled = not enabled
	(row["icon"] as Control).modulate.a = 1.0 if enabled else 0.3
	(row["name"] as Label).add_theme_color_override("font_color",
		UITheme.TEXT if enabled else UITheme.TEXT_FAINT)
	(row["back"] as Panel).add_theme_stylebox_override("panel", UITheme.panel(
		Color(0.09, 0.10, 0.085, 0.95) if enabled else Color(0.06, 0.065, 0.058, 0.95),
		UITheme.LINE if enabled else UITheme.LINE_SOFT, 2))

func _refresh() -> void:
	if not open:
		return
	coin_label.text = "%d COINS" % GameState.coins

	for entry in SELL_TABLE:
		var id: String = String(entry["id"])
		var have: int = _held(id)
		_set_row(sell_rows[id], "You have %d  ·  %d each" % [have, int(entry["price"])], have > 0)

	for item in BUY_TABLE:
		var id: String = String(item["id"])
		var row: Dictionary = buy_rows[id]
		var price: int = int(item["price"])
		if _already_owned(id):
			_set_row(row, "Already yours", false)
			(row["button"] as Button).text = "Bought"
			continue
		var detail: String = "%d coins" % price
		if id == "arrows":
			detail = "%d coins  ·  you have %d" % [price, GameState.arrows]
		_set_row(row, detail, GameState.can_afford(price))

func open_trade() -> void:
	open = true
	visible = true
	GameState.set_trade_open(true)
	Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
	if note.text == "":
		note.text = "Wood and meat both fetch coin. He is gone on day 10."
	_refresh()
	panel.modulate.a = 0.0
	panel.scale = Vector2(0.98, 0.98)
	var tween: Tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(panel, "modulate:a", 1.0, 0.14)
	tween.tween_property(panel, "scale", Vector2.ONE, 0.16).set_ease(Tween.EASE_OUT)
	Sound.play_ui("ui_open", -9.0)

func close_trade() -> void:
	open = false
	visible = false
	GameState.set_trade_open(false)
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _unhandled_input(event: InputEvent) -> void:
	if not open:
		return
	if event is InputEventKey and event.pressed:
		# ESC only. E is the player's key: the player sits later in the scene and
		# is offered input first, so it opens the stall and then this handler saw
		# the same press, found the stall open, and shut it again in one
		# keystroke. Exactly what the map and the pack used to do.
		if event.keycode == KEY_ESCAPE:
			close_trade()
			get_viewport().set_input_as_handled()

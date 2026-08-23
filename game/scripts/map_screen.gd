extends CanvasLayer

# The map you find on the cabin table. Drawn rather than painted: the roads,
# mountains and markers all come from the same coordinates the world is built
# from, so the map cannot go stale when the terrain changes.

const WORLD_HALF := 200.0
const PANEL := Vector2(760, 640)

# Every place worth walking to, mirroring terrain.gd's POI list. `trade` marks
# the ones with people still living in them.
const PLACES := [
	{"name": "Home", "at": Vector2(-14, 4), "trade": false, "label_left": true,
		"note": "Your cabin. Chopping block outside."},
	{"name": "Survivor Camp", "at": Vector2(0, 0), "trade": false,
		"note": "Abandoned. Picked over already."},
	{"name": "Ranger Watchtower", "at": Vector2(-40, -130), "trade": true,
		"note": "A ranger holds the tower. Trades rope and tools."},
	{"name": "Abandoned Cabin", "at": Vector2(95, -85), "trade": false,
		"note": "Empty. Worth a look for tinned food."},
	{"name": "Crashed Convoy", "at": Vector2(130, 40), "trade": true,
		"note": "Two survivors camped in the wrecks. Fuel and ammunition."},
	{"name": "Chapel Ruins", "at": Vector2(-120, 95), "trade": true,
		"note": "A dozen people sheltering. Medicine, and news."},
	{"name": "Radio Tower", "at": Vector2(-150, -30), "trade": false,
		"note": "Still transmitting. Nobody answers."},
	{"name": "The Graves", "at": Vector2(30, 140), "trade": false,
		"note": "Fresh ones. Somebody was still burying people."},
	{"name": "Blackwater Pond", "at": Vector2(60, -30), "trade": false,
		"note": "Fresh water. The only source marked."},
	{"name": "Rocky Lookout", "at": Vector2(-90, -95), "trade": false,
		"note": "High ground. You can see the whole valley."},
]

const ROADS := [
	[Vector2(0, 0), Vector2(130, 40)],
	[Vector2(0, 0), Vector2(-120, 95)],
	[Vector2(0, 0), Vector2(-40, -130)],
	[Vector2(0, 0), Vector2(60, -30)],
	[Vector2(60, -30), Vector2(95, -85)],
	[Vector2(-40, -130), Vector2(-150, -30)],
	[Vector2(0, 0), Vector2(30, 140)],
]

const MOUNTAINS := [
	{"at": Vector2(-150, -150), "r": 78.0},
	{"at": Vector2(150, -120), "r": 62.0},
	{"at": Vector2(120, 150), "r": 76.0},
	{"at": Vector2(-160, 130), "r": 64.0},
]

var root: Control
var panel: PanelContainer
var canvas: Control
var player_marker: Control
var detail_name: Label
var detail_note: Label
var day_line: Label
var markers: Array = []
var player: Node3D = null
var open := false

func _ready() -> void:
	layer = 8
	_build()
	visible = false
	GameState.landmark_discovered.connect(_on_discovered)

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

# World XZ metres to a position inside the drawing area.
func _to_map(at: Vector2) -> Vector2:
	var inset := 26.0
	var span: float = PANEL.x - inset * 2.0
	var u: float = (at.x + WORLD_HALF) / (WORLD_HALF * 2.0)
	var v: float = (at.y + WORLD_HALF) / (WORLD_HALF * 2.0)
	return Vector2(inset + u * span, inset + v * (PANEL.y - 150.0 - inset))

func _build() -> void:
	root = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	var dimmer := _rect(Color(0, 0, 0, 0.72), Vector2.ZERO)
	dimmer.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(dimmer)

	panel = PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UITheme.panel(Color(0.10, 0.10, 0.086, 0.98), UITheme.LINE, 3))
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.position = -PANEL * 0.5
	panel.custom_minimum_size = PANEL
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(panel)

	canvas = Control.new()
	canvas.name = "Canvas"
	canvas.custom_minimum_size = PANEL
	canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	panel.add_child(canvas)

	var title: Label = _label("THE VALLEY", UITheme.display(), 26, UITheme.TEXT)
	title.position = Vector2(24, 8)
	canvas.add_child(title)

	day_line = _label("", UITheme.body(), 16, UITheme.ACCENT, HORIZONTAL_ALIGNMENT_RIGHT)
	day_line.position = Vector2(PANEL.x - 320, 14)
	day_line.size = Vector2(296, 20)
	canvas.add_child(day_line)

	_draw_mountains()
	_draw_roads()
	_draw_places()
	_draw_player()
	_draw_legend()

func _draw_mountains() -> void:
	for m in MOUNTAINS:
		var centre: Vector2 = _to_map(m["at"])
		# Concentric rings stand in for contour lines: cheap, and it reads as a
		# hand-drawn survey rather than a filled blob.
		for ring in 3:
			var r: float = float(m["r"]) * (0.45 + ring * 0.28) * (PANEL.x - 52.0) / (WORLD_HALF * 2.0)
			var ring_node := Panel.new()
			var style := StyleBoxFlat.new()
			style.bg_color = Color(0, 0, 0, 0)
			style.border_color = Color(0.36, 0.38, 0.32, 0.55 - ring * 0.13)
			style.set_border_width_all(1)
			style.set_corner_radius_all(int(r))
			ring_node.add_theme_stylebox_override("panel", style)
			ring_node.position = centre - Vector2(r, r)
			ring_node.size = Vector2(r * 2.0, r * 2.0)
			ring_node.mouse_filter = Control.MOUSE_FILTER_IGNORE
			canvas.add_child(ring_node)

func _draw_roads() -> void:
	for road in ROADS:
		var a: Vector2 = _to_map(road[0])
		var b: Vector2 = _to_map(road[1])
		var delta: Vector2 = b - a
		var line: ColorRect = _rect(Color(0.42, 0.34, 0.22, 0.75), Vector2(delta.length(), 2.0))
		line.position = a
		line.pivot_offset = Vector2(0, 1)
		line.rotation = delta.angle()
		canvas.add_child(line)

func _draw_places() -> void:
	for i in PLACES.size():
		var place: Dictionary = PLACES[i]
		var at: Vector2 = _to_map(place["at"])
		var is_trade: bool = bool(place["trade"])

		var pip := Panel.new()
		var style := StyleBoxFlat.new()
		style.bg_color = UITheme.ACCENT if is_trade else Color(0.55, 0.58, 0.50)
		style.set_corner_radius_all(5)
		style.border_color = Color(0.06, 0.07, 0.05)
		style.set_border_width_all(1)
		pip.add_theme_stylebox_override("panel", style)
		pip.size = Vector2(10, 10)
		pip.position = at - Vector2(5, 5)
		pip.mouse_filter = Control.MOUSE_FILTER_IGNORE
		canvas.add_child(pip)

		var text: String = place["name"]
		if is_trade:
			text += "  ·  TRADE"
		var label_colour: Color = UITheme.TEXT_DIM
		if is_trade:
			label_colour = UITheme.ACCENT
		var name_label: Label = _label(text, UITheme.body(), 14, label_colour)
		# A couple of places sit close enough together that their labels would
		# overlap; those are flagged to hang off the other side of the pip.
		if bool(place.get("label_left", false)):
			name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
			name_label.size = Vector2(140, 18)
			name_label.position = at + Vector2(-149, -9)
		else:
			name_label.position = at + Vector2(9, -9)
		canvas.add_child(name_label)
		markers.append({"pip": pip, "label": name_label, "place": place})

func _draw_player() -> void:
	player_marker = Control.new()
	player_marker.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.add_child(player_marker)
	# A small triangle built from three stacked bars, pointing up local -Y.
	for i in 3:
		var bar: ColorRect = _rect(Color(0.95, 0.95, 0.88), Vector2(2 + i * 3, 2))
		bar.position = Vector2(-(1 + i * 1.5), -4 + i * 2)
		player_marker.add_child(bar)

func _draw_legend() -> void:
	var y: float = PANEL.y - 116.0
	var rule: ColorRect = _rect(UITheme.LINE_SOFT, Vector2(PANEL.x - 48, 1))
	rule.position = Vector2(24, y - 12)
	canvas.add_child(rule)

	detail_name = _label("Traders are marked in amber.", UITheme.display(), 19, UITheme.TEXT)
	detail_name.position = Vector2(24, y)
	canvas.add_child(detail_name)

	detail_note = _label(
		"Walk near a place to add what you learn about it here.",
		UITheme.body_light(), 15, UITheme.TEXT_DIM)
	detail_note.position = Vector2(24, y + 26)
	detail_note.size = Vector2(PANEL.x - 48, 40)
	canvas.add_child(detail_note)

	var close: Label = _label("M or ESC to close", UITheme.body_light(), 13, UITheme.TEXT_FAINT,
		HORIZONTAL_ALIGNMENT_RIGHT)
	close.position = Vector2(PANEL.x - 224, PANEL.y - 34)
	close.size = Vector2(200, 18)
	canvas.add_child(close)

func _on_discovered(landmark_name: String) -> void:
	for entry in markers:
		if String(entry["place"]["name"]) == landmark_name:
			detail_name.text = landmark_name
			detail_note.text = String(entry["place"]["note"])
			return

func open_map() -> void:
	open = true
	visible = true
	GameState.set_map_open(true)
	Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
	_refresh()
	panel.modulate.a = 0.0
	panel.scale = Vector2(0.98, 0.98)
	var tween: Tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(panel, "modulate:a", 1.0, 0.16)
	tween.tween_property(panel, "scale", Vector2.ONE, 0.18).set_ease(Tween.EASE_OUT)
	Sound.play_ui("ui_toggle", -8.0)

func close_map() -> void:
	open = false
	visible = false
	GameState.set_map_open(false)
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _refresh() -> void:
	var left: int = GameState.days_until_horde()
	if left > 0:
		day_line.text = "DAY %d   ·   %d DAYS UNTIL THEY COME" % [GameState.day, left]
	else:
		day_line.text = "DAY %d   ·   THEY ARE HERE" % GameState.day

func _process(_delta: float) -> void:
	if not open:
		return
	if player == null or not is_instance_valid(player):
		player = get_tree().get_first_node_in_group("player") as Node3D
	if player != null:
		var at: Vector2 = _to_map(Vector2(player.global_position.x, player.global_position.z))
		player_marker.position = at
		# The marker's nose follows where you are actually facing.
		var forward: Vector3 = -player.global_transform.basis.z
		player_marker.rotation = atan2(forward.x, -forward.z)
	_refresh()

func _unhandled_input(event: InputEvent) -> void:
	if not open:
		return
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_M or event.keycode == KEY_ESCAPE or event.keycode == KEY_E:
			close_map()
			get_viewport().set_input_as_handled()

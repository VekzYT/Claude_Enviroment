extends CanvasLayer

# The map you find on the cabin table. Drawn rather than painted: the roads,
# mountains and markers all come from the same coordinates the world is built
# from, so the map cannot go stale when the terrain changes.

const WORLD_HALF := 232.0
const PANEL := Vector2(900, 668)
# Side of the square drawing area inside the panel.
const MAP_SIZE := 560.0
const RELIEF_RES := 176

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
	{"name": "Chapel Ruins", "at": Vector2(-120, 95), "trade": false,
		"note": "Burnt out. Whoever sheltered here has moved on."},
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

const POND_AT := Vector2(60.0, -30.0)
const POND_RADIUS := 13.0

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
var distance_labels: Array = []
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

var map_origin := Vector2(24.0, 56.0)

# World XZ metres to a position inside the drawing area.
func _to_map(at: Vector2) -> Vector2:
	var u: float = (at.x + WORLD_HALF) / (WORLD_HALF * 2.0)
	var v: float = (at.y + WORLD_HALF) / (WORLD_HALF * 2.0)
	return map_origin + Vector2(u * MAP_SIZE, v * MAP_SIZE)

# Renders the actual terrain into a texture: hillshaded relief, height banding,
# water, and the worn ground of roads and clearings. Sampled from the same
# TerrainGrid the world is built on, so the map is the world, not a drawing of
# a world that used to exist.
func _build_relief() -> ImageTexture:
	var terrain: Node = get_tree().get_first_node_in_group("terrain")
	if terrain == null:
		terrain = get_node_or_null("../Terrain")
	var img := Image.create(RELIEF_RES, RELIEF_RES, false, Image.FORMAT_RGBA8)
	if terrain == null or not terrain.has_method("height_at"):
		img.fill(Color(0.16, 0.17, 0.13))
		return ImageTexture.create_from_image(img)
	if terrain.has_method("ensure_built"):
		terrain.call("ensure_built")

	var step: float = (WORLD_HALF * 2.0) / float(RELIEF_RES - 1)
	var heights := PackedFloat32Array()
	heights.resize(RELIEF_RES * RELIEF_RES)
	var lowest := 1e9
	var highest := -1e9
	for iy in RELIEF_RES:
		for ix in RELIEF_RES:
			var wx: float = -WORLD_HALF + ix * step
			var wz: float = -WORLD_HALF + iy * step
			var h: float = float(terrain.call("height_at", wx, wz))
			heights[iy * RELIEF_RES + ix] = h
			lowest = minf(lowest, h)
			highest = maxf(highest, h)
	var span: float = maxf(highest - lowest, 1.0)

	# Low ground green, rising through scrub to bare rock and snow.
	var bands := [
		Color(0.20, 0.26, 0.17), Color(0.26, 0.31, 0.19), Color(0.34, 0.34, 0.22),
		Color(0.42, 0.38, 0.28), Color(0.50, 0.47, 0.42), Color(0.72, 0.73, 0.75),
	]
	for iy in RELIEF_RES:
		for ix in RELIEF_RES:
			var h: float = heights[iy * RELIEF_RES + ix]
			var t: float = clampf((h - lowest) / span, 0.0, 1.0)
			var band: float = t * float(bands.size() - 1)
			var lo: int = int(floor(band))
			var hi: int = mini(lo + 1, bands.size() - 1)
			var colour: Color = Color(bands[lo]).lerp(Color(bands[hi]), band - float(lo))

			# Hillshade from the local gradient, lit from the north-west, which
			# is the convention that makes relief read as raised not sunken.
			var left: float = heights[iy * RELIEF_RES + maxi(ix - 1, 0)]
			var right: float = heights[iy * RELIEF_RES + mini(ix + 1, RELIEF_RES - 1)]
			var up: float = heights[maxi(iy - 1, 0) * RELIEF_RES + ix]
			var down: float = heights[mini(iy + 1, RELIEF_RES - 1) * RELIEF_RES + ix]
			var normal := Vector3(left - right, 2.0 * step, up - down).normalized()
			var shade: float = clampf(normal.dot(Vector3(-0.5, 0.72, -0.48).normalized()), 0.0, 1.0)
			colour = colour.darkened(0.42 * (1.0 - shade)).lightened(0.18 * shade)

			# Contour lines every eight metres.
			if fposmod(h - lowest, 8.0) < 0.55:
				colour = colour.darkened(0.22)

			var wx: float = -WORLD_HALF + ix * step
			var wz: float = -WORLD_HALF + iy * step
			# Roads and cleared pads are worn to bare earth.
			if terrain.has_method("in_clearing") and bool(terrain.call("in_clearing", Vector2(wx, wz), 0.0, 7.0)):
				colour = colour.lerp(Color(0.46, 0.37, 0.24), 0.62)
			# The pond, drawn from where it actually sits.
			if Vector2(wx, wz).distance_to(POND_AT) < POND_RADIUS:
				colour = Color(0.16, 0.28, 0.36)
			img.set_pixel(ix, iy, colour)
	return ImageTexture.create_from_image(img)

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

	_draw_relief()
	_draw_grid()
	_draw_roads()
	_draw_places()
	_draw_player()
	_draw_places_list()
	_draw_legend()

func _draw_relief() -> void:
	var relief := TextureRect.new()
	relief.name = "Relief"
	relief.texture = _build_relief()
	relief.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	relief.stretch_mode = TextureRect.STRETCH_SCALE
	relief.position = map_origin
	relief.size = Vector2(MAP_SIZE, MAP_SIZE)
	relief.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.add_child(relief)

	var border := Panel.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0)
	style.border_color = UITheme.LINE
	style.set_border_width_all(1)
	border.add_theme_stylebox_override("panel", style)
	border.position = map_origin - Vector2(1, 1)
	border.size = Vector2(MAP_SIZE + 2.0, MAP_SIZE + 2.0)
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.add_child(border)

# A 50 m grid, so distances on the map mean something.
func _draw_grid() -> void:
	var spacing: float = MAP_SIZE * 50.0 / (WORLD_HALF * 2.0)
	var count: int = int(MAP_SIZE / spacing)
	for i in range(1, count + 1):
		var offset: float = i * spacing
		var vertical: ColorRect = _rect(Color(0.85, 0.85, 0.78, 0.09), Vector2(1, MAP_SIZE))
		vertical.position = map_origin + Vector2(offset, 0)
		canvas.add_child(vertical)
		var horizontal: ColorRect = _rect(Color(0.85, 0.85, 0.78, 0.09), Vector2(MAP_SIZE, 1))
		horizontal.position = map_origin + Vector2(0, offset)
		canvas.add_child(horizontal)

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

# The column beside the map: every location, whether it trades, and how far
# away it is right now.
func _draw_places_list() -> void:
	var left: float = map_origin.x + MAP_SIZE + 26.0
	var width: float = PANEL.x - left - 24.0

	var heading: Label = _label("LOCATIONS", UITheme.body_light(), 13, UITheme.TEXT_FAINT)
	heading.position = Vector2(left, map_origin.y - 4.0)
	canvas.add_child(heading)

	var rule: ColorRect = _rect(UITheme.LINE_SOFT, Vector2(width, 1))
	rule.position = Vector2(left, map_origin.y + 14.0)
	canvas.add_child(rule)

	for i in PLACES.size():
		var place: Dictionary = PLACES[i]
		var y: float = map_origin.y + 26.0 + i * 40.0
		var is_trade: bool = bool(place["trade"])

		var chip := Panel.new()
		var style := StyleBoxFlat.new()
		if is_trade:
			style.bg_color = UITheme.ACCENT
		else:
			style.bg_color = Color(0.55, 0.58, 0.50)
		style.set_corner_radius_all(4)
		chip.add_theme_stylebox_override("panel", style)
		chip.position = Vector2(left, y + 5.0)
		chip.size = Vector2(8, 8)
		chip.mouse_filter = Control.MOUSE_FILTER_IGNORE
		canvas.add_child(chip)

		var colour: Color = UITheme.TEXT
		if is_trade:
			colour = UITheme.ACCENT
		var name_label: Label = _label(String(place["name"]), UITheme.body(), 16, colour)
		name_label.position = Vector2(left + 16.0, y)
		canvas.add_child(name_label)

		var sub: String = "—"
		if is_trade:
			sub = "Trades"
		var sub_label: Label = _label(sub, UITheme.body_light(), 13, UITheme.TEXT_FAINT)
		sub_label.position = Vector2(left + 16.0, y + 18.0)
		sub_label.size = Vector2(width - 16.0, 16)
		canvas.add_child(sub_label)
		distance_labels.append({"label": sub_label, "place": place, "trade": is_trade})

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
	var y: float = map_origin.y + MAP_SIZE + 16.0

	# Scale bar: 50 m of map, measured off the same projection as everything
	# else, sat in the bottom-right corner of the chart.
	var bar_len: float = MAP_SIZE * 50.0 / (WORLD_HALF * 2.0)
	var bar_x: float = map_origin.x + MAP_SIZE - bar_len - 14.0
	var bar_y: float = map_origin.y + MAP_SIZE - 16.0
	var backing: ColorRect = _rect(Color(0.05, 0.05, 0.04, 0.55),
		Vector2(bar_len + 58.0, 22))
	backing.position = Vector2(bar_x - 50.0, bar_y - 12.0)
	canvas.add_child(backing)
	var bar: ColorRect = _rect(Color(0.92, 0.92, 0.86), Vector2(bar_len, 2))
	bar.position = Vector2(bar_x, bar_y)
	canvas.add_child(bar)
	for end in [0.0, bar_len - 1.0]:
		var tick: ColorRect = _rect(Color(0.92, 0.92, 0.86), Vector2(1, 8))
		tick.position = Vector2(bar_x + end, bar_y - 3.0)
		canvas.add_child(tick)
	var scale_label: Label = _label("50 m", UITheme.body_light(), 12, Color(0.88, 0.88, 0.82),
		HORIZONTAL_ALIGNMENT_RIGHT)
	scale_label.position = Vector2(bar_x - 46.0, bar_y - 10.0)
	scale_label.size = Vector2(42, 16)
	canvas.add_child(scale_label)
	detail_name = _label("Traders are marked in amber.", UITheme.display(), 19, UITheme.TEXT)
	detail_name.position = Vector2(24, y)
	canvas.add_child(detail_name)

	detail_note = _label(
		"Walk near a place to add what you learn about it here.",
		UITheme.body_light(), 15, UITheme.TEXT_DIM)
	detail_note.position = Vector2(24, y + 24)
	detail_note.size = Vector2(PANEL.x - 260, 40)
	canvas.add_child(detail_note)

	var close: Label = _label("M or ESC to close", UITheme.body_light(), 13, UITheme.TEXT_FAINT,
		HORIZONTAL_ALIGNMENT_RIGHT)
	close.position = Vector2(PANEL.x - 224, PANEL.y - 26)
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
	Sound.play_ui("ui_open", -9.0)

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
		_refresh_distances()
	_refresh()

func _refresh_distances() -> void:
	if player == null:
		return
	var here := Vector2(player.global_position.x, player.global_position.z)
	for entry in distance_labels:
		var away: float = here.distance_to(Vector2(entry["place"]["at"]))
		var text: String = "%d m" % int(round(away))
		if bool(entry["trade"]):
			text += "   ·   Trades"
		(entry["label"] as Label).text = text

func _unhandled_input(event: InputEvent) -> void:
	if not open:
		return
	if event is InputEventKey and event.pressed:
		# M and E are the player's toggle keys and never reach this far; it
		# consumes them itself so one press cannot both open and close. ESC is
		# ours alone.
		if event.keycode == KEY_ESCAPE:
			close_map()
			get_viewport().set_input_as_handled()

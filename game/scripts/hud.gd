extends CanvasLayer

# The whole HUD is assembled here rather than in the scene file. It is a lot of
# small pieces that all need to agree on spacing, colour and font, and building
# them in one pass keeps that consistent -- and lets the compass generate its
# own ticks instead of us hand-placing two dozen nodes.

const MAX_HEALTH_DISPLAY := 100
const BAR_WIDTH := 232.0
const HEALTH_BAR_HEIGHT := 15.0
const STAMINA_BAR_HEIGHT := 6.0
const KNIFE_WEAPON_INDEX := 2

# Compass ribbon: a 120-degree window, so a tick every 15 degrees gives eight
# marks on screen at once and the ribbon reads as motion rather than as a jump.
const COMPASS_WIDTH := 460.0
const COMPASS_SPAN := 120.0
const COMPASS_TICK_STEP := 15.0
const CARDINALS := {0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW"}

const CROSSHAIR_BASE := 5.0
const CROSSHAIR_ARM := 7.0
const HINT_FADE_AFTER := 24.0

var root: Control
var vignette: TextureRect
var damage_vignette: TextureRect
var low_health_vignette: TextureRect

var crosshair: Control
var crosshair_arms: Array[ColorRect] = []
var crosshair_dot: ColorRect
var hit_marker: Control

var compass_strip: Control
var compass_ticks: Array = []

var supply_value: Label
var wood_value: Label
var day_value: Label
var day_caption: Label
var clock_hand: ColorRect

var health_fill: ColorRect
var health_lag: ColorRect
var health_value: Label
var stamina_fill: ColorRect
var hunger_fill: ColorRect

var item_card: PanelContainer
var item_icon: Panel
var item_name: Label

var prompt_box: PanelContainer
var prompt_key: Label
var prompt_text: Label

var toast_box: PanelContainer
var toast_label: Label

var hint_label: Label

var knife_bar: Control
var knife_fill: ColorRect

var scope_overlay: TextureRect
var scope_reticle_h: ColorRect
var scope_reticle_v: ColorRect

var last_health := 100
var health_lag_value := 100.0
var current_weapon_index := 3
var pulse_time := 0.0
var hint_time := 0.0
var crosshair_spread := CROSSHAIR_BASE
var player: Node3D = null
var toast_tween: Tween = null
var item_tween: Tween = null

# Colour per carryable, so the item card's swatch says at a glance what is in
# your hands without reading the name.
const ITEM_TINTS: Array[Color] = [
	Color(0.55, 0.58, 0.62), Color(0.55, 0.58, 0.62), Color(0.70, 0.72, 0.75),
	Color(0.72, 0.55, 0.43), Color(0.78, 0.58, 0.32),
]

func _ready() -> void:
	_build()

	GameState.health_changed.connect(_on_health_changed)
	GameState.stamina_changed.connect(_on_stamina_changed)
	GameState.hunger_changed.connect(_on_hunger_changed)
	GameState.weapon_changed.connect(_on_weapon_changed)
	GameState.scope_active_changed.connect(_on_scope_active_changed)
	GameState.knife_cooldown_changed.connect(_on_knife_cooldown_changed)
	GameState.hit_marker_triggered.connect(_on_hit_marker_triggered)
	GameState.landmark_discovered.connect(_on_landmark_discovered)
	GameState.supply_collected.connect(_on_supply_collected)
	GameState.wood_changed.connect(_on_wood_changed)
	GameState.day_changed.connect(_on_day_changed)
	GameState.time_changed.connect(_on_time_changed)
	GameState.carry_changed.connect(_on_carry_changed)
	GameState.held_item_changed.connect(_on_held_item_changed)
	GameState.interact_prompt_changed.connect(_on_prompt_changed)
	GameState.announced.connect(show_toast)

	last_health = GameState.player_health
	health_lag_value = float(last_health)
	_on_health_changed(GameState.player_health)
	_on_stamina_changed(GameState.stamina)
	_on_hunger_changed(GameState.hunger)
	_on_weapon_changed(GameState.current_weapon)
	_on_scope_active_changed(GameState.scope_active)
	_on_knife_cooldown_changed(GameState.knife_cooldown_fraction)
	_on_supply_collected(GameState.supplies_collected, GameState.SUPPLIES_TOTAL)
	_on_wood_changed(GameState.wood)
	_on_day_changed(GameState.day)
	_on_time_changed(GameState.time_of_day)
	_on_held_item_changed(GameState.held_item)
	_on_prompt_changed(GameState.interact_prompt)

# --- construction ------------------------------------------------------------

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

func _panel_box(bg: Color, border: Color, radius: int = 3) -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", UITheme.panel(bg, border, radius))
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return p

func _row(separation: int) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", separation)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return h

func _column(separation: int) -> VBoxContainer:
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", separation)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return v

func _full_screen(tex: Texture2D) -> TextureRect:
	var t := TextureRect.new()
	t.texture = tex
	t.set_anchors_preset(Control.PRESET_FULL_RECT)
	t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	t.stretch_mode = TextureRect.STRETCH_SCALE
	t.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return t

func _build() -> void:
	root = Control.new()
	root.name = "Root"
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	# A permanent corner darkening pulls the eye to the middle of the frame and
	# stops the HUD panels from looking like they float on nothing.
	vignette = _full_screen(UITheme.vignette_texture(Color(0, 0, 0, 0.55), 0.35, 1.0, 1.4))
	root.add_child(vignette)

	damage_vignette = _full_screen(UITheme.vignette_texture(Color(0.75, 0.06, 0.04, 1.0), 0.12, 0.95, 1.1))
	damage_vignette.modulate.a = 0.0
	root.add_child(damage_vignette)

	low_health_vignette = _full_screen(UITheme.vignette_texture(Color(0.62, 0.03, 0.02, 1.0), 0.05, 1.0, 1.0))
	low_health_vignette.modulate.a = 0.0
	root.add_child(low_health_vignette)

	_build_crosshair()
	_build_compass()
	_build_chips()
	_build_vitals()
	_build_item_card()
	_build_prompt()
	_build_toast()
	_build_hints()
	_build_scope()

func _build_crosshair() -> void:
	crosshair = Control.new()
	crosshair.name = "Crosshair"
	crosshair.set_anchors_preset(Control.PRESET_CENTER)
	crosshair.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(crosshair)

	crosshair_dot = _rect(Color(0.95, 0.95, 0.90, 0.9), Vector2(2, 2))
	crosshair_dot.position = Vector2(-1, -1)
	crosshair.add_child(crosshair_dot)

	for i in 4:
		var size := Vector2(2, CROSSHAIR_ARM)
		if i >= 2:
			size = Vector2(CROSSHAIR_ARM, 2)
		var arm: ColorRect = _rect(Color(0.95, 0.95, 0.90, 0.75), size)
		crosshair.add_child(arm)
		crosshair_arms.append(arm)

	# Four short strokes that punch outward from the centre on a landed hit.
	hit_marker = Control.new()
	hit_marker.name = "HitMarker"
	hit_marker.set_anchors_preset(Control.PRESET_CENTER)
	hit_marker.modulate.a = 0.0
	hit_marker.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(hit_marker)
	for i in 4:
		var angle: float = deg_to_rad(45.0 + 90.0 * i)
		var tick: ColorRect = _rect(Color(1, 0.96, 0.88, 0.95), Vector2(2, 9))
		tick.pivot_offset = Vector2(1, 4.5)
		tick.rotation = angle
		tick.position = Vector2(sin(angle), -cos(angle)) * 11.0 - Vector2(1, 4.5)
		hit_marker.add_child(tick)

func _build_compass() -> void:
	var frame: PanelContainer = _panel_box(UITheme.BG_DEEP, UITheme.LINE_SOFT, 2)
	frame.name = "Compass"
	frame.set_anchors_preset(Control.PRESET_CENTER_TOP)
	frame.position = Vector2(-COMPASS_WIDTH * 0.5 - 10.0, 14.0)
	frame.custom_minimum_size = Vector2(COMPASS_WIDTH + 20.0, 30.0)
	root.add_child(frame)

	var inner := Control.new()
	inner.name = "CompassInner"
	inner.custom_minimum_size = Vector2(COMPASS_WIDTH, 20.0)
	inner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	frame.add_child(inner)

	compass_strip = Control.new()
	compass_strip.name = "Strip"
	compass_strip.clip_contents = true
	compass_strip.set_anchors_preset(Control.PRESET_FULL_RECT)
	compass_strip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	inner.add_child(compass_strip)

	var body: Font = UITheme.body_bold()
	# One entry per 15 degrees all the way round; _process slides them.
	var bearing := 0.0
	while bearing < 360.0:
		var major: bool = CARDINALS.has(int(bearing))
		var tick_colour: Color = UITheme.TEXT_FAINT
		var tick_size := Vector2(1.0, 4.0)
		if major:
			tick_colour = UITheme.TEXT_DIM
			tick_size = Vector2(2.0, 7.0)
		var tick: ColorRect = _rect(tick_colour, tick_size)
		compass_strip.add_child(tick)
		var text_node: Label = null
		if major:
			var cardinal: String = CARDINALS[int(bearing)]
			var font_size: int = 12
			var font_colour: Color = UITheme.TEXT_DIM
			if cardinal.length() == 1:
				font_size = 15
				font_colour = UITheme.TEXT
			text_node = _label(cardinal, body, font_size, font_colour, HORIZONTAL_ALIGNMENT_CENTER)
			text_node.custom_minimum_size = Vector2(28, 0)
			text_node.size = Vector2(28, 16)
			compass_strip.add_child(text_node)
		compass_ticks.append({"bearing": bearing, "tick": tick, "label": text_node})
		bearing += COMPASS_TICK_STEP

	# The needle marks dead ahead so the ribbon has something to read against.
	var needle: ColorRect = _rect(UITheme.ACCENT, Vector2(1.5, 24))
	needle.position = Vector2(COMPASS_WIDTH * 0.5, -2.0)
	inner.add_child(needle)

func _chip(swatch_colour: Color, caption: String) -> Array:
	var box: PanelContainer = _panel_box(UITheme.BG, UITheme.LINE_SOFT, 2)
	var row: HBoxContainer = _row(8)
	box.add_child(row)
	var swatch := Panel.new()
	swatch.custom_minimum_size = Vector2(4, 16)
	swatch.add_theme_stylebox_override("panel", UITheme.flat(swatch_colour, 1))
	swatch.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(swatch)
	row.add_child(_label(caption, UITheme.body_light(), 15, UITheme.TEXT_DIM))
	var value: Label = _label("0", UITheme.body_bold(), 16, UITheme.TEXT, HORIZONTAL_ALIGNMENT_RIGHT)
	value.custom_minimum_size = Vector2(44, 0)
	row.add_child(value)
	return [box, value]

func _build_chips() -> void:
	var column: VBoxContainer = _column(5)
	column.name = "Chips"
	column.position = Vector2(16, 16)
	root.add_child(column)

	# Day chip: the day number, the phase of the day, and a dial that goes round
	# once per day so you can see dusk coming without reading anything.
	var day_box: PanelContainer = _panel_box(UITheme.BG_DEEP, UITheme.ACCENT_DIM, 2)
	column.add_child(day_box)
	var day_row: HBoxContainer = _row(9)
	day_box.add_child(day_row)

	var dial := Control.new()
	dial.custom_minimum_size = Vector2(18, 18)
	dial.mouse_filter = Control.MOUSE_FILTER_IGNORE
	day_row.add_child(dial)
	var face := Panel.new()
	var face_style := StyleBoxFlat.new()
	face_style.bg_color = Color(0.03, 0.035, 0.03, 0.9)
	face_style.border_color = UITheme.LINE_SOFT
	face_style.set_border_width_all(1)
	face_style.set_corner_radius_all(9)
	face.add_theme_stylebox_override("panel", face_style)
	face.set_anchors_preset(Control.PRESET_FULL_RECT)
	face.mouse_filter = Control.MOUSE_FILTER_IGNORE
	dial.add_child(face)
	clock_hand = _rect(UITheme.ACCENT, Vector2(1.5, 7))
	clock_hand.pivot_offset = Vector2(0.75, 7)
	clock_hand.position = Vector2(8.25, 2)
	dial.add_child(clock_hand)

	day_value = _label("DAY 1", UITheme.body_bold(), 16, UITheme.TEXT)
	day_row.add_child(day_value)
	day_caption = _label("Dawn", UITheme.body_light(), 14, UITheme.TEXT_DIM, HORIZONTAL_ALIGNMENT_RIGHT)
	day_caption.custom_minimum_size = Vector2(112, 0)
	day_row.add_child(day_caption)

	var supplies: Array = _chip(UITheme.GOOD, "SUPPLIES")
	column.add_child(supplies[0])
	supply_value = supplies[1]

	var wood: Array = _chip(UITheme.WOOD, "WOOD")
	column.add_child(wood[0])
	wood_value = wood[1]

func _bar(width: float, height: float, fill_colour: Color) -> Array:
	var holder := Control.new()
	holder.custom_minimum_size = Vector2(width, height)
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var back := Panel.new()
	back.add_theme_stylebox_override("panel", UITheme.flat(Color(0.03, 0.035, 0.03, 0.92), 2))
	back.set_anchors_preset(Control.PRESET_FULL_RECT)
	back.mouse_filter = Control.MOUSE_FILTER_IGNORE
	holder.add_child(back)
	var fill: ColorRect = _rect(fill_colour, Vector2(width - 2.0, height - 2.0))
	fill.position = Vector2(1, 1)
	holder.add_child(fill)
	return [holder, fill]

func _build_vitals() -> void:
	var frame: PanelContainer = _panel_box(UITheme.BG, UITheme.LINE_SOFT, 3)
	frame.name = "Vitals"
	frame.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	frame.position = Vector2(16, -86)
	root.add_child(frame)

	var column: VBoxContainer = _column(4)
	frame.add_child(column)

	var caption: HBoxContainer = _row(0)
	column.add_child(caption)
	var title: Label = _label("CONDITION", UITheme.body_light(), 13, UITheme.TEXT_FAINT)
	title.custom_minimum_size = Vector2(BAR_WIDTH - 60.0, 0)
	caption.add_child(title)
	health_value = _label("100", UITheme.body_bold(), 15, UITheme.TEXT, HORIZONTAL_ALIGNMENT_RIGHT)
	health_value.custom_minimum_size = Vector2(60, 0)
	caption.add_child(health_value)

	# Two stacked fills: the pale one lags behind, so a hit leaves a visible
	# streak of what you just lost before it drains away.
	var health_holder: Array = _bar(BAR_WIDTH, HEALTH_BAR_HEIGHT, Color(0.55, 0.12, 0.10, 0.85))
	column.add_child(health_holder[0])
	health_lag = health_holder[1]
	health_fill = _rect(UITheme.GOOD, Vector2(BAR_WIDTH - 2.0, HEALTH_BAR_HEIGHT - 2.0))
	health_fill.position = Vector2(1, 1)
	(health_holder[0] as Control).add_child(health_fill)

	var stamina_holder: Array = _bar(BAR_WIDTH, STAMINA_BAR_HEIGHT, UITheme.STAMINA)
	stamina_fill = stamina_holder[1]
	column.add_child(stamina_holder[0])

	# Food sits under wind, because running on an empty stomach is what makes
	# both of them matter at the same time.
	var hunger_holder: Array = _bar(BAR_WIDTH, STAMINA_BAR_HEIGHT, Color(0.72, 0.55, 0.24))
	hunger_fill = hunger_holder[1]
	column.add_child(hunger_holder[0])

	# Knife readiness lives under the crosshair, not down here, so it stays
	# where the eye already is mid-fight.
	var knife_holder: Array = _bar(64.0, 5.0, UITheme.ACCENT_DIM)
	knife_bar = knife_holder[0]
	knife_fill = knife_holder[1]
	knife_bar.set_anchors_preset(Control.PRESET_CENTER)
	knife_bar.position = Vector2(-32, 26)
	knife_bar.visible = false
	root.add_child(knife_bar)

func _build_item_card() -> void:
	item_card = _panel_box(UITheme.BG, UITheme.LINE_SOFT, 3)
	item_card.name = "ItemCard"
	item_card.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	item_card.position = Vector2(-214, -76)
	item_card.custom_minimum_size = Vector2(198, 0)
	item_card.pivot_offset = Vector2(198, 56)
	root.add_child(item_card)

	var row: HBoxContainer = _row(10)
	item_card.add_child(row)

	item_icon = Panel.new()
	item_icon.custom_minimum_size = Vector2(30, 30)
	item_icon.add_theme_stylebox_override("panel", UITheme.panel(Color(0.12, 0.13, 0.11, 1.0), UITheme.LINE, 2))
	item_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(item_icon)

	var column: VBoxContainer = _column(0)
	row.add_child(column)
	item_name = _label("Bare hands", UITheme.display(), 19, UITheme.TEXT)
	column.add_child(item_name)
	column.add_child(_label("SCROLL TO SWAP", UITheme.body_light(), 11, UITheme.TEXT_FAINT))

func _build_prompt() -> void:
	prompt_box = _panel_box(UITheme.BG_DEEP, UITheme.LINE, 3)
	prompt_box.name = "Prompt"
	prompt_box.set_anchors_preset(Control.PRESET_CENTER)
	prompt_box.position = Vector2(-96, 56)
	prompt_box.visible = false
	root.add_child(prompt_box)

	var row: HBoxContainer = _row(9)
	prompt_box.add_child(row)

	var cap: PanelContainer = _panel_box(Color(0.18, 0.19, 0.16, 1.0), UITheme.ACCENT_DIM, 2)
	row.add_child(cap)
	prompt_key = _label("E", UITheme.body_bold(), 15, UITheme.ACCENT, HORIZONTAL_ALIGNMENT_CENTER)
	prompt_key.custom_minimum_size = Vector2(12, 0)
	cap.add_child(prompt_key)

	prompt_text = _label("", UITheme.body(), 17, UITheme.TEXT)
	row.add_child(prompt_text)

func _build_toast() -> void:
	toast_box = _panel_box(UITheme.BG_DEEP, UITheme.ACCENT_DIM, 2)
	toast_box.name = "Toast"
	toast_box.set_anchors_preset(Control.PRESET_CENTER_TOP)
	toast_box.position = Vector2(-130, 56)
	toast_box.custom_minimum_size = Vector2(260, 0)
	toast_box.visible = false
	toast_box.modulate.a = 0.0
	root.add_child(toast_box)
	toast_label = _label("", UITheme.body(), 17, UITheme.TEXT, HORIZONTAL_ALIGNMENT_CENTER)
	toast_box.add_child(toast_label)

func _build_hints() -> void:
	hint_label = _label(
		"WASD move    SHIFT sprint    LMB swing    E interact    TAB pack    M map    F eat    SCROLL swap    ESC pause",
		UITheme.body_light(), 14, UITheme.TEXT_FAINT, HORIZONTAL_ALIGNMENT_CENTER)
	hint_label.name = "Hints"
	hint_label.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	hint_label.position = Vector2(0, -28)
	root.add_child(hint_label)

func _build_scope() -> void:
	scope_overlay = _full_screen(_build_scope_mask_texture())
	scope_overlay.visible = false
	root.add_child(scope_overlay)

	scope_reticle_h = _rect(Color(0, 0, 0, 0.85), Vector2(560, 1))
	scope_reticle_h.set_anchors_preset(Control.PRESET_CENTER)
	scope_reticle_h.position = Vector2(-280, 0)
	scope_reticle_h.visible = false
	root.add_child(scope_reticle_h)

	scope_reticle_v = _rect(Color(0, 0, 0, 0.85), Vector2(1, 560))
	scope_reticle_v.set_anchors_preset(Control.PRESET_CENTER)
	scope_reticle_v.position = Vector2(0, -280)
	scope_reticle_v.visible = false
	root.add_child(scope_reticle_v)

# --- per-frame ---------------------------------------------------------------

func _process(delta: float) -> void:
	if player == null or not is_instance_valid(player):
		player = get_tree().get_first_node_in_group("player") as Node3D

	if last_health > 0 and last_health <= 30:
		pulse_time += delta
		var severity: float = 1.0 - clampf(float(last_health) / 30.0, 0.0, 1.0)
		low_health_vignette.modulate.a = (0.25 + 0.22 * sin(pulse_time * 4.2)) * severity
	else:
		pulse_time = 0.0
		low_health_vignette.modulate.a = move_toward(low_health_vignette.modulate.a, 0.0, delta * 2.0)

	# Drain the pale trailing bar toward the real health value.
	var target_health: float = float(last_health)
	if health_lag_value > target_health:
		health_lag_value = move_toward(health_lag_value, target_health, delta * 45.0)
	else:
		health_lag_value = target_health
	health_lag.size.x = (BAR_WIDTH - 2.0) * clampf(health_lag_value / float(MAX_HEALTH_DISPLAY), 0.0, 1.0)

	if hint_label.visible:
		hint_time += delta
		if hint_time > HINT_FADE_AFTER:
			hint_label.modulate.a = maxf(hint_label.modulate.a - delta * 0.5, 0.0)
			if hint_label.modulate.a <= 0.01:
				hint_label.visible = false

	_update_compass()
	_update_crosshair(delta)

func _update_compass() -> void:
	if player == null:
		return
	var forward: Vector3 = -player.global_transform.basis.z
	var bearing: float = fposmod(rad_to_deg(atan2(forward.x, -forward.z)), 360.0)
	var centre: float = COMPASS_WIDTH * 0.5
	var px_per_deg: float = COMPASS_WIDTH / COMPASS_SPAN
	for entry in compass_ticks:
		# Shortest signed distance, so a tick crossing north slides instead of
		# leaping the whole way round the dial.
		var diff: float = fposmod(float(entry["bearing"]) - bearing + 180.0, 360.0) - 180.0
		var x: float = centre + diff * px_per_deg
		var on_screen: bool = x > -20.0 and x < COMPASS_WIDTH + 20.0
		var tick: ColorRect = entry["tick"]
		tick.visible = on_screen
		if on_screen:
			tick.position = Vector2(x - tick.size.x * 0.5, 0.0)
		var text_node: Label = entry["label"]
		if text_node != null:
			text_node.visible = on_screen
			if on_screen:
				text_node.position = Vector2(x - 14.0, 5.0)

func _update_crosshair(delta: float) -> void:
	var target: float = CROSSHAIR_BASE
	if player != null:
		if "velocity" in player:
			var speed: float = Vector2(player.velocity.x, player.velocity.z).length()
			target += clampf(speed / 9.5, 0.0, 1.0) * 5.0
		if "is_meleeing" in player and player.is_meleeing:
			target += 9.0
	crosshair_spread = lerpf(crosshair_spread, target, clampf(delta * 12.0, 0.0, 1.0))
	var d: float = crosshair_spread
	crosshair_arms[0].position = Vector2(-1, -d - CROSSHAIR_ARM)
	crosshair_arms[1].position = Vector2(-1, d)
	crosshair_arms[2].position = Vector2(-d - CROSSHAIR_ARM, -1)
	crosshair_arms[3].position = Vector2(d, -1)

# --- signal handlers ---------------------------------------------------------

func _on_health_changed(new_health: int) -> void:
	var fraction: float = clampf(float(new_health) / float(MAX_HEALTH_DISPLAY), 0.0, 1.0)
	health_fill.size.x = (BAR_WIDTH - 2.0) * fraction
	if fraction > 0.55:
		health_fill.color = UITheme.GOOD
	elif fraction > 0.25:
		health_fill.color = UITheme.WARN
	else:
		health_fill.color = UITheme.BAD
	health_value.text = "%d" % new_health
	if new_health < last_health:
		flash_damage()
	elif new_health > last_health:
		health_lag_value = float(new_health)
	last_health = new_health

func _on_stamina_changed(fraction: float) -> void:
	var f: float = clampf(fraction, 0.0, 1.0)
	stamina_fill.size.x = (BAR_WIDTH - 2.0) * f
	# Turns amber while it is too low to sprint on, so the reason you slowed
	# down is visible without reading a number.
	if f > 0.2:
		stamina_fill.color = UITheme.STAMINA
	else:
		stamina_fill.color = UITheme.WARN

func _on_hunger_changed(fraction: float) -> void:
	var f: float = clampf(fraction, 0.0, 1.0)
	hunger_fill.size.x = (BAR_WIDTH - 2.0) * f
	if f > 0.5:
		hunger_fill.color = Color(0.72, 0.55, 0.24)
	elif f > 0.22:
		hunger_fill.color = UITheme.WARN
	else:
		hunger_fill.color = UITheme.BAD

func flash_damage() -> void:
	damage_vignette.modulate.a = 0.85
	var tween: Tween = create_tween()
	tween.tween_property(damage_vignette, "modulate:a", 0.0, 0.55).set_ease(Tween.EASE_OUT)

func _on_weapon_changed(index: int) -> void:
	current_weapon_index = index
	knife_bar.visible = index == KNIFE_WEAPON_INDEX
	if index >= 0 and index < ITEM_TINTS.size():
		var tint: Color = ITEM_TINTS[index]
		item_icon.add_theme_stylebox_override("panel", UITheme.panel(tint.darkened(0.6), tint, 2))

func _on_knife_cooldown_changed(fraction: float) -> void:
	var ready_fraction: float = 1.0 - clampf(fraction, 0.0, 1.0)
	knife_fill.size.x = 62.0 * ready_fraction
	if ready_fraction >= 1.0:
		knife_fill.color = UITheme.ACCENT
	else:
		knife_fill.color = UITheme.ACCENT_DIM

func _on_hit_marker_triggered() -> void:
	hit_marker.modulate.a = 1.0
	hit_marker.scale = Vector2(0.7, 0.7)
	var tween: Tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(hit_marker, "scale", Vector2.ONE, 0.12).set_ease(Tween.EASE_OUT)
	tween.tween_property(hit_marker, "modulate:a", 0.0, 0.28).set_delay(0.06)

func _on_landmark_discovered(landmark_name: String) -> void:
	show_toast("Discovered  ·  %s" % landmark_name)
	Sound.play_ui("ui_toggle", -4.0)

func _on_supply_collected(count: int, total: int) -> void:
	supply_value.text = "%d/%d" % [count, total]
	if count > 0:
		show_toast("Supply cache recovered  ·  %d of %d" % [count, total])

func _on_wood_changed(amount: int) -> void:
	wood_value.text = "%d" % amount

func _on_day_changed(day: int) -> void:
	day_value.text = "DAY %d" % day
	var left: int = GameState.days_until_horde()
	# The chip turns red inside the last three days, so the deadline is visible
	# in peripheral vision rather than only in the toast that already went.
	if left <= 0:
		day_value.add_theme_color_override("font_color", UITheme.BAD)
	elif left <= 3:
		day_value.add_theme_color_override("font_color", UITheme.WARN)
	else:
		day_value.add_theme_color_override("font_color", UITheme.TEXT)

func _on_time_changed(t: float) -> void:
	# Midnight at the top, noon at the bottom: one turn per day.
	clock_hand.rotation = t * TAU
	var left: int = GameState.days_until_horde()
	var phase: String = _phase_name(t)
	if left <= 0:
		day_caption.text = "%s · they are here" % phase
	elif left <= 3:
		day_caption.text = "%s · %dd left" % [phase, left]
	else:
		day_caption.text = phase

func _phase_name(t: float) -> String:
	if t < 0.22:
		return "Night"
	if t < 0.32:
		return "Dawn"
	if t < 0.46:
		return "Morning"
	if t < 0.56:
		return "Midday"
	if t < 0.70:
		return "Afternoon"
	if t < 0.82:
		return "Dusk"
	return "Night"

func _on_carry_changed(carrying: bool) -> void:
	if carrying:
		item_name.text = "Log (both hands)"
		item_icon.add_theme_stylebox_override("panel",
			UITheme.panel(UITheme.WOOD.darkened(0.6), UITheme.WOOD, 2))
	else:
		_on_held_item_changed(GameState.held_item)
		_on_weapon_changed(GameState.current_weapon)

func _on_held_item_changed(title: String) -> void:
	if GameState.carrying_log:
		return
	item_name.text = title
	if item_tween != null and item_tween.is_valid():
		item_tween.kill()
	item_card.scale = Vector2(1.06, 1.06)
	item_tween = create_tween()
	item_tween.tween_property(item_card, "scale", Vector2.ONE, 0.18).set_ease(Tween.EASE_OUT)

func _on_prompt_changed(text: String) -> void:
	# The player hands us "[E]  Pick up Axe"; the key already has its own cap.
	var body: String = text
	if body.begins_with("[E]"):
		body = body.substr(3).strip_edges()
	prompt_text.text = body
	prompt_box.visible = text != ""

func show_toast(text: String) -> void:
	if toast_tween != null and toast_tween.is_valid():
		toast_tween.kill()
	toast_label.text = text
	toast_box.visible = true
	toast_box.modulate.a = 0.0
	toast_box.position.y = 46.0
	toast_tween = create_tween()
	toast_tween.set_parallel(true)
	toast_tween.tween_property(toast_box, "modulate:a", 1.0, 0.22)
	toast_tween.tween_property(toast_box, "position:y", 56.0, 0.28).set_ease(Tween.EASE_OUT)
	toast_tween.chain().tween_interval(2.3)
	toast_tween.chain().tween_property(toast_box, "modulate:a", 0.0, 0.5)
	toast_tween.chain().tween_callback(func() -> void:
		toast_box.visible = false
	)

func _on_scope_active_changed(active: bool) -> void:
	scope_overlay.visible = active
	scope_reticle_h.visible = active
	scope_reticle_v.visible = active
	crosshair.visible = not active

func _build_scope_mask_texture() -> ImageTexture:
	var w := 320
	var h := 180
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	var centre := Vector2(w / 2.0, h / 2.0)
	var radius: float = h * 0.46
	var edge: float = h * 0.05
	for y in h:
		for x in w:
			var d: float = Vector2(x, y).distance_to(centre)
			var alpha: float = clampf((d - radius) / edge, 0.0, 1.0)
			img.set_pixel(x, y, Color(0.0, 0.0, 0.0, alpha))
	return ImageTexture.create_from_image(img)

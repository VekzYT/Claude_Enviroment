extends CanvasLayer

const MAX_HEALTH_DISPLAY := 100
const HEALTH_BAR_WIDTH := 300.0
const KNIFE_BAR_WIDTH := 60.0
const KNIFE_WEAPON_INDEX := 2

@onready var score_label: Label = $ScoreLabel
@onready var health_bar_fill: ColorRect = $HealthBarFill
@onready var health_bar_label: Label = $HealthBarLabel
@onready var damage_flash: ColorRect = $DamageFlash
@onready var low_health_pulse: ColorRect = $LowHealthPulse
@onready var crosshair: Label = $Crosshair
@onready var hit_marker: Label = $HitMarker

@onready var weapon_panel_bg: ColorRect = $WeaponPanelBG
@onready var weapon_panel_text: RichTextLabel = $WeaponPanelText

@onready var knife_cooldown_bg: ColorRect = $KnifeCooldownBG
@onready var knife_cooldown_fill: ColorRect = $KnifeCooldownFill

@onready var scope_overlay: TextureRect = $ScopeOverlay
@onready var scope_reticle_h: ColorRect = $ScopeReticleH
@onready var scope_reticle_v: ColorRect = $ScopeReticleV

@onready var compass_label: Label = $CompassLabel
@onready var supply_label: Label = $SupplyLabel
@onready var toast_label: Label = $ToastLabel
@onready var wood_label: Label = $WoodLabel
@onready var held_label: Label = $HeldLabel
@onready var prompt_label: Label = $PromptLabel

var last_health := 100
var current_weapon_index := 1
var weapon_names: Array = ["Sniper", "Handgun", "Knife", "Bare hands", "Axe"]
var pulse_time := 0.0
var player: Node3D = null
var toast_tween: Tween = null

const COMPASS_NAMES: Array[String] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]

func _ready() -> void:
	GameState.score_changed.connect(_on_score_changed)
	GameState.health_changed.connect(_on_health_changed)
	GameState.weapon_changed.connect(_on_weapon_changed)
	GameState.weapon_panel_visibility_changed.connect(_on_weapon_panel_visibility_changed)
	GameState.scope_active_changed.connect(_on_scope_active_changed)
	GameState.knife_cooldown_changed.connect(_on_knife_cooldown_changed)
	GameState.hit_marker_triggered.connect(_on_hit_marker_triggered)
	GameState.landmark_discovered.connect(_on_landmark_discovered)
	GameState.supply_collected.connect(_on_supply_collected)
	GameState.wood_changed.connect(_on_wood_changed)
	GameState.held_item_changed.connect(_on_held_item_changed)
	GameState.interact_prompt_changed.connect(_on_prompt_changed)
	GameState.announced.connect(show_toast)

	_on_score_changed(GameState.score)
	last_health = GameState.player_health
	_on_health_changed(GameState.player_health)
	_on_weapon_changed(GameState.current_weapon)
	_on_weapon_panel_visibility_changed(GameState.weapon_panel_open)
	_on_scope_active_changed(GameState.scope_active)
	_on_knife_cooldown_changed(GameState.knife_cooldown_fraction)
	supply_label.text = "Supplies: %d / %d" % [GameState.supplies_collected, GameState.SUPPLIES_TOTAL]
	_on_wood_changed(GameState.wood)
	_on_held_item_changed(GameState.held_item)
	_on_prompt_changed(GameState.interact_prompt)

	hit_marker.visible = false
	toast_label.visible = false
	toast_label.modulate.a = 0.0
	scope_overlay.texture = _build_scope_mask_texture()

func _process(delta: float) -> void:
	if last_health > 0 and last_health <= 25:
		pulse_time += delta
		low_health_pulse.color.a = 0.15 + 0.15 * sin(pulse_time * 4.0)
	else:
		pulse_time = 0.0
		low_health_pulse.color.a = 0.0
	update_compass()

func update_compass() -> void:
	if player == null:
		player = get_tree().get_first_node_in_group("player")
		if player == null:
			return
	var forward: Vector3 = -player.global_transform.basis.z
	var bearing_rad: float = atan2(forward.x, -forward.z)
	var bearing_deg: float = fposmod(rad_to_deg(bearing_rad), 360.0)
	var idx: int = int(round(bearing_deg / 45.0)) % 8
	compass_label.text = "%s   %d°" % [COMPASS_NAMES[idx], int(bearing_deg)]

func _on_landmark_discovered(landmark_name: String) -> void:
	show_toast("Discovered: %s" % landmark_name)
	Sound.play_ui("ui_toggle", -4.0)

func _on_supply_collected(count: int, total: int) -> void:
	supply_label.text = "Supplies: %d / %d" % [count, total]
	show_toast("Supplies recovered  (%d/%d)" % [count, total])

func _on_wood_changed(amount: int) -> void:
	wood_label.text = "Wood: %d" % amount

func _on_held_item_changed(title: String) -> void:
	held_label.text = title

func _on_prompt_changed(text: String) -> void:
	prompt_label.text = text
	prompt_label.visible = text != ""

func show_toast(text: String) -> void:
	if toast_tween != null and toast_tween.is_valid():
		toast_tween.kill()
	toast_label.text = text
	toast_label.visible = true
	toast_label.modulate.a = 0.0
	toast_tween = create_tween()
	toast_tween.tween_property(toast_label, "modulate:a", 1.0, 0.3)
	toast_tween.tween_interval(2.2)
	toast_tween.tween_property(toast_label, "modulate:a", 0.0, 0.5)
	toast_tween.tween_callback(func() -> void:
		toast_label.visible = false
	)

func _on_score_changed(new_score: int) -> void:
	score_label.text = "Score: %d" % new_score

func _on_health_changed(new_health: int) -> void:
	var fraction: float = clamp(float(new_health) / float(MAX_HEALTH_DISPLAY), 0.0, 1.0)
	health_bar_fill.size.x = HEALTH_BAR_WIDTH * fraction
	health_bar_fill.color = Color(0.85, 0.15, 0.1).lerp(Color(0.2, 0.85, 0.3), fraction)
	health_bar_label.text = "%d / %d" % [new_health, MAX_HEALTH_DISPLAY]
	if new_health < last_health:
		flash_damage()
	last_health = new_health

func flash_damage() -> void:
	damage_flash.color.a = 0.35
	var tween: Tween = create_tween()
	tween.tween_property(damage_flash, "color:a", 0.0, 0.4)

func _on_weapon_changed(index: int) -> void:
	current_weapon_index = index
	_refresh_weapon_panel()
	var is_knife: bool = index == KNIFE_WEAPON_INDEX
	knife_cooldown_bg.visible = is_knife
	knife_cooldown_fill.visible = is_knife

func _on_knife_cooldown_changed(fraction: float) -> void:
	var ready_fraction: float = 1.0 - fraction
	knife_cooldown_fill.size.x = KNIFE_BAR_WIDTH * ready_fraction
	knife_cooldown_fill.color = Color(0.6, 0.55, 0.4, 1) if ready_fraction >= 1.0 else Color(0.4, 0.38, 0.32, 1)

func _on_hit_marker_triggered() -> void:
	hit_marker.visible = true
	hit_marker.modulate.a = 1.0
	var tween: Tween = create_tween()
	tween.tween_property(hit_marker, "modulate:a", 0.0, 0.25)
	tween.tween_callback(func() -> void:
		hit_marker.visible = false
	)

func _refresh_weapon_panel() -> void:
	var lines: Array = []
	for i in weapon_names.size():
		var weapon_name: String = weapon_names[i]
		if i == current_weapon_index:
			lines.append("[color=#8fdc8f]> %d. %s[/color]" % [i + 1, weapon_name])
		else:
			lines.append("      %d. %s" % [i + 1, weapon_name])
	weapon_panel_text.text = "\n".join(lines)

func _on_weapon_panel_visibility_changed(is_open: bool) -> void:
	weapon_panel_bg.visible = is_open
	weapon_panel_text.visible = is_open

func _on_scope_active_changed(active: bool) -> void:
	scope_overlay.visible = active
	scope_reticle_h.visible = active
	scope_reticle_v.visible = active
	crosshair.visible = not active

func _build_scope_mask_texture() -> ImageTexture:
	var w := 320
	var h := 180
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	var center := Vector2(w / 2.0, h / 2.0)
	var radius: float = h * 0.46
	var edge: float = h * 0.05
	for y in h:
		for x in w:
			var d: float = Vector2(x, y).distance_to(center)
			var alpha: float = clamp((d - radius) / edge, 0.0, 1.0)
			img.set_pixel(x, y, Color(0.0, 0.0, 0.0, alpha))
	return ImageTexture.create_from_image(img)

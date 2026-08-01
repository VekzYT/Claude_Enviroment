extends CanvasLayer

const MAX_HEALTH_DISPLAY := 100
const HEALTH_BAR_WIDTH := 300.0

@onready var score_label: Label = $ScoreLabel
@onready var health_bar_fill: ColorRect = $HealthBarFill
@onready var health_bar_label: Label = $HealthBarLabel
@onready var damage_flash: ColorRect = $DamageFlash
@onready var crosshair: Label = $Crosshair

@onready var weapon_panel_bg: ColorRect = $WeaponPanelBG
@onready var weapon_panel_text: RichTextLabel = $WeaponPanelText

@onready var scope_overlay: TextureRect = $ScopeOverlay
@onready var scope_reticle_h: ColorRect = $ScopeReticleH
@onready var scope_reticle_v: ColorRect = $ScopeReticleV

var last_health := 100
var current_weapon_index := 1
var weapon_names: Array = ["Sniper", "Handgun", "Knife"]

func _ready() -> void:
	GameState.score_changed.connect(_on_score_changed)
	GameState.health_changed.connect(_on_health_changed)
	GameState.weapon_changed.connect(_on_weapon_changed)
	GameState.weapon_panel_visibility_changed.connect(_on_weapon_panel_visibility_changed)
	GameState.scope_active_changed.connect(_on_scope_active_changed)

	_on_score_changed(GameState.score)
	last_health = GameState.player_health
	_on_health_changed(GameState.player_health)
	_on_weapon_changed(GameState.current_weapon)
	_on_weapon_panel_visibility_changed(GameState.weapon_panel_open)
	_on_scope_active_changed(GameState.scope_active)

	scope_overlay.texture = _build_scope_mask_texture()

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

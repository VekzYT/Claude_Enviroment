extends CanvasLayer

const MAX_HEALTH_DISPLAY := 100
const HEALTH_BAR_WIDTH := 300.0

@onready var score_label: Label = $ScoreLabel
@onready var health_bar_fill: ColorRect = $HealthBarFill
@onready var health_bar_label: Label = $HealthBarLabel
@onready var damage_flash: ColorRect = $DamageFlash

var last_health := 100

func _ready() -> void:
	GameState.score_changed.connect(_on_score_changed)
	GameState.health_changed.connect(_on_health_changed)
	_on_score_changed(GameState.score)
	last_health = GameState.player_health
	_on_health_changed(GameState.player_health)

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

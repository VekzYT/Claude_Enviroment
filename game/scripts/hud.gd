extends CanvasLayer

@onready var score_label: Label = $ScoreLabel
@onready var health_label: Label = $HealthLabel
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
	health_label.text = "Health: %d" % new_health
	if new_health < last_health:
		flash_damage()
	last_health = new_health

func flash_damage() -> void:
	damage_flash.color.a = 0.35
	var tween: Tween = create_tween()
	tween.tween_property(damage_flash, "color:a", 0.0, 0.4)

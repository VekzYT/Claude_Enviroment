extends CanvasLayer

@onready var score_label: Label = $ScoreLabel

func _ready() -> void:
	GameState.score_changed.connect(_on_score_changed)
	_on_score_changed(GameState.score)

func _on_score_changed(new_score: int) -> void:
	score_label.text = "Score: %d" % new_score

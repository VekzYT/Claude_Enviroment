extends Node

signal score_changed(new_score: int)
signal health_changed(new_health: int)

var score := 0
var player_health := 100

func add_point() -> void:
	score += 1
	score_changed.emit(score)

func set_player_health(value: int) -> void:
	player_health = value
	health_changed.emit(player_health)

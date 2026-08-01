extends Node

signal score_changed(new_score: int)

var score := 0

func add_point() -> void:
	score += 1
	score_changed.emit(score)

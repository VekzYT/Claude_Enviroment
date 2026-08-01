extends Node

signal score_changed(new_score: int)
signal health_changed(new_health: int)
signal weapon_changed(index: int)
signal weapon_panel_visibility_changed(is_open: bool)
signal scope_active_changed(active: bool)

var score := 0
var player_health := 100
var current_weapon := 1
var weapon_panel_open := false
var scope_active := false

func add_point() -> void:
	score += 1
	score_changed.emit(score)

func set_player_health(value: int) -> void:
	player_health = value
	health_changed.emit(player_health)

func set_current_weapon(index: int) -> void:
	current_weapon = index
	weapon_changed.emit(current_weapon)

func set_weapon_panel_open(value: bool) -> void:
	weapon_panel_open = value
	weapon_panel_visibility_changed.emit(weapon_panel_open)

func set_scope_active(value: bool) -> void:
	scope_active = value
	scope_active_changed.emit(scope_active)

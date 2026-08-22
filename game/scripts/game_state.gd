extends Node

signal score_changed(new_score: int)
signal health_changed(new_health: int)
signal weapon_changed(index: int)
signal weapon_panel_visibility_changed(is_open: bool)
signal scope_active_changed(active: bool)
signal knife_cooldown_changed(fraction: float)
signal hit_marker_triggered
signal landmark_discovered(landmark_name: String)
signal supply_collected(count: int, total: int)

const SUPPLIES_TOTAL := 8

var score := 0
var player_health := 100
var current_weapon := 1
var weapon_panel_open := false
var scope_active := false
var knife_cooldown_fraction := 0.0
var supplies_collected := 0

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

func set_knife_cooldown(fraction: float) -> void:
	knife_cooldown_fraction = fraction
	knife_cooldown_changed.emit(knife_cooldown_fraction)

func trigger_hit_marker() -> void:
	hit_marker_triggered.emit()

func discover_landmark(landmark_name: String) -> void:
	landmark_discovered.emit(landmark_name)

func collect_supply() -> void:
	supplies_collected += 1
	supply_collected.emit(supplies_collected, SUPPLIES_TOTAL)

func reset() -> void:
	supplies_collected = 0
	score = 0
	score_changed.emit(score)
	player_health = 100
	health_changed.emit(player_health)
	current_weapon = 1
	weapon_changed.emit(current_weapon)
	weapon_panel_open = false
	weapon_panel_visibility_changed.emit(weapon_panel_open)
	scope_active = false
	scope_active_changed.emit(scope_active)
	knife_cooldown_fraction = 0.0
	knife_cooldown_changed.emit(knife_cooldown_fraction)

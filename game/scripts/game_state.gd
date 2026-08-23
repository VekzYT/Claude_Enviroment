extends Node

signal score_changed(new_score: int)
signal health_changed(new_health: int)
signal weapon_changed(index: int)
signal scope_active_changed(active: bool)
signal knife_cooldown_changed(fraction: float)
signal hit_marker_triggered
signal landmark_discovered(landmark_name: String)
signal supply_collected(count: int, total: int)
signal held_item_changed(title: String)
signal interact_prompt_changed(text: String)
signal wood_changed(amount: int)
signal stamina_changed(fraction: float)
signal announced(text: String)

const SUPPLIES_TOTAL := 8

var score := 0
var player_health := 100
var current_weapon := 1
var scope_active := false
var knife_cooldown_fraction := 0.0
var supplies_collected := 0
var held_item := "Bare hands"
var interact_prompt := ""
var wood := 0
var stamina := 1.0

func add_point() -> void:
	score += 1
	score_changed.emit(score)

func set_player_health(value: int) -> void:
	player_health = value
	health_changed.emit(player_health)

func set_current_weapon(index: int) -> void:
	current_weapon = index
	weapon_changed.emit(current_weapon)

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

func set_held_item(title: String) -> void:
	held_item = title
	held_item_changed.emit(held_item)

func set_interact_prompt(text: String) -> void:
	if text == interact_prompt:
		return
	interact_prompt = text
	interact_prompt_changed.emit(interact_prompt)

func set_stamina(fraction: float) -> void:
	var f: float = clampf(fraction, 0.0, 1.0)
	if is_equal_approx(f, stamina):
		return
	stamina = f
	stamina_changed.emit(stamina)

func add_wood(amount: int) -> void:
	wood += amount
	wood_changed.emit(wood)

func announce(text: String) -> void:
	announced.emit(text)

func reset() -> void:
	supplies_collected = 0
	wood = 0
	wood_changed.emit(wood)
	stamina = 1.0
	stamina_changed.emit(stamina)
	held_item = "Bare hands"
	held_item_changed.emit(held_item)
	interact_prompt = ""
	interact_prompt_changed.emit(interact_prompt)
	score = 0
	score_changed.emit(score)
	player_health = 100
	health_changed.emit(player_health)
	current_weapon = 1
	weapon_changed.emit(current_weapon)
	scope_active = false
	scope_active_changed.emit(scope_active)
	knife_cooldown_fraction = 0.0
	knife_cooldown_changed.emit(knife_cooldown_fraction)

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
signal day_changed(day: int)
signal time_changed(time_of_day: float)
signal carry_changed(carrying: bool)
signal map_visibility_changed(open: bool)
signal inventory_visibility_changed(open: bool)
signal hunger_changed(fraction: float)
signal apples_changed(count: int)
signal map_known_changed(known: bool)

const SUPPLIES_TOTAL := 8
# The horde is not implemented yet, but everything counts down to it: the day
# chip, the warnings, and the reason to go trade instead of sitting at home.
const HORDE_DAY := 10

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
var day := 1
# 0 is midnight, 0.5 is noon. The clock starts a little after sunrise.
var time_of_day := 0.30
var carrying_log := false
var map_open := false
var inventory_open := false
# 1 is full, 0 is starving. Drains over roughly three days of walking around.
var hunger := 1.0
var apples := 0
# Set the first time the chart on the cabin table is read; after that the map
# can be opened from anywhere.
var map_known := false

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

func set_day(value: int) -> void:
	if value == day:
		return
	day = value
	day_changed.emit(day)

func set_time_of_day(value: float) -> void:
	time_of_day = value
	time_changed.emit(time_of_day)

func set_carrying_log(value: bool) -> void:
	if value == carrying_log:
		return
	carrying_log = value
	carry_changed.emit(carrying_log)

func set_map_open(value: bool) -> void:
	if value == map_open:
		return
	map_open = value
	map_visibility_changed.emit(map_open)

func set_inventory_open(value: bool) -> void:
	if value == inventory_open:
		return
	inventory_open = value
	inventory_visibility_changed.emit(inventory_open)

func set_hunger(fraction: float) -> void:
	var f: float = clampf(fraction, 0.0, 1.0)
	if is_equal_approx(f, hunger):
		return
	hunger = f
	hunger_changed.emit(hunger)

func add_apples(count: int) -> void:
	apples = maxi(apples + count, 0)
	apples_changed.emit(apples)

func learn_map() -> void:
	if map_known:
		return
	map_known = true
	map_known_changed.emit(map_known)

func days_until_horde() -> int:
	return maxi(HORDE_DAY - day, 0)

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
	day = 1
	day_changed.emit(day)
	time_of_day = 0.30
	time_changed.emit(time_of_day)
	carrying_log = false
	carry_changed.emit(carrying_log)
	map_open = false
	map_visibility_changed.emit(map_open)
	inventory_open = false
	inventory_visibility_changed.emit(inventory_open)
	hunger = 1.0
	hunger_changed.emit(hunger)
	apples = 0
	apples_changed.emit(apples)
	map_known = false
	map_known_changed.emit(map_known)
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

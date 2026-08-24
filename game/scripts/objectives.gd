extends Node

# The opening guide. A short list of steps that walks you through everything
# the game expects you to know how to do, in the order you would naturally do
# it, and then gets out of the way.
#
# Each step is a condition checked once a second rather than a web of signals,
# because the conditions are cheap and the alternative is wiring a dozen
# different systems into this one.

const STEPS := [
	{
		"text": "Take the axe from the chopping block",
		"hint": "It is outside the cabin door. Look at it and press E.",
	},
	{
		"text": "Fell a tree",
		"hint": "Find a trunk and swing with left click. Five bites will drop it.",
	},
	{
		"text": "Shoulder the log it leaves",
		"hint": "Look at the fallen log and press E. Both hands will be full.",
	},
	{
		"text": "Carry it to your chopping block",
		"hint": "Back at the cabin. Look at the block and press E to load it.",
	},
	{
		"text": "Split the log for firewood",
		"hint": "Swing the axe at the loaded block. Four splits gives 12 wood.",
	},
	{
		"text": "Read the map on the cabin table",
		"hint": "Inside the cabin. After reading it once, M opens it anywhere.",
	},
	{
		"text": "Hunt an animal",
		"hint": "Deer and boar wander the forest. Two or three axe blows will do it.",
	},
	{
		"text": "Light a fire, then cook on it",
		"hint": "Find flint, set it down beside firewood, and strike it with the axe.",
	},
	{
		"text": "Eat, and keep eating",
		"hint": "Press F. Watch the food bar under your stamina.",
	},
	{
		"text": "Trade with the pedlar",
		"hint": "He comes past the cabin from day 2. Wood and meat both fetch coin.",
	},
	{
		"text": "Buy a bow, and arrows for it",
		"hint": "The bow is no use empty. Press 4 to draw it.",
	},
]

var index := 0
var finished := false
var check_timer := 0.0
var player: Node = null
var block: Node = null
var felled_any := false
var log_carried := false
var block_loaded_seen := false
var ate_once := false

func _ready() -> void:
	add_to_group("objectives")
	GameState.tree_felled.connect(func() -> void: felled_any = true)
	GameState.carry_changed.connect(func(carrying: bool) -> void:
		if carrying:
			log_carried = true
	)
	# No timer: the HUD pulls the current step once it has built itself, so the
	# guide cannot lose the race against whichever _ready() runs first.

func _process(delta: float) -> void:
	if finished:
		return
	check_timer += delta
	if check_timer < 0.5:
		return
	check_timer = 0.0
	if player == null or not is_instance_valid(player):
		player = get_tree().get_first_node_in_group("player")
	if block == null or not is_instance_valid(block):
		block = get_tree().get_first_node_in_group("chopping_block")
	if block != null and bool(block.get("loaded")):
		block_loaded_seen = true
	if GameState.hunger < 0.999:
		# Only counts once something has actually been eaten back up.
		pass
	if _is_done(index):
		_advance()

func _is_done(step: int) -> bool:
	match step:
		0:
			return player != null and bool((player.get("owned") as Array)[4])
		1:
			return felled_any
		2:
			return log_carried
		3:
			return block_loaded_seen
		4:
			return GameState.wood >= 12
		5:
			return GameState.map_known
		6:
			return GameState.raw_meat > 0 or GameState.cooked_meat > 0
		7:
			return GameState.cooked_meat > 0 and GameState.any_fire_lit
		8:
			return ate_once
		9:
			return GameState.coins > 0
		10:
			return GameState.bow_owned and GameState.arrows > 0
		_:
			return false
	return false

# What the HUD asks for on startup: [text, hint, index, total], or empty when
# the guide is finished.
func current() -> Array:
	if finished or index >= STEPS.size():
		return []
	var step: Dictionary = STEPS[index]
	return [String(step["text"]), String(step["hint"]), index, STEPS.size()]

func note_ate() -> void:
	ate_once = true

func _advance() -> void:
	GameState.objective_completed.emit(String(STEPS[index]["text"]))
	Sound.play_ui("ui_toggle", -8.0)
	index += 1
	if index >= STEPS.size():
		finished = true
		GameState.objective_changed.emit("", "", STEPS.size(), STEPS.size())
		return
	_announce_current()

func _announce_current() -> void:
	if index >= STEPS.size():
		return
	var step: Dictionary = STEPS[index]
	GameState.objective_changed.emit(
		String(step["text"]), String(step["hint"]), index, STEPS.size())

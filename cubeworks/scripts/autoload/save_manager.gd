extends Node
## Persists a world: its seed, every block the player changed, where the player
## stood, what they carried and what time of day it was.
##
## Registered as the "SaveManager" autoload. Block edits live in memory as a
## sparse table (chunk -> {voxel index -> block id}), which is tiny compared to
## storing terrain: untouched chunks cost nothing because they are regenerated
## from the seed. The table is read by worker threads during chunk generation,
## so every access goes through a mutex.

const SAVE_DIR := "user://saves"
const SAVE_VERSION := 2

var _mutex := Mutex.new()
## Vector2i -> Dictionary[int, int]
var _edits: Dictionary = {}

# Everything below is written on save and read back on load.
var world_seed: int = 0
var world_name: String = "world"
var time_of_day: float = 0.30
var day_count: int = 0
var player_position := Vector3.ZERO
var player_yaw: float = 0.0
var player_pitch: float = 0.0
var player_health: float = 20.0
var inventory_data: Array = []
var has_player_state := false


func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)


# ------------------------------------------------------------- block edits

func record_edit(coord: Vector2i, index: int, id: int) -> void:
	_mutex.lock()
	var table: Dictionary = _edits.get(coord, {})
	table[index] = id
	_edits[coord] = table
	_mutex.unlock()


## Thread-safe copy of one chunk's edits. Returns an empty dictionary for the
## overwhelming majority of chunks, which nobody has touched.
func get_chunk_edits(coord: Vector2i) -> Dictionary:
	_mutex.lock()
	var table: Dictionary = _edits.get(coord, {})
	var copy := table.duplicate()
	_mutex.unlock()
	return copy


func edit_count() -> int:
	_mutex.lock()
	var total := 0
	for coord in _edits:
		total += (_edits[coord] as Dictionary).size()
	_mutex.unlock()
	return total


func clear_edits() -> void:
	_mutex.lock()
	_edits.clear()
	_mutex.unlock()


# ------------------------------------------------------------ save / load

func path_for(name: String) -> String:
	return "%s/%s.cwsave" % [SAVE_DIR, name]


func world_exists(name: String) -> bool:
	return FileAccess.file_exists(path_for(name))


func list_worlds() -> Array:
	var out: Array = []
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null:
		return out
	dir.list_dir_begin()
	var file := dir.get_next()
	while file != "":
		if not dir.current_is_dir() and file.ends_with(".cwsave"):
			out.append(file.get_basename())
		file = dir.get_next()
	dir.list_dir_end()
	out.sort()
	return out


## Starts a brand new world in memory. Nothing is written until save_world().
func begin_new_world(name: String, seed_value: int) -> void:
	clear_edits()
	world_name = name
	world_seed = seed_value
	time_of_day = 0.30
	day_count = 0
	player_position = Vector3.ZERO
	player_yaw = 0.0
	player_pitch = 0.0
	player_health = 20.0
	inventory_data = []
	has_player_state = false


func save_world() -> bool:
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)
	var file := FileAccess.open(path_for(world_name), FileAccess.WRITE)
	if file == null:
		push_error("Cubeworks: could not write save file %s" % path_for(world_name))
		return false

	_mutex.lock()
	var edits_copy := _edits.duplicate(true)
	_mutex.unlock()

	var payload := {
		"version": SAVE_VERSION,
		"seed": world_seed,
		"name": world_name,
		"time_of_day": time_of_day,
		"day_count": day_count,
		"player": {
			"position": player_position,
			"yaw": player_yaw,
			"pitch": player_pitch,
			"health": player_health,
		},
		"inventory": inventory_data,
		"edits": edits_copy,
	}
	file.store_var(payload, false)
	file.close()
	return true


func load_world(name: String) -> bool:
	var path := path_for(name)
	if not FileAccess.file_exists(path):
		return false
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return false
	var payload = file.get_var(false)
	file.close()
	if typeof(payload) != TYPE_DICTIONARY:
		push_error("Cubeworks: save file %s is unreadable" % path)
		return false

	world_name = name
	world_seed = int(payload.get("seed", 0))
	time_of_day = float(payload.get("time_of_day", 0.3))
	day_count = int(payload.get("day_count", 0))
	inventory_data = payload.get("inventory", [])

	var p: Dictionary = payload.get("player", {})
	player_position = p.get("position", Vector3.ZERO)
	player_yaw = float(p.get("yaw", 0.0))
	player_pitch = float(p.get("pitch", 0.0))
	player_health = float(p.get("health", 20.0))
	has_player_state = not p.is_empty()

	_mutex.lock()
	_edits = payload.get("edits", {})
	_mutex.unlock()
	return true


func delete_world(name: String) -> void:
	var path := path_for(name)
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path))

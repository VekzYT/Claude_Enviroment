extends Node

# The game's audio. Everything it plays was synthesised by tools/make_sfx.py and
# tools/make_music.py, so the whole set shares one sample rate and one loudness
# target and nothing needs riding on a fader at the call site.
#
# Three jobs live here:
#
#   one-shots   pooled players, 2D for UI and 3D for anything with a position
#   ambience    a day bed and a night bed, crossfaded by the clock
#   music       three tracks, crossfaded by where you are and what day it is
#
# Voices are pooled rather than allocated per sound. Felling a tree can fire a
# dozen overlapping hits, and a fresh AudioStreamPlayer3D for each one is both
# an allocation and a node the scene tree has to clean up mid-swing.

const POOL_2D := 12
const POOL_3D := 24

# How far a 3D sound carries. Anything sharp enough to matter at distance --
# a tree coming down -- overrides this at the call site.
const DEFAULT_MAX_DISTANCE := 42.0
const MUSIC_FADE := 2.5
const AMBIENCE_FADE := 6.0

# Ambience and music both key off the clock; these are the boundaries.
const DAWN := 0.22
const DUSK := 0.76
# The day the score turns.
const TENSION_DAY := 8

var streams: Dictionary = {}
var variants: Dictionary = {}

var pool_2d: Array[AudioStreamPlayer] = []
var pool_3d: Array[AudioStreamPlayer3D] = []
var next_2d := 0
var next_3d := 0

var amb_day: AudioStreamPlayer = null
var amb_night: AudioStreamPlayer = null
var music_players: Dictionary = {}
var music_target := ""
var in_menu := true

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_library()
	_build_pools()
	_build_ambience()
	_build_music()
	GameState.day_changed.connect(func(_d: int) -> void: _choose_music())
	_choose_music()

# ------------------------------------------------------------------- library

func _try(path: String) -> AudioStream:
	if not ResourceLoader.exists(path):
		return null
	return load(path) as AudioStream

# Registers a name, and collects `name_0`, `name_1`... as random variants of it.
func _register(name: String) -> void:
	var single: AudioStream = _try("res://audio/sfx/%s.wav" % name)
	if single == null:
		single = _try("res://audio/sfx/%s.ogg" % name)
	if single != null:
		streams[name] = single

func _register_set(name: String, count: int) -> void:
	var list: Array[AudioStream] = []
	for i in count:
		var s: AudioStream = _try("res://audio/sfx/%s_%d.wav" % [name, i])
		if s != null:
			list.append(s)
	if not list.is_empty():
		variants[name] = list

func _load_library() -> void:
	for surface in ["grass", "dirt", "wood", "stone", "water"]:
		_register_set("step_" + surface, 6)

	for name in [
		"jump", "land_soft", "land_hard", "crouch_down", "crouch_up", "winded",
		"axe_swing", "swing_light", "axe_hit_wood", "axe_hit_stone", "axe_split",
		"tree_creak", "tree_fall",
		"bow_draw", "bow_release", "arrow_flight",
		"arrow_hit_wood", "arrow_hit_flesh", "arrow_hit_ground",
		"pickup_item", "pickup_wood", "pickup_food", "pickup_meat",
		"pickup_flint", "pickup_coin", "place_item", "eat", "weapon_switch",
		"ui_click", "ui_hover", "ui_open", "ui_close", "ui_buy", "ui_denied",
		"ui_objective", "ui_discover", "day_change", "lamp_on", "lamp_off",
		"fire_ignite", "fire_loop", "cook_sizzle", "cook_done",
		"deer_call", "boar_grunt", "hare_squeak", "animal_hurt", "animal_death",
		"player_hurt", "player_death",
		"build_place", "build_remove", "build_cycle", "door_open", "door_close",
		"amb_forest_day", "amb_forest_night", "amb_wind", "amb_water",
	]:
		_register(name)

	for name in ["music_menu", "music_explore", "music_tension"]:
		var s: AudioStream = _try("res://audio/music/%s.ogg" % name)
		if s != null:
			if s is AudioStreamOggVorbis:
				(s as AudioStreamOggVorbis).loop = true
			streams[name] = s

	# Loops have to be told they loop; a WAV import defaults to one-shot.
	for name in ["fire_loop", "cook_sizzle", "amb_forest_day", "amb_forest_night",
			"amb_wind", "amb_water"]:
		var s: AudioStream = streams.get(name)
		if s is AudioStreamOggVorbis:
			(s as AudioStreamOggVorbis).loop = true
		elif s is AudioStreamWAV:
			(s as AudioStreamWAV).loop_mode = AudioStreamWAV.LOOP_FORWARD
			(s as AudioStreamWAV).loop_end = (s as AudioStreamWAV).data.size() / 2

func _resolve(name: String) -> AudioStream:
	if variants.has(name):
		var list: Array = variants[name]
		return list[randi() % list.size()]
	return streams.get(name)

func has(name: String) -> bool:
	return streams.has(name) or variants.has(name)

# --------------------------------------------------------------------- pools

func _build_pools() -> void:
	for i in POOL_2D:
		var p := AudioStreamPlayer.new()
		p.bus = "SFX"
		p.process_mode = Node.PROCESS_MODE_ALWAYS
		add_child(p)
		pool_2d.append(p)
	for i in POOL_3D:
		var p3 := AudioStreamPlayer3D.new()
		p3.bus = "SFX"
		p3.max_distance = DEFAULT_MAX_DISTANCE
		p3.unit_size = 6.0
		p3.attenuation_model = AudioStreamPlayer3D.ATTENUATION_INVERSE_DISTANCE
		add_child(p3)
		pool_3d.append(p3)

# Prefers a free voice; if every one is busy it steals the oldest, which is
# what keeps a burst of hits from going silent halfway through.
func _take_2d() -> AudioStreamPlayer:
	for i in pool_2d.size():
		var idx: int = (next_2d + i) % pool_2d.size()
		if not pool_2d[idx].playing:
			next_2d = (idx + 1) % pool_2d.size()
			return pool_2d[idx]
	var victim: AudioStreamPlayer = pool_2d[next_2d]
	next_2d = (next_2d + 1) % pool_2d.size()
	return victim

func _take_3d() -> AudioStreamPlayer3D:
	for i in pool_3d.size():
		var idx: int = (next_3d + i) % pool_3d.size()
		if not pool_3d[idx].playing:
			next_3d = (idx + 1) % pool_3d.size()
			return pool_3d[idx]
	var victim: AudioStreamPlayer3D = pool_3d[next_3d]
	next_3d = (next_3d + 1) % pool_3d.size()
	return victim

# ------------------------------------------------------------------ playback

func play_ui(sound_name: String, volume_db: float = 0.0) -> void:
	var stream: AudioStream = _resolve(sound_name)
	if stream == null:
		return
	var p: AudioStreamPlayer = _take_2d()
	p.stream = stream
	p.volume_db = volume_db
	p.pitch_scale = 1.0
	p.play()

func play_2d(sound_name: String, volume_db: float = 0.0,
		pitch_variance: float = 0.05) -> void:
	var stream: AudioStream = _resolve(sound_name)
	if stream == null:
		return
	var p: AudioStreamPlayer = _take_2d()
	p.stream = stream
	p.volume_db = volume_db
	p.pitch_scale = 1.0 + randf_range(-pitch_variance, pitch_variance)
	p.play()

func play_3d(sound_name: String, position: Vector3, volume_db: float = 0.0,
		pitch_variance: float = 0.06, max_distance: float = 0.0) -> void:
	var stream: AudioStream = _resolve(sound_name)
	if stream == null:
		return
	var p: AudioStreamPlayer3D = _take_3d()
	p.stream = stream
	p.global_position = position
	p.volume_db = volume_db
	p.max_distance = max_distance if max_distance > 0.0 else DEFAULT_MAX_DISTANCE
	p.pitch_scale = 1.0 + randf_range(-pitch_variance, pitch_variance)
	p.play()

# A footstep on whatever you are standing on. Falls back to dirt so a surface
# nobody has written a set for still makes a noise.
func play_step(surface: String, position: Vector3, volume_db: float = -9.0) -> void:
	var key: String = "step_" + surface
	if not variants.has(key):
		key = "step_dirt"
	play_3d(key, position, volume_db, 0.11)

# For things that hold a sound while they exist -- a fire, a pot on the boil.
# Returns the player so the caller can stop it; it is theirs to free.
func attach_loop(sound_name: String, parent: Node3D, volume_db: float = -12.0,
		max_distance: float = 24.0) -> AudioStreamPlayer3D:
	var stream: AudioStream = _resolve(sound_name)
	if stream == null or parent == null:
		return null
	var p := AudioStreamPlayer3D.new()
	p.stream = stream
	p.bus = "SFX"
	p.volume_db = volume_db
	p.max_distance = max_distance
	p.unit_size = 4.0
	p.attenuation_model = AudioStreamPlayer3D.ATTENUATION_INVERSE_DISTANCE
	parent.add_child(p)
	p.play()
	return p

# ------------------------------------------------------------------ ambience

func _bed(name: String, volume_db: float) -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	p.stream = _resolve(name)
	p.bus = "SFX"
	p.volume_db = volume_db
	p.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(p)
	if p.stream != null:
		p.play()
	return p

func _build_ambience() -> void:
	amb_day = _bed("amb_forest_day", -60.0)
	amb_night = _bed("amb_forest_night", -60.0)

func _process(delta: float) -> void:
	_update_ambience(delta)
	_update_music(delta)

func _update_ambience(delta: float) -> void:
	if amb_day == null or amb_night == null:
		return
	# Silent on the menu, where the music carries the whole thing.
	var day_level := -60.0
	var night_level := -60.0
	if not in_menu:
		var tod: float = GameState.time_of_day
		var daylight: float = 0.0
		if tod < DAWN:
			daylight = 0.0
		elif tod < DAWN + 0.1:
			daylight = (tod - DAWN) / 0.1
		elif tod < DUSK:
			daylight = 1.0
		elif tod < DUSK + 0.1:
			daylight = 1.0 - (tod - DUSK) / 0.1
		daylight = clampf(daylight, 0.0, 1.0)
		day_level = lerpf(-60.0, -16.0, daylight)
		night_level = lerpf(-60.0, -18.0, 1.0 - daylight)
	var step: float = delta * (60.0 / AMBIENCE_FADE)
	amb_day.volume_db = move_toward(amb_day.volume_db, day_level, step)
	amb_night.volume_db = move_toward(amb_night.volume_db, night_level, step)

# --------------------------------------------------------------------- music

func _build_music() -> void:
	for name in ["music_menu", "music_explore", "music_tension"]:
		var p := AudioStreamPlayer.new()
		p.stream = streams.get(name)
		p.bus = "Music"
		p.volume_db = -60.0
		p.process_mode = Node.PROCESS_MODE_ALWAYS
		add_child(p)
		if p.stream != null:
			p.play()
		music_players[name] = p

# All three tracks run the whole time and only their faders move, so switching
# lands on the beat you were already on rather than restarting the bar.
func _choose_music() -> void:
	if in_menu:
		music_target = "music_menu"
	elif GameState.day >= TENSION_DAY:
		music_target = "music_tension"
	else:
		music_target = "music_explore"

func _update_music(delta: float) -> void:
	var step: float = delta * (60.0 / MUSIC_FADE)
	for name in music_players:
		var p: AudioStreamPlayer = music_players[name]
		var wanted: float = -6.0 if name == music_target else -60.0
		p.volume_db = move_toward(p.volume_db, wanted, step)

func set_in_menu(value: bool) -> void:
	in_menu = value
	_choose_music()

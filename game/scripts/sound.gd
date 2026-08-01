extends Node

var streams: Dictionary = {}
var footstep_streams: Array = []
var music_player: AudioStreamPlayer

func _ready() -> void:
	_load_sounds()
	music_player = AudioStreamPlayer.new()
	music_player.stream = streams["music"]
	music_player.volume_db = -9.0
	music_player.bus = "Music"
	music_player.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(music_player)
	music_player.play()

func play_3d(sound_name: String, position: Vector3, volume_db: float = 0.0, pitch_variance: float = 0.06) -> void:
	var stream: AudioStream = _resolve_stream(sound_name)
	if stream == null:
		return
	var player := AudioStreamPlayer3D.new()
	player.stream = stream
	player.volume_db = volume_db
	player.bus = "SFX"
	player.pitch_scale = 1.0 + randf_range(-pitch_variance, pitch_variance)
	player.max_distance = 45.0
	player.unit_size = 6.0
	get_tree().current_scene.add_child(player)
	player.global_position = position
	player.play()
	player.finished.connect(player.queue_free)

func play_ui(sound_name: String, volume_db: float = 0.0) -> void:
	var stream: AudioStream = _resolve_stream(sound_name)
	if stream == null:
		return
	var player := AudioStreamPlayer.new()
	player.stream = stream
	player.volume_db = volume_db
	player.bus = "SFX"
	add_child(player)
	player.play()
	player.finished.connect(player.queue_free)

func _resolve_stream(sound_name: String):
	if sound_name == "footstep":
		if footstep_streams.is_empty():
			return null
		var index: int = randi() % footstep_streams.size()
		return footstep_streams[index]
	if streams.has(sound_name):
		return streams[sound_name]
	return null

func _load_sounds() -> void:
	streams["handgun_shot"] = load("res://audio/sfx/handgun_shot.wav")
	streams["sniper_shot"] = load("res://audio/sfx/sniper_shot.wav")
	streams["bot_shot"] = load("res://audio/sfx/bot_shot.wav")
	streams["reload_click"] = load("res://audio/sfx/reload_click.wav")
	streams["bolt_cycle"] = load("res://audio/sfx/bolt_cycle.wav")
	streams["knife_swing"] = load("res://audio/sfx/knife_swing.ogg")
	streams["knife_hit"] = load("res://audio/sfx/knife_hit.ogg")
	streams["jump"] = load("res://audio/sfx/jump.ogg")
	streams["land"] = load("res://audio/sfx/land.ogg")
	streams["player_hurt"] = load("res://audio/sfx/player_hurt.ogg")
	streams["bot_death"] = load("res://audio/sfx/bot_death.ogg")
	streams["target_hit"] = load("res://audio/sfx/target_hit.ogg")
	streams["weapon_switch"] = load("res://audio/sfx/weapon_switch.ogg")
	streams["ui_toggle"] = load("res://audio/sfx/ui_toggle.ogg")
	streams["bot_alert"] = load("res://audio/sfx/bot_alert.ogg")

	footstep_streams = [
		load("res://audio/sfx/footstep_00.ogg"),
		load("res://audio/sfx/footstep_01.ogg"),
		load("res://audio/sfx/footstep_02.ogg"),
		load("res://audio/sfx/footstep_03.ogg"),
		load("res://audio/sfx/footstep_04.ogg"),
	]

	var music_stream = load("res://audio/music/theme.mp3")
	music_stream.loop = true
	streams["music"] = music_stream

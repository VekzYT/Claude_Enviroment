extends Node

const CONFIG_PATH := "user://settings.cfg"

var master_volume := 1.0
var music_volume := 0.8
var sfx_volume := 1.0
var mouse_sensitivity := 1.0

func _ready() -> void:
	_ensure_bus("Music")
	_ensure_bus("SFX")
	load_settings()
	apply_audio()

func _ensure_bus(bus_name: String) -> void:
	if AudioServer.get_bus_index(bus_name) == -1:
		var idx: int = AudioServer.bus_count
		AudioServer.add_bus(idx)
		AudioServer.set_bus_name(idx, bus_name)
		AudioServer.set_bus_send(idx, "Master")

func set_master_volume(value: float) -> void:
	master_volume = value
	apply_audio()
	save_settings()

func set_music_volume(value: float) -> void:
	music_volume = value
	apply_audio()
	save_settings()

func set_sfx_volume(value: float) -> void:
	sfx_volume = value
	apply_audio()
	save_settings()

func set_mouse_sensitivity(value: float) -> void:
	mouse_sensitivity = value
	save_settings()

func apply_audio() -> void:
	var master_idx: int = AudioServer.get_bus_index("Master")
	AudioServer.set_bus_volume_db(master_idx, linear_to_db(max(master_volume, 0.0001)))
	var music_idx: int = AudioServer.get_bus_index("Music")
	if music_idx != -1:
		AudioServer.set_bus_volume_db(music_idx, linear_to_db(max(music_volume, 0.0001)))
	var sfx_idx: int = AudioServer.get_bus_index("SFX")
	if sfx_idx != -1:
		AudioServer.set_bus_volume_db(sfx_idx, linear_to_db(max(sfx_volume, 0.0001)))

func save_settings() -> void:
	var config := ConfigFile.new()
	config.set_value("audio", "master", master_volume)
	config.set_value("audio", "music", music_volume)
	config.set_value("audio", "sfx", sfx_volume)
	config.set_value("controls", "sensitivity", mouse_sensitivity)
	config.save(CONFIG_PATH)

func load_settings() -> void:
	var config := ConfigFile.new()
	var err: int = config.load(CONFIG_PATH)
	if err != OK:
		return
	master_volume = config.get_value("audio", "master", master_volume)
	music_volume = config.get_value("audio", "music", music_volume)
	sfx_volume = config.get_value("audio", "sfx", sfx_volume)
	mouse_sensitivity = config.get_value("controls", "sensitivity", mouse_sensitivity)

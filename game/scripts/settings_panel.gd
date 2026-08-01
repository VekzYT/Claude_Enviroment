extends Control

signal back_pressed

@onready var master_slider: HSlider = $BoxBorder/Box/Content/MasterRow/MasterSlider
@onready var music_slider: HSlider = $BoxBorder/Box/Content/MusicRow/MusicSlider
@onready var sfx_slider: HSlider = $BoxBorder/Box/Content/SFXRow/SFXSlider
@onready var sens_slider: HSlider = $BoxBorder/Box/Content/SensRow/SensSlider
@onready var master_value: Label = $BoxBorder/Box/Content/MasterRow/MasterValue
@onready var music_value: Label = $BoxBorder/Box/Content/MusicRow/MusicValue
@onready var sfx_value: Label = $BoxBorder/Box/Content/SFXRow/SFXValue
@onready var sens_value: Label = $BoxBorder/Box/Content/SensRow/SensValue
@onready var back_button: Button = $BoxBorder/Box/Content/BackButton

func _ready() -> void:
	master_slider.value = Settings.master_volume
	music_slider.value = Settings.music_volume
	sfx_slider.value = Settings.sfx_volume
	sens_slider.value = Settings.mouse_sensitivity
	_update_labels()

	master_slider.value_changed.connect(_on_master_changed)
	music_slider.value_changed.connect(_on_music_changed)
	sfx_slider.value_changed.connect(_on_sfx_changed)
	sens_slider.value_changed.connect(_on_sens_changed)
	back_button.pressed.connect(_on_back_pressed)

func _update_labels() -> void:
	master_value.text = "%d%%" % int(round(master_slider.value * 100.0))
	music_value.text = "%d%%" % int(round(music_slider.value * 100.0))
	sfx_value.text = "%d%%" % int(round(sfx_slider.value * 100.0))
	sens_value.text = "%d%%" % int(round(sens_slider.value * 100.0))

func _on_master_changed(value: float) -> void:
	Settings.set_master_volume(value)
	_update_labels()

func _on_music_changed(value: float) -> void:
	Settings.set_music_volume(value)
	_update_labels()

func _on_sfx_changed(value: float) -> void:
	Settings.set_sfx_volume(value)
	_update_labels()

func _on_sens_changed(value: float) -> void:
	Settings.set_mouse_sensitivity(value)
	_update_labels()

func _on_back_pressed() -> void:
	back_pressed.emit()

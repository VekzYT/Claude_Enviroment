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
	theme = UITheme.menu_theme()
	_style()
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

# Pulls the panel into the shared visual language without touching its scene
# file, so the layout stays editable in the editor.
func _style() -> void:
	var border := get_node_or_null("BoxBorder") as ColorRect
	if border != null:
		border.color = UITheme.LINE
	var box := get_node_or_null("BoxBorder/Box") as ColorRect
	if box != null:
		box.color = Color(0.055, 0.062, 0.051, 0.97)
	for node in find_children("*", "Label", true, false):
		var label := node as Label
		label.add_theme_font_override("font", UITheme.body())
		label.add_theme_color_override("font_color", UITheme.TEXT_DIM)
	var title := get_node_or_null("BoxBorder/Box/Content/Title") as Label
	if title != null:
		title.add_theme_font_override("font", UITheme.display())
		title.add_theme_font_size_override("font_size", 28)
		title.add_theme_color_override("font_color", UITheme.TEXT)
	for node in [master_value, music_value, sfx_value, sens_value]:
		var value := node as Label
		value.add_theme_font_override("font", UITheme.body_bold())
		value.add_theme_color_override("font_color", UITheme.ACCENT)

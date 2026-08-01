extends Control

@onready var button_box: VBoxContainer = $ButtonBox
@onready var play_button: Button = $ButtonBox/PlayButton
@onready var settings_button: Button = $ButtonBox/SettingsButton
@onready var quit_button: Button = $ButtonBox/QuitButton
@onready var settings_panel: Control = $SettingsPanel

func _ready() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
	settings_panel.visible = false
	play_button.pressed.connect(_on_play_pressed)
	settings_button.pressed.connect(_on_settings_pressed)
	quit_button.pressed.connect(_on_quit_pressed)
	settings_panel.back_pressed.connect(_on_settings_back)

func _on_play_pressed() -> void:
	GameState.reset()
	get_tree().change_scene_to_file("res://scenes/main.tscn")

func _on_settings_pressed() -> void:
	button_box.visible = false
	settings_panel.visible = true

func _on_settings_back() -> void:
	settings_panel.visible = false
	button_box.visible = true

func _on_quit_pressed() -> void:
	get_tree().quit()

extends CanvasLayer

@onready var dimmer: ColorRect = $Dimmer
@onready var menu_box: Control = $MenuBox
@onready var resume_button: Button = $MenuBox/BoxBorder/Box/Content/ResumeButton
@onready var settings_button: Button = $MenuBox/BoxBorder/Box/Content/SettingsButton
@onready var quit_button: Button = $MenuBox/BoxBorder/Box/Content/QuitButton
@onready var settings_panel: Control = $SettingsPanel

var is_open := false

func _ready() -> void:
	process_mode = PROCESS_MODE_ALWAYS
	dimmer.visible = false
	menu_box.visible = false
	settings_panel.visible = false
	resume_button.pressed.connect(close)
	settings_button.pressed.connect(_on_settings_pressed)
	quit_button.pressed.connect(_on_quit_pressed)
	settings_panel.back_pressed.connect(_on_settings_back)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		if settings_panel.visible:
			_on_settings_back()
		elif is_open:
			close()
		else:
			open()

func open() -> void:
	is_open = true
	get_tree().paused = true
	dimmer.visible = true
	menu_box.visible = true
	Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)

func close() -> void:
	is_open = false
	get_tree().paused = false
	dimmer.visible = false
	menu_box.visible = false
	settings_panel.visible = false
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _on_settings_pressed() -> void:
	menu_box.visible = false
	settings_panel.visible = true

func _on_settings_back() -> void:
	settings_panel.visible = false
	menu_box.visible = true

func _on_quit_pressed() -> void:
	get_tree().paused = false
	GameState.reset()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

extends CanvasLayer

@onready var dimmer: ColorRect = $Dimmer
@onready var menu_box: Control = $MenuBox
@onready var resume_button: Button = $MenuBox/BoxBorder/Box/Content/ResumeButton
@onready var settings_button: Button = $MenuBox/BoxBorder/Box/Content/SettingsButton
@onready var quit_button: Button = $MenuBox/BoxBorder/Box/Content/QuitButton
@onready var settings_panel: Control = $SettingsPanel
@onready var title: Label = $MenuBox/BoxBorder/Box/Content/Title
@onready var box_border: ColorRect = $MenuBox/BoxBorder
@onready var box: ColorRect = $MenuBox/BoxBorder/Box
@onready var content: VBoxContainer = $MenuBox/BoxBorder/Box/Content

var is_open := false

func _ready() -> void:
	process_mode = PROCESS_MODE_ALWAYS
	# CanvasLayer carries no theme of its own -- it hangs on the Control inside.
	menu_box.theme = UITheme.menu_theme()
	box_border.color = UITheme.LINE
	box.color = Color(0.055, 0.062, 0.051, 0.97)
	title.add_theme_font_override("font", UITheme.display())
	title.add_theme_font_size_override("font_size", 30)
	title.add_theme_color_override("font_color", UITheme.TEXT)
	content.add_theme_constant_override("separation", 12)
	dimmer.color = Color(0, 0, 0, 0.62)
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
	Sound.play_ui("ui_toggle", -8.0)
	# The panel drops in even while the tree is paused, which is why the tween
	# has to be told to ignore the pause it was opened by.
	menu_box.modulate.a = 0.0
	box_border.position.y = -12.0
	var tween: Tween = create_tween()
	tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tween.set_parallel(true)
	tween.tween_property(menu_box, "modulate:a", 1.0, 0.14)
	tween.tween_property(box_border, "position:y", 0.0, 0.20).set_ease(Tween.EASE_OUT)
	resume_button.grab_focus()

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

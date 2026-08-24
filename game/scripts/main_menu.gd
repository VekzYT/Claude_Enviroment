extends Control

# The title screen paints its own backdrop rather than shipping an image: a
# dusk gradient with a warm band on the horizon, two mist layers drifting at
# different speeds, and the same vignette the in-game HUD uses.

const MIST_A_SPEED := 7.0
const MIST_B_SPEED := -11.0

@onready var backdrop: TextureRect = $Backdrop
@onready var mist_a: TextureRect = $MistA
@onready var mist_b: TextureRect = $MistB
@onready var vignette: TextureRect = $Vignette
@onready var title: Label = $Title
@onready var subtitle: Label = $Subtitle
@onready var tagline: Label = $Tagline
@onready var rule_left: ColorRect = $RuleLeft
@onready var rule_right: ColorRect = $RuleRight
@onready var footer: Label = $Footer
@onready var build_label: Label = $Build
@onready var button_box: VBoxContainer = $ButtonBox
@onready var play_button: Button = $ButtonBox/PlayButton
@onready var settings_button: Button = $ButtonBox/SettingsButton
@onready var quit_button: Button = $ButtonBox/QuitButton
@onready var settings_panel: Control = $SettingsPanel

var drift := 0.0
var mist_a_home := 0.0
var mist_b_home := 0.0

func _ready() -> void:
	Sound.set_in_menu(true)
	Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
	theme = UITheme.menu_theme()

	backdrop.texture = _build_backdrop()
	mist_a.texture = _build_mist(Color(0.62, 0.66, 0.60, 0.16))
	mist_b.texture = _build_mist(Color(0.50, 0.55, 0.52, 0.12))
	vignette.texture = UITheme.vignette_texture(Color(0, 0, 0, 0.8), 0.28, 1.05, 1.5)
	mist_a_home = mist_a.position.x
	mist_b_home = mist_b.position.x

	title.add_theme_font_override("font", UITheme.display())
	title.add_theme_font_size_override("font_size", 92)
	title.add_theme_color_override("font_color", Color(0.90, 0.89, 0.80, 1))
	# A soft dark drop keeps the title legible against the brightest part of the
	# horizon band without needing a panel behind it.
	title.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.65))
	title.add_theme_constant_override("shadow_offset_x", 0)
	title.add_theme_constant_override("shadow_offset_y", 4)
	title.add_theme_constant_override("shadow_outline_size", 10)

	subtitle.add_theme_font_override("font", UITheme.body_bold())
	subtitle.add_theme_font_size_override("font_size", 19)
	subtitle.add_theme_color_override("font_color", UITheme.ACCENT)

	tagline.add_theme_font_override("font", UITheme.body_light())
	tagline.add_theme_font_size_override("font_size", 18)
	tagline.add_theme_color_override("font_color", UITheme.TEXT_DIM)

	rule_left.color = UITheme.ACCENT_DIM
	rule_right.color = UITheme.ACCENT_DIM

	footer.add_theme_font_override("font", UITheme.body_light())
	footer.add_theme_font_size_override("font_size", 14)
	footer.add_theme_color_override("font_color", UITheme.TEXT_FAINT)

	build_label.add_theme_font_override("font", UITheme.body_light())
	build_label.add_theme_font_size_override("font_size", 13)
	build_label.add_theme_color_override("font_color", UITheme.TEXT_FAINT)
	build_label.text = "BUILD %s" % _version()

	settings_panel.visible = false
	play_button.pressed.connect(_on_play_pressed)
	settings_button.pressed.connect(_on_settings_pressed)
	quit_button.pressed.connect(_on_quit_pressed)
	settings_panel.back_pressed.connect(_on_settings_back)
	for button in [play_button, settings_button, quit_button]:
		(button as Button).mouse_entered.connect(func() -> void:
			Sound.play_ui("ui_hover", -8.0)
		)
	play_button.grab_focus()

	_fade_in()

func _version() -> String:
	var file := FileAccess.open("res://VERSION", FileAccess.READ)
	if file == null:
		return "?"
	return file.get_as_text().strip_edges()

func _fade_in() -> void:
	for node in [title, subtitle, tagline, button_box, footer]:
		(node as CanvasItem).modulate.a = 0.0
	var tween: Tween = create_tween()
	tween.set_parallel(true)
	var delay := 0.0
	for node in [title, subtitle, tagline, button_box, footer]:
		tween.tween_property(node, "modulate:a", 1.0, 0.5).set_delay(delay)
		delay += 0.09

func _process(delta: float) -> void:
	drift += delta
	# Wrap on the texture's own width so the seam never lands on screen.
	mist_a.position.x = mist_a_home + fposmod(drift * MIST_A_SPEED, 700.0) - 350.0
	mist_b.position.x = mist_b_home + fposmod(drift * MIST_B_SPEED, 900.0) - 450.0

func _build_backdrop() -> ImageTexture:
	var w := 8
	var h := 128
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	var sky_top := Color(0.055, 0.075, 0.105)
	var sky_low := Color(0.20, 0.22, 0.23)
	var ground := Color(0.075, 0.070, 0.058)
	var horizon := 0.56
	for y in h:
		var t: float = float(y) / float(h - 1)
		var c: Color
		if t < horizon:
			var k: float = pow(t / horizon, 1.6)
			c = sky_top.lerp(sky_low, k)
			# A thin warm band right on the horizon, as if the sun just went.
			var glow: float = pow(clampf(1.0 - absf(t - horizon) / 0.14, 0.0, 1.0), 2.2)
			c = c.lerp(Color(0.52, 0.34, 0.19), glow * 0.55)
		else:
			var k2: float = clampf((t - horizon) / (1.0 - horizon), 0.0, 1.0)
			c = Color(0.16, 0.15, 0.12).lerp(ground, pow(k2, 0.7))
		for x in w:
			img.set_pixel(x, y, c)
	return ImageTexture.create_from_image(img)

func _build_mist(tint: Color) -> ImageTexture:
	var w := 256
	var h := 32
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	var noise := FastNoiseLite.new()
	noise.seed = 20240823
	noise.frequency = 0.02
	noise.fractal_octaves = 3
	for y in h:
		# Fade to nothing at the top and bottom edges so the band has no hard line.
		var vertical: float = sin(PI * float(y) / float(h - 1))
		for x in w:
			# Blend the two ends together so the strip tiles without a seam.
			var blend: float = float(x) / float(w)
			var n: float = lerpf(
				noise.get_noise_2d(x, y) * 0.5 + 0.5,
				noise.get_noise_2d(x - w, y) * 0.5 + 0.5,
				blend)
			var a: float = clampf(n, 0.0, 1.0) * vertical * tint.a
			img.set_pixel(x, y, Color(tint.r, tint.g, tint.b, a))
	return ImageTexture.create_from_image(img)

func _on_play_pressed() -> void:
	Sound.play_ui("ui_click", -5.0)
	GameState.reset()
	Sound.set_in_menu(false)
	get_tree().change_scene_to_file("res://scenes/main.tscn")

func _on_settings_pressed() -> void:
	Sound.play_ui("ui_click", -5.0)
	button_box.visible = false
	settings_panel.visible = true

func _on_settings_back() -> void:
	settings_panel.visible = false
	button_box.visible = true
	play_button.grab_focus()

func _on_quit_pressed() -> void:
	get_tree().quit()

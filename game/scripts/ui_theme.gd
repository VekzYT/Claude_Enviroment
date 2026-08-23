class_name UITheme
extends RefCounted

# One place for the game's visual language, so the HUD, the main menu, the
# pause menu and the settings panel cannot drift apart. Everything here builds
# fresh resources; call the makers once at _ready() and hold the result.

const BG := Color(0.055, 0.062, 0.051, 0.86)
const BG_DEEP := Color(0.028, 0.032, 0.027, 0.94)
const BG_SOLID := Color(0.075, 0.082, 0.069, 1.0)
const LINE := Color(0.34, 0.38, 0.30, 0.9)
const LINE_SOFT := Color(0.34, 0.38, 0.30, 0.3)

const TEXT := Color(0.90, 0.90, 0.84, 1.0)
const TEXT_DIM := Color(0.60, 0.63, 0.55, 1.0)
const TEXT_FAINT := Color(0.48, 0.51, 0.44, 1.0)

const ACCENT := Color(0.86, 0.67, 0.30, 1.0)
const ACCENT_DIM := Color(0.50, 0.39, 0.18, 1.0)
const GOOD := Color(0.44, 0.74, 0.36, 1.0)
const WARN := Color(0.85, 0.60, 0.22, 1.0)
const BAD := Color(0.80, 0.24, 0.18, 1.0)
const STAMINA := Color(0.52, 0.70, 0.80, 1.0)
const WOOD := Color(0.78, 0.58, 0.32, 1.0)

const FONT_DISPLAY := "res://ui/fonts/Oswald-Variable.ttf"
const FONT_BODY := "res://ui/fonts/BarlowCondensed-Medium.ttf"
const FONT_BODY_SB := "res://ui/fonts/BarlowCondensed-SemiBold.ttf"
const FONT_BODY_RG := "res://ui/fonts/BarlowCondensed-Regular.ttf"

static func display() -> Font:
	return load(FONT_DISPLAY) as Font

static func body() -> Font:
	return load(FONT_BODY) as Font

static func body_bold() -> Font:
	return load(FONT_BODY_SB) as Font

static func body_light() -> Font:
	return load(FONT_BODY_RG) as Font

# A panel with a hairline border. Used for every framed surface in the game.
static func panel(bg: Color = BG, border: Color = LINE, radius: int = 3, width: int = 1) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(width)
	sb.set_corner_radius_all(radius)
	sb.content_margin_left = 10.0
	sb.content_margin_right = 10.0
	sb.content_margin_top = 6.0
	sb.content_margin_bottom = 6.0
	return sb

static func flat(bg: Color, radius: int = 2) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.set_corner_radius_all(radius)
	return sb

# Buttons read as slabs that light up along their left edge on hover, which
# gives the menus a direction of travel without any animation work.
static func button(bg: Color, border: Color, accent_left: int = 0, accent: Color = ACCENT) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(2)
	sb.content_margin_left = 18.0
	sb.content_margin_right = 18.0
	sb.content_margin_top = 9.0
	sb.content_margin_bottom = 9.0
	if accent_left > 0:
		sb.border_width_left = accent_left
		sb.border_color = accent
	return sb

# Theme for menus: buttons, labels, sliders and check boxes in one resource.
static func menu_theme() -> Theme:
	var t := Theme.new()
	var f_display: Font = display()
	var f_body: Font = body()

	t.default_font = f_body
	t.default_font_size = 17

	t.set_font("font", "Button", f_display)
	t.set_font_size("font_size", "Button", 20)
	t.set_color("font_color", "Button", TEXT)
	t.set_color("font_hover_color", "Button", Color(1, 0.96, 0.86, 1))
	t.set_color("font_pressed_color", "Button", ACCENT)
	t.set_color("font_focus_color", "Button", Color(1, 0.96, 0.86, 1))
	t.set_color("font_disabled_color", "Button", TEXT_FAINT)
	t.set_stylebox("normal", "Button", button(Color(0.09, 0.10, 0.085, 0.85), LINE_SOFT))
	t.set_stylebox("hover", "Button", button(Color(0.15, 0.16, 0.13, 0.95), LINE, 3))
	t.set_stylebox("pressed", "Button", button(Color(0.06, 0.07, 0.055, 1.0), ACCENT_DIM, 3))
	t.set_stylebox("focus", "Button", button(Color(0.12, 0.13, 0.11, 0.9), LINE, 3))
	t.set_stylebox("disabled", "Button", button(Color(0.07, 0.07, 0.065, 0.6), LINE_SOFT))

	t.set_font("font", "Label", f_body)
	t.set_font_size("font_size", "Label", 17)
	t.set_color("font_color", "Label", TEXT)

	t.set_stylebox("panel", "PanelContainer", panel())
	t.set_stylebox("panel", "Panel", panel())

	t.set_stylebox("slider", "HSlider", flat(Color(0.10, 0.11, 0.09, 1.0), 3))
	t.set_stylebox("grabber_area", "HSlider", flat(ACCENT_DIM, 3))
	t.set_stylebox("grabber_area_highlight", "HSlider", flat(ACCENT, 3))
	return t

# Builds a soft radial mask once and hands back a texture: dark (or coloured)
# at the edges, clear in the middle. Used for the permanent vignette, the
# damage flash and the low-health pulse, so none of them wash out the centre
# of the screen the way a flat full-screen rectangle does.
static func vignette_texture(tint: Color, inner: float, outer: float, power: float = 1.0) -> ImageTexture:
	var w := 160
	var h := 90
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	var centre := Vector2(w * 0.5, h * 0.5)
	var max_d: float = centre.length()
	for y in h:
		for x in w:
			# Normalise against the corner so the falloff is aspect-independent.
			var d: float = Vector2(x + 0.5, y + 0.5).distance_to(centre) / max_d
			var a: float = clampf((d - inner) / maxf(outer - inner, 0.0001), 0.0, 1.0)
			a = pow(a, power)
			img.set_pixel(x, y, Color(tint.r, tint.g, tint.b, tint.a * a))
	return ImageTexture.create_from_image(img)

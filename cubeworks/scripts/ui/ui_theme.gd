class_name UITheme
extends RefCounted
## One place for the game's look: colours, panels and buttons.
##
## The style is deliberately its own thing -- dark slate panels, a warm amber
## highlight and thin square frames -- so nothing here resembles any other
## voxel game's interface.

const BG_DEEP := Color(0.07, 0.08, 0.10, 0.92)
const BG_PANEL := Color(0.12, 0.13, 0.16, 0.94)
const BG_SLOT := Color(0.18, 0.19, 0.23, 0.88)
const BG_SLOT_HOVER := Color(0.26, 0.28, 0.33, 0.94)
const EDGE := Color(0.32, 0.34, 0.40, 1.0)
const EDGE_SOFT := Color(0.22, 0.24, 0.29, 1.0)
const ACCENT := Color(0.98, 0.72, 0.28, 1.0)
const ACCENT_DIM := Color(0.62, 0.45, 0.18, 1.0)
const TEXT := Color(0.90, 0.92, 0.96, 1.0)
const TEXT_DIM := Color(0.62, 0.66, 0.74, 1.0)
const DANGER := Color(0.86, 0.28, 0.26, 1.0)
const HEALTH := Color(0.88, 0.26, 0.30, 1.0)
const HEALTH_BACK := Color(0.20, 0.10, 0.12, 0.85)


static func panel(bg: Color = BG_PANEL, border: Color = EDGE, radius: int = 6,
		border_width: int = 2) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(border_width)
	sb.set_corner_radius_all(radius)
	sb.content_margin_left = 10
	sb.content_margin_right = 10
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	return sb


static func slot_style(selected: bool, hovered: bool = false) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = BG_SLOT_HOVER if hovered else BG_SLOT
	sb.border_color = ACCENT if selected else EDGE_SOFT
	sb.set_border_width_all(3 if selected else 1)
	sb.set_corner_radius_all(4)
	return sb


static func style_button(button: Button, accent: bool = false) -> void:
	var normal := panel(BG_SLOT if not accent else ACCENT_DIM, EDGE if not accent else ACCENT, 5, 2)
	var hover := panel(BG_SLOT_HOVER if not accent else ACCENT.darkened(0.25),
			ACCENT, 5, 2)
	var pressed := panel(BG_DEEP, ACCENT, 5, 2)
	var disabled := panel(Color(0.14, 0.15, 0.18, 0.7), EDGE_SOFT, 5, 1)
	for sb in [normal, hover, pressed, disabled]:
		sb.content_margin_left = 14
		sb.content_margin_right = 14
		sb.content_margin_top = 8
		sb.content_margin_bottom = 8
	button.add_theme_stylebox_override("normal", normal)
	button.add_theme_stylebox_override("hover", hover)
	button.add_theme_stylebox_override("pressed", pressed)
	button.add_theme_stylebox_override("disabled", disabled)
	button.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	button.add_theme_color_override("font_color", TEXT)
	button.add_theme_color_override("font_hover_color", Color.WHITE)
	button.add_theme_color_override("font_disabled_color", TEXT_DIM)
	button.add_theme_font_size_override("font_size", 16)


static func style_line_edit(edit: LineEdit) -> void:
	var normal := panel(Color(0.09, 0.10, 0.12, 0.95), EDGE_SOFT, 4, 1)
	var focus := panel(Color(0.09, 0.10, 0.12, 0.98), ACCENT, 4, 2)
	edit.add_theme_stylebox_override("normal", normal)
	edit.add_theme_stylebox_override("focus", focus)
	edit.add_theme_color_override("font_color", TEXT)
	edit.add_theme_color_override("font_placeholder_color", TEXT_DIM)
	edit.add_theme_font_size_override("font_size", 16)


static func make_label(text: String, size: int = 16, color: Color = TEXT) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.85))
	l.add_theme_constant_override("outline_size", 4)
	return l

extends Control
class_name ItemIcon

# A hand-drawn item glyph. Everything is expressed as a fraction of the box so
# the same icon works at 24px in a gear row and at 40px in a supply slot.
var kind: String = "crate"
var tint: Color = Color(0.8, 0.8, 0.8)

func _init(k: String, t: Color, s: float) -> void:
	kind = k
	tint = t
	custom_minimum_size = Vector2(s, s)
	size = Vector2(s, s)
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func _p(x: float, y: float) -> Vector2:
	var s: float = minf(size.x, size.y)
	return Vector2(x * s, y * s)

func _poly(pts: Array, c: Color) -> void:
	var out := PackedVector2Array()
	for pt in pts:
		out.append(_p(pt[0], pt[1]))
	draw_colored_polygon(out, c)

func _stroke(a: Array, b: Array, c: Color, w: float) -> void:
	var s: float = minf(size.x, size.y)
	draw_line(_p(a[0], a[1]), _p(b[0], b[1]), c, w * s, true)

func _draw() -> void:
	var s: float = minf(size.x, size.y)
	var dark: Color = tint.darkened(0.55)
	var light: Color = tint.lightened(0.3)
	var steel := Color(0.72, 0.75, 0.79)
	var wood := Color(0.46, 0.33, 0.20)
	match kind:
		"axe":
			_poly([[0.34, 0.90], [0.44, 0.90], [0.66, 0.22], [0.56, 0.20]], wood)
			_poly([[0.58, 0.10], [0.86, 0.20], [0.80, 0.44], [0.50, 0.32]], steel.darkened(0.25))
			_poly([[0.80, 0.16], [0.88, 0.21], [0.82, 0.42], [0.75, 0.39]], steel)
		"knife":
			_poly([[0.30, 0.86], [0.42, 0.86], [0.44, 0.60], [0.32, 0.60]], wood)
			_poly([[0.32, 0.60], [0.44, 0.60], [0.62, 0.14], [0.40, 0.30]], steel)
		"rifle":
			_poly([[0.08, 0.62], [0.86, 0.44], [0.88, 0.54], [0.10, 0.72]], Color(0.28, 0.24, 0.21))
			_poly([[0.08, 0.62], [0.30, 0.57], [0.34, 0.84], [0.14, 0.80]], wood)
			draw_rect(Rect2(_p(0.44, 0.34), Vector2(0.26 * s, 0.10 * s)), steel.darkened(0.3))
		"pistol":
			_poly([[0.16, 0.40], [0.84, 0.40], [0.84, 0.54], [0.16, 0.54]], Color(0.26, 0.26, 0.28))
			_poly([[0.24, 0.54], [0.44, 0.54], [0.38, 0.86], [0.20, 0.86]], Color(0.20, 0.20, 0.22))
		"hands":
			_poly([[0.14, 0.82], [0.14, 0.44], [0.24, 0.28], [0.34, 0.44], [0.34, 0.82]], tint)
			_poly([[0.50, 0.82], [0.50, 0.40], [0.62, 0.24], [0.74, 0.40], [0.74, 0.82]], light)
		"log":
			_poly([[0.20, 0.34], [0.80, 0.34], [0.80, 0.68], [0.20, 0.68]], wood)
			draw_circle(_p(0.80, 0.51), 0.17 * s, wood.lightened(0.18))
			draw_circle(_p(0.80, 0.51), 0.09 * s, wood.darkened(0.3))
			_stroke([0.30, 0.44], [0.68, 0.44], wood.darkened(0.35), 0.035)
		"apple":
			draw_circle(_p(0.44, 0.60), 0.26 * s, tint)
			draw_circle(_p(0.60, 0.60), 0.24 * s, tint.darkened(0.12))
			_stroke([0.52, 0.36], [0.55, 0.20], Color(0.32, 0.24, 0.14), 0.045)
			_poly([[0.55, 0.24], [0.74, 0.16], [0.66, 0.32]], Color(0.32, 0.52, 0.24))
		"meat_raw":
			_poly([[0.22, 0.60], [0.30, 0.34], [0.62, 0.28], [0.76, 0.50],
				[0.66, 0.76], [0.34, 0.78]], tint)
			draw_circle(_p(0.46, 0.54), 0.11 * s, light)
			_poly([[0.66, 0.72], [0.84, 0.80], [0.78, 0.88], [0.62, 0.80]], Color(0.90, 0.88, 0.82))
		"meat_cooked":
			_poly([[0.22, 0.60], [0.30, 0.34], [0.62, 0.28], [0.76, 0.50],
				[0.66, 0.76], [0.34, 0.78]], dark)
			_stroke([0.32, 0.44], [0.62, 0.38], Color(0.14, 0.10, 0.08), 0.05)
			_stroke([0.34, 0.60], [0.68, 0.54], Color(0.14, 0.10, 0.08), 0.05)
			_poly([[0.66, 0.72], [0.84, 0.80], [0.78, 0.88], [0.62, 0.80]], Color(0.86, 0.84, 0.78))
		"wood":
			_poly([[0.16, 0.78], [0.30, 0.26], [0.40, 0.28], [0.28, 0.80]], wood)
			_poly([[0.44, 0.80], [0.56, 0.24], [0.66, 0.26], [0.56, 0.82]], wood.lightened(0.15))
			_poly([[0.66, 0.78], [0.78, 0.32], [0.86, 0.36], [0.76, 0.80]], wood.darkened(0.2))
		"coin":
			# Three overlapping, so a purse reads as a purse and not a button.
			draw_circle(_p(0.36, 0.66), 0.20 * s, tint.darkened(0.3))
			draw_circle(_p(0.64, 0.64), 0.20 * s, tint.darkened(0.15))
			draw_circle(_p(0.50, 0.40), 0.22 * s, tint)
			draw_circle(_p(0.50, 0.40), 0.13 * s, tint.darkened(0.28))
		"bow":
			# The stave, drawn as a fan of short chords around an arc.
			var prev := Vector2.ZERO
			for i in 13:
				var a: float = -0.95 + float(i) * (1.9 / 12.0)
				var pt := Vector2(0.76 - cos(a) * 0.30, 0.5 + sin(a) * 0.42)
				if i > 0:
					draw_line(_p(prev.x, prev.y), _p(pt.x, pt.y), wood, 0.055 * s, true)
				prev = pt
			_stroke([0.76 - cos(-0.95) * 0.30, 0.5 + sin(-0.95) * 0.42],
				[0.76 - cos(0.95) * 0.30, 0.5 + sin(0.95) * 0.42],
				Color(0.82, 0.80, 0.72), 0.022)
		"arrow":
			_stroke([0.20, 0.78], [0.74, 0.26], Color(0.58, 0.44, 0.28), 0.045)
			_poly([[0.86, 0.14], [0.72, 0.32], [0.62, 0.22]], steel)
			_poly([[0.20, 0.78], [0.34, 0.72], [0.28, 0.86]], Color(0.80, 0.78, 0.74))
		_:
			draw_rect(Rect2(_p(0.18, 0.26), Vector2(0.64 * s, 0.52 * s)), tint.darkened(0.4))
			draw_rect(Rect2(_p(0.18, 0.26), Vector2(0.64 * s, 0.52 * s)), tint, false, 0.035 * s)
			_stroke([0.18, 0.26], [0.82, 0.78], tint, 0.035)
			_stroke([0.82, 0.26], [0.18, 0.78], tint, 0.035)

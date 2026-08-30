class_name Crosshair
extends Control
## A thin four-armed reticle drawn straight to the canvas.

const ARM := 9.0
const GAP := 4.0
const THICK := 2.0


func _ready() -> void:
	custom_minimum_size = Vector2(48, 48)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _draw() -> void:
	var c := size * 0.5
	var arms := [Vector2(1, 0), Vector2(-1, 0), Vector2(0, 1), Vector2(0, -1)]
	# Dark pass first so the reticle survives on a bright sky.
	for a in arms:
		draw_line(c + a * GAP, c + a * (GAP + ARM), Color(0, 0, 0, 0.55), THICK + 2.0)
	for a in arms:
		draw_line(c + a * GAP, c + a * (GAP + ARM), Color(1, 1, 1, 0.92), THICK)
	draw_rect(Rect2(c - Vector2(1.5, 1.5), Vector2(3, 3)), Color(1, 1, 1, 0.75))

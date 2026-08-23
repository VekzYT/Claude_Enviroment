extends Area3D

# A world item the player can look at and take. The player only needs the two
# exported values, so adding more pickups later means no player-side changes.

@export var item_id: int = 4
@export var item_title: String = "Axe"

var taken := false
var base_y := 0.0
var base_roll := 0.0
var t := 0.0

func _ready() -> void:
	add_to_group("pickup")
	base_y = position.y
	# Sway around whatever lean the scene authored, so moving the axe in the
	# editor does not get overwritten on the first frame.
	base_roll = rotation.z

func _process(delta: float) -> void:
	if taken:
		return
	# A slow breathing tilt so it reads as interactive without spinning like an
	# arcade token -- it is meant to look buried in the block.
	t += delta
	rotation.z = base_roll + deg_to_rad(sin(t * 1.1) * 1.4)

func consume() -> void:
	if taken:
		return
	taken = true
	# Pulled free of the block and shrinking away, rather than blinking out.
	var tween: Tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "position:y", base_y + 0.55, 0.22)
	tween.tween_property(self, "scale", Vector3(0.01, 0.01, 0.01), 0.22)
	tween.chain().tween_callback(queue_free)

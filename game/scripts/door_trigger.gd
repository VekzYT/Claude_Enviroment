extends Area3D

# The volume you aim at to work a door. It stands in front of the leaf, where a
# ray from eye height actually lands, and hands the press to the hinge above it.
#
# A door needs this because the leaf is a StaticBody3D that swings: putting the
# interaction on the leaf itself would move the thing you are aiming at out from
# under your crosshair the moment it started to open.

func _ready() -> void:
	add_to_group("interactable")

func _hinge() -> Node:
	var parent: Node = get_parent()
	while parent != null:
		if parent.has_method("toggle") and parent.is_in_group("built_door"):
			return parent
		parent = parent.get_parent()
	return null

func interact_point() -> Vector3:
	return global_position + Vector3(0.0, 0.2, 0.0)

func prompt_for(player: Node) -> String:
	var hinge: Node = _hinge()
	if hinge == null:
		return ""
	return String(hinge.call("prompt_for", player))

func interact(_player: Node) -> void:
	var hinge: Node = _hinge()
	if hinge != null:
		hinge.call("toggle")

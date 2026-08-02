extends Node3D

const LANDMARK_NAMES: Array[String] = [
	"Watchtower",
	"Sunrise Cabin",
	"Timberline Lodge",
	"Harbor Cottage",
	"Southshore Hut",
	"North Ridge",
	"West Ridge",
]
const LANDMARK_POSITIONS: Array[Vector3] = [
	Vector3(30, 0, -40),
	Vector3(36, 0, 24),
	Vector3(-34, 0, -22),
	Vector3(-50, 0, 18),
	Vector3(-16, 0, -44),
	Vector3(0, 5, 46),
	Vector3(-35, 2, 0),
]
const DISCOVERY_RADIUS := 11.0

var discovered: Array[bool] = [false, false, false, false, false, false, false]
var player: Node3D = null

func _process(_delta: float) -> void:
	if player == null:
		player = get_tree().get_first_node_in_group("player")
		if player == null:
			return
	for i in LANDMARK_NAMES.size():
		if discovered[i]:
			continue
		var dist: float = player.global_position.distance_to(LANDMARK_POSITIONS[i])
		if dist <= DISCOVERY_RADIUS:
			discovered[i] = true
			GameState.discover_landmark(LANDMARK_NAMES[i])

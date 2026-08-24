extends Node3D

# Fires a one-shot "Discovered" banner the first time the player walks near a
# named location. Coordinates mirror the POI list in forest_scatter.gd, which is
# what keeps these spots clear of trees.

const LANDMARK_NAMES: Array[String] = [
	"Survivor Camp",
	"Ranger Watchtower",
	"Abandoned Cabin",
	"Crashed Convoy",
	"Elmswood",
	"Radio Tower",
	"The Graves",
	"Blackwater Pond",
	"Rocky Lookout",
]
const LANDMARK_POSITIONS: Array[Vector3] = [
	Vector3(0.0, 0.0, 0.0),
	Vector3(-40.0, 0.0, -130.0),
	Vector3(95.0, 0.0, -85.0),
	Vector3(130.0, 0.0, 40.0),
	Vector3(-120.0, 0.0, 95.0),
	Vector3(-150.0, 0.0, -30.0),
	Vector3(30.0, 0.0, 140.0),
	Vector3(60.0, 0.0, -30.0),
	Vector3(-90.0, 0.0, -95.0),
]
const DISCOVERY_RADIUS := 16.0

var discovered: Array[bool] = []
var player: Node3D = null

func _ready() -> void:
	discovered.resize(LANDMARK_NAMES.size())
	discovered.fill(false)

func _process(_delta: float) -> void:
	if player == null:
		player = get_tree().get_first_node_in_group("player")
		if player == null:
			return
	var here := Vector2(player.global_position.x, player.global_position.z)
	for i in LANDMARK_NAMES.size():
		if discovered[i]:
			continue
		var there := Vector2(LANDMARK_POSITIONS[i].x, LANDMARK_POSITIONS[i].z)
		# Compared on the ground plane so standing on the tower or the lookout
		# still counts as arriving.
		if here.distance_to(there) <= DISCOVERY_RADIUS:
			discovered[i] = true
			GameState.discover_landmark(LANDMARK_NAMES[i])

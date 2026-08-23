extends Node3D

# One first-person arm, built from code so both hands stay identical and the
# fingers can actually be jointed. Each finger is a chain of three pivots, so
# closing a fist is three rotations rather than a swapped mesh -- which is what
# lets the hand curl onto the axe haft when you pick it up.
#
# Everything lives along local -Z, matching the pivot the player script aims:
# the shoulder is the origin and the palm sits at PALM_Z.

@export var side: float = 1.0

const FOREARM_Z := -0.325
const WRIST_Z := -0.386
const PALM_Z := -0.44
const KNUCKLE_Z := -0.481

# Resting spread and curl per joint, then the same for a closed grip. The
# distal joint barely moves; almost all of a fist is the first two knuckles.
const OPEN_CURL := [14.0, 18.0, 12.0]
const GRIP_CURL := [64.0, 72.0, 44.0]
const THUMB_OPEN := [10.0, 14.0]
const THUMB_GRIP := [44.0, 52.0]

var finger_joints: Array = []
var thumb_joints: Array = []
var grip := 0.0

func _ready() -> void:
	_build()
	set_grip(0.0)

func _material(colour: Color, roughness: float) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = colour
	mat.roughness = roughness
	return mat

func _unit_box() -> BoxMesh:
	var m := BoxMesh.new()
	m.size = Vector3.ONE
	return m

func _part(parent: Node3D, mesh: Mesh, material: Material, position: Vector3,
		scale: Vector3, node_name: String) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = node_name
	node.mesh = mesh
	node.material_override = material
	node.position = position
	node.scale = scale
	parent.add_child(node)
	return node

func _build() -> void:
	var box: BoxMesh = _unit_box()
	var skin: StandardMaterial3D = _material(Color(0.72, 0.55, 0.43), 0.82)
	var skin_dark: StandardMaterial3D = _material(Color(0.62, 0.46, 0.36), 0.85)
	var sleeve: StandardMaterial3D = _material(Color(0.27, 0.30, 0.24), 0.95)
	var sleeve_dark: StandardMaterial3D = _material(Color(0.20, 0.23, 0.18), 0.95)

	_part(self, box, sleeve, Vector3(0, 0, -0.135), Vector3(0.072, 0.074, 0.23), "Sleeve")
	# A slightly wider band where the cuff is rolled back over the forearm.
	_part(self, box, sleeve_dark, Vector3(0, 0, -0.262), Vector3(0.080, 0.082, 0.036), "Cuff")

	# Two boxes rather than one give the forearm a taper toward the wrist.
	_part(self, box, skin, Vector3(0, 0.002, FOREARM_Z + 0.022), Vector3(0.060, 0.057, 0.062), "ForearmUpper")
	_part(self, box, skin, Vector3(0, 0.002, FOREARM_Z - 0.036), Vector3(0.052, 0.050, 0.058), "ForearmLower")
	_part(self, box, skin_dark, Vector3(0, 0.002, WRIST_Z), Vector3(0.049, 0.044, 0.030), "Wrist")

	_part(self, box, skin, Vector3(0, 0.002, PALM_Z), Vector3(0.062, 0.043, 0.080), "Palm")
	# The heel of the hand, on the little-finger side.
	_part(self, box, skin, Vector3(0.017 * side, -0.004, PALM_Z + 0.014), Vector3(0.030, 0.038, 0.052), "Heel")
	_part(self, box, skin, Vector3(0, 0.005, KNUCKLE_Z + 0.010), Vector3(0.063, 0.041, 0.022), "Knuckles")

	# Four fingers across the knuckle line, index nearest the thumb side.
	var lengths := [0.038, 0.041, 0.038, 0.032]
	# Narrower than the 0.019 spacing, so there is a real gap between fingers
	# instead of one continuous plank.
	var widths := [0.0155, 0.0160, 0.0150, 0.0132]
	for i in 4:
		var across: float = (-0.0285 + i * 0.019) * side
		var root := Node3D.new()
		root.name = "Finger%d" % i
		root.position = Vector3(across, 0.004, KNUCKLE_Z)
		# Fingers fan out very slightly, and the outer ones sit a touch lower.
		root.rotation_degrees = Vector3(0, (-3.0 + i * 2.4) * side, 0)
		add_child(root)

		var w: float = widths[i]
		var proximal_len: float = lengths[i]
		_part(root, box, skin, Vector3(0, 0, -proximal_len * 0.5), Vector3(w, w * 0.92, proximal_len), "Proximal")

		var mid_pivot := Node3D.new()
		mid_pivot.name = "MidJoint"
		mid_pivot.position = Vector3(0, 0, -proximal_len)
		root.add_child(mid_pivot)
		var mid_len: float = proximal_len * 0.74
		_part(mid_pivot, box, skin, Vector3(0, 0, -mid_len * 0.5), Vector3(w * 0.92, w * 0.86, mid_len), "Middle")

		var tip_pivot := Node3D.new()
		tip_pivot.name = "TipJoint"
		tip_pivot.position = Vector3(0, 0, -mid_len)
		mid_pivot.add_child(tip_pivot)
		var tip_len: float = proximal_len * 0.58
		_part(tip_pivot, box, skin_dark, Vector3(0, 0, -tip_len * 0.5), Vector3(w * 0.84, w * 0.80, tip_len), "Tip")

		finger_joints.append([root, mid_pivot, tip_pivot])

	# The thumb comes off the side of the palm and swings across, not down.
	var thumb_root := Node3D.new()
	thumb_root.name = "Thumb"
	thumb_root.position = Vector3(-0.028 * side, 0.008, PALM_Z - 0.014)
	thumb_root.rotation_degrees = Vector3(-8, 34.0 * side, 0)
	add_child(thumb_root)
	_part(thumb_root, box, skin, Vector3(0, 0, -0.021), Vector3(0.024, 0.023, 0.042), "ThumbProximal")

	var thumb_tip := Node3D.new()
	thumb_tip.name = "ThumbTipJoint"
	thumb_tip.position = Vector3(0, 0, -0.042)
	thumb_root.add_child(thumb_tip)
	_part(thumb_tip, box, skin_dark, Vector3(0, 0, -0.016), Vector3(0.021, 0.020, 0.032), "ThumbTip")
	thumb_joints = [thumb_root, thumb_tip]

# 0 is an open, relaxed hand; 1 is closed around a haft.
func set_grip(amount: float) -> void:
	grip = clampf(amount, 0.0, 1.0)
	for chain in finger_joints:
		for joint in 3:
			var angle: float = lerpf(OPEN_CURL[joint], GRIP_CURL[joint], grip)
			var node: Node3D = chain[joint]
			# Curling bends about the local X axis; the fan-out on the root
			# joint is authored in Y and has to survive the write.
			node.rotation.x = deg_to_rad(-angle)
	for joint in 2:
		var angle: float = lerpf(THUMB_OPEN[joint], THUMB_GRIP[joint], grip)
		var node: Node3D = thumb_joints[joint]
		node.rotation.x = deg_to_rad(-angle)

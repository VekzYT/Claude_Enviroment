extends Node3D

# Elmswood. The one place in the valley with people still in it, built onto the
# flat pad the terrain already grades at this spot.
#
# Everything here is generated rather than placed by hand, for the same reason
# the forest is: the ground moves whenever the terrain seed changes, and a
# village of hand-placed nodes would float or sink the moment it did. Every
# piece asks the terrain how high it is and sits on that.

const CENTER := Vector2(-120.0, 95.0)
const PALISADE_RADIUS := 23.0
const HOUSE_RING := 15.0
const HOUSE_COUNT := 8

var terrain: Node = null
var rng := RandomNumberGenerator.new()
var walls: StaticBody3D = null

# Shared so the whole village is a handful of materials rather than one per box.
var mat_timber: StandardMaterial3D
var mat_timber_dark: StandardMaterial3D
var mat_plaster: StandardMaterial3D
var mat_roof: StandardMaterial3D
var mat_stone: StandardMaterial3D
var mat_cloth: StandardMaterial3D
var mat_glow: StandardMaterial3D

func _ready() -> void:
	add_to_group("village")
	rng.seed = 20260823
	terrain = get_tree().get_first_node_in_group("terrain")
	if terrain == null:
		push_error("Village: no terrain; nothing built.")
		return
	terrain.call("ensure_built")

	walls = StaticBody3D.new()
	walls.name = "VillageCollision"
	add_child(walls)

	_make_materials()
	_build_palisade()
	_build_houses()
	_build_square()
	_place_trader()

func _ground(x: float, z: float) -> float:
	return float(terrain.call("height_at", x, z))

func _mat(colour: Color, rough: float) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = colour
	m.roughness = rough
	return m

func _make_materials() -> void:
	mat_timber = _mat(Color(0.36, 0.26, 0.17), 0.95)
	mat_timber_dark = _mat(Color(0.22, 0.16, 0.11), 0.95)
	mat_plaster = _mat(Color(0.62, 0.58, 0.48), 0.92)
	mat_roof = _mat(Color(0.28, 0.24, 0.20), 0.9)
	mat_stone = _mat(Color(0.40, 0.39, 0.36), 0.94)
	mat_cloth = _mat(Color(0.52, 0.26, 0.20), 0.95)
	mat_glow = _mat(Color(0.95, 0.72, 0.36), 0.6)
	mat_glow.emission_enabled = true
	mat_glow.emission = Color(1.0, 0.74, 0.34)
	mat_glow.emission_energy_multiplier = 3.2

# One box of the village. `solid` also drops a matching collision shape, which
# is how you cannot walk through a house.
#
# The transform is composed by hand rather than set through the rotation and
# scale properties. A Basis holds rotation and scale together as one matrix, so
# rotating a node that has already been scaled non-uniformly multiplies the
# rotation onto the right of R*S and shears it. That is what turned every roof
# panel in the first build into a floating parallelogram.
func _box(pos: Vector3, size: Vector3, mat: Material, yaw: float = 0.0,
		solid: bool = false, pitch: float = 0.0) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = Vector3.ONE
	var rot: Basis = Basis(Vector3.UP, yaw) * Basis(Vector3.RIGHT, pitch)
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.material_override = mat
	node.transform = Transform3D(rot * Basis.IDENTITY.scaled(size), pos)
	add_child(node)
	if solid:
		var cs := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = size
		cs.shape = shape
		cs.transform = Transform3D(rot, pos)
		walls.add_child(cs)
	return node

# ------------------------------------------------------------------ palisade

# The bearing the road comes in on, which is where the gate has to be.
func _gate_angle() -> float:
	var toward_camp: Vector2 = (Vector2.ZERO - CENTER).normalized()
	return atan2(toward_camp.y, toward_camp.x)

func _build_palisade() -> void:
	var gate: float = _gate_angle()
	var posts: int = 208
	for i in posts:
		var a: float = TAU * float(i) / float(posts)
		# Leave a gap for the gate, and a second smaller one at the back so the
		# village does not read as a sealed drum.
		var off_gate: float = absf(wrapf(a - gate, -PI, PI))
		if off_gate < 0.16:
			continue
		if absf(wrapf(a - gate - PI, -PI, PI)) < 0.05:
			continue
		var r: float = PALISADE_RADIUS + rng.randf_range(-0.25, 0.25)
		var x: float = CENTER.x + cos(a) * r
		var z: float = CENTER.y + sin(a) * r
		var h: float = rng.randf_range(3.4, 4.1)
		var gy: float = _ground(x, z)
		# Wide enough that neighbours touch at this spacing, and sunk half a
		# metre so an uneven pad cannot leave one hovering. Ragged tops, so it
		# reads as split logs rather than machined fence panels.
		_box(Vector3(x, gy + h * 0.5 - 0.5, z), Vector3(0.78, h, 0.5),
			mat_timber if i % 3 else mat_timber_dark,
			a + rng.randf_range(-0.05, 0.05), true)

	# Gate towers either side of the opening, and a lintel across the top.
	for side in [-1.0, 1.0]:
		var a: float = gate + 0.24 * side
		var x: float = CENTER.x + cos(a) * PALISADE_RADIUS
		var z: float = CENTER.y + sin(a) * PALISADE_RADIUS
		var gy: float = _ground(x, z)
		_box(Vector3(x, gy + 2.1, z), Vector3(1.1, 4.6, 1.1), mat_timber_dark, a, true)
		_box(Vector3(x, gy + 4.5, z), Vector3(1.5, 0.35, 1.5), mat_roof, a)
		var lamp := OmniLight3D.new()
		lamp.position = Vector3(x, gy + 4.0, z)
		lamp.light_color = Color(1.0, 0.78, 0.45)
		lamp.light_energy = 2.4
		lamp.omni_range = 14.0
		add_child(lamp)
		_box(Vector3(x, gy + 4.0, z), Vector3(0.3, 0.3, 0.3), mat_glow, a)

	var gx: float = CENTER.x + cos(gate) * PALISADE_RADIUS
	var gz: float = CENTER.y + sin(gate) * PALISADE_RADIUS
	_box(Vector3(gx, _ground(gx, gz) + 4.3, gz), Vector3(6.0, 0.5, 0.5), mat_timber_dark, gate)

	# A carved board over the gate.
	_box(Vector3(gx, _ground(gx, gz) + 4.9, gz), Vector3(3.0, 0.7, 0.18), mat_timber, gate)

# -------------------------------------------------------------------- houses

func _build_houses() -> void:
	var gate: float = _gate_angle()
	for i in HOUSE_COUNT:
		# Spread around the ring but kept clear of the gate mouth.
		var a: float = gate + PI * 0.32 + TAU * float(i) / float(HOUSE_COUNT) * 0.86
		var r: float = HOUSE_RING + rng.randf_range(-1.6, 2.2)
		var x: float = CENTER.x + cos(a) * r
		var z: float = CENTER.y + sin(a) * r
		# Doors face the square.
		_build_house(Vector3(x, _ground(x, z), z), a + PI + rng.randf_range(-0.12, 0.12),
			rng.randf_range(0.85, 1.25), i)

func _build_house(base: Vector3, yaw: float, size: float, index: int) -> void:
	var w: float = 4.6 * size
	var d: float = 5.4 * size
	var h: float = 3.0 * size

	var body_mat: Material = mat_plaster if index % 2 == 0 else mat_timber
	_box(base + Vector3(0, h * 0.5, 0), Vector3(w, h, d), body_mat, yaw, true)

	# Corner posts and a beam, so a wall is not one flat slab of colour.
	for sx in [-1.0, 1.0]:
		for sz in [-1.0, 1.0]:
			var corner := Vector3(w * 0.5 * sx, h * 0.5, d * 0.5 * sz).rotated(Vector3.UP, yaw)
			_box(base + corner, Vector3(0.3, h, 0.3), mat_timber_dark, yaw)
	_box(base + Vector3(0, h - 0.2, 0), Vector3(w + 0.2, 0.28, d + 0.2), mat_timber_dark, yaw)

	# A gable roof, built as two slabs leaning against each other.
	var slope: float = 0.62
	var rise: float = d * 0.5 * tan(slope)
	for sz in [-1.0, 1.0]:
		var mid := Vector3(0.0, h + rise * 0.5, d * 0.25 * sz).rotated(Vector3.UP, yaw)
		_box(base + mid, Vector3(w + 0.7, 0.24, d * 0.5 / cos(slope) + 0.3),
			mat_roof, yaw, false, slope * sz)
	# The ridge beam capping the join.
	_box(base + Vector3(0, h + rise, 0), Vector3(w + 0.8, 0.22, 0.28), mat_timber_dark, yaw)

	# Door on the front face, and a lit window beside it.
	var front := Vector3(0.0, 1.05, d * 0.5 + 0.06).rotated(Vector3.UP, yaw)
	_box(base + front, Vector3(1.05, 2.1, 0.12), mat_timber_dark, yaw)
	var win := Vector3(w * 0.3, 1.85, d * 0.5 + 0.07).rotated(Vector3.UP, yaw)
	_box(base + win, Vector3(0.8, 0.7, 0.1), mat_glow, yaw)

	# A little warm spill, on a couple of houses only -- one light per building
	# across eight buildings is more than this scene needs to pay for.
	if index % 3 == 0:
		var lamp := OmniLight3D.new()
		lamp.position = base + win + Vector3(0, 0, 0).rotated(Vector3.UP, yaw)
		lamp.light_color = Color(1.0, 0.80, 0.48)
		lamp.light_energy = 1.8
		lamp.omni_range = 9.0
		add_child(lamp)

# -------------------------------------------------------------------- square

func _build_square() -> void:
	var cx: float = CENTER.x
	var cz: float = CENTER.y
	var gy: float = _ground(cx, cz)

	# A stone well, which is what tells you this is a village and not a camp.
	var ring: int = 14
	for i in ring:
		var a: float = TAU * float(i) / float(ring)
		var x: float = cx + cos(a) * 1.5
		var z: float = cz + sin(a) * 1.5
		_box(Vector3(x, _ground(x, z) + 0.45, z), Vector3(0.55, 0.9, 0.42), mat_stone, a, true)
	for side in [-1.0, 1.0]:
		_box(Vector3(cx + 1.4 * side, gy + 1.9, cz), Vector3(0.22, 2.6, 0.22), mat_timber_dark)
	_box(Vector3(cx, gy + 3.1, cz), Vector3(3.6, 0.22, 2.2), mat_roof, 0.0, false, 0.0)
	_box(Vector3(cx, gy + 2.6, cz), Vector3(0.7, 0.5, 0.7), mat_timber)

	# Market stalls: a counter with a cloth awning over it.
	for i in 3:
		var a: float = _gate_angle() + PI + (float(i) - 1.0) * 0.7
		var x: float = cx + cos(a) * 6.4
		var z: float = cz + sin(a) * 6.4
		var sy: float = _ground(x, z)
		var facing: float = a + PI
		_box(Vector3(x, sy + 0.5, z), Vector3(3.0, 1.0, 1.1), mat_timber, facing, true)
		_box(Vector3(x, sy + 1.05, z), Vector3(3.2, 0.14, 1.3), mat_timber_dark, facing)
		for sx in [-1.0, 1.0]:
			var post := Vector3(1.4 * sx, 1.2, 0.0).rotated(Vector3.UP, facing)
			_box(Vector3(x, sy, z) + post, Vector3(0.14, 2.4, 0.14), mat_timber_dark, facing)
		var awning := Vector3(0.0, 2.5, -0.35).rotated(Vector3.UP, facing)
		_box(Vector3(x, sy, z) + awning, Vector3(3.4, 0.1, 1.9), mat_cloth, facing, false, -0.22)

	# Crates and barrels scattered about, so the square is lived in.
	var stall_bearing: float = _gate_angle() + PI
	for i in 10:
		var a: float = rng.randf_range(0.0, TAU)
		# The stalls and the trader stand on this bearing; leave them room.
		if absf(wrapf(a - stall_bearing, -PI, PI)) < 0.85:
			a = wrapf(a + PI, 0.0, TAU)
		var r: float = rng.randf_range(3.4, 11.0)
		var x: float = cx + cos(a) * r
		var z: float = cz + sin(a) * r
		var s: float = rng.randf_range(0.55, 0.9)
		_box(Vector3(x, _ground(x, z) + s * 0.5, z), Vector3(s, s, s),
			mat_timber if i % 2 else mat_timber_dark, rng.randf_range(0.0, TAU), true)

	# Braziers, for a village that is still lit after dark.
	for i in 2:
		var a: float = _gate_angle() + PI * 0.5 + PI * float(i)
		var x: float = cx + cos(a) * 8.0
		var z: float = cz + sin(a) * 8.0
		var by: float = _ground(x, z)
		_box(Vector3(x, by + 0.5, z), Vector3(0.5, 1.0, 0.5), mat_stone, 0.0, true)
		_box(Vector3(x, by + 1.1, z), Vector3(0.7, 0.3, 0.7), mat_glow)
		var fire := OmniLight3D.new()
		fire.position = Vector3(x, by + 1.4, z)
		fire.light_color = Color(1.0, 0.66, 0.30)
		fire.light_energy = 3.0
		fire.omni_range = 16.0
		add_child(fire)

func _place_trader() -> void:
	var a: float = _gate_angle() + PI
	var x: float = CENTER.x + cos(a) * 6.4
	var z: float = CENTER.y + sin(a) * 6.4
	# Behind the middle stall and a stride to one side, so the counter is not
	# between her and you when you walk up to trade.
	var out := Vector2(cos(a), sin(a))
	var across := Vector2(-out.y, out.x)
	# Well clear of the counter: standing partly inside it put solid village
	# geometry between her and anyone walking up to trade.
	var spot: Vector2 = Vector2(x, z) + out * 0.95 + across * 2.35
	var tx: float = spot.x
	var tz: float = spot.y
	var trader: Node3D = load("res://scenes/trader.tscn").instantiate() as Node3D
	add_child(trader)
	trader.global_position = Vector3(tx, _ground(tx, tz), tz)
	trader.rotation.y = atan2(-(x - tx), -(z - tz))

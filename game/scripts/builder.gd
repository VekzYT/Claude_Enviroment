extends Node3D

# Building, and setting things down.
#
# Press B for the kit: a ghost of the next piece stands where the piece will
# actually stand, snapped to a grid and sitting on the terrain, red when the
# spot is refused. Mouse wheel cycles the piece, R turns it, left click builds,
# right click takes one back down for part of the wood.
#
# The same ghost machinery does double duty for putting items down out of the
# pack -- a piece of flint, a stack of firewood -- because "show me where it
# lands, then click" is the same problem either way.

const GRID := 2.0
const REACH := 8.0
const SAME_CELL := 0.05

# The kit. Sizes are in metres and costs are in wood.
const PIECES := [
	{
		"id": "wall", "name": "Wall", "cost": 6, "refund": 3,
		"size": Vector3(2.0, 2.6, 0.35), "lift": 1.3,
	},
	{
		"id": "door", "name": "Doorway", "cost": 10, "refund": 5,
		"size": Vector3(2.0, 2.6, 0.35), "lift": 1.3,
	},
	{
		"id": "floor", "name": "Floor", "cost": 5, "refund": 2,
		"size": Vector3(2.0, 0.22, 2.0), "lift": 0.11,
	},
	{
		"id": "ramp", "name": "Ramp", "cost": 7, "refund": 3,
		"size": Vector3(2.0, 0.24, 2.9), "lift": 0.62,
	},
	{
		"id": "post", "name": "Torch post", "cost": 4, "refund": 2,
		"size": Vector3(0.3, 2.4, 0.3), "lift": 1.2,
	},
]

# Things that can be set down out of the pack, and what each costs you.
const PLACEABLES := {
	"flint": {"name": "Flint", "size": Vector3(0.34, 0.22, 0.30), "lift": 0.11},
	"wood": {"name": "Firewood", "size": Vector3(0.9, 0.4, 0.7), "lift": 0.2, "cost": 3},
}

var active := false
var piece := 0
# When set, the ghost is an item out of the pack rather than a build piece.
var placing_item := ""
var ghost: MeshInstance3D = null
var ghost_ok := false
var ghost_xf: Transform3D = Transform3D.IDENTITY
var yaw_step := 0
var built: Array = []
var terrain: Node = null
var player: Node3D = null
var camera: Camera3D = null

var mat_wood: StandardMaterial3D
var mat_trim: StandardMaterial3D
var mat_ghost_ok: StandardMaterial3D
var mat_ghost_bad: StandardMaterial3D

const PLACED_SCENE: PackedScene = preload("res://scenes/placed_item.tscn")

func _ready() -> void:
	add_to_group("builder")
	terrain = get_tree().get_first_node_in_group("terrain")
	_make_materials()
	_make_ghost()

func _make_materials() -> void:
	mat_wood = StandardMaterial3D.new()
	mat_wood.albedo_color = Color(0.44, 0.32, 0.20)
	mat_wood.roughness = 0.95

	mat_trim = StandardMaterial3D.new()
	mat_trim.albedo_color = Color(0.28, 0.20, 0.13)
	mat_trim.roughness = 0.95

	mat_ghost_ok = StandardMaterial3D.new()
	mat_ghost_ok.albedo_color = Color(0.45, 0.85, 0.45, 0.38)
	mat_ghost_ok.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat_ghost_ok.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat_ghost_ok.cull_mode = BaseMaterial3D.CULL_DISABLED

	mat_ghost_bad = StandardMaterial3D.new()
	mat_ghost_bad.albedo_color = Color(0.9, 0.3, 0.25, 0.34)
	mat_ghost_bad.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat_ghost_bad.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat_ghost_bad.cull_mode = BaseMaterial3D.CULL_DISABLED

func _make_ghost() -> void:
	ghost = MeshInstance3D.new()
	ghost.name = "BuildGhost"
	ghost.mesh = BoxMesh.new()
	ghost.material_override = mat_ghost_ok
	ghost.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	ghost.visible = false
	add_child(ghost)

# ------------------------------------------------------------------- state

func current() -> Dictionary:
	if placing_item != "":
		var spec: Dictionary = PLACEABLES[placing_item].duplicate()
		spec["id"] = placing_item
		spec["cost"] = int(spec.get("cost", 0))
		return spec
	return PIECES[piece]

func current_name() -> String:
	return String(current().get("name", "?"))

func current_cost() -> int:
	return int(current().get("cost", 0))

func toggle() -> void:
	if active:
		stop()
	else:
		start()

func start() -> void:
	if GameState.carrying_log:
		GameState.announce("Not with a log on your shoulder.")
		return
	active = true
	placing_item = ""
	ghost.visible = true
	GameState.set_build_mode(true)
	Sound.play_ui("ui_toggle", -10.0)

# Called from the pack: arms the ghost with an item instead of a build piece.
func begin_placing(item: String) -> void:
	if not PLACEABLES.has(item):
		return
	if not _has_item(item):
		GameState.announce("You have none.")
		return
	active = true
	placing_item = item
	ghost.visible = true
	GameState.set_build_mode(true)
	GameState.announce("Setting down %s. Left click to place, B to stop." %
		String(PLACEABLES[item]["name"]).to_lower())
	Sound.play_ui("ui_toggle", -12.0)

func stop() -> void:
	active = false
	placing_item = ""
	ghost.visible = false
	GameState.set_build_mode(false)

func cycle(step: int) -> void:
	if not active:
		return
	# Cycling always returns you to the build kit; you set one item down at a
	# time rather than scrolling through your pack in the world.
	placing_item = ""
	piece = wrapi(piece + step, 0, PIECES.size())
	Sound.play_ui("ui_toggle", -16.0)

func rotate_ghost() -> void:
	if not active:
		return
	yaw_step = (yaw_step + 1) % 4
	Sound.play_ui("ui_toggle", -16.0)

func _has_item(item: String) -> bool:
	match item:
		"flint":
			return GameState.flint > 0
		"wood":
			return GameState.wood >= int(PLACEABLES["wood"].get("cost", 1))
	return false

func _ground(x: float, z: float) -> float:
	if terrain == null:
		return 0.0
	return float(terrain.call("height_at", x, z))

func _thing_at(x: float, z: float, half: float) -> Node3D:
	for w in built:
		if not is_instance_valid(w):
			continue
		var p: Vector3 = (w as Node3D).global_position
		if absf(p.x - x) < half - SAME_CELL and absf(p.z - z) < half - SAME_CELL:
			return w
	return null

# Where the piece would go: along your aim, snapped, standing on the ground.
func _plan() -> Array:
	if player == null or not is_instance_valid(player):
		player = get_tree().get_first_node_in_group("player")
		if player == null:
			return [Transform3D.IDENTITY, false]
	if camera == null:
		camera = player.get_node_or_null("Head/Camera3D") as Camera3D
		if camera == null:
			return [Transform3D.IDENTITY, false]

	var spec: Dictionary = current()
	var from: Vector3 = camera.global_position
	var dir: Vector3 = -camera.global_transform.basis.z
	var space: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	var query := PhysicsRayQueryParameters3D.create(from, from + dir * REACH)
	query.exclude = [(player as CollisionObject3D).get_rid()]
	var hit: Dictionary = space.intersect_ray(query)
	var spot: Vector3 = from + dir * REACH
	if not hit.is_empty():
		spot = hit.get("position", spot)

	# Items sit exactly where you point; build pieces snap to the grid so a run
	# of walls lines up without fighting the mouse.
	var gx: float = spot.x
	var gz: float = spot.z
	if placing_item == "":
		gx = round(spot.x / GRID) * GRID
		gz = round(spot.z / GRID) * GRID
	var gy: float = _ground(gx, gz)
	var yaw: float = float(yaw_step) * PI * 0.5

	var allowed := true
	var flat: float = Vector2(gx - player.global_position.x, gz - player.global_position.z).length()
	if flat > REACH:
		allowed = false
	if placing_item == "":
		if not GameState.can_build(int(spec["cost"])):
			allowed = false
		if _thing_at(gx, gz, GRID * 0.5) != null:
			allowed = false
		if terrain != null and float(terrain.call("slope_at", gx, gz)) > 0.55:
			allowed = false
	elif not _has_item(placing_item):
		allowed = false

	var xf := Transform3D(Basis(Vector3.UP, yaw),
		Vector3(gx, gy + float(spec["lift"]), gz))
	return [xf, allowed]

func _process(_delta: float) -> void:
	if not active:
		return
	var spec: Dictionary = current()
	(ghost.mesh as BoxMesh).size = spec["size"]
	var plan: Array = _plan()
	ghost_xf = plan[0]
	ghost_ok = bool(plan[1])
	ghost.global_transform = ghost_xf
	ghost.material_override = mat_ghost_ok if ghost_ok else mat_ghost_bad

# ------------------------------------------------------------------ placing

func place() -> void:
	if not active:
		return
	if placing_item != "":
		_place_item()
		return
	var spec: Dictionary = current()
	if not ghost_ok:
		if not GameState.can_build(int(spec["cost"])):
			GameState.announce("Not enough wood. A %s costs %d." % [
				String(spec["name"]).to_lower(), int(spec["cost"])])
		return
	if not GameState.spend_wood(int(spec["cost"])):
		return

	var body := StaticBody3D.new()
	body.name = "Built" + String(spec["id"]).capitalize()
	body.add_to_group("player_wall")
	add_child(body)
	body.global_transform = ghost_xf
	body.set_meta("piece", spec["id"])
	body.set_meta("refund", int(spec["refund"]))

	match String(spec["id"]):
		"door":
			_build_doorway(body, spec)
		"floor":
			_build_slab(body, spec, 4)
		"ramp":
			_build_ramp(body, spec)
		"post":
			_build_post(body, spec)
		_:
			_build_wall(body, spec)

	built.append(body)
	Sound.play_3d("land", body.global_position, -4.0)
	GameState.announce("%s up. %d wood left." % [String(spec["name"]), GameState.wood])

func _place_item() -> void:
	if not ghost_ok:
		GameState.announce("You have none.")
		return
	var item: String = placing_item
	match item:
		"flint":
			GameState.add_flint(-1)
		"wood":
			GameState.spend_wood(int(PLACEABLES["wood"].get("cost", 3)))
	var node: Node3D = PLACED_SCENE.instantiate() as Node3D
	node.set("kind", item)
	get_tree().current_scene.add_child(node)
	node.global_transform = ghost_xf
	Sound.play_3d("land", node.global_position, -12.0)
	if not _has_item(item):
		stop()

# ------------------------------------------------------------------- pieces

func _mesh(parent: Node3D, size: Vector3, pos: Vector3, mat: Material,
		rot: Basis = Basis.IDENTITY) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = Vector3.ONE
	var node := MeshInstance3D.new()
	node.mesh = mesh
	# Composed rather than set through scale then rotation, which shears.
	node.transform = Transform3D(rot * Basis.IDENTITY.scaled(size), pos)
	node.material_override = mat
	parent.add_child(node)
	return node

func _collider(parent: Node3D, size: Vector3, pos: Vector3,
		rot: Basis = Basis.IDENTITY) -> void:
	var cs := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	cs.shape = shape
	cs.transform = Transform3D(rot, pos)
	parent.add_child(cs)

func _plank_face(parent: Node3D, size: Vector3, lines: int) -> void:
	for i in lines:
		_mesh(parent, Vector3(size.x * 0.98, 0.07, size.z + 0.04),
			Vector3(0, -size.y * 0.5 + size.y * (float(i) + 0.5) / float(lines), 0), mat_trim)

func _build_wall(body: StaticBody3D, spec: Dictionary) -> void:
	var size: Vector3 = spec["size"]
	_mesh(body, size, Vector3.ZERO, mat_wood)
	_plank_face(body, size, 4)
	for sx in [-1.0, 1.0]:
		_mesh(body, Vector3(0.16, size.y, size.z + 0.06),
			Vector3(size.x * 0.5 * sx, 0, 0), mat_trim)
	_collider(body, size, Vector3.ZERO)

# A frame with a gap in it and a door hung on one side. The door is its own
# body so it can swing without dragging the frame around with it.
func _build_doorway(body: StaticBody3D, spec: Dictionary) -> void:
	var size: Vector3 = spec["size"]
	var gap_w: float = 1.05
	var gap_h: float = 2.0
	var jamb: float = (size.x - gap_w) * 0.5

	for sx in [-1.0, 1.0]:
		var pos := Vector3((gap_w * 0.5 + jamb * 0.5) * sx, 0, 0)
		_mesh(body, Vector3(jamb, size.y, size.z), pos, mat_wood)
		_collider(body, Vector3(jamb, size.y, size.z), pos)
	# The lintel over the opening.
	var head_h: float = size.y - gap_h
	var head_pos := Vector3(0, size.y * 0.5 - head_h * 0.5, 0)
	_mesh(body, Vector3(gap_w, head_h, size.z), head_pos, mat_wood)
	_collider(body, Vector3(gap_w, head_h, size.z), head_pos)
	_mesh(body, Vector3(size.x + 0.1, 0.12, size.z + 0.06),
		Vector3(0, size.y * 0.5 - head_h, 0), mat_trim)

	var door: Node3D = load("res://scripts/door.gd").new()
	door.name = "Door"
	# Hinged at one jamb: the pivot sits at the edge of the opening so the leaf
	# swings about it instead of spinning around its own middle.
	door.position = Vector3(-gap_w * 0.5, -size.y * 0.5 + gap_h * 0.5, 0)
	door.set("leaf_size", Vector3(gap_w, gap_h - 0.06, size.z * 0.7))
	door.set("wood_mat", mat_wood)
	door.set("trim_mat", mat_trim)
	body.add_child(door)

func _build_slab(body: StaticBody3D, spec: Dictionary, lines: int) -> void:
	var size: Vector3 = spec["size"]
	_mesh(body, size, Vector3.ZERO, mat_wood)
	for i in lines:
		_mesh(body, Vector3(size.x * 0.97, size.y + 0.03, 0.06),
			Vector3(0, 0, -size.z * 0.5 + size.z * (float(i) + 0.5) / float(lines)), mat_trim)
	_collider(body, size, Vector3.ZERO)

func _build_ramp(body: StaticBody3D, spec: Dictionary) -> void:
	var size: Vector3 = spec["size"]
	# Tilted about its own width axis so it climbs one storey over its run.
	var pitch: float = -atan2(1.3, size.z)
	var rot := Basis(Vector3.RIGHT, pitch)
	_mesh(body, size, Vector3.ZERO, mat_wood, rot)
	for i in 5:
		_mesh(body, Vector3(size.x * 0.97, size.y + 0.04, 0.08),
			rot * Vector3(0, 0, -size.z * 0.5 + size.z * (float(i) + 0.5) / 5.0), mat_trim, rot)
	_collider(body, size, Vector3.ZERO, rot)

func _build_post(body: StaticBody3D, spec: Dictionary) -> void:
	var size: Vector3 = spec["size"]
	_mesh(body, size, Vector3.ZERO, mat_wood)
	_mesh(body, Vector3(size.x * 1.9, 0.18, size.z * 1.9), Vector3(0, size.y * 0.5, 0), mat_trim)
	var glow := StandardMaterial3D.new()
	glow.albedo_color = Color(1.0, 0.76, 0.38)
	glow.emission_enabled = true
	glow.emission = Color(1.0, 0.68, 0.28)
	glow.emission_energy_multiplier = 4.0
	_mesh(body, Vector3(0.26, 0.3, 0.26), Vector3(0, size.y * 0.5 + 0.2, 0), glow)
	var lamp := OmniLight3D.new()
	lamp.position = Vector3(0, size.y * 0.5 + 0.3, 0)
	lamp.light_color = Color(1.0, 0.72, 0.36)
	lamp.light_energy = 3.2
	lamp.omni_range = 15.0
	body.add_child(lamp)
	_collider(body, size, Vector3.ZERO)

# Right click takes back whatever you are pointing at, for part of the wood.
func remove() -> void:
	if not active or placing_item != "":
		return
	var target: Node3D = _thing_at(ghost_xf.origin.x, ghost_xf.origin.z, GRID * 0.5)
	if target == null:
		return
	var back: int = int(target.get_meta("refund", 2))
	built.erase(target)
	target.queue_free()
	GameState.add_wood(back)
	GameState.announce("Pulled down. %d wood back." % back)
	Sound.play_ui("ui_toggle", -12.0)

extends Node3D

# Building. Press B to raise a ghost of the next wall, left click to plant it,
# right click to take one back down.
#
# The ghost is a real preview, not a cursor: it stands where the wall will
# actually stand, snapped to a grid and sitting on the terrain, and it turns red
# when the spot is refused. What you see before you click is what you get.

const WALL_COST := 6
const REFUND := 3
const GRID := 2.0
const WALL := Vector3(2.0, 2.6, 0.35)
const REACH := 8.0
# Walls are placed on a grid, so this is how close two centres may be before
# they are treated as the same cell.
const SAME_CELL := 0.05

var active := false
var ghost: MeshInstance3D = null
var ghost_ok := false
var ghost_xf: Transform3D = Transform3D.IDENTITY
var yaw_step := 0
var walls: Array = []
var terrain: Node = null
var player: Node3D = null
var camera: Camera3D = null

var mat_wall: StandardMaterial3D
var mat_ghost_ok: StandardMaterial3D
var mat_ghost_bad: StandardMaterial3D

func _ready() -> void:
	add_to_group("builder")
	terrain = get_tree().get_first_node_in_group("terrain")
	_make_materials()
	_make_ghost()

func _make_materials() -> void:
	mat_wall = StandardMaterial3D.new()
	mat_wall.albedo_color = Color(0.44, 0.32, 0.20)
	mat_wall.roughness = 0.95

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
	var mesh := BoxMesh.new()
	mesh.size = WALL
	ghost = MeshInstance3D.new()
	ghost.name = "BuildGhost"
	ghost.mesh = mesh
	ghost.material_override = mat_ghost_ok
	ghost.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	ghost.visible = false
	add_child(ghost)

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
	ghost.visible = true
	GameState.set_build_mode(true)
	GameState.announce("Build mode. Left click to place, right click to remove, R to turn.")
	Sound.play_ui("ui_toggle", -10.0)

func stop() -> void:
	active = false
	ghost.visible = false
	GameState.set_build_mode(false)

func rotate_ghost() -> void:
	if not active:
		return
	yaw_step = (yaw_step + 1) % 4
	Sound.play_ui("ui_toggle", -14.0)

# Where the wall would go: along the player's aim, snapped to the grid, with its
# base on the ground. Returns [transform, allowed].
func _plan() -> Array:
	if player == null or not is_instance_valid(player):
		player = get_tree().get_first_node_in_group("player")
		if player == null:
			return [Transform3D.IDENTITY, false]
		camera = player.get_node_or_null("Head/Camera3D") as Camera3D
	if camera == null:
		camera = player.get_node_or_null("Head/Camera3D") as Camera3D
		if camera == null:
			return [Transform3D.IDENTITY, false]

	# Aim at the ground where you are looking; if you are looking at the sky,
	# fall back to a point a few metres in front of you.
	var from: Vector3 = camera.global_position
	var dir: Vector3 = -camera.global_transform.basis.z
	var space: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	var query := PhysicsRayQueryParameters3D.create(from, from + dir * REACH)
	query.exclude = [(player as CollisionObject3D).get_rid()]
	var hit: Dictionary = space.intersect_ray(query)
	var spot: Vector3
	if hit.is_empty():
		spot = from + dir * REACH
	else:
		spot = hit.get("position", from + dir * REACH)

	var gx: float = round(spot.x / GRID) * GRID
	var gz: float = round(spot.z / GRID) * GRID
	var gy: float = _ground(gx, gz)
	var yaw: float = float(yaw_step) * PI * 0.5

	var allowed := true
	# Out of reach on the flat, measured from the player rather than the camera.
	var flat: float = Vector2(gx - player.global_position.x, gz - player.global_position.z).length()
	if flat > REACH:
		allowed = false
	if not GameState.can_build(WALL_COST):
		allowed = false
	# One wall per cell.
	if _wall_at(gx, gz) != null:
		allowed = false
	# Nothing on a slope so steep the wall would hang off it.
	if terrain != null and float(terrain.call("slope_at", gx, gz)) > 0.55:
		allowed = false

	var xf := Transform3D(Basis(Vector3.UP, yaw), Vector3(gx, gy + WALL.y * 0.5, gz))
	return [xf, allowed]

func _ground(x: float, z: float) -> float:
	if terrain == null:
		return 0.0
	return float(terrain.call("height_at", x, z))

func _wall_at(x: float, z: float) -> Node3D:
	for w in walls:
		if not is_instance_valid(w):
			continue
		var p: Vector3 = (w as Node3D).global_position
		if absf(p.x - x) < GRID * 0.5 - SAME_CELL and absf(p.z - z) < GRID * 0.5 - SAME_CELL:
			return w
	return null

func _process(_delta: float) -> void:
	if not active:
		return
	var plan: Array = _plan()
	ghost_xf = plan[0]
	ghost_ok = bool(plan[1])
	ghost.global_transform = ghost_xf
	ghost.material_override = mat_ghost_ok if ghost_ok else mat_ghost_bad

func place() -> void:
	if not active:
		return
	if not ghost_ok:
		if not GameState.can_build(WALL_COST):
			GameState.announce("Not enough wood. A wall costs %d." % WALL_COST)
		return
	if not GameState.spend_wood(WALL_COST):
		return

	var body := StaticBody3D.new()
	body.name = "PlayerWall"
	body.add_to_group("player_wall")
	add_child(body)
	body.global_transform = ghost_xf

	var mesh := BoxMesh.new()
	mesh.size = WALL
	var view := MeshInstance3D.new()
	view.mesh = mesh
	view.material_override = mat_wall
	body.add_child(view)

	# Plank lines across the face, so a wall is not one bare slab.
	var plank := BoxMesh.new()
	plank.size = Vector3(WALL.x * 0.98, 0.07, WALL.z + 0.04)
	var trim := StandardMaterial3D.new()
	trim.albedo_color = Color(0.28, 0.20, 0.13)
	trim.roughness = 0.95
	for i in 4:
		var line := MeshInstance3D.new()
		line.mesh = plank
		line.material_override = trim
		line.position = Vector3(0, -WALL.y * 0.5 + WALL.y * (float(i) + 0.5) / 4.0, 0)
		body.add_child(line)
	# Uprights at each end.
	for sx in [-1.0, 1.0]:
		var postmesh := BoxMesh.new()
		postmesh.size = Vector3(0.16, WALL.y, WALL.z + 0.06)
		var post := MeshInstance3D.new()
		post.mesh = postmesh
		post.material_override = trim
		post.position = Vector3(WALL.x * 0.5 * sx, 0, 0)
		body.add_child(post)

	var cs := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = WALL
	cs.shape = shape
	body.add_child(cs)

	walls.append(body)
	Sound.play_3d("land", body.global_position, -4.0)
	GameState.announce("Wall up. %d wood left." % GameState.wood)

# Right click takes back the wall you are looking at, for part of the wood.
func remove() -> void:
	if not active:
		return
	var target: Node3D = _wall_at(ghost_xf.origin.x, ghost_xf.origin.z)
	if target == null:
		return
	walls.erase(target)
	target.queue_free()
	GameState.add_wood(REFUND)
	GameState.announce("Wall pulled down. %d wood back." % REFUND)
	Sound.play_ui("ui_toggle", -12.0)

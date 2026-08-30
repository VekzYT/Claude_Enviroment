extends Node
## Keeps a small population of night creatures around the player.
##
## Spawning is deliberately cheap: a handful of random column probes every few
## seconds, nothing per-frame, and a hard cap on how many can exist.

const MAX_MOBS := 12
const SPAWN_INTERVAL := 3.5
const MIN_DISTANCE := 16.0
const MAX_DISTANCE := 42.0
const ATTEMPTS := 12

var world: VoxelWorld
var player: Node3D
var day_night: DayNight

var _timer := 0.0
var _mobs: Array = []


func setup(p_world: VoxelWorld, p_player: Node3D, p_day_night: DayNight) -> void:
	world = p_world
	player = p_player
	day_night = p_day_night


func _process(delta: float) -> void:
	if world == null or player == null or day_night == null:
		return
	_timer -= delta
	if _timer > 0.0:
		return
	_timer = SPAWN_INTERVAL

	_mobs = _mobs.filter(func(m: Node) -> bool: return is_instance_valid(m))
	if not day_night.is_night():
		return
	if _mobs.size() >= MAX_MOBS:
		return

	for i in ATTEMPTS:
		var spot := _find_spawn_spot()
		if spot != Vector3.INF:
			_spawn(spot)
			return


func _find_spawn_spot() -> Vector3:
	var angle := randf() * TAU
	var distance := randf_range(MIN_DISTANCE, MAX_DISTANCE)
	var bx := floori(player.global_position.x + sin(angle) * distance)
	var bz := floori(player.global_position.z + cos(angle) * distance)

	var start := floori(player.global_position.y) + 8
	for y in range(start, maxi(start - 32, 2), -1):
		if not world.is_solid_at(bx, y, bz):
			continue
		var ground := world.get_block(bx, y, bz)
		if BlockDB.is_liquid(ground):
			continue
		if world.is_solid_at(bx, y + 1, bz) or world.is_solid_at(bx, y + 2, bz):
			continue
		if BlockDB.is_liquid(world.get_block(bx, y + 1, bz)):
			continue
		return Vector3(bx + 0.5, y + 1.05, bz + 0.5)
	return Vector3.INF


func _spawn(spot: Vector3) -> void:
	var mob := Mob.new()
	mob.setup(world, player)
	get_parent().add_child(mob)
	mob.global_position = spot
	mob.died.connect(func(m: Mob) -> void: _mobs.erase(m))
	_mobs.append(mob)


func mob_count() -> int:
	_mobs = _mobs.filter(func(m: Node) -> bool: return is_instance_valid(m))
	return _mobs.size()


func clear_all() -> void:
	for m in _mobs:
		if is_instance_valid(m):
			m.queue_free()
	_mobs.clear()

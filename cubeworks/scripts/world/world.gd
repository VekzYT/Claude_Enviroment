class_name VoxelWorld
extends Node3D
## Streams chunks in and out around the player and owns every block in the game.
##
## Generation and meshing both run on WorkerThreadPool threads. Worker code only
## ever touches plain byte arrays, never the scene tree; finished work is parked
## in a mutex-guarded list and attached to the tree a few chunks per frame so the
## main thread never stalls.

signal spawn_area_ready
signal chunk_became_ready(coord: Vector2i)

const CH := 16
const HEIGHT := 128
const VOLUME := CH * CH * HEIGHT

## How many chunk jobs may be in flight at once.
const MAX_TASKS := 6
## How many finished chunks are attached to the tree per frame.
const APPLY_PER_FRAME := 3

var generator: TerrainGenerator
var render_distance: int = 7
var player: Node3D

var chunks: Dictionary = {}          # Vector2i -> Chunk

var _center := Vector2i(999999, 999999)
var _load_queue: Array = []
var _mesh_queue: Array = []
## Membership set for _mesh_queue so "is it already queued?" stays O(1).
var _mesh_queued: Dictionary = {}
var _results: Array = []
var _result_mutex := Mutex.new()
var _pool_mutex := Mutex.new()
var _gen_pool: Array = []
var _mesher_pool: Array = []
var _tasks: Array = []
var _shutting_down := false
var _spawn_announced := false

# Debug counters shown by the F3 overlay.
var stat_generated := 0
var stat_meshed := 0


func _ready() -> void:
	generator = TerrainGenerator.new(GameState.world_seed)
	render_distance = GameState.render_distance


func setup(p_player: Node3D) -> void:
	player = p_player


func _exit_tree() -> void:
	_shutting_down = true
	for id in _tasks:
		WorkerThreadPool.wait_for_task_completion(id)
	_tasks.clear()


# ------------------------------------------------------------- main loop

func _process(_delta: float) -> void:
	_sweep_tasks()
	_apply_results()
	if player == null:
		return

	var pc := world_to_chunk(player.global_position)
	if pc != _center:
		_center = pc
		_rebuild_load_queue()
		_unload_far_chunks()

	_start_tasks()
	_check_spawn_ready()


func _sweep_tasks() -> void:
	var i := _tasks.size() - 1
	while i >= 0:
		var id: int = _tasks[i]
		if WorkerThreadPool.is_task_completed(id):
			WorkerThreadPool.wait_for_task_completion(id)
			_tasks.remove_at(i)
		i -= 1


func _start_tasks() -> void:
	# Remeshes come first: they are what the player is looking at right now.
	while _tasks.size() < MAX_TASKS and not _mesh_queue.is_empty():
		var coord: Vector2i = _mesh_queue.pop_front()
		_mesh_queued.erase(coord)
		_begin_mesh(coord)

	while _tasks.size() < MAX_TASKS and not _load_queue.is_empty():
		var coord2: Vector2i = _load_queue.pop_front()
		if chunks.has(coord2):
			continue
		_begin_generate(coord2)


func _check_spawn_ready() -> void:
	if _spawn_announced:
		return
	var c: Chunk = chunks.get(_center)
	if c != null and c.state == Chunk.State.READY:
		_spawn_announced = true
		spawn_area_ready.emit()


# --------------------------------------------------------- chunk lifecycle

func _rebuild_load_queue() -> void:
	_load_queue.clear()
	# One extra ring is generated but never meshed; it only exists so the chunks
	# we do mesh have real neighbours and therefore no seams.
	var r := render_distance + 1
	var wanted: Array = []
	for dz in range(-r, r + 1):
		for dx in range(-r, r + 1):
			var coord := _center + Vector2i(dx, dz)
			if chunks.has(coord):
				continue
			wanted.append(coord)
	wanted.sort_custom(func(a: Vector2i, b: Vector2i) -> bool:
		return _dist2(a) < _dist2(b))
	_load_queue = wanted

	# Anything already loaded may now be mesh-able or may have come into range.
	for coord in chunks:
		_consider_mesh(coord)


func _dist2(c: Vector2i) -> int:
	var dx := c.x - _center.x
	var dz := c.y - _center.y
	return dx * dx + dz * dz


func _chebyshev(c: Vector2i) -> int:
	return maxi(absi(c.x - _center.x), absi(c.y - _center.y))


func _unload_far_chunks() -> void:
	var limit := render_distance + 3
	var doomed: Array = []
	for coord in chunks:
		if _chebyshev(coord) > limit:
			doomed.append(coord)
	for coord in doomed:
		var c: Chunk = chunks[coord]
		# A chunk with a job in flight is kept until the result is discarded.
		chunks.erase(coord)
		c.queue_free()
	if not doomed.is_empty():
		var i := _mesh_queue.size() - 1
		while i >= 0:
			if not chunks.has(_mesh_queue[i]):
				_mesh_queued.erase(_mesh_queue[i])
				_mesh_queue.remove_at(i)
			i -= 1


func _begin_generate(coord: Vector2i) -> void:
	var c := Chunk.new()
	c.setup(coord)
	c.state = Chunk.State.GENERATING
	chunks[coord] = c
	add_child(c)
	var id := WorkerThreadPool.add_task(_task_generate.bind(coord), false, "chunk gen")
	_tasks.append(id)


func _begin_mesh(coord: Vector2i) -> void:
	var c: Chunk = chunks.get(coord)
	if c == null or not c.has_data():
		return
	var neighbours := [
		_neighbour_data(coord + Vector2i(-1, 0)),
		_neighbour_data(coord + Vector2i(1, 0)),
		_neighbour_data(coord + Vector2i(0, -1)),
		_neighbour_data(coord + Vector2i(0, 1)),
	]
	c.meshing = true
	c.dirty = false
	var id := WorkerThreadPool.add_task(
		_task_mesh.bind(coord, c.data, neighbours, c.max_y, c.mesh_revision), false, "chunk mesh")
	_tasks.append(id)


func _neighbour_data(coord: Vector2i) -> PackedByteArray:
	var c: Chunk = chunks.get(coord)
	if c == null or not c.has_data():
		return PackedByteArray()
	return c.data


## A chunk may be meshed once it and all four of its neighbours hold voxels.
func _consider_mesh(coord: Vector2i) -> void:
	var c: Chunk = chunks.get(coord)
	if c == null or not c.has_data():
		return
	if c.meshing:
		return
	if c.state == Chunk.State.READY and not c.dirty:
		return
	if _chebyshev(coord) > render_distance:
		return
	for offset in [Vector2i(-1, 0), Vector2i(1, 0), Vector2i(0, -1), Vector2i(0, 1)]:
		var n: Chunk = chunks.get(coord + offset)
		if n == null or not n.has_data():
			return
	if not _mesh_queued.has(coord):
		_mesh_queued[coord] = true
		_mesh_queue.append(coord)


# ------------------------------------------------------------ worker tasks

func _acquire_generator() -> TerrainGenerator:
	_pool_mutex.lock()
	var g: TerrainGenerator = _gen_pool.pop_back() if not _gen_pool.is_empty() else null
	_pool_mutex.unlock()
	if g == null:
		g = TerrainGenerator.new(GameState.world_seed)
	return g


func _release_generator(g: TerrainGenerator) -> void:
	_pool_mutex.lock()
	_gen_pool.append(g)
	_pool_mutex.unlock()


func _acquire_mesher() -> ChunkMesher:
	_pool_mutex.lock()
	var m: ChunkMesher = _mesher_pool.pop_back() if not _mesher_pool.is_empty() else null
	_pool_mutex.unlock()
	if m == null:
		m = ChunkMesher.new()
	return m


func _release_mesher(m: ChunkMesher) -> void:
	_pool_mutex.lock()
	_mesher_pool.append(m)
	_pool_mutex.unlock()


func _task_generate(coord: Vector2i) -> void:
	if _shutting_down:
		return
	var gen := _acquire_generator()
	var res := gen.generate_chunk(coord.x, coord.y)
	_release_generator(gen)

	var data: PackedByteArray = res["data"]
	var max_y: int = res["max_y"]

	# Replay everything the player has changed in this chunk.
	var edits: Dictionary = SaveManager.get_chunk_edits(coord)
	if not edits.is_empty():
		for key in edits:
			var index: int = key
			if index < 0 or index >= VOLUME:
				continue
			var id: int = edits[key]
			data[index] = id
			if id != BlockDB.AIR:
				max_y = maxi(max_y, index >> 8)

	_result_mutex.lock()
	_results.append({"kind": "gen", "coord": coord, "data": data, "max_y": max_y})
	_result_mutex.unlock()


func _task_mesh(coord: Vector2i, data: PackedByteArray, neighbours: Array,
		max_y: int, revision: int) -> void:
	if _shutting_down:
		return
	var mesher := _acquire_mesher()
	var out := mesher.build(data, neighbours, max_y)
	_release_mesher(mesher)

	var mesh_opaque := _make_mesh(out["opaque"])
	var mesh_transparent := _make_mesh(out["transparent"])

	var shape: ConcavePolygonShape3D = null
	var faces: PackedVector3Array = out["collision"]
	if faces.size() >= 3:
		shape = ConcavePolygonShape3D.new()
		shape.set_faces(faces)

	_result_mutex.lock()
	_results.append({
		"kind": "mesh", "coord": coord, "revision": revision,
		"mesh_opaque": mesh_opaque, "mesh_transparent": mesh_transparent, "shape": shape,
	})
	_result_mutex.unlock()


func _make_mesh(surface) -> ArrayMesh:
	if surface == null:
		return null
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = surface[0]
	arrays[Mesh.ARRAY_NORMAL] = surface[1]
	arrays[Mesh.ARRAY_TEX_UV] = surface[2]
	arrays[Mesh.ARRAY_COLOR] = surface[3]
	var m := ArrayMesh.new()
	m.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	return m


# ------------------------------------------------------- applying results

func _apply_results() -> void:
	var batch: Array = []
	var keep: Array = []
	_result_mutex.lock()
	var meshes_taken := 0
	while not _results.is_empty():
		var result: Dictionary = _results.pop_front()
		if result["kind"] == "gen":
			# Terrain data is just a byte array handover, so never throttle it.
			batch.append(result)
		elif meshes_taken < APPLY_PER_FRAME:
			meshes_taken += 1
			batch.append(result)
		else:
			keep.append(result)
	if not keep.is_empty():
		_results = keep + _results
	_result_mutex.unlock()

	for result in batch:
		if result["kind"] == "gen":
			_apply_generated(result)
		else:
			_apply_mesh(result)


func _apply_generated(result: Dictionary) -> void:
	var coord: Vector2i = result["coord"]
	var c: Chunk = chunks.get(coord)
	if c == null:
		return
	c.data = result["data"]
	c.max_y = result["max_y"]
	c.state = Chunk.State.DATA_READY
	stat_generated += 1
	_consider_mesh(coord)
	for offset in [Vector2i(-1, 0), Vector2i(1, 0), Vector2i(0, -1), Vector2i(0, 1)]:
		_consider_mesh(coord + offset)


func _apply_mesh(result: Dictionary) -> void:
	var coord: Vector2i = result["coord"]
	var c: Chunk = chunks.get(coord)
	if c == null:
		return
	c.meshing = false
	if result["revision"] != c.mesh_revision:
		# The chunk changed while the mesh was being built; do it again.
		c.dirty = true
		_consider_mesh(coord)
		return
	c.apply_surfaces(result)
	stat_meshed += 1
	chunk_became_ready.emit(coord)
	if c.dirty:
		_consider_mesh(coord)


# --------------------------------------------------------- block accessors

static func world_to_chunk(pos: Vector3) -> Vector2i:
	return Vector2i(floori(pos.x / float(CH)), floori(pos.z / float(CH)))


static func block_to_chunk(bx: int, bz: int) -> Vector2i:
	return Vector2i(bx >> 4, bz >> 4)


func get_block(bx: int, by: int, bz: int) -> int:
	if by < 0 or by >= HEIGHT:
		return BlockDB.AIR
	var c: Chunk = chunks.get(Vector2i(bx >> 4, bz >> 4))
	if c == null or not c.has_data():
		return BlockDB.AIR
	return c.get_block(bx & 15, by, bz & 15)


func get_block_v(p: Vector3i) -> int:
	return get_block(p.x, p.y, p.z)


func is_solid_at(bx: int, by: int, bz: int) -> bool:
	return BlockDB.is_solid(get_block(bx, by, bz))


## Changes one block and schedules the smallest possible rebuild.
## Returns true when the world actually changed.
func set_block(bx: int, by: int, bz: int, id: int, record: bool = true) -> bool:
	if by < 0 or by >= HEIGHT:
		return false
	var coord := Vector2i(bx >> 4, bz >> 4)
	var c: Chunk = chunks.get(coord)
	if c == null or not c.has_data():
		return false
	var lx := bx & 15
	var lz := bz & 15
	if c.get_block(lx, by, lz) == id:
		return false

	c.set_block(lx, by, lz, id)
	c.mesh_revision += 1
	c.dirty = true

	if record:
		SaveManager.record_edit(coord, Chunk.index_of(lx, by, lz), id)

	_consider_mesh(coord)
	# A block on a chunk seam also changes what its neighbour can see.
	if lx == 0:
		_touch_neighbour(coord + Vector2i(-1, 0))
	elif lx == CH - 1:
		_touch_neighbour(coord + Vector2i(1, 0))
	if lz == 0:
		_touch_neighbour(coord + Vector2i(0, -1))
	elif lz == CH - 1:
		_touch_neighbour(coord + Vector2i(0, 1))
	return true


func _touch_neighbour(coord: Vector2i) -> void:
	var c: Chunk = chunks.get(coord)
	if c == null:
		return
	c.mesh_revision += 1
	c.dirty = true
	_consider_mesh(coord)


## True when the column at this position has real voxels behind it. The player
## uses it to avoid falling through a chunk that has not streamed in yet.
func has_data_at(pos: Vector3) -> bool:
	var c: Chunk = chunks.get(Vector2i(floori(pos.x) >> 4, floori(pos.z) >> 4))
	return c != null and c.has_data()


func is_chunk_ready(coord: Vector2i) -> bool:
	var c: Chunk = chunks.get(coord)
	return c != null and c.state == Chunk.State.READY


# ------------------------------------------------------------- ray casting

## Walks the voxel grid one cell at a time (the classic Amanatides & Woo
## traversal) so aiming is exact instead of "close enough".
##
## Returns { "hit": bool, "block": Vector3i, "normal": Vector3i,
##           "place": Vector3i, "id": int }.
func raycast(origin: Vector3, direction: Vector3, max_distance: float) -> Dictionary:
	var miss := {"hit": false, "block": Vector3i.ZERO, "normal": Vector3i.ZERO,
			"place": Vector3i.ZERO, "id": BlockDB.AIR}
	var dir := direction.normalized()
	if dir.length_squared() < 0.5:
		return miss

	var bx := floori(origin.x)
	var by := floori(origin.y)
	var bz := floori(origin.z)

	var step_x := 1 if dir.x > 0.0 else -1
	var step_y := 1 if dir.y > 0.0 else -1
	var step_z := 1 if dir.z > 0.0 else -1

	var inf := 1.0e30
	var t_delta_x := inf if absf(dir.x) < 1e-8 else absf(1.0 / dir.x)
	var t_delta_y := inf if absf(dir.y) < 1e-8 else absf(1.0 / dir.y)
	var t_delta_z := inf if absf(dir.z) < 1e-8 else absf(1.0 / dir.z)

	var next_x := float(bx + (1 if step_x > 0 else 0))
	var next_y := float(by + (1 if step_y > 0 else 0))
	var next_z := float(bz + (1 if step_z > 0 else 0))

	var t_max_x := inf if t_delta_x == inf else (next_x - origin.x) / dir.x
	var t_max_y := inf if t_delta_y == inf else (next_y - origin.y) / dir.y
	var t_max_z := inf if t_delta_z == inf else (next_z - origin.z) / dir.z

	var normal := Vector3i.ZERO
	var travelled := 0.0

	# The block the ray starts inside counts too.
	var start_id := get_block(bx, by, bz)
	if BlockDB.is_solid(start_id):
		return {"hit": true, "block": Vector3i(bx, by, bz), "normal": Vector3i(0, 1, 0),
				"place": Vector3i(bx, by + 1, bz), "id": start_id}

	while travelled <= max_distance:
		if t_max_x < t_max_y and t_max_x < t_max_z:
			bx += step_x
			travelled = t_max_x
			t_max_x += t_delta_x
			normal = Vector3i(-step_x, 0, 0)
		elif t_max_y < t_max_z:
			by += step_y
			travelled = t_max_y
			t_max_y += t_delta_y
			normal = Vector3i(0, -step_y, 0)
		else:
			bz += step_z
			travelled = t_max_z
			t_max_z += t_delta_z
			normal = Vector3i(0, 0, -step_z)

		if travelled > max_distance:
			break
		if by < 0 or by >= HEIGHT:
			continue

		var id := get_block(bx, by, bz)
		if BlockDB.is_solid(id):
			var hit_block := Vector3i(bx, by, bz)
			return {"hit": true, "block": hit_block, "normal": normal,
					"place": hit_block + normal, "id": id}

	return miss


# ------------------------------------------------------------------ spawn

## A safe standing spot near the world origin (or near a saved position):
## above sea level, off the beach, and clear of trees.
func find_spawn(around: Vector2i = Vector2i.ZERO) -> Vector3:
	for radius in range(0, 48):
		for dz in range(-radius, radius + 1):
			for dx in range(-radius, radius + 1):
				if radius > 0 and absi(dx) != radius and absi(dz) != radius:
					continue
				var wx := around.x + dx
				var wz := around.y + dz
				var h := generator.surface_height(wx, wz)
				if h <= TerrainGenerator.SEA_LEVEL + 3:
					continue
				if generator.has_plant_near(wx, wz, 2):
					continue
				return Vector3(wx + 0.5, h + 1.05, wz + 0.5)
	return Vector3(0.5, TerrainGenerator.SEA_LEVEL + 24, 0.5)


## Drops a position onto the first solid block beneath it that has room to
## stand. Used once the chunks around the spawn have actually loaded, so the
## player never starts inside terrain or inside a tree.
func settle_on_ground(pos: Vector3) -> Vector3:
	var bx := floori(pos.x)
	var bz := floori(pos.z)
	var start := mini(HEIGHT - 3, floori(pos.y) + 6)
	for y in range(start, 0, -1):
		if not BlockDB.is_solid(get_block(bx, y, bz)):
			continue
		if BlockDB.is_solid(get_block(bx, y + 1, bz)):
			continue
		if BlockDB.is_solid(get_block(bx, y + 2, bz)):
			continue
		return Vector3(bx + 0.5, float(y + 1) + 0.05, bz + 0.5)
	return pos

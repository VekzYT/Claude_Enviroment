class_name TerrainGenerator
extends RefCounted
## Deterministic procedural world generation.
##
## Everything here is a pure function of the world seed plus a coordinate, so
## the same seed always rebuilds exactly the same world and chunks can be
## generated on worker threads in any order.

const CH := 16                  ## chunk width and depth in blocks
const HEIGHT := 128             ## world height in blocks
const SEA_LEVEL := 46

# Biomes.
const B_OCEAN := 0
const B_BEACH := 1
const B_PLAINS := 2
const B_FOREST := 3
const B_DESERT := 4
const B_SNOWY := 5
const B_MOUNTAIN := 6

const BIOME_NAMES := ["Ocean", "Shore", "Plains", "Woodland", "Dunes", "Frostland", "Highlands"]

var world_seed: int = 0

var _n_continent := FastNoiseLite.new()
var _n_hills := FastNoiseLite.new()
var _n_mountain := FastNoiseLite.new()
var _n_ridge := FastNoiseLite.new()
var _n_temp := FastNoiseLite.new()
var _n_moist := FastNoiseLite.new()
var _n_cave_a := FastNoiseLite.new()
var _n_cave_b := FastNoiseLite.new()
var _n_cheese := FastNoiseLite.new()
var _n_coal := FastNoiseLite.new()
var _n_iron := FastNoiseLite.new()
var _n_gravel := FastNoiseLite.new()


func _init(p_seed: int = 0) -> void:
	world_seed = p_seed
	_setup(_n_continent, p_seed + 11, 0.0016, FastNoiseLite.TYPE_SIMPLEX, 3, 0.5)
	_setup(_n_hills, p_seed + 23, 0.0062, FastNoiseLite.TYPE_SIMPLEX, 2, 0.45)
	_setup(_n_mountain, p_seed + 37, 0.0030, FastNoiseLite.TYPE_SIMPLEX, 2, 0.5)
	_setup(_n_ridge, p_seed + 43, 0.0052, FastNoiseLite.TYPE_SIMPLEX, 3, 0.5)
	_setup(_n_temp, p_seed + 53, 0.0009, FastNoiseLite.TYPE_SIMPLEX, 2, 0.5)
	_setup(_n_moist, p_seed + 71, 0.0011, FastNoiseLite.TYPE_SIMPLEX, 2, 0.5)
	_setup(_n_cave_a, p_seed + 97, 0.0260, FastNoiseLite.TYPE_SIMPLEX, 2, 0.5)
	_setup(_n_cave_b, p_seed + 113, 0.0260, FastNoiseLite.TYPE_SIMPLEX, 2, 0.5)
	_setup(_n_cheese, p_seed + 131, 0.0450, FastNoiseLite.TYPE_SIMPLEX, 1, 0.5)
	_setup(_n_coal, p_seed + 149, 0.0900, FastNoiseLite.TYPE_SIMPLEX, 1, 0.5)
	_setup(_n_iron, p_seed + 167, 0.1000, FastNoiseLite.TYPE_SIMPLEX, 1, 0.5)
	_setup(_n_gravel, p_seed + 181, 0.0700, FastNoiseLite.TYPE_SIMPLEX, 1, 0.5)


func _setup(n: FastNoiseLite, s: int, freq: float, type: int, octaves: int, gain: float) -> void:
	n.seed = s
	n.frequency = freq
	n.noise_type = type
	n.fractal_type = FastNoiseLite.FRACTAL_FBM
	n.fractal_octaves = octaves
	n.fractal_gain = gain


# ----------------------------------------------------------- surface shape

## Terrain height (index of the topmost solid block) at a world column.
func surface_height(wx: int, wz: int) -> int:
	var fx := float(wx)
	var fz := float(wz)

	# Biased upward so most of the map is walkable land with seas between,
	# rather than an even split of land and ocean.
	var continent := _n_continent.get_noise_2d(fx, fz)          # -1 .. 1
	var base := float(SEA_LEVEL) + 9.0 + continent * 34.0

	var hills := _n_hills.get_noise_2d(fx, fz) * 13.0

	# Mountains are a separate, rarer feature rather than something added to
	# every column: one low-frequency field decides *where* a range is, and
	# ridged noise decides its shape. Cubing the ridge keeps the peaks sharp
	# and the surrounding land flat instead of tilting the whole map.
	var mountainness := clampf((_n_mountain.get_noise_2d(fx, fz) - 0.14) * 2.6, 0.0, 1.0)
	var mountain := 0.0
	if mountainness > 0.0:
		var ridge := 1.0 - absf(_n_ridge.get_noise_2d(fx, fz))
		ridge = ridge * ridge * ridge
		mountain = ridge * 44.0 * mountainness * mountainness

	var h := int(round(base + hills + mountain))
	return clampi(h, 4, HEIGHT - 10)


func temperature(wx: int, wz: int) -> float:
	return _n_temp.get_noise_2d(float(wx), float(wz))


func moisture(wx: int, wz: int) -> float:
	return _n_moist.get_noise_2d(float(wx) + 1000.0, float(wz) - 1000.0)


func biome_at(wx: int, wz: int, h: int) -> int:
	if h < SEA_LEVEL - 2:
		return B_OCEAN
	if h <= SEA_LEVEL + 2:
		return B_BEACH
	if h >= SEA_LEVEL + 34:
		return B_MOUNTAIN
	var t := temperature(wx, wz)
	var m := moisture(wx, wz)
	if t < -0.32:
		return B_SNOWY
	if t > 0.26 and m < 0.02:
		return B_DESERT
	if m > 0.10:
		return B_FOREST
	return B_PLAINS


## True when a tree or cactus would grow in (or right next to) this column.
## Spawn picking uses it so nobody starts inside a trunk.
func has_plant_near(wx: int, wz: int, radius: int = 2) -> bool:
	for dz in range(-radius, radius + 1):
		for dx in range(-radius, radius + 1):
			var x := wx + dx
			var z := wz + dz
			var h := surface_height(x, z)
			if h <= SEA_LEVEL:
				continue
			var roll := _hash01(x, z, 17)
			match biome_at(x, z, h):
				B_FOREST:
					if roll < 0.055:
						return true
				B_PLAINS:
					if roll < 0.010:
						return true
				B_SNOWY:
					if roll < 0.030:
						return true
				B_DESERT:
					if roll < 0.014:
						return true
				_:
					pass
	return false


## Highest safe standing height for a column, used to drop the player in.
func spawn_height(wx: int, wz: int) -> int:
	return maxi(surface_height(wx, wz), SEA_LEVEL) + 2


# --------------------------------------------------------------- utilities

static func idx(x: int, y: int, z: int) -> int:
	return (y << 8) | (z << 4) | x


func _hash_i(x: int, z: int, salt: int) -> int:
	var h: int = world_seed
	h = (h ^ (x * 374761393)) * 1103515245
	h = (h ^ (z * 668265263)) * 1103515245
	h = (h ^ (salt * 2654435761)) * 1103515245
	h = h ^ (h >> 15)
	return h


func _hash01(x: int, z: int, salt: int) -> float:
	return float(absi(_hash_i(x, z, salt)) % 100000) / 100000.0


func _hash_range(x: int, z: int, salt: int, lo: int, hi: int) -> int:
	if hi <= lo:
		return lo
	return lo + absi(_hash_i(x, z, salt)) % (hi - lo + 1)


# ------------------------------------------------------------- generation

## Builds the raw voxel data for one chunk.
## Returns { "data": PackedByteArray, "max_y": int }.
func generate_chunk(cx: int, cz: int) -> Dictionary:
	var data := PackedByteArray()
	data.resize(CH * CH * HEIGHT)   # zero filled == all air

	var base_x := cx * CH
	var base_z := cz * CH

	var heights := PackedInt32Array()
	heights.resize(CH * CH)
	var biomes := PackedInt32Array()
	biomes.resize(CH * CH)

	var max_y := 1

	for lz in CH:
		for lx in CH:
			var wx := base_x + lx
			var wz := base_z + lz
			var h := surface_height(wx, wz)
			var biome := biome_at(wx, wz, h)
			heights[lz * CH + lx] = h
			biomes[lz * CH + lx] = biome
			max_y = maxi(max_y, maxi(h, SEA_LEVEL))

			_fill_column(data, lx, lz, wx, wz, h, biome)

	# Caves are carved after the column is solid so they can cut through
	# anything except the crust and the bedrock floor.
	_carve_caves(data, base_x, base_z, heights)

	# Trees and cacti are grown from an area larger than the chunk so canopies
	# that straddle a chunk border still line up perfectly.
	max_y = maxi(max_y, _grow_plants(data, cx, cz))

	return {"data": data, "max_y": mini(max_y + 1, HEIGHT - 1)}


func _fill_column(data: PackedByteArray, lx: int, lz: int, wx: int, wz: int,
		h: int, biome: int) -> void:
	var soil_depth := 3 + _hash_range(wx, wz, 5, 0, 1)

	var surface_id: int = BlockDB.GRASS
	var soil_id: int = BlockDB.DIRT
	match biome:
		B_OCEAN, B_BEACH:
			surface_id = BlockDB.SAND
			soil_id = BlockDB.SAND
			soil_depth = 4
		B_DESERT:
			surface_id = BlockDB.SAND
			soil_id = BlockDB.SAND
			soil_depth = 5
		B_SNOWY:
			surface_id = BlockDB.SNOW
			soil_id = BlockDB.DIRT
		B_MOUNTAIN:
			if h > SEA_LEVEL + 46:
				surface_id = BlockDB.SNOW
				soil_id = BlockDB.STONE
				soil_depth = 2
			else:
				surface_id = BlockDB.STONE
				soil_id = BlockDB.STONE
				soil_depth = 2
		_:
			surface_id = BlockDB.GRASS
			soil_id = BlockDB.DIRT

	# Underwater ground is always sand or gravel, never turf.
	if h < SEA_LEVEL:
		surface_id = BlockDB.SAND if _hash01(wx, wz, 9) > 0.25 else BlockDB.GRAVEL
		soil_id = BlockDB.SAND

	var bedrock_top := 1 + _hash_range(wx, wz, 3, 0, 2)

	for y in range(0, h + 1):
		var id: int = BlockDB.STONE
		if y <= bedrock_top:
			id = BlockDB.BEDROCK
		elif y == h:
			id = surface_id
		elif y > h - soil_depth:
			id = soil_id
		else:
			# Ore veins and gravel pockets inside the stone.
			var fy := float(y)
			var fwx := float(wx)
			var fwz := float(wz)
			if y >= 4 and y <= 62 and _n_coal.get_noise_3d(fwx, fy, fwz) > 0.62:
				id = BlockDB.COAL_ORE
			elif y >= 4 and y <= 44 and _n_iron.get_noise_3d(fwx, fy, fwz) > 0.70:
				id = BlockDB.IRON_ORE
			elif _n_gravel.get_noise_3d(fwx * 0.6, fy, fwz * 0.6) > 0.72:
				id = BlockDB.GRAVEL
		data[idx(lx, y, lz)] = id

	# Fill the gap up to sea level with water.
	if h < SEA_LEVEL:
		for y in range(h + 1, SEA_LEVEL + 1):
			data[idx(lx, y, lz)] = BlockDB.WATER


func _carve_caves(data: PackedByteArray, base_x: int, base_z: int,
		heights: PackedInt32Array) -> void:
	for lz in CH:
		for lx in CH:
			var wx := float(base_x + lx)
			var wz := float(base_z + lz)
			var top: int = heights[lz * CH + lx] - 4
			if top < 6:
				continue
			for y in range(4, top + 1):
				var fy := float(y)
				# Two thin tunnel fields; a block is hollow where both are near
				# zero, which produces long winding corridors that intersect.
				var a := absf(_n_cave_a.get_noise_3d(wx, fy * 1.7, wz))
				if a > 0.070:
					continue
				var b := absf(_n_cave_b.get_noise_3d(wx, fy * 1.7, wz))
				if b > 0.070:
					continue
				var i := idx(lx, y, lz)
				if data[i] != BlockDB.BEDROCK:
					data[i] = BlockDB.AIR

			# Larger open caverns, only deep down.
			for y in range(6, mini(top, 40)):
				if _n_cheese.get_noise_3d(wx, float(y) * 1.3, wz) > 0.64:
					var i2 := idx(lx, y, lz)
					if data[i2] != BlockDB.BEDROCK:
						data[i2] = BlockDB.AIR


## Plants whose canopy may cross a chunk edge. Returns the highest block written.
func _grow_plants(data: PackedByteArray, cx: int, cz: int) -> int:
	var base_x := cx * CH
	var base_z := cz * CH
	var highest := 0

	for lz in range(-3, CH + 3):
		for lx in range(-3, CH + 3):
			var wx := base_x + lx
			var wz := base_z + lz
			var h := surface_height(wx, wz)
			if h <= SEA_LEVEL:
				continue
			var biome := biome_at(wx, wz, h)
			var roll := _hash01(wx, wz, 17)

			match biome:
				B_FOREST:
					if roll < 0.055:
						highest = maxi(highest, _place_tree(data, lx, h, lz, wx, wz))
				B_PLAINS:
					if roll < 0.010:
						highest = maxi(highest, _place_tree(data, lx, h, lz, wx, wz))
				B_SNOWY:
					if roll < 0.030:
						highest = maxi(highest, _place_pine(data, lx, h, lz, wx, wz))
				B_DESERT:
					if roll < 0.014:
						highest = maxi(highest, _place_cactus(data, lx, h, lz, wx, wz))
				_:
					pass
	return highest


func _write(data: PackedByteArray, lx: int, y: int, lz: int, id: int, only_air: bool) -> void:
	if lx < 0 or lx >= CH or lz < 0 or lz >= CH or y < 0 or y >= HEIGHT:
		return
	var i := idx(lx, y, lz)
	if only_air and data[i] != BlockDB.AIR:
		return
	data[i] = id


func _place_tree(data: PackedByteArray, lx: int, h: int, lz: int, wx: int, wz: int) -> int:
	var trunk := _hash_range(wx, wz, 29, 4, 6)
	var top := h + trunk

	for dy in range(-2, 2):
		var y := top + dy
		var r := 2 if dy < 0 else 1
		for dz in range(-r, r + 1):
			for dx in range(-r, r + 1):
				if absi(dx) == r and absi(dz) == r:
					# Trim the far corners so the canopy is rounded, not square.
					if dy >= 0 or _hash01(wx + dx, wz + dz, 31) < 0.45:
						continue
				_write(data, lx + dx, y, lz + dz, BlockDB.LEAVES, true)

	for dy in range(0, trunk):
		_write(data, lx, h + 1 + dy, lz, BlockDB.WOOD, false)
	return top + 1


func _place_pine(data: PackedByteArray, lx: int, h: int, lz: int, wx: int, wz: int) -> int:
	var trunk := _hash_range(wx, wz, 41, 5, 8)
	var top := h + trunk
	var r := 2
	var y := h + 2
	while y <= top:
		for dz in range(-r, r + 1):
			for dx in range(-r, r + 1):
				if absi(dx) + absi(dz) > r + 1:
					continue
				_write(data, lx + dx, y, lz + dz, BlockDB.LEAVES, true)
		y += 1
		if (top - y) < 3:
			r = 1
		if y == top:
			r = 0
	_write(data, lx, top + 1, lz, BlockDB.LEAVES, true)
	for dy in range(0, trunk):
		_write(data, lx, h + 1 + dy, lz, BlockDB.WOOD, false)
	return top + 2


func _place_cactus(data: PackedByteArray, lx: int, h: int, lz: int, wx: int, wz: int) -> int:
	var tall := _hash_range(wx, wz, 47, 2, 4)
	for dy in range(0, tall):
		_write(data, lx, h + 1 + dy, lz, BlockDB.CACTUS, true)
	return h + tall

class_name TextureBaker
extends RefCounted
## Paints the block texture atlas at runtime.
##
## Every tile is drawn from scratch with plain maths, so the game ships with no
## image files at all and the artwork is unambiguously original. The result is a
## single 8x8 grid of 32x32 pixel tiles (256x256 px).

const TILE := 32
const GRID := 8
const ATLAS_SIZE := TILE * GRID

# Tile slots. The number is the index into the atlas, read left to right,
# top to bottom. Add new artwork by appending a slot and drawing it in _paint().
const T_GRASS_TOP := 0
const T_GRASS_SIDE := 1
const T_DIRT := 2
const T_STONE := 3
const T_SAND := 4
const T_LOG_SIDE := 5
const T_LOG_TOP := 6
const T_LEAVES := 7
const T_WATER := 8
const T_BEDROCK := 9
const T_PLANKS := 10
const T_COBBLE := 11
const T_GLASS := 12
const T_SNOW := 13
const T_GRAVEL := 14
const T_COAL_ORE := 15
const T_IRON_ORE := 16
const T_BRICK := 17
const T_LAMP := 18
const T_CACTUS_SIDE := 19
const T_CACTUS_TOP := 20
const T_SNOW_SIDE := 21
const T_CRAFT_TOP := 22
const T_CRAFT_SIDE := 23


## Builds the finished atlas image.
static func bake_atlas() -> Image:
	var img := Image.create(ATLAS_SIZE, ATLAS_SIZE, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	for slot in range(GRID * GRID):
		_paint(img, slot)
	return img


static func tile_origin(slot: int) -> Vector2i:
	return Vector2i((slot % GRID) * TILE, (slot / GRID) * TILE)


## UV rectangle of a tile in 0..1 space, inset by half a texel so neighbouring
## tiles can never bleed into each other.
static func tile_uv_rect(slot: int) -> Rect2:
	var o := tile_origin(slot)
	var inset := 0.25 / float(ATLAS_SIZE)
	return Rect2(
		float(o.x) / ATLAS_SIZE + inset,
		float(o.y) / ATLAS_SIZE + inset,
		float(TILE) / ATLAS_SIZE - inset * 2.0,
		float(TILE) / ATLAS_SIZE - inset * 2.0)


## Pixel rectangle of a tile, used by the inventory icons.
static func tile_pixel_rect(slot: int) -> Rect2:
	var o := tile_origin(slot)
	return Rect2(o.x, o.y, TILE, TILE)


# ---------------------------------------------------------------- painting

static func _rng(slot: int) -> RandomNumberGenerator:
	var r := RandomNumberGenerator.new()
	r.seed = 90210 + slot * 7919
	return r


static func _px(img: Image, ox: int, oy: int, x: int, y: int, c: Color) -> void:
	if x < 0 or y < 0 or x >= TILE or y >= TILE:
		return
	img.set_pixel(ox + x, oy + y, c)


static func _fill(img: Image, ox: int, oy: int, c: Color) -> void:
	for y in TILE:
		for x in TILE:
			img.set_pixel(ox + x, oy + y, c)


## Fills the tile with a base colour that is randomly nudged per pixel.
static func _noise_fill(img: Image, ox: int, oy: int, base: Color, amount: float,
		rng: RandomNumberGenerator) -> void:
	for y in TILE:
		for x in TILE:
			var d := rng.randf_range(-amount, amount)
			img.set_pixel(ox + x, oy + y, Color(
				clampf(base.r + d, 0.0, 1.0),
				clampf(base.g + d, 0.0, 1.0),
				clampf(base.b + d, 0.0, 1.0),
				base.a))


## Scatters soft round blobs, used for ores, cobble and pebbles.
static func _blob(img: Image, ox: int, oy: int, cx: int, cy: int, radius: float,
		c: Color, rng: RandomNumberGenerator) -> void:
	var r2 := radius * radius
	var ir := int(ceil(radius)) + 1
	for y in range(cy - ir, cy + ir + 1):
		for x in range(cx - ir, cx + ir + 1):
			var dx := float(x - cx)
			var dy := float(y - cy)
			var d2 := dx * dx + dy * dy
			if d2 <= r2 * rng.randf_range(0.75, 1.15):
				var shade := 1.0 + rng.randf_range(-0.06, 0.06)
				_px(img, ox, oy, x, y, Color(c.r * shade, c.g * shade, c.b * shade, c.a))


static func _paint(img: Image, slot: int) -> void:
	var o := tile_origin(slot)
	var ox := o.x
	var oy := o.y
	var rng := _rng(slot)

	match slot:
		T_GRASS_TOP:
			_noise_fill(img, ox, oy, Color(0.31, 0.52, 0.24), 0.05, rng)
			for i in 40:
				_px(img, ox, oy, rng.randi_range(0, TILE - 1), rng.randi_range(0, TILE - 1),
						Color(0.36, 0.59, 0.28))
			for i in 22:
				_px(img, ox, oy, rng.randi_range(0, TILE - 1), rng.randi_range(0, TILE - 1),
						Color(0.25, 0.43, 0.19))

		T_GRASS_SIDE:
			_noise_fill(img, ox, oy, Color(0.47, 0.34, 0.22), 0.05, rng)
			for i in 30:
				_px(img, ox, oy, rng.randi_range(0, TILE - 1), rng.randi_range(6, TILE - 1),
						Color(0.39, 0.28, 0.18))
			# Jagged band of turf spilling over the top edge.
			for x in TILE:
				var depth := 5 + rng.randi_range(0, 4)
				for y in depth:
					var g := Color(0.31, 0.52, 0.24)
					if y == depth - 1:
						g = Color(0.25, 0.43, 0.19)
					_px(img, ox, oy, x, y, g.lightened(rng.randf_range(0.0, 0.09)))

		T_DIRT:
			_noise_fill(img, ox, oy, Color(0.47, 0.34, 0.22), 0.06, rng)
			for i in 26:
				_px(img, ox, oy, rng.randi_range(0, TILE - 1), rng.randi_range(0, TILE - 1),
						Color(0.38, 0.27, 0.17))
			for i in 14:
				_px(img, ox, oy, rng.randi_range(0, TILE - 1), rng.randi_range(0, TILE - 1),
						Color(0.55, 0.41, 0.27))

		T_STONE:
			_noise_fill(img, ox, oy, Color(0.52, 0.52, 0.55), 0.045, rng)
			for i in 7:
				_blob(img, ox, oy, rng.randi_range(2, TILE - 3), rng.randi_range(2, TILE - 3),
						rng.randf_range(2.0, 4.5), Color(0.46, 0.46, 0.49), rng)
			for i in 4:
				_blob(img, ox, oy, rng.randi_range(2, TILE - 3), rng.randi_range(2, TILE - 3),
						rng.randf_range(1.5, 3.0), Color(0.58, 0.58, 0.61), rng)

		T_SAND:
			_noise_fill(img, ox, oy, Color(0.85, 0.79, 0.56), 0.04, rng)
			for i in 40:
				_px(img, ox, oy, rng.randi_range(0, TILE - 1), rng.randi_range(0, TILE - 1),
						Color(0.79, 0.72, 0.49))

		T_LOG_SIDE:
			_noise_fill(img, ox, oy, Color(0.42, 0.30, 0.18), 0.035, rng)
			var x := 0
			while x < TILE:
				var w := rng.randi_range(2, 5)
				var shade := rng.randf_range(-0.06, 0.07)
				for dx in w:
					if x + dx >= TILE:
						break
					for y in TILE:
						var c := Color(0.42 + shade, 0.30 + shade, 0.18 + shade)
						if (y + x) % 11 == 0:
							c = c.darkened(0.18)
						_px(img, ox, oy, x + dx, y, c)
				x += w

		T_LOG_TOP:
			_noise_fill(img, ox, oy, Color(0.62, 0.47, 0.29), 0.03, rng)
			var c := TILE / 2
			for y in TILE:
				for xx in TILE:
					var d: float = Vector2(xx - c + 0.5, y - c + 0.5).length()
					if int(d) % 4 == 0:
						_px(img, ox, oy, xx, y, Color(0.50, 0.37, 0.22))
					if d > 14.0:
						_px(img, ox, oy, xx, y, Color(0.40, 0.29, 0.17))

		T_LEAVES:
			_noise_fill(img, ox, oy, Color(0.19, 0.36, 0.17), 0.055, rng)
			for i in 30:
				_blob(img, ox, oy, rng.randi_range(0, TILE - 1), rng.randi_range(0, TILE - 1),
						rng.randf_range(1.2, 2.6), Color(0.24, 0.44, 0.20), rng)
			for i in 26:
				_blob(img, ox, oy, rng.randi_range(0, TILE - 1), rng.randi_range(0, TILE - 1),
						rng.randf_range(0.9, 1.8), Color(0.13, 0.25, 0.12), rng)

		T_WATER:
			for y in TILE:
				var band := sin(float(y) * 0.55) * 0.05
				for xx in TILE:
					var wob := sin(float(xx) * 0.4 + float(y) * 0.2) * 0.03
					img.set_pixel(ox + xx, oy + y, Color(
							0.16 + band + wob, 0.36 + band + wob, 0.72 + band + wob, 0.68))

		T_BEDROCK:
			_noise_fill(img, ox, oy, Color(0.24, 0.24, 0.27), 0.05, rng)
			for i in 16:
				var bx := rng.randi_range(0, TILE - 6)
				var by := rng.randi_range(0, TILE - 6)
				var bw := rng.randi_range(3, 7)
				var bh := rng.randi_range(3, 7)
				var col := Color(0.18, 0.18, 0.21) if rng.randf() < 0.5 else Color(0.33, 0.33, 0.36)
				for yy in bh:
					for xx in bw:
						_px(img, ox, oy, bx + xx, by + yy, col)

		T_PLANKS:
			_noise_fill(img, ox, oy, Color(0.66, 0.49, 0.30), 0.03, rng)
			for row in 4:
				var y0 := row * 8
				var shade := rng.randf_range(-0.05, 0.05)
				for yy in range(y0, y0 + 8):
					for xx in TILE:
						var c := Color(0.66 + shade, 0.49 + shade, 0.30 + shade)
						if (xx * 3 + yy * 7 + row) % 13 == 0:
							c = c.darkened(0.10)
						_px(img, ox, oy, xx, yy, c)
				for xx in TILE:
					_px(img, ox, oy, xx, y0, Color(0.46, 0.33, 0.20))
				var seam := 8 + row * 9
				for yy in range(y0, y0 + 8):
					_px(img, ox, oy, seam % TILE, yy, Color(0.50, 0.36, 0.22))

		T_COBBLE:
			_fill(img, ox, oy, Color(0.34, 0.34, 0.37))
			for i in 22:
				_blob(img, ox, oy, rng.randi_range(1, TILE - 2), rng.randi_range(1, TILE - 2),
						rng.randf_range(2.2, 4.2), Color(0.55, 0.55, 0.58), rng)
			for i in 12:
				_blob(img, ox, oy, rng.randi_range(1, TILE - 2), rng.randi_range(1, TILE - 2),
						rng.randf_range(1.4, 2.6), Color(0.46, 0.46, 0.50), rng)

		T_GLASS:
			for y in TILE:
				for xx in TILE:
					img.set_pixel(ox + xx, oy + y, Color(0.72, 0.86, 0.94, 0.22))
			for i in TILE:
				_px(img, ox, oy, i, 0, Color(0.88, 0.95, 1.0, 0.92))
				_px(img, ox, oy, i, 1, Color(0.82, 0.91, 0.98, 0.7))
				_px(img, ox, oy, i, TILE - 1, Color(0.88, 0.95, 1.0, 0.92))
				_px(img, ox, oy, i, TILE - 2, Color(0.82, 0.91, 0.98, 0.7))
				_px(img, ox, oy, 0, i, Color(0.88, 0.95, 1.0, 0.92))
				_px(img, ox, oy, 1, i, Color(0.82, 0.91, 0.98, 0.7))
				_px(img, ox, oy, TILE - 1, i, Color(0.88, 0.95, 1.0, 0.92))
				_px(img, ox, oy, TILE - 2, i, Color(0.82, 0.91, 0.98, 0.7))
			for i in 12:
				_px(img, ox, oy, 5 + i, 6 + i, Color(1, 1, 1, 0.72))
				_px(img, ox, oy, 6 + i, 6 + i, Color(1, 1, 1, 0.5))
				_px(img, ox, oy, 18 + (i / 2), 8 + i, Color(1, 1, 1, 0.4))

		T_SNOW:
			_noise_fill(img, ox, oy, Color(0.93, 0.95, 0.99), 0.025, rng)
			for i in 24:
				_px(img, ox, oy, rng.randi_range(0, TILE - 1), rng.randi_range(0, TILE - 1),
						Color(0.86, 0.90, 0.98))

		T_SNOW_SIDE:
			_noise_fill(img, ox, oy, Color(0.47, 0.34, 0.22), 0.05, rng)
			for x2 in TILE:
				var depth2 := 7 + rng.randi_range(0, 4)
				for y in depth2:
					_px(img, ox, oy, x2, y, Color(0.93, 0.95, 0.99).darkened(rng.randf_range(0.0, 0.05)))

		T_GRAVEL:
			_noise_fill(img, ox, oy, Color(0.46, 0.44, 0.43), 0.05, rng)
			for i in 30:
				_blob(img, ox, oy, rng.randi_range(0, TILE - 1), rng.randi_range(0, TILE - 1),
						rng.randf_range(1.0, 2.4),
						Color(0.56, 0.54, 0.52) if rng.randf() < 0.5 else Color(0.36, 0.35, 0.34), rng)

		T_COAL_ORE:
			_noise_fill(img, ox, oy, Color(0.52, 0.52, 0.55), 0.045, rng)
			for i in 6:
				_blob(img, ox, oy, rng.randi_range(4, TILE - 5), rng.randi_range(4, TILE - 5),
						rng.randf_range(2.0, 3.8), Color(0.12, 0.12, 0.14), rng)

		T_IRON_ORE:
			_noise_fill(img, ox, oy, Color(0.52, 0.52, 0.55), 0.045, rng)
			for i in 6:
				_blob(img, ox, oy, rng.randi_range(4, TILE - 5), rng.randi_range(4, TILE - 5),
						rng.randf_range(1.8, 3.4), Color(0.79, 0.62, 0.44), rng)

		T_BRICK:
			_fill(img, ox, oy, Color(0.72, 0.72, 0.70))
			for row in 4:
				var y0b := row * 8 + 1
				var offset := 0 if row % 2 == 0 else 8
				for b in 2:
					var x0 := offset + b * 16 + 1
					for yy in 6:
						for xx in 14:
							var px2 := (x0 + xx) % TILE
							var shade2 := rng.randf_range(-0.05, 0.05)
							_px(img, ox, oy, px2, y0b + yy,
									Color(0.62 + shade2, 0.28 + shade2 * 0.5, 0.22 + shade2 * 0.5))

		T_LAMP:
			_noise_fill(img, ox, oy, Color(0.95, 0.80, 0.42), 0.04, rng)
			for i in TILE:
				_px(img, ox, oy, i, 0, Color(0.62, 0.48, 0.22))
				_px(img, ox, oy, i, TILE - 1, Color(0.62, 0.48, 0.22))
				_px(img, ox, oy, 0, i, Color(0.62, 0.48, 0.22))
				_px(img, ox, oy, TILE - 1, i, Color(0.62, 0.48, 0.22))
			for i in 8:
				_blob(img, ox, oy, rng.randi_range(6, TILE - 7), rng.randi_range(6, TILE - 7),
						rng.randf_range(1.6, 3.2), Color(1.0, 0.94, 0.68), rng)

		T_CACTUS_SIDE:
			_noise_fill(img, ox, oy, Color(0.24, 0.48, 0.24), 0.04, rng)
			for xx in [3, 4, 15, 16, 27, 28]:
				for yy in TILE:
					_px(img, ox, oy, xx, yy, Color(0.19, 0.39, 0.19))
			for i in 14:
				var sx := rng.randi_range(1, TILE - 2)
				var sy := rng.randi_range(1, TILE - 2)
				_px(img, ox, oy, sx, sy, Color(0.85, 0.88, 0.70))

		T_CACTUS_TOP:
			_noise_fill(img, ox, oy, Color(0.28, 0.54, 0.28), 0.035, rng)
			for i in 10:
				_blob(img, ox, oy, TILE / 2 + rng.randi_range(-6, 6), TILE / 2 + rng.randi_range(-6, 6),
						rng.randf_range(1.4, 3.0), Color(0.22, 0.44, 0.22), rng)

		T_CRAFT_TOP:
			_noise_fill(img, ox, oy, Color(0.60, 0.44, 0.27), 0.03, rng)
			for i in TILE:
				_px(img, ox, oy, i, 10, Color(0.38, 0.27, 0.16))
				_px(img, ox, oy, i, 21, Color(0.38, 0.27, 0.16))
				_px(img, ox, oy, 10, i, Color(0.38, 0.27, 0.16))
				_px(img, ox, oy, 21, i, Color(0.38, 0.27, 0.16))

		T_CRAFT_SIDE:
			_noise_fill(img, ox, oy, Color(0.60, 0.44, 0.27), 0.03, rng)
			for yy in range(0, 6):
				for xx in TILE:
					_px(img, ox, oy, xx, yy, Color(0.46, 0.33, 0.20))
			for i in 10:
				var tx := rng.randi_range(2, TILE - 4)
				var ty := rng.randi_range(8, TILE - 4)
				for k in 3:
					_px(img, ox, oy, tx + k, ty, Color(0.44, 0.32, 0.19))

		_:
			# Unused slots stay fully transparent.
			pass

extends Node
## The block registry: every block type, its looks and its behaviour.
##
## Registered as the "BlockDB" autoload. Adding a block means adding one entry
## to _DEFS (and, if it needs new artwork, one tile in TextureBaker). Nothing
## else in the game has to change.

# Face indices used everywhere in the mesher.
const FACE_PX := 0  # +X  east
const FACE_NX := 1  # -X  west
const FACE_PY := 2  # +Y  top
const FACE_NY := 3  # -Y  bottom
const FACE_PZ := 4  # +Z  south
const FACE_NZ := 5  # -Z  north

# Block ids. Ids are persisted in save files, so never renumber an existing one;
# only append.
const AIR := 0
const GRASS := 1
const DIRT := 2
const STONE := 3
const SAND := 4
const WOOD := 5
const LEAVES := 6
const WATER := 7
const BEDROCK := 8
const PLANKS := 9
const COBBLESTONE := 10
const GLASS := 11
const SNOW := 12
const GRAVEL := 13
const COAL_ORE := 14
const IRON_ORE := 15
const BRICK := 16
const LAMP := 17
const CACTUS := 18
const WORKBENCH := 19

const BLOCK_COUNT := 20

# Which mesh surface a block is drawn into.
const LAYER_OPAQUE := 0
const LAYER_TRANSPARENT := 1

const T = preload("res://scripts/blocks/texture_baker.gd")

## The registry itself.
## tiles: [+X, -X, +Y, -Y, +Z, -Z] tile slots in the atlas.
## solid: takes part in collision.
## opaque: hides the faces of the blocks touching it.
## break_time: seconds of held left-click needed to break it (0 = instant).
## drop: the block id that ends up in your inventory (0 = nothing).
const _DEFS := {
	AIR: {
		"name": "Air", "tiles": [0, 0, 0, 0, 0, 0], "solid": false, "opaque": false,
		"liquid": false, "placeable": false, "breakable": false, "break_time": 0.0,
		"drop": AIR, "layer": LAYER_OPAQUE, "light": 0,
	},
	GRASS: {
		"name": "Turf Block",
		"tiles": [T.T_GRASS_SIDE, T.T_GRASS_SIDE, T.T_GRASS_TOP, T.T_DIRT, T.T_GRASS_SIDE, T.T_GRASS_SIDE],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 0.45, "drop": DIRT, "layer": LAYER_OPAQUE, "light": 0,
	},
	DIRT: {
		"name": "Soil", "tiles": [T.T_DIRT, T.T_DIRT, T.T_DIRT, T.T_DIRT, T.T_DIRT, T.T_DIRT],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 0.4, "drop": DIRT, "layer": LAYER_OPAQUE, "light": 0,
	},
	STONE: {
		"name": "Rockstone", "tiles": [T.T_STONE, T.T_STONE, T.T_STONE, T.T_STONE, T.T_STONE, T.T_STONE],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 1.3, "drop": COBBLESTONE, "layer": LAYER_OPAQUE, "light": 0,
	},
	SAND: {
		"name": "Sand", "tiles": [T.T_SAND, T.T_SAND, T.T_SAND, T.T_SAND, T.T_SAND, T.T_SAND],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 0.4, "drop": SAND, "layer": LAYER_OPAQUE, "light": 0,
	},
	WOOD: {
		"name": "Timber Log",
		"tiles": [T.T_LOG_SIDE, T.T_LOG_SIDE, T.T_LOG_TOP, T.T_LOG_TOP, T.T_LOG_SIDE, T.T_LOG_SIDE],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 1.0, "drop": WOOD, "layer": LAYER_OPAQUE, "light": 0,
	},
	LEAVES: {
		"name": "Canopy", "tiles": [T.T_LEAVES, T.T_LEAVES, T.T_LEAVES, T.T_LEAVES, T.T_LEAVES, T.T_LEAVES],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 0.25, "drop": LEAVES, "layer": LAYER_OPAQUE, "light": 0,
	},
	WATER: {
		"name": "Water", "tiles": [T.T_WATER, T.T_WATER, T.T_WATER, T.T_WATER, T.T_WATER, T.T_WATER],
		"solid": false, "opaque": false, "liquid": true, "placeable": false,
		"breakable": false, "break_time": 0.0, "drop": AIR, "layer": LAYER_TRANSPARENT, "light": 0,
	},
	BEDROCK: {
		"name": "Worldstone",
		"tiles": [T.T_BEDROCK, T.T_BEDROCK, T.T_BEDROCK, T.T_BEDROCK, T.T_BEDROCK, T.T_BEDROCK],
		"solid": true, "opaque": true, "liquid": false, "placeable": false,
		"breakable": false, "break_time": 0.0, "drop": AIR, "layer": LAYER_OPAQUE, "light": 0,
	},
	PLANKS: {
		"name": "Planks", "tiles": [T.T_PLANKS, T.T_PLANKS, T.T_PLANKS, T.T_PLANKS, T.T_PLANKS, T.T_PLANKS],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 0.8, "drop": PLANKS, "layer": LAYER_OPAQUE, "light": 0,
	},
	COBBLESTONE: {
		"name": "Rubblestone",
		"tiles": [T.T_COBBLE, T.T_COBBLE, T.T_COBBLE, T.T_COBBLE, T.T_COBBLE, T.T_COBBLE],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 1.4, "drop": COBBLESTONE, "layer": LAYER_OPAQUE, "light": 0,
	},
	GLASS: {
		"name": "Pane Block", "tiles": [T.T_GLASS, T.T_GLASS, T.T_GLASS, T.T_GLASS, T.T_GLASS, T.T_GLASS],
		"solid": true, "opaque": false, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 0.3, "drop": GLASS, "layer": LAYER_TRANSPARENT, "light": 0,
	},
	SNOW: {
		"name": "Snowpack",
		"tiles": [T.T_SNOW_SIDE, T.T_SNOW_SIDE, T.T_SNOW, T.T_DIRT, T.T_SNOW_SIDE, T.T_SNOW_SIDE],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 0.3, "drop": SNOW, "layer": LAYER_OPAQUE, "light": 0,
	},
	GRAVEL: {
		"name": "Shingle", "tiles": [T.T_GRAVEL, T.T_GRAVEL, T.T_GRAVEL, T.T_GRAVEL, T.T_GRAVEL, T.T_GRAVEL],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 0.6, "drop": GRAVEL, "layer": LAYER_OPAQUE, "light": 0,
	},
	COAL_ORE: {
		"name": "Sootstone",
		"tiles": [T.T_COAL_ORE, T.T_COAL_ORE, T.T_COAL_ORE, T.T_COAL_ORE, T.T_COAL_ORE, T.T_COAL_ORE],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 1.8, "drop": COAL_ORE, "layer": LAYER_OPAQUE, "light": 0,
	},
	IRON_ORE: {
		"name": "Ironstone",
		"tiles": [T.T_IRON_ORE, T.T_IRON_ORE, T.T_IRON_ORE, T.T_IRON_ORE, T.T_IRON_ORE, T.T_IRON_ORE],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 2.2, "drop": IRON_ORE, "layer": LAYER_OPAQUE, "light": 0,
	},
	BRICK: {
		"name": "Brickwork", "tiles": [T.T_BRICK, T.T_BRICK, T.T_BRICK, T.T_BRICK, T.T_BRICK, T.T_BRICK],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 1.6, "drop": BRICK, "layer": LAYER_OPAQUE, "light": 0,
	},
	LAMP: {
		"name": "Glowblock", "tiles": [T.T_LAMP, T.T_LAMP, T.T_LAMP, T.T_LAMP, T.T_LAMP, T.T_LAMP],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 0.5, "drop": LAMP, "layer": LAYER_OPAQUE, "light": 13,
	},
	CACTUS: {
		"name": "Thornstalk",
		"tiles": [T.T_CACTUS_SIDE, T.T_CACTUS_SIDE, T.T_CACTUS_TOP, T.T_CACTUS_TOP,
			T.T_CACTUS_SIDE, T.T_CACTUS_SIDE],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 0.5, "drop": CACTUS, "layer": LAYER_OPAQUE, "light": 0,
	},
	WORKBENCH: {
		"name": "Workbench",
		"tiles": [T.T_CRAFT_SIDE, T.T_CRAFT_SIDE, T.T_CRAFT_TOP, T.T_PLANKS,
			T.T_CRAFT_SIDE, T.T_CRAFT_SIDE],
		"solid": true, "opaque": true, "liquid": false, "placeable": true,
		"breakable": true, "break_time": 0.9, "drop": WORKBENCH, "layer": LAYER_OPAQUE, "light": 0,
	},
}

const MAX_STACK := 64

# Flat lookup tables. The mesher touches these millions of times per chunk, so
# they are packed arrays rather than dictionary lookups.
var opaque_flags := PackedByteArray()
var solid_flags := PackedByteArray()
var liquid_flags := PackedByteArray()
var layer_flags := PackedByteArray()
var light_levels := PackedByteArray()
## uv_rects[block_id][face] -> Rect2 inside the atlas, in 0..1 space.
var uv_rects: Array = []

var atlas_image: Image
var atlas_texture: ImageTexture
var material_opaque: StandardMaterial3D
var material_transparent: StandardMaterial3D
## Small textures used by the hotbar and inventory, one per block id.
var icons: Array = []


func _ready() -> void:
	_build_tables()
	_build_atlas()
	_build_materials()
	_build_icons()


func _build_tables() -> void:
	opaque_flags.resize(BLOCK_COUNT)
	solid_flags.resize(BLOCK_COUNT)
	liquid_flags.resize(BLOCK_COUNT)
	layer_flags.resize(BLOCK_COUNT)
	light_levels.resize(BLOCK_COUNT)
	uv_rects.resize(BLOCK_COUNT)
	for id in BLOCK_COUNT:
		var d: Dictionary = _DEFS.get(id, _DEFS[AIR])
		opaque_flags[id] = 1 if d["opaque"] else 0
		solid_flags[id] = 1 if d["solid"] else 0
		liquid_flags[id] = 1 if d["liquid"] else 0
		layer_flags[id] = d["layer"]
		light_levels[id] = d["light"]
		var rects: Array = []
		for face in 6:
			rects.append(TextureBaker.tile_uv_rect(d["tiles"][face]))
		uv_rects[id] = rects


func _build_atlas() -> void:
	atlas_image = TextureBaker.bake_atlas()
	atlas_texture = ImageTexture.create_from_image(atlas_image)


func _build_materials() -> void:
	material_opaque = StandardMaterial3D.new()
	material_opaque.albedo_texture = atlas_texture
	material_opaque.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	material_opaque.vertex_color_use_as_albedo = true
	material_opaque.roughness = 0.95
	material_opaque.specular_mode = BaseMaterial3D.SPECULAR_DISABLED
	material_opaque.cull_mode = BaseMaterial3D.CULL_BACK

	material_transparent = StandardMaterial3D.new()
	material_transparent.albedo_texture = atlas_texture
	material_transparent.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	material_transparent.vertex_color_use_as_albedo = true
	material_transparent.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material_transparent.cull_mode = BaseMaterial3D.CULL_DISABLED
	material_transparent.roughness = 0.15
	material_transparent.specular_mode = BaseMaterial3D.SPECULAR_SCHLICK_GGX
	material_transparent.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL


func _build_icons() -> void:
	icons.resize(BLOCK_COUNT)
	for id in BLOCK_COUNT:
		if id == AIR:
			icons[id] = null
			continue
		var tex := AtlasTexture.new()
		tex.atlas = atlas_texture
		# The +Z face reads best as an icon.
		tex.region = TextureBaker.tile_pixel_rect(_DEFS[id]["tiles"][FACE_PZ])
		icons[id] = tex


# ----------------------------------------------------------------- queries

func get_def(id: int) -> Dictionary:
	return _DEFS.get(id, _DEFS[AIR])

func get_name_of(id: int) -> String:
	return get_def(id)["name"]

func is_air(id: int) -> bool:
	return id == AIR

func is_opaque(id: int) -> bool:
	return id >= 0 and id < BLOCK_COUNT and opaque_flags[id] == 1

func is_solid(id: int) -> bool:
	return id >= 0 and id < BLOCK_COUNT and solid_flags[id] == 1

func is_liquid(id: int) -> bool:
	return id >= 0 and id < BLOCK_COUNT and liquid_flags[id] == 1

func is_placeable(id: int) -> bool:
	return get_def(id)["placeable"]

func is_breakable(id: int) -> bool:
	return get_def(id)["breakable"]

func break_time(id: int) -> float:
	return get_def(id)["break_time"]

func drop_of(id: int) -> int:
	return get_def(id)["drop"]

func icon_of(id: int) -> Texture2D:
	if id <= 0 or id >= icons.size():
		return null
	return icons[id]

## Every block that the player is allowed to hold, used by the menus and the
## starting kit.
func placeable_ids() -> Array:
	var out: Array = []
	for id in BLOCK_COUNT:
		if id != AIR and _DEFS[id]["placeable"]:
			out.append(id)
	return out

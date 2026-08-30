class_name Chunk
extends Node3D
## One 16 x 128 x 16 column of the world.
##
## A chunk is exactly four nodes no matter how many blocks it holds: two mesh
## instances (solid and see-through) and one static body for collision. Blocks
## are never nodes.

const CH := 16
const HEIGHT := 128
const VOLUME := CH * CH * HEIGHT

enum State {
	EMPTY,        ## just created, nothing in it yet
	GENERATING,   ## a worker thread is filling in the terrain
	DATA_READY,   ## voxels exist, no mesh yet
	MESHING,      ## a worker thread is building the surfaces
	READY,        ## visible and collidable
}

var coord := Vector2i.ZERO
var data := PackedByteArray()
var max_y := 0
var state: int = State.EMPTY
## Set when the voxels changed and the surfaces have to be rebuilt.
var dirty := false
## True while a mesh task for this chunk is in flight; results that arrive for
## an older revision are thrown away.
var mesh_revision := 0

var mesh_opaque: MeshInstance3D
var mesh_transparent: MeshInstance3D
var body: StaticBody3D
var collider: CollisionShape3D


func _init() -> void:
	mesh_opaque = MeshInstance3D.new()
	mesh_opaque.name = "Solid"
	mesh_opaque.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	add_child(mesh_opaque)

	mesh_transparent = MeshInstance3D.new()
	mesh_transparent.name = "Transparent"
	mesh_transparent.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mesh_transparent)

	body = StaticBody3D.new()
	body.name = "Body"
	body.collision_layer = 1
	body.collision_mask = 0
	add_child(body)

	collider = CollisionShape3D.new()
	body.add_child(collider)


func setup(p_coord: Vector2i) -> void:
	coord = p_coord
	name = "Chunk_%d_%d" % [p_coord.x, p_coord.y]
	position = Vector3(p_coord.x * CH, 0, p_coord.y * CH)


static func index_of(lx: int, ly: int, lz: int) -> int:
	return (ly << 8) | (lz << 4) | lx


func has_data() -> bool:
	return data.size() == VOLUME


func get_block(lx: int, ly: int, lz: int) -> int:
	if ly < 0 or ly >= HEIGHT or not has_data():
		return BlockDB.AIR
	return data[(ly << 8) | (lz << 4) | lx]


func set_block(lx: int, ly: int, lz: int, id: int) -> void:
	if ly < 0 or ly >= HEIGHT or not has_data():
		return
	data[(ly << 8) | (lz << 4) | lx] = id
	if id != BlockDB.AIR:
		max_y = maxi(max_y, ly)


## Hands the finished surfaces from the worker thread to the scene tree.
func apply_surfaces(result: Dictionary) -> void:
	var arr_mesh: ArrayMesh = result.get("mesh_opaque")
	mesh_opaque.mesh = arr_mesh
	if arr_mesh != null:
		mesh_opaque.material_override = BlockDB.material_opaque

	var water_mesh: ArrayMesh = result.get("mesh_transparent")
	mesh_transparent.mesh = water_mesh
	if water_mesh != null:
		mesh_transparent.material_override = BlockDB.material_transparent

	collider.shape = result.get("shape")
	state = State.READY

var meshing := false

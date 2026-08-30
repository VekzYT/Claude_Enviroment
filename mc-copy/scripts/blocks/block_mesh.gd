class_name BlockMesh
extends RefCounted
## Builds a single textured cube for one block type.
##
## Used for the block the player is holding and for the small preview in the
## menus. It reuses the mesher's face tables so a cube here always matches what
## the same block looks like in the world.


static func build_cube(id: int) -> ArrayMesh:
	if id <= 0:
		return null
	var rects: Array = BlockDB.uv_rects[id]

	var pos := PackedVector3Array()
	var nrm := PackedVector3Array()
	var uvs := PackedVector2Array()
	var cols := PackedColorArray()

	for face in 6:
		var verts: Array = ChunkMesher.FACE_VERTS[face]
		var face_uvs: Array = ChunkMesher.FACE_UVS[face]
		var normal: Vector3 = ChunkMesher.FACE_NORMAL[face]
		var shade: float = ChunkMesher.FACE_SHADE[face]
		var rect: Rect2 = rects[face]
		var order := [0, 1, 2, 0, 2, 3]
		for k in order:
			var o: Vector3i = verts[k]
			pos.append(Vector3(o.x - 0.5, o.y - 0.5, o.z - 0.5))
			nrm.append(normal)
			var q: Vector2 = face_uvs[k]
			uvs.append(Vector2(rect.position.x + q.x * rect.size.x,
					rect.position.y + q.y * rect.size.y))
			cols.append(Color(shade, shade, shade))

	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = pos
	arrays[Mesh.ARRAY_NORMAL] = nrm
	arrays[Mesh.ARRAY_TEX_UV] = uvs
	arrays[Mesh.ARRAY_COLOR] = cols
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	return mesh

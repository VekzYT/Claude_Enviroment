extends MeshInstance3D

# The water has to know how deep it is at every point to colour itself, fade
# out at the edges and put foam where it meets the bank.
#
# Reading that back out of the depth buffer is the usual trick, but the
# reconstruction differs between renderers -- Vulkan hands you a [0,1] depth
# and OpenGL a [-1,1] one -- and getting it wrong turns the whole pond into a
# sheet of white foam. So the bed is sampled straight off the terrain instead,
# once, when the level loads. It is exact, it picks up the noise in the
# shoreline for free, and it behaves identically in every renderer.

const RES := 192

func _ready() -> void:
	add_to_group("pond")
	_bake_bed()
	# Heard from the bank rather than across the whole valley.
	Sound.attach_loop("amb_water", self, -20.0, 30.0)

func _bake_bed() -> void:
	var terrain: Node = get_tree().get_first_node_in_group("terrain")
	if terrain == null:
		return
	terrain.call("ensure_built")

	var mat: ShaderMaterial = get_surface_override_material(0) as ShaderMaterial
	if mat == null:
		return

	var plane: PlaneMesh = mesh as PlaneMesh
	if plane == null:
		return
	var size: Vector2 = plane.size
	var water_y: float = position.y

	# Two passes: measure the deepest point, then store everything relative to
	# it, so the single channel keeps its precision whatever the pond's depth.
	var depths := PackedFloat32Array()
	depths.resize(RES * RES)
	var deepest: float = 0.001
	for iy in RES:
		var v: float = (float(iy) + 0.5) / float(RES)
		var wz: float = position.z + (v - 0.5) * size.y
		for ix in RES:
			var u: float = (float(ix) + 0.5) / float(RES)
			var wx: float = position.x + (u - 0.5) * size.x
			var d: float = water_y - float(terrain.call("height_at", wx, wz))
			d = maxf(d, 0.0)
			depths[iy * RES + ix] = d
			deepest = maxf(deepest, d)

	var img: Image = Image.create(RES, RES, false, Image.FORMAT_RF)
	for iy in RES:
		for ix in RES:
			img.set_pixel(ix, iy, Color(depths[iy * RES + ix] / deepest, 0.0, 0.0, 1.0))

	mat.set_shader_parameter("bed_depth_tex", ImageTexture.create_from_image(img))
	mat.set_shader_parameter("pond_center", Vector2(position.x, position.z))
	mat.set_shader_parameter("pond_size", size)
	mat.set_shader_parameter("max_depth", deepest)

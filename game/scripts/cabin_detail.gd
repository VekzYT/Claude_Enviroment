extends Node3D

# Dresses the starter cabin. The shell in main.tscn stays exactly as it is --
# it owns the collision and the interior surfaces -- and this hangs the detail
# that makes it read as a built thing on the outside of it: stacked log courses
# with notched corner ends, overlapping roof shingles, a stone chimney, a
# shuttered window, a plank door, a porch rail, and a woodpile.
#
# It is a script rather than another two hundred nodes in main.tscn because
# almost all of it is repetition, and repetition batches: the logs, shingles,
# stones and firewood are four MultiMeshes rather than ~600 separate nodes.

# Cabin footprint, matching the shell in main.tscn.
const CENTRE := Vector3(-14.0, 0.0, 4.0)
const HALF_X := 4.5
const HALF_Z := 4.0
const WALL_TOP := 3.2
const RIDGE_Y := 4.46
const ROOF_PITCH_DEG := 13.8972

const LOG_RADIUS := 0.21
const LOG_RISE := 0.38
const CORNER_OVERHANG := 0.34

# The doorway in the east wall, which the log courses have to step around.
const DOOR_Z_MIN := 3.0
const DOOR_Z_MAX := 5.0
const DOOR_TOP := 2.2

@export var wood_texture: Texture2D
@export var wood_normal: Texture2D
@export var rock_texture: Texture2D
@export var rock_normal: Texture2D

var rng := RandomNumberGenerator.new()

func _ready() -> void:
	rng.seed = 90210
	_build_logs()
	_build_shingles()
	_build_chimney_stones()
	_build_window()
	_build_door()
	_build_porch_rail()
	_build_woodpile()
	_build_lantern()
	_build_barrel_hoops()

# --- helpers -----------------------------------------------------------------

func _material(albedo: Color, texture: Texture2D, normal_map: Texture2D, roughness: float, uv_scale: Vector3) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = albedo
	mat.roughness = roughness
	if texture != null:
		mat.albedo_texture = texture
		mat.uv1_scale = uv_scale
		mat.uv1_triplanar = true
	if normal_map != null:
		mat.normal_enabled = true
		mat.normal_texture = normal_map
		mat.normal_scale = 0.8
	return mat

func _multimesh(mesh: Mesh, material: Material, transforms: Array, colours: Array, node_name: String) -> void:
	if transforms.is_empty():
		return
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = mesh
	mm.instance_count = transforms.size()
	for i in transforms.size():
		mm.set_instance_transform(i, transforms[i])
		mm.set_instance_color(i, colours[i])
	var node := MultiMeshInstance3D.new()
	node.name = node_name
	node.multimesh = mm
	node.material_override = material
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	add_child(node)

# Scale composed on the right, so a rotated instance is stretched along its own
# axes instead of being sheared by the world ones.
func _local_scale(rotation: Basis, scale: Vector3) -> Basis:
	return rotation * Basis.IDENTITY.scaled(scale)

func _box(position: Vector3, size: Vector3, rotation: Basis = Basis.IDENTITY) -> Transform3D:
	return Transform3D(_local_scale(rotation, size), position)

func _mesh_instance(mesh: Mesh, material: Material, position: Vector3, scale: Vector3,
		rotation_deg: Vector3, node_name: String) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = node_name
	node.mesh = mesh
	node.material_override = material
	node.position = position
	node.scale = scale
	node.rotation_degrees = rotation_deg
	add_child(node)
	return node

func _unit_box() -> BoxMesh:
	var m := BoxMesh.new()
	m.size = Vector3.ONE
	return m

func _unit_cylinder() -> CylinderMesh:
	var m := CylinderMesh.new()
	m.top_radius = 1.0
	m.bottom_radius = 1.0
	m.height = 1.0
	m.radial_segments = 10
	m.rings = 1
	return m

# --- log walls ---------------------------------------------------------------

func _build_logs() -> void:
	var transforms: Array = []
	var colours: Array = []
	# Lying on its side: the cylinder's own +Y becomes the run of the log.
	var lie_x := Basis(Vector3(0, 0, 1), deg_to_rad(90.0))
	var lie_z := Basis(Vector3(1, 0, 0), deg_to_rad(90.0))

	var course := 0
	var y := LOG_RADIUS
	while y < WALL_TOP:
		# Alternate courses sit slightly proud, the way real stacked logs do.
		var bulge: float = LOG_RADIUS * (1.0 + (0.06 if course % 2 == 0 else -0.02))
		var tint: Color = Color(1, 1, 1).lerp(Color(0.72, 0.62, 0.5), rng.randf() * 0.5)

		# North and south walls run along X.
		for side in [-1.0, 1.0]:
			var z: float = CENTRE.z + side * (HALF_Z + 0.16)
			transforms.append(_box(
				Vector3(CENTRE.x, y, z),
				Vector3(bulge * 2.0, HALF_X * 2.0 + CORNER_OVERHANG * 2.0, bulge * 2.0),
				lie_x))
			colours.append(tint)

		# West wall runs along Z, unbroken.
		transforms.append(_box(
			Vector3(CENTRE.x - HALF_X - 0.16, y, CENTRE.z),
			Vector3(bulge * 2.0, HALF_Z * 2.0, bulge * 2.0),
			lie_z))
		colours.append(tint)

		# East wall has the doorway in it: below the header the course is cut
		# into two stubs, above it runs the full width.
		var east_x: float = CENTRE.x + HALF_X + 0.16
		if y > DOOR_TOP:
			transforms.append(_box(Vector3(east_x, y, CENTRE.z),
				Vector3(bulge * 2.0, HALF_Z * 2.0, bulge * 2.0), lie_z))
			colours.append(tint)
		else:
			var north_len: float = DOOR_Z_MIN - (CENTRE.z - HALF_Z)
			var south_len: float = (CENTRE.z + HALF_Z) - DOOR_Z_MAX
			transforms.append(_box(
				Vector3(east_x, y, CENTRE.z - HALF_Z + north_len * 0.5),
				Vector3(bulge * 2.0, north_len, bulge * 2.0), lie_z))
			colours.append(tint)
			transforms.append(_box(
				Vector3(east_x, y, DOOR_Z_MAX + south_len * 0.5),
				Vector3(bulge * 2.0, south_len, bulge * 2.0), lie_z))
			colours.append(tint)

		y += LOG_RISE
		course += 1

	# Corner posts hide the ends where the courses cross.
	for sx in [-1.0, 1.0]:
		for sz in [-1.0, 1.0]:
			transforms.append(_box(
				Vector3(CENTRE.x + sx * (HALF_X + 0.2), WALL_TOP * 0.5, CENTRE.z + sz * (HALF_Z + 0.2)),
				Vector3(0.34, WALL_TOP, 0.34)))
			colours.append(Color(0.8, 0.72, 0.6))

	var material: StandardMaterial3D = _material(
		Color(0.44, 0.33, 0.22), wood_texture, wood_normal, 0.88, Vector3(0.5, 0.5, 0.5))
	material.vertex_color_use_as_albedo = true
	_multimesh(_unit_cylinder(), material, transforms, colours, "LogCourses")

# --- roof --------------------------------------------------------------------

func _build_shingles() -> void:
	var transforms: Array = []
	var colours: Array = []
	var pitch: float = deg_to_rad(ROOF_PITCH_DEG)
	# Slope length from ridge down to the eave, plus a little overhang.
	var run: float = HALF_X + 0.5
	var slope_length: float = run / cos(pitch)
	var rows: int = int(slope_length / 0.34) + 1
	var shingle_z: float = 0.62

	for side in [-1.0, 1.0]:
		var tilt := Basis(Vector3(0, 0, 1), pitch * side)
		var down := Vector3(side * cos(pitch), -sin(pitch), 0.0)
		var ridge_top := Vector3(CENTRE.x, RIDGE_Y - 0.06, CENTRE.z)
		for row in rows:
			var along: float = 0.18 + row * 0.34
			if along > slope_length:
				break
			var centre: Vector3 = ridge_top + down * along
			var columns: int = int((HALF_Z * 2.0 + 1.0) / shingle_z) + 1
			for col in columns:
				var z: float = CENTRE.z - HALF_Z - 0.5 + shingle_z * (col + 0.5)
				if z > CENTRE.z + HALF_Z + 0.5:
					break
				# Nudge every other row sideways so the joints break like a
				# real course of shingles instead of lining up into stripes.
				var stagger: float = (shingle_z * 0.5) if row % 2 == 1 else 0.0
				transforms.append(_box(
					Vector3(centre.x, centre.y + 0.04, z + stagger),
					Vector3(0.44, 0.05, shingle_z * 0.92),
					tilt))
				colours.append(Color(1, 1, 1).lerp(Color(0.55, 0.5, 0.45), rng.randf() * 0.7))

	var material: StandardMaterial3D = _material(
		Color(0.20, 0.17, 0.14), wood_texture, wood_normal, 0.95, Vector3(1.5, 1.5, 1.5))
	material.vertex_color_use_as_albedo = true
	_multimesh(_unit_box(), material, transforms, colours, "RoofShingles")

# --- chimney -----------------------------------------------------------------

func _build_chimney_stones() -> void:
	var transforms: Array = []
	var colours: Array = []
	var base := Vector3(-17.6, 1.0, 1.7)
	var half := 0.44
	var y := 1.05
	while y < 6.0:
		var band: float = 0.26 + rng.randf() * 0.06
		var per_side: int = 3
		for face in 4:
			var normal: Vector3 = [Vector3(1, 0, 0), Vector3(-1, 0, 0), Vector3(0, 0, 1), Vector3(0, 0, -1)][face]
			var along: Vector3 = Vector3(normal.z, 0.0, normal.x)
			for i in per_side:
				var t: float = (float(i) + 0.5) / float(per_side) - 0.5
				var jitter := Vector3(rng.randf_range(-0.02, 0.02), rng.randf_range(-0.03, 0.03), rng.randf_range(-0.02, 0.02))
				var stone_len: float = (half * 2.0) / float(per_side) * rng.randf_range(0.72, 0.98)
				# Stones on the east/west faces are long in Z and thin in X, and
				# the other way round on the north/south faces.
				var stone_size := Vector3(
					absf(normal.x) * 0.12 + absf(normal.z) * stone_len,
					band * rng.randf_range(0.75, 1.0),
					absf(normal.z) * 0.12 + absf(normal.x) * stone_len)
				transforms.append(_box(
					base + Vector3(0, y - base.y, 0) + normal * (half + 0.03) + along * (t * half * 2.0) + jitter,
					stone_size,
					Basis(Vector3(0, 1, 0), rng.randf_range(-0.08, 0.08))))
				colours.append(Color(1, 1, 1).lerp(Color(0.6, 0.6, 0.62), rng.randf() * 0.8))
		y += band
	var material: StandardMaterial3D = _material(
		Color(0.34, 0.33, 0.31), rock_texture, rock_normal, 0.92, Vector3(1.2, 1.2, 1.2))
	material.vertex_color_use_as_albedo = true
	_multimesh(_unit_box(), material, transforms, colours, "ChimneyStones")

# --- window ------------------------------------------------------------------

func _build_window() -> void:
	var frame_mat: StandardMaterial3D = _material(Color(0.26, 0.19, 0.12), wood_texture, wood_normal, 0.9, Vector3(2, 2, 2))
	var shutter_mat: StandardMaterial3D = _material(Color(0.32, 0.26, 0.17), wood_texture, wood_normal, 0.92, Vector3(2, 2, 2))
	var box: BoxMesh = _unit_box()
	var wall_z := 7.92
	var centre_x := -15.6
	var centre_y := 1.85

	# Cross mullions turn one pane into four, which is most of what makes a
	# window read as a window at a distance.
	_mesh_instance(box, frame_mat, Vector3(centre_x, centre_y, wall_z), Vector3(0.07, 1.24, 0.07), Vector3.ZERO, "WindowMullionV")
	_mesh_instance(box, frame_mat, Vector3(centre_x, centre_y, wall_z), Vector3(1.62, 0.07, 0.07), Vector3.ZERO, "WindowMullionH")
	# A sill that sticks out and throws a shadow line under the opening.
	_mesh_instance(box, frame_mat, Vector3(centre_x, 1.19, wall_z + 0.06), Vector3(2.0, 0.1, 0.28), Vector3(0, 0, 0), "WindowSill")

	for side in [-1.0, 1.0]:
		var hinge_x: float = centre_x + side * 0.84
		# Swung back against the wall, so they read as open shutters.
		var shutter := _mesh_instance(box, shutter_mat,
			Vector3(hinge_x + side * 0.42, centre_y, wall_z + 0.12),
			Vector3(0.82, 1.34, 0.08), Vector3(0, side * -14.0, 0), "WindowShutter%d" % int(side))
		for bar in 2:
			var slat := MeshInstance3D.new()
			slat.mesh = box
			slat.material_override = frame_mat
			slat.position = Vector3(0.0, -0.32 + bar * 0.64, 0.9)
			slat.scale = Vector3(0.94, 0.12, 0.6)
			shutter.add_child(slat)

func _build_door() -> void:
	var plank_mat: StandardMaterial3D = _material(Color(0.30, 0.22, 0.14), wood_texture, wood_normal, 0.9, Vector3(2, 2, 2))
	var iron_mat := StandardMaterial3D.new()
	iron_mat.albedo_color = Color(0.10, 0.10, 0.11)
	iron_mat.metallic = 0.7
	iron_mat.roughness = 0.45
	var box: BoxMesh = _unit_box()

	# The shell already has a slab standing open at 28 degrees; this rebuilds it
	# out of planks with iron battens and a ring handle.
	var door := Node3D.new()
	door.name = "DoorLeaf"
	door.position = Vector3(-9.6, 1.35, 2.55)
	door.rotation_degrees = Vector3(0, 28, 0)
	add_child(door)

	for i in 5:
		var plank := MeshInstance3D.new()
		plank.mesh = box
		plank.material_override = plank_mat
		plank.position = Vector3(0.0, 0.0, -0.64 + i * 0.32)
		plank.scale = Vector3(0.09, 2.46, 0.30)
		door.add_child(plank)
	for i in 2:
		var batten := MeshInstance3D.new()
		batten.mesh = box
		batten.material_override = iron_mat
		batten.position = Vector3(-0.055, -0.78 + i * 1.56, 0.0)
		batten.scale = Vector3(0.03, 0.13, 1.56)
		door.add_child(batten)
	var handle := MeshInstance3D.new()
	handle.mesh = _unit_cylinder()
	handle.material_override = iron_mat
	handle.position = Vector3(-0.07, 0.0, 0.60)
	handle.rotation_degrees = Vector3(90, 0, 0)
	handle.scale = Vector3(0.13, 0.04, 0.13)
	door.add_child(handle)

func _build_porch_rail() -> void:
	var mat: StandardMaterial3D = _material(Color(0.28, 0.21, 0.14), wood_texture, wood_normal, 0.92, Vector3(2, 2, 2))
	var box: BoxMesh = _unit_box()
	# The porch runs from z 2.3 to 5.7 at x -7.2; rail the two open ends.
	for z_end in [2.35, 5.65]:
		_mesh_instance(box, mat, Vector3(-7.85, 1.0, z_end), Vector3(1.3, 0.1, 0.12), Vector3.ZERO, "RailTop%d" % int(z_end * 10))
		for i in 4:
			var x: float = -8.4 + i * 0.36
			_mesh_instance(box, mat, Vector3(x, 0.62, z_end), Vector3(0.07, 0.86, 0.07), Vector3.ZERO,
				"Baluster%d_%d" % [int(z_end * 10), i])
	# Two steps down off the front edge of the deck.
	for i in 2:
		_mesh_instance(box, mat, Vector3(-7.05 + i * 0.34, 0.15 - i * 0.075, 4.0),
			Vector3(0.36, 0.09, 1.5), Vector3.ZERO, "PorchStep%d" % i)

func _build_woodpile() -> void:
	var transforms: Array = []
	var colours: Array = []
	var lie_z := Basis(Vector3(1, 0, 0), deg_to_rad(90.0))
	# Stacked against the south wall: five rows of six split rounds.
	var origin := Vector3(-12.4, 0.13, 8.35)
	for row in 5:
		var count: int = 6 - int(row / 3)
		for i in count:
			var jitter: float = rng.randf_range(-0.02, 0.02)
			transforms.append(_box(
				origin + Vector3(i * 0.25 + (0.12 if row % 2 == 1 else 0.0), row * 0.24, jitter),
				Vector3(0.22, 0.62, 0.22),
				lie_z * Basis(Vector3(0, 1, 0), rng.randf_range(-0.1, 0.1))))
			colours.append(Color(1, 1, 1).lerp(Color(0.66, 0.55, 0.42), rng.randf() * 0.8))
	var material: StandardMaterial3D = _material(
		Color(0.42, 0.31, 0.20), wood_texture, wood_normal, 0.9, Vector3(1.5, 1.5, 1.5))
	material.vertex_color_use_as_albedo = true
	_multimesh(_unit_cylinder(), material, transforms, colours, "Woodpile")

func _build_lantern() -> void:
	var iron := StandardMaterial3D.new()
	iron.albedo_color = Color(0.09, 0.09, 0.10)
	iron.metallic = 0.6
	iron.roughness = 0.5
	var glass := StandardMaterial3D.new()
	glass.albedo_color = Color(1.0, 0.72, 0.36)
	glass.emission_enabled = true
	glass.emission = Color(1.0, 0.70, 0.34)
	# Bright enough to read as a lit flame, not so bright it blows out into a
	# white sticker on the post.
	glass.emission_energy_multiplier = 1.5

	var box: BoxMesh = _unit_box()
	var post := Vector3(-7.2, 2.15, 2.5)
	# Hung off the front porch post on a short bracket.
	_mesh_instance(box, iron, post + Vector3(0.0, 0.24, 0.22), Vector3(0.04, 0.04, 0.44), Vector3.ZERO, "LanternArm")
	_mesh_instance(box, iron, post + Vector3(0.0, 0.16, 0.42), Vector3(0.03, 0.2, 0.03), Vector3.ZERO, "LanternHanger")
	_mesh_instance(box, glass, post + Vector3(0.0, -0.02, 0.42), Vector3(0.11, 0.17, 0.11), Vector3.ZERO, "LanternGlass")
	for corner in [Vector3(-0.06, 0, -0.06), Vector3(0.06, 0, -0.06), Vector3(-0.06, 0, 0.06), Vector3(0.06, 0, 0.06)]:
		_mesh_instance(box, iron, post + Vector3(0.0, -0.02, 0.42) + corner,
			Vector3(0.016, 0.19, 0.016), Vector3.ZERO, "LanternRib%d%d" % [int(corner.x * 100), int(corner.z * 100)])
	_mesh_instance(box, iron, post + Vector3(0.0, 0.11, 0.42), Vector3(0.19, 0.04, 0.19), Vector3.ZERO, "LanternCap")
	_mesh_instance(box, iron, post + Vector3(0.0, -0.14, 0.42), Vector3(0.18, 0.04, 0.18), Vector3.ZERO, "LanternBase")

	var light := OmniLight3D.new()
	light.name = "LanternLight"
	light.position = post + Vector3(0.0, -0.02, 0.42)
	light.light_color = Color(1.0, 0.74, 0.42)
	light.light_energy = 1.3
	light.omni_range = 5.0
	light.shadow_enabled = false
	add_child(light)

# The camp drum wears a tiling rust texture that reads as a stack of coins from
# a few metres away. Two hoops and a lid break that repeat up into a barrel.
func _build_barrel_hoops() -> void:
	var iron := StandardMaterial3D.new()
	iron.albedo_color = Color(0.19, 0.14, 0.10)
	iron.metallic = 0.55
	iron.roughness = 0.72
	var cylinder: CylinderMesh = _unit_cylinder()
	cylinder.radial_segments = 16
	var centre := Vector3(-5.0, 0.0, 4.0)
	for y in [0.16, 0.44, 0.72]:
		_mesh_instance(cylinder, iron, centre + Vector3(0, y, 0),
			Vector3(0.305, 0.05, 0.305), Vector3.ZERO, "BarrelHoop%d" % int(y * 100))
	_mesh_instance(cylinder, iron, centre + Vector3(0, 0.885, 0),
		Vector3(0.30, 0.03, 0.30), Vector3.ZERO, "BarrelLid")

	# The drum shares the scene's rust material, whose UV scale tiles about ten
	# times up a 0.9 m barrel and reads as a stack of coins. Give it its own
	# copy at one tile so it reads as sheet steel.
	var drum := get_parent().get_node_or_null("CampBarrel/CampBarrelMesh") as MeshInstance3D
	if drum != null:
		var steel: StandardMaterial3D = _material(
			Color(0.40, 0.26, 0.17), null, null, 0.72, Vector3.ONE)
		steel.metallic = 0.35
		drum.material_override = steel

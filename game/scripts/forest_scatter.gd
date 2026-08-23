extends Node3D

# Populates the terrain with vegetation.
#
# Everything repeated is batched into MultiMeshes, so a forest of a thousand
# trees costs a handful of draw calls. Every placement asks the terrain for the
# ground height and slope, so nothing floats or buries itself on the hills, and
# nothing tries to grow on a cliff face.
#
# Shapes are deliberately not primitives: canopies and boulders are spheres and
# cones pushed around by noise, which is what stops the forest reading as a
# field of cones and boxes. Placement, tilt, scale and tint are all randomised
# per instance from a fixed seed, so it looks organic but rebuilds identically.

@export var terrain_path: NodePath = NodePath("../Terrain")

const MAP_HALF := 232.0

const CONIFER_COUNT := 900
const BROADLEAF_COUNT := 340
const DEAD_TREE_COUNT := 190
const BUSH_COUNT := 620
const ROCK_COUNT := 240
const FERN_PATCHES := 430
const FERNS_PER_PATCH := 6
const GRASS_PATCHES := 700
const GRASS_PER_PATCH := 26
const FLOWER_PATCHES := 260
const FLOWERS_PER_PATCH := 9
const HERO_DEAD_TRUNKS := 14
const HERO_STUMPS := 22

const MAX_TRIES_FACTOR := 30
const ROAD_CLEARANCE := 6.5

# Slope limits. Trees will not root on anything approaching a cliff; small
# ground cover tolerates a bit more.
const TREE_MAX_SLOPE := 0.42
const COVER_MAX_SLOPE := 0.60

const TRUNK_RADIUS_BUCKETS: Array[float] = [0.16, 0.22, 0.28, 0.34, 0.42, 0.52]

const FLOWER_COLORS: Array[Color] = [
	Color(1.00, 1.00, 0.96),
	Color(1.00, 0.86, 0.30),
	Color(0.92, 0.62, 0.78),
	Color(0.72, 0.60, 0.95),
	Color(0.95, 0.45, 0.38),
	Color(0.85, 0.90, 1.00),
]

var rng := RandomNumberGenerator.new()
var terrain: TerrainGrid = null
var tree_collision_body: StaticBody3D = null
var rock_collision_body: StaticBody3D = null
var bucket_shapes: Array[BoxShape3D] = []

# Chopping. Each felled-able tree records every MultiMesh instance it owns
# (trunk plus every canopy tier) so the whole thing can be rotated as one rigid
# body about its base. tree_by_shape maps the CollisionShape3D the axe ray hit
# back to that record, which is how a batched instance becomes addressable.
var trees: Array = []
var tree_by_shape: Dictionary = {}
var falling: Array = []
var stump_mm: MultiMesh = null
var stumps_used: int = 0

# Basis.scaled() multiplies scale in on the left, which shears a mesh whose
# rotation mixes the unevenly scaled axes. Composing on the right scales along
# the mesh's own axes, which is what tilted trunks and branches need.
func _local_scale(rot: Basis, s: Vector3) -> Basis:
	return rot * Basis.IDENTITY.scaled(s)

func _ready() -> void:
	add_to_group("forest")
	rng.seed = 20260822
	terrain = get_node_or_null(terrain_path) as TerrainGrid
	if terrain == null:
		push_error("ForestScatter: terrain not found at %s; nothing scattered." % terrain_path)
		return
	# Build order between siblings is not guaranteed, so make sure the height
	# grid exists before the first query rather than relying on _ready order.
	terrain.ensure_built()

	_setup_collision_bodies()
	_build_stump_pool()
	_scatter_conifers()
	_scatter_broadleaf()
	_scatter_dead_trees()
	_scatter_bushes()
	_scatter_ferns()
	_scatter_rocks()
	_scatter_undergrowth()
	_scatter_flowers()
	_place_hero_props()

# ---------------------------------------------------------------- terrain io

func _ground(x: float, z: float) -> float:
	return terrain.height_at(x, z)

func _slope(x: float, z: float) -> float:
	return terrain.slope_at(x, z)

func _in_clearing(p: Vector2, poi_margin: float, road_clearance: float) -> bool:
	return terrain.in_clearing(p, poi_margin, road_clearance)

func _random_point() -> Vector2:
	return Vector2(rng.randf_range(-MAP_HALF, MAP_HALF), rng.randf_range(-MAP_HALF, MAP_HALF))

func _find_spots(count: int, poi_margin: float, road_clearance: float, max_slope: float) -> Array[Vector2]:
	var points: Array[Vector2] = []
	var tries: int = 0
	var limit: int = count * MAX_TRIES_FACTOR
	while points.size() < count and tries < limit:
		tries += 1
		var p: Vector2 = _random_point()
		if _in_clearing(p, poi_margin, road_clearance):
			continue
		if _slope(p.x, p.y) > max_slope:
			continue
		points.append(p)
	return points

# ---------------------------------------------------------------- mesh build

func _noise(seed_value: int, freq: float) -> FastNoiseLite:
	var n := FastNoiseLite.new()
	n.seed = seed_value
	n.noise_type = FastNoiseLite.TYPE_SIMPLEX
	n.frequency = freq
	n.fractal_octaves = 3
	return n

# Takes a primitive and pushes every vertex along its own direction by noise.
# Sampling the noise by position (not index) keeps duplicated seam vertices in
# agreement, so the surface never splits open.
func _deform(source: Mesh, amount: float, freq: float, seed_value: int, squash: float) -> ArrayMesh:
	var n: FastNoiseLite = _noise(seed_value, freq)
	var arrays: Array = source.surface_get_arrays(0)
	var verts: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	for i in verts.size():
		var v: Vector3 = verts[i]
		var d: float = n.get_noise_3d(v.x * 4.0, v.y * 4.0, v.z * 4.0)
		verts[i] = v * (1.0 + d * amount) * Vector3(1.0, squash, 1.0)
	arrays[Mesh.ARRAY_VERTEX] = verts

	var temp := ArrayMesh.new()
	temp.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	var st := SurfaceTool.new()
	st.create_from(temp, 0)
	st.generate_normals()
	return st.commit()

func _trunk_mesh() -> CylinderMesh:
	var m := CylinderMesh.new()
	m.top_radius = 0.5
	m.bottom_radius = 1.0
	m.height = 1.0
	m.radial_segments = 10
	m.rings = 1
	return m

# ------------------------------------------------------------------ trunks

# Every tree in the forest used to share one cylinder. These three taper by
# different amounts and flare out where they meet the ground, which is most of
# what separates a tree from a fence post.
const TRUNK_VARIANTS := 3
const TRUNK_TAPER: Array[float] = [0.52, 0.36, 0.68]
const TRUNK_FLARE: Array[float] = [0.50, 0.78, 0.32]

# Radius profile from root (0) to crown (1): a flared base easing quickly into
# a long even taper.
func _trunk_radius(t: float, taper: float, flare: float) -> float:
	var stem: float = lerpf(1.0, taper, t)
	var root: float = flare * pow(clampf(1.0 - t / 0.2, 0.0, 1.0), 2.0)
	return stem + root

# Built by reshaping a CylinderMesh rather than laying out triangles by hand,
# which keeps its winding, caps and UVs correct for the bark shader.
func _trunk_variant_mesh(variant: int) -> ArrayMesh:
	var src := CylinderMesh.new()
	src.top_radius = 1.0
	src.bottom_radius = 1.0
	src.height = 1.0
	src.radial_segments = 9
	src.rings = 6
	var taper: float = TRUNK_TAPER[variant]
	var flare: float = TRUNK_FLARE[variant]
	var n: FastNoiseLite = _noise(4100 + variant * 97, 1.4)

	var arrays: Array = src.surface_get_arrays(0)
	var verts: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	for i in verts.size():
		var v: Vector3 = verts[i]
		var t: float = clampf(v.y + 0.5, 0.0, 1.0)
		var radial: float = _trunk_radius(t, taper, flare)
		# A slow wobble around the trunk so it is not a machined post. Driven
		# by the angle alone so every ring wobbles the same way and the trunk
		# reads as a bent column rather than a stack of unrelated discs.
		var ang: float = atan2(v.z, v.x)
		radial *= 1.0 + n.get_noise_2d(cos(ang) * 2.0, sin(ang) * 2.0) * 0.17
		verts[i] = Vector3(v.x * radial, v.y, v.z * radial)
	arrays[Mesh.ARRAY_VERTEX] = verts

	var temp := ArrayMesh.new()
	temp.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	var st := SurfaceTool.new()
	st.create_from(temp, 0)
	st.generate_normals()
	return st.commit()

# ------------------------------------------------------------------- leaves

# One leaf spray: a flat card attached at `stem` and reaching out along `dir`.
# Four things are baked in that the shader needs and cannot work out for
# itself -- see foliage_leaves.gdshader for what each channel means.
#
# The vertex normal is the crown's outward direction rather than the card's own
# face. That single choice is what makes card foliage read as one soft mass
# instead of a pile of flat plates catching the sun at random angles.
func _leaf_card(st: SurfaceTool, stem: Vector3, dir: Vector3, roll: float,
		w: float, h: float, phase: float, shade: float, shell: Vector3) -> void:
	var d: Vector3 = dir.normalized()
	if d.length_squared() < 0.5:
		d = Vector3.UP
	var seed_axis: Vector3 = Vector3.UP if absf(d.y) < 0.9 else Vector3.RIGHT
	var right: Vector3 = d.cross(seed_axis).normalized().rotated(d, roll)
	var tip: Vector3 = stem + d * h
	# Narrower at the tip, so the card is a leaf shape and not a domino.
	var half_base: Vector3 = right * (w * 0.5)
	var half_tip: Vector3 = right * (w * 0.32)
	var n: Vector3 = shell.normalized() if shell.length_squared() > 0.0001 else Vector3.UP

	var pts: Array[Vector3] = [stem - half_base, stem + half_base, tip + half_tip, tip - half_tip]
	var vs: Array[float] = [0.0, 0.0, 1.0, 1.0]
	for i in [0, 1, 2, 0, 2, 3]:
		st.set_normal(n)
		st.set_uv(Vector2(shade, vs[i]))
		st.set_uv2(Vector2(phase, vs[i]))
		st.add_vertex(pts[i])

# ------------------------------------------------------------------ conifers

# Five trees in the same family: a tight fir, a broad spruce, a sparse
# windblown pine, a dense young one, and a ragged old-growth with gaps in it.
const CONIFER_VARIANTS := 5
# Height as a multiple of the base radius. The canopy is authored at these real
# proportions and then instanced with a single uniform scale, which matters:
# scaling a canopy mesh separately in Y stretches every leaf card in it into a
# vertical shard, and a forest of those reads as a field of spikes.
const CONIFER_ASPECT: Array[float] = [3.0, 2.5, 3.4, 2.7, 2.9]
const CONIFER_WHORLS: Array[int] = [20, 18, 15, 22, 19]
const CONIFER_PER_WHORL: Array[int] = [16, 18, 12, 17, 15]
const CONIFER_DROOP: Array[float] = [0.55, 0.32, 0.72, 0.42, 0.62]
const CONIFER_PROFILE: Array[float] = [1.35, 1.0, 1.65, 1.15, 1.3]
const CONIFER_SPRAY: Array[float] = [0.16, 0.19, 0.14, 0.15, 0.17]
const CONIFER_GAPS: Array[float] = [0.0, 0.05, 0.24, 0.0, 0.17]

# Authored with the base radius at 1.0 and the tip at y = aspect, so the whole
# thing scales up uniformly.
func _conifer_canopy_mesh(variant: int) -> ArrayMesh:
	var r := RandomNumberGenerator.new()
	r.seed = 90210 + variant * 7717
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)

	var aspect: float = CONIFER_ASPECT[variant]
	var whorls: int = CONIFER_WHORLS[variant]
	var per: int = CONIFER_PER_WHORL[variant]
	var droop: float = CONIFER_DROOP[variant]
	var profile: float = CONIFER_PROFILE[variant]
	var spray: float = CONIFER_SPRAY[variant]
	var gaps: float = CONIFER_GAPS[variant]

	for w in whorls:
		var t: float = float(w) / float(whorls - 1)
		var radius: float = pow(1.0 - t, profile) * r.randf_range(0.88, 1.06)
		if radius < 0.04:
			continue
		var count: int = maxi(4, int(round(float(per) * (0.4 + 0.6 * radius))))
		var base_ang: float = r.randf() * TAU
		for i in count:
			if r.randf() < gaps:
				continue
			var ang: float = base_ang + TAU * float(i) / float(count) + r.randf_range(-0.18, 0.18)
			var rr: float = radius * r.randf_range(0.7, 1.0)
			var y: float = (t + r.randf_range(-0.015, 0.015)) * aspect
			var stem := Vector3(cos(ang) * rr * 0.25, y, sin(ang) * rr * 0.25)
			# Fronds reach outward and hang, which is what makes a conifer read
			# as a conifer instead of a green cone.
			var out := Vector3(cos(ang), -droop, sin(ang))
			_leaf_card(st, stem, out, r.randf_range(0.0, TAU),
				spray * r.randf_range(0.8, 1.15), rr * 0.8 + spray * 0.6,
				r.randf(), clampf(0.25 + t * 0.7, 0.0, 1.0),
				Vector3(cos(ang) * 0.72, 0.62, sin(ang) * 0.72))

		# Two sprays hard against the leader, so you cannot see clean daylight
		# straight through the middle of the tree.
		for _k in 2:
			var ia: float = r.randf() * TAU
			_leaf_card(st, Vector3(0.0, t * aspect, 0.0),
				Vector3(cos(ia) * 0.6, -0.2 + r.randf() * 0.5, sin(ia) * 0.6),
				r.randf_range(0.0, TAU), spray * 0.8, maxf(radius * 0.55, 0.09),
				r.randf(), clampf(0.15 + t * 0.5, 0.0, 1.0), Vector3.UP)

	# The leader: a spike of sprays at the very top.
	for _k in 6:
		var la: float = r.randf() * TAU
		_leaf_card(st, Vector3(0.0, aspect * 0.95, 0.0),
			Vector3(cos(la) * 0.35, 0.9, sin(la) * 0.35),
			r.randf_range(0.0, TAU), spray * 0.6, spray * 1.6,
			r.randf(), 1.0, Vector3.UP)
	return st.commit()

# ----------------------------------------------------------------- broadleaf

# Round oak, tall poplar, wide maple, a drooping willow and a big airy elm.
const BROADLEAF_VARIANTS := 5
const BROADLEAF_LOBES: Array[int] = [3, 2, 4, 3, 5]
const BROADLEAF_CARDS: Array[int] = [300, 260, 330, 250, 350]
const BROADLEAF_SPRAY: Array[float] = [0.100, 0.115, 0.092, 0.108, 0.086]
const BROADLEAF_DROOP: Array[float] = [0.0, 0.1, 0.0, 0.45, 0.12]
const BROADLEAF_SQUASH: Array[float] = [0.86, 1.0, 0.78, 0.95, 0.9]

# Authored centred on the origin with radius 0.5, matching the sphere the old
# canopy blobs used, so the instancing maths stays familiar.
func _broadleaf_crown_mesh(variant: int) -> ArrayMesh:
	var r := RandomNumberGenerator.new()
	r.seed = 51234 + variant * 3313
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)

	var lobes: int = BROADLEAF_LOBES[variant]
	var cards: int = BROADLEAF_CARDS[variant]
	var spray: float = BROADLEAF_SPRAY[variant]
	var droop: float = BROADLEAF_DROOP[variant]
	var squash: float = BROADLEAF_SQUASH[variant]

	# A handful of overlapping masses rather than one ball, which is what stops
	# a crown reading as a green sphere stuck on a stick.
	var centers: Array[Vector3] = [Vector3(0.0, 0.02, 0.0)]
	var radii: Array[float] = [0.40]
	for i in range(1, lobes):
		var a: float = TAU * float(i) / float(lobes) + r.randf_range(-0.5, 0.5)
		var d: float = r.randf_range(0.16, 0.28)
		centers.append(Vector3(cos(a) * d, r.randf_range(-0.10, 0.16), sin(a) * d))
		radii.append(r.randf_range(0.22, 0.33))

	for _c in cards:
		var li: int = r.randi() % centers.size()
		var center: Vector3 = centers[li]
		var rad: float = radii[li]
		var dir := Vector3(r.randfn(0.0, 1.0), r.randfn(0.0, 1.0), r.randfn(0.0, 1.0))
		if dir.length_squared() < 0.0001:
			dir = Vector3.UP
		dir = dir.normalized()
		# Biased hard toward the surface, so the leaves form a shell instead of
		# a solid ball of geometry nobody can ever see the inside of.
		var t: float = pow(r.randf(), 0.32)
		var stem: Vector3 = center + Vector3(dir.x, dir.y * squash, dir.z) * rad * t
		var out := Vector3(dir.x, dir.y - droop, dir.z)
		_leaf_card(st, stem, out, r.randf_range(0.0, TAU),
			spray * r.randf_range(0.8, 1.25), spray * r.randf_range(1.0, 1.5),
			r.randf(), clampf(t * 0.85 + stem.y + 0.35, 0.0, 1.0), dir)
	return st.commit()

# ------------------------------------------------------------------ deadfall

# What is left in the crown of a standing dead tree: a scatter of brown sprays
# clinging to the upper branches, nothing like a full canopy.
func _dead_crown_mesh(variant: int) -> ArrayMesh:
	var r := RandomNumberGenerator.new()
	r.seed = 33871 + variant * 911
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var cards: int = [46, 30][variant]
	var spray: float = [0.15, 0.19][variant]
	for _c in cards:
		var dir := Vector3(r.randfn(0.0, 1.0), r.randfn(0.0, 0.7), r.randfn(0.0, 1.0))
		if dir.length_squared() < 0.0001:
			dir = Vector3.UP
		dir = dir.normalized()
		var t: float = pow(r.randf(), 0.4)
		var stem: Vector3 = Vector3(dir.x, dir.y * 1.15, dir.z) * 0.46 * t
		_leaf_card(st, stem, Vector3(dir.x, dir.y - 0.5, dir.z), r.randf_range(0.0, TAU),
			spray * r.randf_range(0.7, 1.1), spray * r.randf_range(1.0, 1.6),
			r.randf(), clampf(t, 0.0, 1.0), dir)
	return st.commit()

func _cone_source() -> CylinderMesh:
	var m := CylinderMesh.new()
	m.top_radius = 0.04
	m.bottom_radius = 1.0
	m.height = 1.0
	m.radial_segments = 12
	m.rings = 3
	return m

func _sphere_source(segments: int, rings: int) -> SphereMesh:
	var m := SphereMesh.new()
	m.radius = 0.5
	m.height = 1.0
	m.radial_segments = segments
	m.rings = rings
	return m

func _cross_quad_mesh(width: float, height: float) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	_add_quad(st, width, height, false)
	_add_quad(st, width, height, true)
	st.generate_normals()
	return st.commit()

func _add_quad(st: SurfaceTool, w: float, h: float, rotated: bool) -> void:
	var a: Vector3
	var b: Vector3
	var c: Vector3
	var d: Vector3
	if rotated:
		a = Vector3(0.0, 0.0, -w)
		b = Vector3(0.0, 0.0, w)
		c = Vector3(0.0, h, w * 0.15)
		d = Vector3(0.0, h, -w * 0.15)
	else:
		a = Vector3(-w, 0.0, 0.0)
		b = Vector3(w, 0.0, 0.0)
		c = Vector3(w * 0.15, h, 0.0)
		d = Vector3(-w * 0.15, h, 0.0)
	st.set_uv(Vector2(0.0, 1.0))
	st.add_vertex(a)
	st.set_uv(Vector2(1.0, 1.0))
	st.add_vertex(b)
	st.set_uv(Vector2(1.0, 0.0))
	st.add_vertex(c)
	st.set_uv(Vector2(0.0, 1.0))
	st.add_vertex(a)
	st.set_uv(Vector2(1.0, 0.0))
	st.add_vertex(c)
	st.set_uv(Vector2(0.0, 0.0))
	st.add_vertex(d)

# A stem with a small crossed bloom on top. The shader decides which part is
# which from the vertex height.
func _flower_mesh() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	_add_quad(st, 0.012, 0.30, false)
	_add_quad(st, 0.012, 0.30, true)
	var petal_w: float = 0.055
	var lo: float = 0.24
	var hi: float = 0.31
	for pass_index in 2:
		var rotated: bool = pass_index == 1
		var a: Vector3
		var b: Vector3
		var c: Vector3
		var d: Vector3
		if rotated:
			a = Vector3(0.0, lo, -petal_w)
			b = Vector3(0.0, lo, petal_w)
			c = Vector3(0.0, hi, petal_w)
			d = Vector3(0.0, hi, -petal_w)
		else:
			a = Vector3(-petal_w, lo, 0.0)
			b = Vector3(petal_w, lo, 0.0)
			c = Vector3(petal_w, hi, 0.0)
			d = Vector3(-petal_w, hi, 0.0)
		st.set_uv(Vector2(0.0, 1.0))
		st.add_vertex(a)
		st.set_uv(Vector2(1.0, 1.0))
		st.add_vertex(b)
		st.set_uv(Vector2(1.0, 0.0))
		st.add_vertex(c)
		st.set_uv(Vector2(0.0, 1.0))
		st.add_vertex(a)
		st.set_uv(Vector2(1.0, 0.0))
		st.add_vertex(c)
		st.set_uv(Vector2(0.0, 0.0))
		st.add_vertex(d)
	st.generate_normals()
	return st.commit()

# ---------------------------------------------------------------- materials

func _bark_material(tint: Color, uv_scale: Vector2, roughness: float) -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/bark.gdshader") as Shader
	mat.set_shader_parameter("albedo_tex", load("res://textures/bark_albedo.jpg"))
	mat.set_shader_parameter("normal_tex", load("res://textures/bark_normal.jpg"))
	mat.set_shader_parameter("roughness_tex", load("res://textures/bark_rough.jpg"))
	mat.set_shader_parameter("base_tint", tint)
	mat.set_shader_parameter("uv_scale", uv_scale)
	mat.set_shader_parameter("normal_strength", 1.5)
	mat.set_shader_parameter("roughness_value", roughness)
	return mat

func _foliage_material(base: Color, tip: Color, pivot: float, strength: float, speed: float) -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/foliage_wind.gdshader") as Shader
	mat.set_shader_parameter("base_color", base)
	mat.set_shader_parameter("tip_color", tip)
	mat.set_shader_parameter("pivot_height", pivot)
	mat.set_shader_parameter("wind_strength", strength)
	mat.set_shader_parameter("wind_speed", speed)
	mat.set_shader_parameter("wind_frequency", 0.22)
	mat.set_shader_parameter("roughness_value", 0.92)
	return mat

# For canopies built out of leaf cards. Separate from _foliage_material, which
# still drives the solid bushes, ferns and grass.
func _leaf_material(base: Color, tip: Color, crown_h: float, sway: float,
		speed: float, flutter: float) -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/foliage_leaves.gdshader") as Shader
	mat.set_shader_parameter("base_color", base)
	mat.set_shader_parameter("tip_color", tip)
	mat.set_shader_parameter("crown_height", crown_h)
	mat.set_shader_parameter("wind_strength", sway)
	mat.set_shader_parameter("wind_speed", speed)
	mat.set_shader_parameter("wind_frequency", 0.22)
	mat.set_shader_parameter("gust_strength", 0.55)
	mat.set_shader_parameter("leaf_flutter", flutter)
	mat.set_shader_parameter("leaf_speed", 2.6)
	mat.set_shader_parameter("roughness_value", 0.92)
	return mat

# Commits one bucket of gathered instances. Buckets are plain untyped Arrays so
# they can live in a list indexed by variant; this copies them back into the
# typed arrays _add_multimesh wants.
func _commit_bucket(mesh_name: String, mesh: Mesh, material: Material,
		xf: Array, col: Array, cast_shadow: bool) -> MultiMesh:
	var xs: Array[Transform3D] = []
	var cs: Array[Color] = []
	for v in xf:
		xs.append(v)
	for c in col:
		cs.append(c)
	return _add_multimesh(mesh_name, mesh, material, xs, cs, cast_shadow)

func _rock_material() -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.62, 0.62, 0.63, 1.0)
	mat.albedo_texture = load("res://textures/rock_albedo.jpg")
	mat.normal_enabled = true
	mat.normal_texture = load("res://textures/rock_normal.jpg")
	mat.normal_scale = 1.3
	mat.roughness_texture = load("res://textures/rock_rough.jpg")
	mat.roughness = 0.95
	mat.uv1_triplanar = true
	mat.uv1_scale = Vector3(0.5, 0.5, 0.5)
	return mat

# ---------------------------------------------------------------- multimesh

func _add_multimesh(mesh_name: String, mesh: Mesh, material: Material,
		transforms: Array[Transform3D], colors: Array[Color], cast_shadow: bool) -> MultiMesh:
	if transforms.is_empty():
		return null
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = mesh
	mm.instance_count = transforms.size()
	for i in transforms.size():
		mm.set_instance_transform(i, transforms[i])
		mm.set_instance_color(i, colors[i])
	var mmi := MultiMeshInstance3D.new()
	mmi.name = mesh_name
	mmi.multimesh = mm
	mmi.material_override = material
	if not cast_shadow:
		mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mmi)
	return mm

# ---------------------------------------------------------------- collision

func _setup_collision_bodies() -> void:
	tree_collision_body = StaticBody3D.new()
	tree_collision_body.name = "TreeCollision"
	add_child(tree_collision_body)
	rock_collision_body = StaticBody3D.new()
	rock_collision_body.name = "RockCollision"
	add_child(rock_collision_body)
	for r in TRUNK_RADIUS_BUCKETS:
		var shape := BoxShape3D.new()
		# Tall enough for any trunk; the overhang sits underground or above the
		# canopy where nothing can reach it, so one shape covers every height.
		shape.size = Vector3(r * 1.6, 34.0, r * 1.6)
		bucket_shapes.append(shape)

func _add_trunk_collision(pos: Vector2, ground_y: float, radius: float) -> CollisionShape3D:
	var best: int = 0
	var best_diff: float = absf(TRUNK_RADIUS_BUCKETS[0] - radius)
	for i in TRUNK_RADIUS_BUCKETS.size():
		var diff: float = absf(TRUNK_RADIUS_BUCKETS[i] - radius)
		if diff < best_diff:
			best_diff = diff
			best = i
	var cs := CollisionShape3D.new()
	cs.shape = bucket_shapes[best]
	cs.position = Vector3(pos.x, ground_y + 12.0, pos.y)
	tree_collision_body.add_child(cs)
	return cs

# ---------------------------------------------------------------- conifers

func _scatter_conifers() -> void:
	var points: Array[Vector2] = _find_spots(CONIFER_COUNT, 2.0, ROAD_CLEARANCE, TREE_MAX_SLOPE)

	var trunk_xf: Array = []
	var trunk_col: Array = []
	for _t in TRUNK_VARIANTS:
		trunk_xf.append([])
		trunk_col.append([])
	var crown_xf: Array = []
	var crown_col: Array = []
	for _c in CONIFER_VARIANTS:
		crown_xf.append([])
		crown_col.append([])
	var pending: Array = []

	for p in points:
		var gy: float = _ground(p.x, p.y)
		var h: float = rng.randf_range(8.0, 21.0)
		var radius: float = 0.10 + h * 0.013
		var yaw: float = rng.randf_range(0.0, TAU)
		# A couple of degrees of lean stops the trunks looking like a pin array.
		var tilt: float = rng.randf_range(0.0, 0.055)
		var tilt_dir: float = rng.randf_range(0.0, TAU)
		var rot: Basis = Basis(Vector3(cos(tilt_dir), 0.0, sin(tilt_dir)), tilt) * Basis(Vector3.UP, yaw)
		var base := Vector3(p.x, gy, p.y)

		var tv: int = rng.randi() % TRUNK_VARIANTS
		var cv: int = rng.randi() % CONIFER_VARIANTS

		# Both parts are placed by rotating their offset from the base through
		# the same lean, so a tilted tree leans as one piece. Placing each part
		# at the trunk position and letting it rotate about its own origin --
		# which is what this used to do -- slid the canopy off the trunk by
		# half a metre on the tall ones.
		var trunk_slot: int = trunk_xf[tv].size()
		trunk_xf[tv].append(Transform3D(_local_scale(rot, Vector3(radius, h, radius)),
			base + rot * Vector3(0.0, h * 0.5, 0.0)))
		var bark: float = rng.randf_range(0.72, 1.16)
		trunk_col[tv].append(Color(bark, bark * 0.97, bark * 0.92, 1.0))

		var crown_bottom: float = h * rng.randf_range(0.16, 0.28)
		var crown_h: float = h - crown_bottom
		# One uniform scale, derived from the height the canopy has to fill and
		# the proportions its mesh was authored at. Scaling Y on its own would
		# stretch every leaf card in the mesh into a shard.
		var crown_s: float = crown_h / CONIFER_ASPECT[cv]
		var leaf: float = rng.randf_range(0.78, 1.22)
		var leaf_color := Color(leaf * 0.94, leaf, leaf * 0.88, 1.0)
		var crown_slot: int = crown_xf[cv].size()
		crown_xf[cv].append(Transform3D(
			_local_scale(rot * Basis(Vector3.UP, rng.randf_range(0.0, TAU)),
				Vector3(crown_s, crown_s, crown_s)),
			base + rot * Vector3(0.0, crown_bottom, 0.0)))
		crown_col[cv].append(leaf_color)

		var cs: CollisionShape3D = _add_trunk_collision(p, gy, radius)
		pending.append({
			"tv": tv, "trunk": trunk_slot, "cv": cv, "crown": crown_slot, "cs": cs,
			"base": base, "height": h, "radius": radius,
			"tint": Color(0.42, 0.31, 0.20), "species": "conifer",
		})

	var bark_mat: ShaderMaterial = _bark_material(Color(0.68, 0.62, 0.55, 1.0), Vector2(1.0, 3.0), 0.95)
	var trunk_mms: Array = []
	for tv in TRUNK_VARIANTS:
		trunk_mms.append(_commit_bucket("ConiferTrunks%d" % tv, _trunk_variant_mesh(tv),
			bark_mat, trunk_xf[tv], trunk_col[tv], true))

	# Each variant gets its own green so a stand of trees is not one flat wall
	# of the same colour.
	var bases: Array[Color] = [
		Color(0.130, 0.215, 0.118, 1.0), Color(0.150, 0.245, 0.132, 1.0),
		Color(0.118, 0.196, 0.112, 1.0), Color(0.168, 0.265, 0.142, 1.0),
		Color(0.140, 0.228, 0.124, 1.0),
	]
	var tips: Array[Color] = [
		Color(0.270, 0.380, 0.180, 1.0), Color(0.300, 0.415, 0.198, 1.0),
		Color(0.245, 0.345, 0.168, 1.0), Color(0.330, 0.440, 0.215, 1.0),
		Color(0.285, 0.395, 0.190, 1.0),
	]
	var crown_mms: Array = []
	for cv in CONIFER_VARIANTS:
		crown_mms.append(_commit_bucket("ConiferCanopy%d" % cv, _conifer_canopy_mesh(cv),
			_leaf_material(bases[cv], tips[cv], CONIFER_ASPECT[cv],
				0.05 + float(cv) * 0.008, 0.85 + float(cv) * 0.06, 0.030),
			crown_xf[cv], crown_col[cv], true))

	for rec in pending:
		var tv: int = rec["tv"]
		var cv: int = rec["cv"]
		_register_tree(rec, [
			{"mm": trunk_mms[tv], "i": rec["trunk"], "rest": trunk_xf[tv][rec["trunk"]]},
			{"mm": crown_mms[cv], "i": rec["crown"], "rest": crown_xf[cv][rec["crown"]], "leafy": true},
		])

# ---------------------------------------------------------------- broadleaf

func _scatter_broadleaf() -> void:
	var points: Array[Vector2] = _find_spots(BROADLEAF_COUNT, 2.0, ROAD_CLEARANCE, TREE_MAX_SLOPE)

	var trunk_xf: Array = []
	var trunk_col: Array = []
	for _t in TRUNK_VARIANTS:
		trunk_xf.append([])
		trunk_col.append([])
	var crown_xf: Array = []
	var crown_col: Array = []
	for _c in BROADLEAF_VARIANTS:
		crown_xf.append([])
		crown_col.append([])
	var pending: Array = []

	for p in points:
		var gy: float = _ground(p.x, p.y)
		var h: float = rng.randf_range(6.0, 13.5)
		var radius: float = 0.13 + h * 0.016
		var yaw: float = rng.randf_range(0.0, TAU)
		var tilt: float = rng.randf_range(0.0, 0.07)
		var tilt_dir: float = rng.randf_range(0.0, TAU)
		var rot: Basis = Basis(Vector3(cos(tilt_dir), 0.0, sin(tilt_dir)), tilt) * Basis(Vector3.UP, yaw)
		var base := Vector3(p.x, gy, p.y)

		# Birches get a pale trunk, oaks a dark one -- same mesh, different tint.
		var is_birch: bool = rng.randf() < 0.4
		var trunk_ratio: float = 0.62 if is_birch else 0.5
		var trunk_h: float = h * trunk_ratio
		var tv: int = 1 if is_birch else rng.randi() % TRUNK_VARIANTS
		var cv: int = rng.randi() % BROADLEAF_VARIANTS

		var trunk_slot: int = trunk_xf[tv].size()
		trunk_xf[tv].append(Transform3D(_local_scale(rot, Vector3(radius, trunk_h, radius)),
			base + rot * Vector3(0.0, trunk_h * 0.5, 0.0)))
		var shade: float = rng.randf_range(0.85, 1.2) if is_birch else rng.randf_range(0.5, 0.8)
		if is_birch:
			trunk_col[tv].append(Color(shade * 1.25, shade * 1.22, shade * 1.12, 1.0))
		else:
			trunk_col[tv].append(Color(shade, shade * 0.92, shade * 0.82, 1.0))

		var leaf: float = rng.randf_range(0.62, 1.2)
		var warm: float = rng.randf_range(0.0, 1.0)
		var leaf_color := Color(leaf * (0.9 + warm * 0.35), leaf, leaf * 0.72, 1.0)
		var cr: float = h * rng.randf_range(0.26, 0.36)
		var tallness: float = rng.randf_range(0.82, 1.12)
		# The crown mesh has radius 0.5, so it scales up by twice the radius.
		var crown_slot: int = crown_xf[cv].size()
		crown_xf[cv].append(Transform3D(
			_local_scale(rot * Basis(Vector3.UP, rng.randf_range(0.0, TAU)),
				Vector3(cr * 2.0, cr * 2.0 * tallness, cr * 2.0)),
			base + rot * Vector3(0.0, trunk_h + cr * 0.55 * tallness, 0.0)))
		crown_col[cv].append(leaf_color)

		var cs: CollisionShape3D = _add_trunk_collision(p, gy, radius)
		pending.append({
			"tv": tv, "trunk": trunk_slot, "cv": cv, "crown": crown_slot, "cs": cs,
			"base": base, "height": h, "radius": radius,
			"tint": Color(0.52, 0.43, 0.31), "species": "broadleaf",
		})

	var bark_mat: ShaderMaterial = _bark_material(Color(0.7, 0.66, 0.6, 1.0), Vector2(1.0, 2.2), 0.95)
	var trunk_mms: Array = []
	for tv in TRUNK_VARIANTS:
		trunk_mms.append(_commit_bucket("BroadleafTrunks%d" % tv, _trunk_variant_mesh(tv),
			bark_mat, trunk_xf[tv], trunk_col[tv], true))

	var bases: Array[Color] = [
		Color(0.185, 0.265, 0.128, 1.0), Color(0.205, 0.285, 0.125, 1.0),
		Color(0.168, 0.246, 0.120, 1.0), Color(0.198, 0.278, 0.138, 1.0),
		Color(0.176, 0.256, 0.124, 1.0),
	]
	var tips: Array[Color] = [
		Color(0.370, 0.460, 0.205, 1.0), Color(0.405, 0.490, 0.212, 1.0),
		Color(0.345, 0.435, 0.198, 1.0), Color(0.390, 0.478, 0.225, 1.0),
		Color(0.378, 0.466, 0.210, 1.0),
	]
	var crown_mms: Array = []
	for cv in BROADLEAF_VARIANTS:
		# The crown mesh spans y -0.5..0.5, so a crown height of one unit puts
		# the sway anchor at its underside.
		crown_mms.append(_commit_bucket("BroadleafCanopy%d" % cv, _broadleaf_crown_mesh(cv),
			_leaf_material(bases[cv], tips[cv], 1.0,
				0.085 + float(cv) * 0.006, 1.05 + float(cv) * 0.07, 0.055),
			crown_xf[cv], crown_col[cv], true))

	for rec in pending:
		var tv: int = rec["tv"]
		var cv: int = rec["cv"]
		_register_tree(rec, [
			{"mm": trunk_mms[tv], "i": rec["trunk"], "rest": trunk_xf[tv][rec["trunk"]]},
			{"mm": crown_mms[cv], "i": rec["crown"], "rest": crown_xf[cv][rec["crown"]], "leafy": true},
		])

# ---------------------------------------------------------------- deadfall

func _scatter_dead_trees() -> void:
	var points: Array[Vector2] = _find_spots(DEAD_TREE_COUNT, 1.0, ROAD_CLEARANCE, TREE_MAX_SLOPE)

	var trunk_xf: Array = []
	var trunk_col: Array = []
	for _t in TRUNK_VARIANTS:
		trunk_xf.append([])
		trunk_col.append([])
	var branch_xf: Array[Transform3D] = []
	var branch_col: Array[Color] = []
	var crown_xf: Array = [[], []]
	var crown_col: Array = [[], []]
	var pending: Array = []

	for p in points:
		var gy: float = _ground(p.x, p.y)
		var h: float = rng.randf_range(5.5, 15.0)
		var radius: float = 0.09 + h * 0.011
		var yaw: float = rng.randf_range(0.0, TAU)
		var lean: float = rng.randf_range(0.02, 0.16)
		var lean_dir: float = rng.randf_range(0.0, TAU)
		var rot: Basis = Basis(Vector3(cos(lean_dir), 0.0, sin(lean_dir)), lean) * Basis(Vector3.UP, yaw)
		var base := Vector3(p.x, gy, p.y)

		var tv: int = rng.randi() % TRUNK_VARIANTS
		var trunk_slot: int = trunk_xf[tv].size()
		trunk_xf[tv].append(Transform3D(_local_scale(rot, Vector3(radius, h, radius)),
			base + rot * Vector3(0.0, h * 0.5, 0.0)))
		var shade: float = rng.randf_range(0.40, 0.66)
		trunk_col[tv].append(Color(shade, shade * 0.94, shade * 0.86, 1.0))

		var branch_slots: Array = []
		for _i in rng.randi_range(2, 5):
			var by: float = rng.randf_range(0.4, 0.92) * h
			var blen: float = rng.randf_range(0.9, 2.8)
			var brad: float = radius * rng.randf_range(0.2, 0.4)
			var byaw: float = rng.randf_range(0.0, TAU)
			var bpitch: float = rng.randf_range(0.85, 1.55)
			var b_rot: Basis = Basis(Vector3.UP, byaw) * Basis(Vector3.RIGHT, bpitch)
			var offset := Vector3(cos(byaw), 0.0, sin(byaw)) * blen * 0.35
			branch_slots.append(branch_xf.size())
			branch_xf.append(Transform3D(_local_scale(rot * b_rot, Vector3(brad, blen, brad)),
				base + rot * (Vector3(0.0, by, 0.0) + offset)))
			branch_col.append(Color(shade * 0.9, shade * 0.85, shade * 0.78, 1.0))

		# Roughly a third are only half dead and still hold some brown leaf.
		var crown_variant: int = -1
		var crown_slot: int = -1
		if rng.randf() < 0.34:
			crown_variant = rng.randi() % 2
			var cr: float = h * rng.randf_range(0.16, 0.24)
			crown_slot = crown_xf[crown_variant].size()
			crown_xf[crown_variant].append(Transform3D(
				_local_scale(rot * Basis(Vector3.UP, rng.randf_range(0.0, TAU)),
					Vector3(cr * 2.0, cr * 1.7, cr * 2.0)),
				base + rot * Vector3(0.0, h * rng.randf_range(0.72, 0.86), 0.0)))
			var dry: float = rng.randf_range(0.72, 1.1)
			crown_col[crown_variant].append(Color(dry, dry * 0.94, dry * 0.82, 1.0))

		var cs: CollisionShape3D = _add_trunk_collision(p, gy, radius)
		pending.append({
			"tv": tv, "trunk": trunk_slot, "branches": branch_slots,
			"cvar": crown_variant, "crown": crown_slot, "cs": cs,
			"base": base, "height": h, "radius": radius,
			"tint": Color(0.45, 0.41, 0.34), "species": "dead",
		})

	var dead_mat: ShaderMaterial = _bark_material(Color(0.5, 0.46, 0.4, 1.0), Vector2(1.0, 2.5), 1.0)
	var trunk_mms: Array = []
	for tv in TRUNK_VARIANTS:
		trunk_mms.append(_commit_bucket("DeadTrunks%d" % tv, _trunk_variant_mesh(tv),
			dead_mat, trunk_xf[tv], trunk_col[tv], true))
	var branch_mm: MultiMesh = _add_multimesh("DeadBranches", _trunk_mesh(), dead_mat,
		branch_xf, branch_col, false)

	var crown_mms: Array = []
	for cv in 2:
		crown_mms.append(_commit_bucket("DeadCanopy%d" % cv, _dead_crown_mesh(cv),
			_leaf_material(Color(0.135, 0.110, 0.062, 1.0), Color(0.285, 0.215, 0.105, 1.0),
				1.0, 0.05, 1.15, 0.045),
			crown_xf[cv], crown_col[cv], false))

	for rec in pending:
		var tv: int = rec["tv"]
		var parts: Array = [{"mm": trunk_mms[tv], "i": rec["trunk"], "rest": trunk_xf[tv][rec["trunk"]]}]
		for bi in rec["branches"]:
			parts.append({"mm": branch_mm, "i": bi, "rest": branch_xf[bi]})
		var cvar: int = rec["cvar"]
		if cvar >= 0:
			parts.append({"mm": crown_mms[cvar], "i": rec["crown"],
				"rest": crown_xf[cvar][rec["crown"]], "leafy": true})
		_register_tree(rec, parts)

# ---------------------------------------------------------------- undergrowth

func _scatter_bushes() -> void:
	var points: Array[Vector2] = _find_spots(BUSH_COUNT, 1.0, ROAD_CLEARANCE * 0.7, COVER_MAX_SLOPE)
	var xf: Array[Transform3D] = []
	var col: Array[Color] = []
	for p in points:
		var gy: float = _ground(p.x, p.y)
		var w: float = rng.randf_range(1.0, 2.8)
		var hgt: float = w * rng.randf_range(0.5, 0.85)
		var b := Basis(Vector3.UP, rng.randf_range(0.0, TAU)) * Basis(Vector3.RIGHT, rng.randf_range(-0.12, 0.12))
		xf.append(Transform3D(_local_scale(b, Vector3(w, hgt, w)), Vector3(p.x, gy + hgt * 0.40, p.y)))
		var shade: float = rng.randf_range(0.6, 1.18)
		col.append(Color(shade * 0.93, shade, shade * 0.84, 1.0))
	var bush: ArrayMesh = _deform(_sphere_source(10, 6), 0.34, 1.9, 6614, 0.85)
	_add_multimesh("Bushes", bush,
		_foliage_material(Color(0.095, 0.150, 0.080, 1.0), Color(0.190, 0.265, 0.120, 1.0), 1.0, 0.07, 1.35),
		xf, col, false)

func _scatter_ferns() -> void:
	var centers: Array[Vector2] = _find_spots(FERN_PATCHES, 0.0, ROAD_CLEARANCE * 0.55, COVER_MAX_SLOPE)
	var xf: Array[Transform3D] = []
	var col: Array[Color] = []
	for c in centers:
		for _i in FERNS_PER_PATCH:
			var angle: float = rng.randf_range(0.0, TAU)
			var dist: float = sqrt(rng.randf()) * 2.6
			var p: Vector2 = c + Vector2(cos(angle), sin(angle)) * dist
			var gy: float = _ground(p.x, p.y)
			var s: float = rng.randf_range(0.65, 1.6)
			var b: Basis = _local_scale(Basis(Vector3.UP, rng.randf_range(0.0, TAU)), Vector3(s, s, s))
			xf.append(Transform3D(b, Vector3(p.x, gy, p.y)))
			var shade: float = rng.randf_range(0.66, 1.22)
			col.append(Color(shade * 0.9, shade, shade * 0.8, 1.0))
	_add_multimesh("Ferns", _cross_quad_mesh(0.42, 0.85),
		_foliage_material(Color(0.140, 0.210, 0.095, 1.0), Color(0.300, 0.380, 0.160, 1.0), 0.85, 0.09, 1.5),
		xf, col, false)

func _scatter_undergrowth() -> void:
	var centers: Array[Vector2] = _find_spots(GRASS_PATCHES, 0.0, ROAD_CLEARANCE * 0.5, COVER_MAX_SLOPE)
	var xf: Array[Transform3D] = []
	var col: Array[Color] = []
	for c in centers:
		for _i in GRASS_PER_PATCH:
			var angle: float = rng.randf_range(0.0, TAU)
			var dist: float = sqrt(rng.randf()) * 3.2
			var p: Vector2 = c + Vector2(cos(angle), sin(angle)) * dist
			var gy: float = _ground(p.x, p.y)
			var s: float = rng.randf_range(0.65, 1.7)
			var b: Basis = _local_scale(Basis(Vector3.UP, rng.randf_range(0.0, TAU)), Vector3(s, s, s))
			xf.append(Transform3D(b, Vector3(p.x, gy, p.y)))
			var shade: float = rng.randf_range(0.68, 1.22)
			col.append(Color(shade, shade, shade * 0.9, 1.0))
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/grass_wind.gdshader") as Shader
	mat.set_shader_parameter("root_color", Color(0.150, 0.190, 0.090, 1.0))
	mat.set_shader_parameter("tip_color", Color(0.380, 0.450, 0.190, 1.0))
	mat.set_shader_parameter("blade_height", 0.34)
	_add_multimesh("Undergrowth", _cross_quad_mesh(0.055, 0.34), mat, xf, col, false)

func _scatter_flowers() -> void:
	# Wildflowers favour open, gently sloping ground, so they read as meadow
	# pockets in the clearings rather than an even sprinkle over the map.
	var centers: Array[Vector2] = _find_spots(FLOWER_PATCHES, 0.0, ROAD_CLEARANCE * 0.45, 0.30)
	var xf: Array[Transform3D] = []
	var col: Array[Color] = []
	for c in centers:
		# One species per patch, the way real wildflowers clump.
		var patch_color: Color = FLOWER_COLORS[rng.randi_range(0, FLOWER_COLORS.size() - 1)]
		for _i in FLOWERS_PER_PATCH:
			var angle: float = rng.randf_range(0.0, TAU)
			var dist: float = sqrt(rng.randf()) * 2.0
			var p: Vector2 = c + Vector2(cos(angle), sin(angle)) * dist
			var gy: float = _ground(p.x, p.y)
			var s: float = rng.randf_range(0.7, 1.45)
			var b: Basis = _local_scale(Basis(Vector3.UP, rng.randf_range(0.0, TAU)), Vector3(s, s, s))
			xf.append(Transform3D(b, Vector3(p.x, gy, p.y)))
			var v: float = rng.randf_range(0.82, 1.12)
			col.append(Color(patch_color.r * v, patch_color.g * v, patch_color.b * v, 1.0))
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/flower.gdshader") as Shader
	mat.set_shader_parameter("stem_color", Color(0.12, 0.20, 0.09, 1.0))
	mat.set_shader_parameter("total_height", 0.30)
	mat.set_shader_parameter("bloom_start", 0.72)
	_add_multimesh("Wildflowers", _flower_mesh(), mat, xf, col, false)

# ---------------------------------------------------------------- rocks

func _scatter_rocks() -> void:
	var points: Array[Vector2] = _find_spots(ROCK_COUNT, 0.0, ROAD_CLEARANCE * 0.6, 0.75)
	# Three distinct boulder shapes, picked at random per instance.
	var meshes: Array[ArrayMesh] = [
		_deform(_sphere_source(10, 6), 0.38, 1.5, 1201, 0.72),
		_deform(_sphere_source(9, 5), 0.46, 2.2, 4409, 0.60),
		_deform(_sphere_source(11, 7), 0.32, 1.1, 8836, 0.82),
	]
	var buckets: Array[Array] = [[], [], []]
	var bucket_cols: Array[Array] = [[], [], []]
	var mat: StandardMaterial3D = _rock_material()

	for p in points:
		var gy: float = _ground(p.x, p.y)
		var s: float = rng.randf_range(0.5, 2.6)
		var which: int = rng.randi_range(0, 2)
		var rot := Basis(Vector3.UP, rng.randf_range(0.0, TAU))
		rot = rot * Basis(Vector3.RIGHT, rng.randf_range(-0.35, 0.35))
		rot = rot * Basis(Vector3.FORWARD, rng.randf_range(-0.35, 0.35))
		var sx: float = s * rng.randf_range(0.85, 1.5)
		var sy: float = s * rng.randf_range(0.6, 1.05)
		var sz: float = s * rng.randf_range(0.85, 1.45)
		# Sunk slightly so boulders sit in the ground rather than on it.
		buckets[which].append(Transform3D(_local_scale(rot, Vector3(sx, sy, sz)),
			Vector3(p.x, gy + sy * 0.30, p.y)))
		var shade: float = rng.randf_range(0.7, 1.12)
		bucket_cols[which].append(Color(shade, shade, shade * 1.02, 1.0))

		if s > 1.5:
			var sphere := SphereShape3D.new()
			sphere.radius = maxf(sx, sz) * 0.42
			var cs := CollisionShape3D.new()
			cs.shape = sphere
			cs.position = Vector3(p.x, gy + sy * 0.30, p.y)
			rock_collision_body.add_child(cs)

	for i in 3:
		var xf_list: Array[Transform3D] = []
		var col_list: Array[Color] = []
		for v in buckets[i]:
			xf_list.append(v)
		for c in bucket_cols[i]:
			col_list.append(c)
		_add_multimesh("Boulders%d" % (i + 1), meshes[i], mat, xf_list, col_list, true)

# ---------------------------------------------------------------- hero props

func _place_hero_props() -> void:
	# Real scanned meshes used sparingly as detail anchors. If the glTF import
	# is unavailable the forest simply renders without them rather than taking
	# the whole scene down.
	_place_model("res://models/dead_tree_trunk_02/dead_tree_trunk_02_1k.gltf",
		"HeroDeadTrunk", HERO_DEAD_TRUNKS, 0.8, 1.7, 3.0)
	_place_model("res://models/tree_stump_01/tree_stump_01_1k.gltf",
		"HeroStump", HERO_STUMPS, 0.7, 1.5, 1.0)

func _place_model(path: String, prefix: String, count: int,
		min_scale: float, max_scale: float, road_clearance: float) -> void:
	var packed: PackedScene = load(path) as PackedScene
	if packed == null:
		push_warning("Forest: optional model missing, skipping: %s" % path)
		return
	var points: Array[Vector2] = _find_spots(count, 1.0, road_clearance, 0.35)
	for i in points.size():
		var instance: Node3D = packed.instantiate() as Node3D
		if instance == null:
			return
		add_child(instance)
		instance.name = "%s%d" % [prefix, i]
		var gy: float = _ground(points[i].x, points[i].y)
		instance.position = Vector3(points[i].x, gy - 0.15, points[i].y)
		instance.rotation.y = rng.randf_range(0.0, TAU)
		var s: float = rng.randf_range(min_scale, max_scale)
		instance.scale = Vector3(s, s, s)

# ==================================================================== chopping
#
# A tree lives as instances spread across several MultiMeshes, so it has no node
# of its own to hit. The registry below closes that gap: the axe raycast lands on
# one of the trunk collision shapes, that shape maps to a record, and the record
# knows every instance the tree owns. Felling then rotates all of them together
# about the trunk base, which is what makes a batched tree behave like a solid
# object.

const TREE_BASE_HP := 5
const FALL_DURATION := 2.1
const FRUIT_CHANCE := 0.55
const LOG_SCENE: PackedScene = preload("res://scenes/log_pickup.tscn")
const APPLE_SCENE: PackedScene = preload("res://scenes/apple_pickup.tscn")
const STUMP_HEIGHT := 0.42

func _register_tree(rec: Dictionary, parts: Array) -> void:
	var entry: Dictionary = {
		"parts": parts,
		"base": rec["base"],
		"radius": rec["radius"],
		"height": rec["height"],
		"cs": rec["cs"],
		"hp": TREE_BASE_HP + int(rec["height"] / 6.0),
		"felled": false,
		# Carried through to the log that drops, so a birch trunk stays pale
		# and an oak stays dark all the way to the chopping block.
		"tint": rec.get("tint", Color(0.46, 0.35, 0.23)),
		"species": rec.get("species", "conifer"),
	}
	trees.append(entry)
	if rec["cs"] != null:
		tree_by_shape[rec["cs"]] = entry

# Called by the axe. Returns what happened so the player can react without
# knowing anything about how the forest is stored.
# True when this collision shape belongs to a tree that is still standing, so
# callers can tell "I hit a trunk" apart from "I hit a rock" without chopping.
func is_tree(collision_shape: Node) -> bool:
	var entry: Variant = tree_by_shape.get(collision_shape)
	if entry == null:
		return false
	var tree: Dictionary = entry
	return not bool(tree["felled"])

func chop(collision_shape: Node, damage: int) -> Dictionary:
	var entry: Variant = tree_by_shape.get(collision_shape)
	if entry == null:
		return {"hit": false}
	var tree: Dictionary = entry
	if tree["felled"]:
		return {"hit": false}
	tree["hp"] = int(tree["hp"]) - damage
	if int(tree["hp"]) > 0:
		# Shudder on a glancing blow so every swing reads as connecting.
		_shake_tree(tree, 0.035)
		return {"hit": true, "felled": false, "base": tree["base"]}
	_fell_tree(tree)
	return {"hit": true, "felled": true, "base": tree["base"], "tint": tree["tint"]}

func _shake_tree(tree: Dictionary, amount: float) -> void:
	var axis := Vector3(rng.randf_range(-1.0, 1.0), 0.0, rng.randf_range(-1.0, 1.0))
	if axis.length_squared() < 0.001:
		axis = Vector3.RIGHT
	falling.append({
		"tree": tree, "t": 0.0, "dur": 0.28, "angle": amount,
		"axis": axis.normalized(), "shake": true,
	})

func _fell_tree(tree: Dictionary) -> void:
	tree["felled"] = true
	var cs: Variant = tree["cs"]
	if cs != null:
		# Let the player walk over what they just dropped.
		(cs as CollisionShape3D).set_deferred("disabled", true)
	var dir: float = rng.randf_range(0.0, TAU)
	falling.append({
		"tree": tree, "t": 0.0, "dur": FALL_DURATION,
		"angle": PI * 0.5, "axis": Vector3(cos(dir), 0.0, sin(dir)), "shake": false,
	})
	_place_stump(tree)

func _place_stump(tree: Dictionary) -> void:
	if stump_mm == null or stumps_used >= stump_mm.instance_count:
		return
	var base: Vector3 = tree["base"]
	var r: float = float(tree["radius"]) * 1.12
	var xf := Transform3D(
		Basis(Vector3.UP, rng.randf_range(0.0, TAU)).scaled(Vector3(r, STUMP_HEIGHT, r)),
		base + Vector3(0.0, STUMP_HEIGHT * 0.45, 0.0))
	stump_mm.set_instance_transform(stumps_used, xf)
	stump_mm.set_instance_color(stumps_used, Color(0.85, 0.78, 0.62, 1.0))
	stumps_used += 1
	stump_mm.visible_instance_count = stumps_used

func _build_stump_pool() -> void:
	var cap: int = CONIFER_COUNT + BROADLEAF_COUNT + DEAD_TREE_COUNT
	var m := CylinderMesh.new()
	m.top_radius = 1.0
	m.bottom_radius = 1.12
	m.height = 1.0
	m.radial_segments = 10
	m.rings = 1
	stump_mm = MultiMesh.new()
	stump_mm.transform_format = MultiMesh.TRANSFORM_3D
	stump_mm.use_colors = true
	stump_mm.mesh = m
	stump_mm.instance_count = cap
	# Nothing is drawn until a tree actually comes down.
	stump_mm.visible_instance_count = 0
	var mmi := MultiMeshInstance3D.new()
	mmi.name = "Stumps"
	mmi.multimesh = stump_mm
	mmi.material_override = _bark_material(Color(0.82, 0.74, 0.6, 1.0), Vector2(1.0, 1.0), 0.95)
	add_child(mmi)

func _process(delta: float) -> void:
	if falling.is_empty():
		return
	var still_going: Array = []
	for anim in falling:
		var a: Dictionary = anim
		a["t"] = float(a["t"]) + delta
		var t: float = clampf(float(a["t"]) / float(a["dur"]), 0.0, 1.0)
		var angle: float = 0.0
		if bool(a["shake"]):
			# A quick there-and-back wobble.
			angle = sin(t * PI) * float(a["angle"])
		else:
			# Timber: slow to start, then accelerating like it is hinging on the
			# stump, with a small bounce as it settles.
			var e: float = t * t * (3.0 - 2.0 * t)
			e = e * e
			angle = float(a["angle"]) * e
			if t > 0.92:
				angle -= sin((t - 0.92) / 0.08 * PI) * 0.05
		_apply_tree_rotation(a["tree"], a["axis"], angle)
		if t < 1.0:
			still_going.append(a)
		elif not bool(a["shake"]):
			_settle_felled(a["tree"], a["axis"], float(a["angle"]))
	falling = still_going

# The moment a felled tree finishes hitting the ground: the canopy bursts and
# is taken away, the standing geometry is removed, and a carryable log is left
# lying exactly where the trunk came to rest.
func _settle_felled(tree: Dictionary, axis: Vector3, angle: float) -> void:
	if bool(tree.get("settled", false)):
		return
	tree["settled"] = true

	var base: Vector3 = tree["base"]
	var rot := Basis(axis, angle)
	var parts: Array = tree["parts"]
	var tint: Color = tree["tint"]

	# Everything past the trunk comes down with it. The canopy parts are
	# flagged when they are built, so a dead tree's bare branches do not throw
	# a shower of green leaves the way indexing by position used to.
	for i in range(1, parts.size()):
		var part: Dictionary = parts[i]
		var rest: Transform3D = part["rest"]
		var landed: Vector3 = base + rot * (rest.origin - base)
		if bool(part.get("leafy", false)):
			Effects.spawn_leaf_burst(landed, _leaf_tint(tree), 40)
		_hide_part(part)

	# Where the trunk ended up, and which way it is lying.
	var trunk: Dictionary = parts[0]
	var trunk_rest: Transform3D = trunk["rest"]
	var trunk_origin: Vector3 = base + rot * (trunk_rest.origin - base)
	_hide_part(trunk)

	# A trunk instance is scaled so its own +Y is the length; after the fall
	# that axis is where the log should lie.
	var along: Vector3 = (rot * trunk_rest.basis.y).normalized()
	along.y = 0.0
	if along.length() < 0.05:
		along = Vector3(1, 0, 0)
	along = along.normalized()

	var length: float = clampf(float(tree["height"]) * 0.45, 2.2, 4.6)
	var radius: float = clampf(float(tree["radius"]) * 1.05, 0.24, 0.44)
	var log_node: Node3D = LOG_SCENE.instantiate() as Node3D
	log_node.set("tint", tint)
	log_node.set("trunk_radius", radius)
	log_node.set("trunk_length", length)
	get_parent().add_child(log_node)
	# Sat on the ground a little way out from the stump, along the fall line.
	var rest_spot := Vector3(base.x, 0.0, base.z) + along * (length * 0.5 + 0.6)
	log_node.global_position = Vector3(rest_spot.x, _ground(rest_spot.x, rest_spot.z) + radius, rest_spot.z)
	log_node.rotation.y = atan2(along.x, along.z)

	if String(tree["species"]) == "broadleaf":
		_drop_fruit(trunk_origin, along, length)

func _leaf_tint(tree: Dictionary) -> Color:
	if String(tree["species"]) == "conifer":
		return Color(0.22, 0.35, 0.22)
	if String(tree["species"]) == "dead":
		return Color(0.38, 0.33, 0.24)
	return Color(0.34, 0.48, 0.24)

# Pushes a MultiMesh instance out of sight. There is no per-instance visibility
# flag, so it is scaled to nothing and parked under the terrain.
func _hide_part(part: Dictionary) -> void:
	var mm: MultiMesh = part["mm"]
	if mm == null:
		return
	mm.set_instance_transform(int(part["i"]), Transform3D(
		Basis.IDENTITY.scaled(Vector3(0.0001, 0.0001, 0.0001)),
		Vector3(0.0, -900.0, 0.0)))

# Broadleaf canopies sometimes have fruit in them.
func _drop_fruit(near: Vector3, along: Vector3, length: float) -> void:
	if rng.randf() > FRUIT_CHANCE:
		return
	var count: int = rng.randi_range(1, 3)
	for i in count:
		var apple: Node3D = APPLE_SCENE.instantiate() as Node3D
		get_parent().add_child(apple)
		var sideways: Vector3 = Vector3(-along.z, 0.0, along.x)
		var spot: Vector3 = near \
			+ along * rng.randf_range(-length * 0.25, length * 0.35) \
			+ sideways * rng.randf_range(-1.2, 1.2)
		apple.global_position = Vector3(spot.x, _ground(spot.x, spot.z) + 0.14, spot.z)

func _apply_tree_rotation(tree: Dictionary, axis: Vector3, angle: float) -> void:
	var base: Vector3 = tree["base"]
	var rot := Basis(axis, angle)
	for part in tree["parts"]:
		var mm: MultiMesh = part["mm"]
		if mm == null:
			continue
		var idx: int = part["i"]
		# rest was captured at build time; never read back off the MultiMesh.
		var rest: Transform3D = part["rest"]
		# Rigid rotation about the trunk base, so trunk and canopy stay welded.
		mm.set_instance_transform(idx, Transform3D(
			rot * rest.basis, base + rot * (rest.origin - base)))

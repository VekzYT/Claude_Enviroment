extends Node3D

# A campfire that is the size of a campfire. The old one was a 4.8 m stone
# pancake with two 2.2 m logs lying flat on it and a glowing disc in the
# middle, which is why it read as a weird table rather than a fire.
#
# This is roughly 1.3 m across: a ring of individual stones, an ash bed, four
# logs leaning into a tepee with two more fallen across the front, a small
# ember bed, flame and smoke particles, and a light that flickers.

const RING_RADIUS := 0.62
const STONE_COUNT := 11

var light: OmniLight3D = null
var embers: MeshInstance3D = null
var ember_material: StandardMaterial3D = null
var flicker := 0.0
var base_energy := 2.1
var rng := RandomNumberGenerator.new()

const COOK_TIME := 14.0

var cooking := 0
var cook_progress := 0.0
var ready_meat := 0
var spit: Node3D = null

func _ready() -> void:
	add_to_group("interactable")
	add_to_group("campfire")
	rng.seed = 4242
	_build_stones()
	_build_ash()
	_build_logs()
	_build_embers()
	_build_particles()
	_build_light()

func _material(colour: Color, roughness: float) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = colour
	mat.roughness = roughness
	return mat

func _build_stones() -> void:
	var stone_mat: StandardMaterial3D = _material(Color(0.34, 0.33, 0.31), 0.92)
	var soot: StandardMaterial3D = _material(Color(0.15, 0.14, 0.13), 0.95)
	var box := BoxMesh.new()
	box.size = Vector3.ONE
	for i in STONE_COUNT:
		var angle: float = TAU * float(i) / float(STONE_COUNT) + rng.randf_range(-0.08, 0.08)
		var radius: float = RING_RADIUS + rng.randf_range(-0.03, 0.04)
		var stone := MeshInstance3D.new()
		stone.name = "Stone%d" % i
		stone.mesh = box
		# The inner faces are smoke-blackened; from outside the ring the stones
		# are just stone. Alternating the two reads as soot without a texture.
		if i % 3 == 0:
			stone.material_override = soot
		else:
			stone.material_override = stone_mat
		stone.position = Vector3(cos(angle) * radius, rng.randf_range(0.06, 0.11), sin(angle) * radius)
		stone.rotation_degrees = Vector3(
			rng.randf_range(-9, 9), rad_to_deg(angle) + rng.randf_range(-16, 16), rng.randf_range(-9, 9))
		stone.scale = Vector3(rng.randf_range(0.16, 0.26), rng.randf_range(0.13, 0.21), rng.randf_range(0.14, 0.2))
		add_child(stone)

func _build_ash() -> void:
	var ash := MeshInstance3D.new()
	ash.name = "AshBed"
	var disc := CylinderMesh.new()
	disc.top_radius = RING_RADIUS - 0.06
	disc.bottom_radius = RING_RADIUS - 0.02
	disc.height = 0.06
	disc.radial_segments = 14
	ash.mesh = disc
	ash.material_override = _material(Color(0.16, 0.15, 0.14), 0.98)
	ash.position = Vector3(0, 0.03, 0)
	add_child(ash)

func _build_logs() -> void:
	var charred: StandardMaterial3D = _material(Color(0.13, 0.11, 0.10), 0.96)
	var wood: StandardMaterial3D = _material(Color(0.30, 0.21, 0.13), 0.94)
	var stick := CylinderMesh.new()
	stick.top_radius = 0.055
	stick.bottom_radius = 0.07
	stick.height = 0.95
	stick.radial_segments = 7

	# Four leaning into each other, meeting above the middle.
	for i in 4:
		var angle: float = TAU * float(i) / 4.0 + 0.4
		var log_node := MeshInstance3D.new()
		log_node.name = "TepeeLog%d" % i
		log_node.mesh = stick
		if i % 2 == 0:
			log_node.material_override = charred
		else:
			log_node.material_override = wood
		var foot := Vector3(cos(angle) * 0.34, 0.0, sin(angle) * 0.34)
		log_node.position = foot + Vector3(0, 0.34, 0)
		# Tipped inward toward the apex, with a little scatter so it is not
		# a perfect cone.
		log_node.rotation = Vector3(
			deg_to_rad(cos(angle) * 0.0), 0.0, 0.0)
		log_node.look_at_from_position(
			log_node.position, Vector3(0, 0.78, 0), Vector3.UP)
		log_node.rotate_object_local(Vector3(1, 0, 0), deg_to_rad(90.0))
		log_node.rotate_object_local(Vector3(0, 1, 0), rng.randf_range(-0.2, 0.2))
		add_child(log_node)

	# Two lying across the near side, half burnt through.
	for i in 2:
		var fallen := MeshInstance3D.new()
		fallen.name = "FallenLog%d" % i
		var short_stick := CylinderMesh.new()
		short_stick.top_radius = 0.055
		short_stick.bottom_radius = 0.065
		short_stick.height = 0.8
		short_stick.radial_segments = 7
		fallen.mesh = short_stick
		fallen.material_override = charred
		fallen.position = Vector3(-0.1 + i * 0.2, 0.09, 0.3 + i * 0.1)
		fallen.rotation_degrees = Vector3(90, 22 - i * 44, 0)
		add_child(fallen)

func _build_embers() -> void:
	ember_material = StandardMaterial3D.new()
	ember_material.albedo_color = Color(0.42, 0.10, 0.03)
	ember_material.emission_enabled = true
	ember_material.emission = Color(1.0, 0.42, 0.10)
	ember_material.emission_energy_multiplier = 1.5
	ember_material.roughness = 0.9

	embers = MeshInstance3D.new()
	embers.name = "Embers"
	var bed := CylinderMesh.new()
	bed.top_radius = 0.24
	bed.bottom_radius = 0.3
	bed.height = 0.09
	bed.radial_segments = 12
	embers.mesh = bed
	embers.material_override = ember_material
	embers.position = Vector3(0, 0.07, 0)
	add_child(embers)

	# A few loose coals sitting proud of the bed.
	for i in 5:
		var coal := MeshInstance3D.new()
		var lump := BoxMesh.new()
		lump.size = Vector3.ONE
		coal.mesh = lump
		coal.material_override = ember_material
		var angle: float = rng.randf_range(0.0, TAU)
		var radius: float = rng.randf_range(0.05, 0.24)
		coal.position = Vector3(cos(angle) * radius, 0.11, sin(angle) * radius)
		coal.rotation_degrees = Vector3(0, rng.randf_range(0, 90), 0)
		coal.scale = Vector3(rng.randf_range(0.05, 0.1), 0.045, rng.randf_range(0.05, 0.09))
		add_child(coal)

func _build_particles() -> void:
	var flame := GPUParticles3D.new()
	flame.name = "Flame"
	var flame_mat := ParticleProcessMaterial.new()
	flame_mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
	flame_mat.emission_sphere_radius = 0.19
	flame_mat.direction = Vector3(0, 1, 0)
	flame_mat.spread = 12.0
	flame_mat.initial_velocity_min = 0.55
	flame_mat.initial_velocity_max = 1.25
	flame_mat.gravity = Vector3(0, 0.5, 0)
	flame_mat.scale_min = 0.5
	flame_mat.scale_max = 1.2
	# Shrinking as it rises is what turns a column of dots into a flame.
	var curve := CurveTexture.new()
	var shape := Curve.new()
	shape.add_point(Vector2(0.0, 0.25))
	shape.add_point(Vector2(0.3, 1.0))
	shape.add_point(Vector2(1.0, 0.0))
	curve.curve = shape
	flame_mat.scale_curve = curve
	var ramp := Gradient.new()
	# Starts bright and mostly opaque at the coals, thins to nothing well before
	# the top of its arc so the column has a soft edge.
	ramp.set_color(0, Color(1.0, 0.88, 0.46, 0.85))
	ramp.set_color(1, Color(0.80, 0.16, 0.03, 0.0))
	var ramp_texture := GradientTexture1D.new()
	ramp_texture.gradient = ramp
	flame_mat.color_ramp = ramp_texture

	var flame_mesh := QuadMesh.new()
	flame_mesh.size = Vector2(0.13, 0.17)
	var flame_surface := StandardMaterial3D.new()
	flame_surface.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	flame_surface.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	flame_surface.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	flame_surface.vertex_color_use_as_albedo = true
	flame_surface.albedo_color = Color(1, 1, 1, 1)
	flame_mesh.material = flame_surface

	flame.process_material = flame_mat
	flame.draw_pass_1 = flame_mesh
	flame.amount = 40
	flame.lifetime = 0.7
	flame.position = Vector3(0, 0.16, 0)
	add_child(flame)

	var smoke := GPUParticles3D.new()
	smoke.name = "Smoke"
	var smoke_mat := ParticleProcessMaterial.new()
	smoke_mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
	smoke_mat.emission_sphere_radius = 0.14
	smoke_mat.direction = Vector3(0.2, 1, 0.1)
	smoke_mat.spread = 16.0
	smoke_mat.initial_velocity_min = 0.5
	smoke_mat.initial_velocity_max = 1.0
	smoke_mat.gravity = Vector3(0.25, 0.7, 0.1)
	smoke_mat.scale_min = 1.0
	smoke_mat.scale_max = 2.6
	var smoke_ramp := Gradient.new()
	smoke_ramp.set_color(0, Color(0.30, 0.29, 0.27, 0.42))
	smoke_ramp.set_color(1, Color(0.42, 0.42, 0.40, 0.0))
	var smoke_ramp_texture := GradientTexture1D.new()
	smoke_ramp_texture.gradient = smoke_ramp
	smoke_mat.color_ramp = smoke_ramp_texture

	var smoke_mesh := QuadMesh.new()
	smoke_mesh.size = Vector2(0.3, 0.3)
	var smoke_surface := StandardMaterial3D.new()
	smoke_surface.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	smoke_surface.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	smoke_surface.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	smoke_surface.vertex_color_use_as_albedo = true
	smoke_mesh.material = smoke_surface

	smoke.process_material = smoke_mat
	smoke.draw_pass_1 = smoke_mesh
	smoke.amount = 16
	smoke.lifetime = 3.2
	smoke.position = Vector3(0, 0.4, 0)
	add_child(smoke)

func _build_light() -> void:
	light = OmniLight3D.new()
	light.name = "FireLight"
	light.position = Vector3(0, 0.55, 0)
	light.light_color = Color(1.0, 0.58, 0.24)
	light.light_energy = base_energy
	light.omni_range = 11.0
	light.shadow_enabled = true
	add_child(light)

func _process(delta: float) -> void:
	# Two out-of-phase waves plus a little noise: a single sine reads as a
	# pulse, which looks like a fault rather than a fire.
	flicker += delta
	var wobble: float = sin(flicker * 9.1) * 0.09 + sin(flicker * 3.7) * 0.06 + randf_range(-0.04, 0.04)
	if light != null:
		light.light_energy = base_energy * (1.0 + wobble)
	if ember_material != null:
		ember_material.emission_energy_multiplier = 1.5 * (1.0 + wobble * 0.7)
	_cook(delta)

# --- cooking -----------------------------------------------------------------

func prompt_for(_player: Node) -> String:
	if ready_meat > 0:
		return "Take the cooked meat (%d)" % ready_meat
	if cooking > 0:
		return ""
	if GameState.raw_meat > 0:
		return "Cook the meat (%d)" % GameState.raw_meat
	return ""

func interact(_player: Node) -> void:
	if ready_meat > 0:
		GameState.add_cooked_meat(ready_meat)
		GameState.announce("%d cooked meat taken." % ready_meat)
		ready_meat = 0
		_clear_spit()
		Sound.play_ui("weapon_switch", -8.0)
		return
	if cooking > 0 or GameState.raw_meat <= 0:
		return
	cooking = GameState.raw_meat
	GameState.add_raw_meat(-cooking)
	cook_progress = 0.0
	_build_spit()
	GameState.announce("Meat on the fire. Give it a minute.")

func _build_spit() -> void:
	_clear_spit()
	spit = Node3D.new()
	spit.name = "Spit"
	spit.position = Vector3(0, 0.62, 0)
	add_child(spit)

	var iron: StandardMaterial3D = _material(Color(0.13, 0.13, 0.14), 0.6)
	var stake := CylinderMesh.new()
	stake.top_radius = 0.018
	stake.bottom_radius = 0.018
	stake.height = 1.3
	stake.radial_segments = 6
	var bar := MeshInstance3D.new()
	bar.mesh = stake
	bar.material_override = iron
	bar.rotation_degrees = Vector3(0, 0, 90)
	spit.add_child(bar)
	# Two uprights holding the bar over the coals.
	for side in [-1.0, 1.0]:
		var post := MeshInstance3D.new()
		var post_mesh := CylinderMesh.new()
		post_mesh.top_radius = 0.02
		post_mesh.bottom_radius = 0.025
		post_mesh.height = 0.62
		post_mesh.radial_segments = 6
		post.mesh = post_mesh
		post.material_override = iron
		post.position = Vector3(0.56 * side, -0.31, 0)
		spit.add_child(post)

	var raw: StandardMaterial3D = _material(Color(0.60, 0.22, 0.20), 0.72)
	for i in cooking:
		var cut := MeshInstance3D.new()
		cut.name = "Cut%d" % i
		var box := BoxMesh.new()
		box.size = Vector3.ONE
		cut.mesh = box
		cut.material_override = raw
		cut.position = Vector3(-0.3 + float(i) * 0.3, -0.07, 0)
		cut.scale = Vector3(0.2, 0.13, 0.14)
		spit.add_child(cut)

func _clear_spit() -> void:
	if spit != null:
		spit.queue_free()
		spit = null

func _cook(delta: float) -> void:
	if cooking <= 0:
		return
	cook_progress += delta
	var done: float = clampf(cook_progress / COOK_TIME, 0.0, 1.0)
	# The cuts darken and shrink as they cook, so progress is visible from the
	# fire rather than only in a message.
	if spit != null:
		for child in spit.get_children():
			var cut := child as MeshInstance3D
			if cut == null or not cut.name.begins_with("Cut"):
				continue
			var mat := cut.material_override as StandardMaterial3D
			if mat != null:
				mat.albedo_color = Color(0.60, 0.22, 0.20).lerp(Color(0.32, 0.18, 0.10), done)
			cut.scale = Vector3(0.2, 0.13, 0.14) * (1.0 - done * 0.22)
			cut.rotation.x = sin(flicker * 1.2) * 0.1
	if done >= 1.0:
		ready_meat = cooking
		cooking = 0
		GameState.announce("The meat is done.")
		Sound.play_ui("ui_toggle", -8.0)

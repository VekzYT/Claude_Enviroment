extends Node

const TRACER_LIFETIME := 0.09
const TRACER_RADIUS := 0.02

const BLOOD_LIFETIME := 0.7

var tracer_mesh: CylinderMesh
var player_tracer_material: StandardMaterial3D
var bot_tracer_material: StandardMaterial3D
var blood_mesh: SphereMesh


# current_scene is null during scene changes and whenever a scene was not loaded
# through the scene system, which drops the effect and logs an error. This
# autoload is always in the tree, so it is a safe fallback host.
func _host() -> Node:
	var scene: Node = get_tree().current_scene
	if scene == null:
		return self
	return scene

func _ready() -> void:
	tracer_mesh = CylinderMesh.new()
	tracer_mesh.top_radius = 0.5
	tracer_mesh.bottom_radius = 0.5
	tracer_mesh.height = 1.0
	tracer_mesh.radial_segments = 6

	player_tracer_material = StandardMaterial3D.new()
	player_tracer_material.albedo_color = Color(0.4, 0.9, 1.0, 1)
	player_tracer_material.emission_enabled = true
	player_tracer_material.emission = Color(0.4, 0.9, 1.0, 1)
	player_tracer_material.emission_energy_multiplier = 10.0
	player_tracer_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED

	bot_tracer_material = StandardMaterial3D.new()
	bot_tracer_material.albedo_color = Color(1.0, 0.25, 0.15, 1)
	bot_tracer_material.emission_enabled = true
	bot_tracer_material.emission = Color(1.0, 0.25, 0.15, 1)
	bot_tracer_material.emission_energy_multiplier = 10.0
	bot_tracer_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED

	blood_mesh = SphereMesh.new()
	blood_mesh.radius = 0.05
	blood_mesh.height = 0.1
	blood_mesh.radial_segments = 6
	blood_mesh.rings = 3
	var blood_material := StandardMaterial3D.new()
	blood_material.albedo_color = Color(0.42, 0.02, 0.02, 1)
	blood_material.roughness = 0.35
	blood_mesh.material = blood_material

func spawn_tracer(from: Vector3, to: Vector3, is_player: bool) -> void:
	var distance: float = from.distance_to(to)
	if distance < 0.05:
		return

	var mesh_instance := MeshInstance3D.new()
	mesh_instance.mesh = tracer_mesh
	mesh_instance.material_override = player_tracer_material if is_player else bot_tracer_material

	var dir: Vector3 = (to - from).normalized()
	var up_vector: Vector3 = Vector3.RIGHT if abs(dir.dot(Vector3.UP)) > 0.99 else Vector3.UP
	var mid: Vector3 = (from + to) * 0.5

	_host().add_child(mesh_instance)
	mesh_instance.global_position = mid
	mesh_instance.look_at(mid + dir, up_vector)
	mesh_instance.rotate_object_local(Vector3.RIGHT, -PI / 2.0)
	mesh_instance.scale = Vector3(TRACER_RADIUS, distance, TRACER_RADIUS)

	get_tree().create_timer(TRACER_LIFETIME).timeout.connect(mesh_instance.queue_free)

func spawn_blood(position: Vector3, normal: Vector3) -> void:
	var particles := CPUParticles3D.new()
	particles.mesh = blood_mesh
	particles.emitting = true
	particles.one_shot = true
	particles.amount = 14
	particles.lifetime = BLOOD_LIFETIME
	particles.explosiveness = 0.9
	particles.direction = normal if normal.length_squared() > 0.01 else Vector3.UP
	particles.spread = 45.0
	particles.initial_velocity_min = 1.2
	particles.initial_velocity_max = 3.2
	particles.gravity = Vector3(0, -9.0, 0)
	particles.scale_amount_min = 0.3
	particles.scale_amount_max = 1.0

	_host().add_child(particles)
	particles.global_position = position

	get_tree().create_timer(BLOOD_LIFETIME + 0.4).timeout.connect(particles.queue_free)

# Pale splinters kicked out of the cut, aimed back along the surface normal.
func spawn_wood_chips(position: Vector3, normal: Vector3) -> void:
	var particles := GPUParticles3D.new()
	var mat := ParticleProcessMaterial.new()
	mat.direction = normal
	mat.spread = 42.0
	mat.initial_velocity_min = 2.2
	mat.initial_velocity_max = 5.4
	mat.gravity = Vector3(0.0, -9.0, 0.0)
	mat.scale_min = 0.5
	mat.scale_max = 1.3
	mat.damping_min = 0.5
	mat.damping_max = 1.5
	mat.color = Color(0.78, 0.63, 0.40, 1.0)

	var mesh := BoxMesh.new()
	mesh.size = Vector3(0.05, 0.02, 0.09)
	var chip_mat := StandardMaterial3D.new()
	chip_mat.albedo_color = Color(0.72, 0.57, 0.36, 1.0)
	chip_mat.roughness = 0.95
	chip_mat.vertex_color_use_as_albedo = true
	mesh.material = chip_mat

	particles.process_material = mat
	particles.draw_pass_1 = mesh
	particles.amount = 14
	particles.lifetime = 1.1
	particles.one_shot = true
	particles.explosiveness = 1.0
	_host().add_child(particles)
	particles.global_position = position
	particles.emitting = true
	particles.finished.connect(particles.queue_free)


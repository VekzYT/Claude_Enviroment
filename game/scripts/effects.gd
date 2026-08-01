extends Node

const TRACER_LIFETIME := 0.09
const TRACER_RADIUS := 0.02

var tracer_mesh: CylinderMesh
var player_tracer_material: StandardMaterial3D
var bot_tracer_material: StandardMaterial3D

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

	get_tree().current_scene.add_child(mesh_instance)
	mesh_instance.global_position = mid
	mesh_instance.look_at(mid + dir, up_vector)
	mesh_instance.rotate_object_local(Vector3.RIGHT, -PI / 2.0)
	mesh_instance.scale = Vector3(TRACER_RADIUS, distance, TRACER_RADIUS)

	get_tree().create_timer(TRACER_LIFETIME).timeout.connect(mesh_instance.queue_free)

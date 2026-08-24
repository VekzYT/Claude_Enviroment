extends Node3D

# A loosed arrow. It is not a physics body: it steps forward each frame and
# raycasts the distance it just covered, which is the only way a fast projectile
# reliably hits a thin target. A body moving 60 m/s at 60 fps jumps a metre per
# frame and will happily tunnel straight through a hare.

const SPEED := 62.0
const GRAVITY := 11.0
const LIFETIME := 6.0
# Stops short of the surface so the shaft stands proud of it rather than
# vanishing into it.
const EMBED := 0.12

var velocity := Vector3.ZERO
var damage := 46
var age := 0.0
var stuck := false
var hit_was_ground := false
var shooter: Node = null

func _ready() -> void:
	add_to_group("arrow")
	_build()

func launch(from: Vector3, direction: Vector3, dmg: int, by: Node) -> void:
	global_position = from
	velocity = direction.normalized() * SPEED
	damage = dmg
	shooter = by
	_face_travel()

func _build() -> void:
	var shaft_mat := StandardMaterial3D.new()
	shaft_mat.albedo_color = Color(0.52, 0.38, 0.24)
	shaft_mat.roughness = 0.9
	var head_mat := StandardMaterial3D.new()
	head_mat.albedo_color = Color(0.62, 0.64, 0.67)
	head_mat.metallic = 0.6
	head_mat.roughness = 0.35
	var fletch_mat := StandardMaterial3D.new()
	fletch_mat.albedo_color = Color(0.84, 0.82, 0.78)
	fletch_mat.roughness = 0.95
	fletch_mat.cull_mode = BaseMaterial3D.CULL_DISABLED

	var box := BoxMesh.new()
	box.size = Vector3.ONE

	# Built along -Z so the whole node can simply be pointed down its velocity.
	var shaft := MeshInstance3D.new()
	shaft.mesh = box
	shaft.material_override = shaft_mat
	shaft.scale = Vector3(0.016, 0.016, 0.62)
	add_child(shaft)

	var head := MeshInstance3D.new()
	head.mesh = box
	head.material_override = head_mat
	head.position = Vector3(0, 0, -0.34)
	head.scale = Vector3(0.03, 0.03, 0.09)
	head.rotation_degrees = Vector3(0, 0, 45)
	add_child(head)

	for i in 3:
		var fletch := MeshInstance3D.new()
		fletch.mesh = box
		fletch.material_override = fletch_mat
		fletch.position = Vector3(0, 0, 0.26)
		fletch.scale = Vector3(0.006, 0.05, 0.11)
		fletch.rotation_degrees = Vector3(0, 0, 120.0 * float(i))
		add_child(fletch)

func _face_travel() -> void:
	if velocity.length_squared() < 0.001:
		return
	# look_at points the node's -Z at the target, which is how it was built.
	look_at(global_position + velocity, Vector3.UP)

func _physics_process(delta: float) -> void:
	age += delta
	if age > LIFETIME:
		queue_free()
		return
	if stuck:
		return

	velocity.y -= GRAVITY * delta
	var step: Vector3 = velocity * delta
	var from: Vector3 = global_position
	var to: Vector3 = from + step

	var space := get_world_3d().direct_space_state
	var query := PhysicsRayQueryParameters3D.create(from, to)
	query.collide_with_areas = true
	query.collide_with_bodies = true
	if shooter != null and shooter is CollisionObject3D:
		query.exclude = [(shooter as CollisionObject3D).get_rid()]
	var hit: Dictionary = space.intersect_ray(query)

	if hit.is_empty():
		global_position = to
		_face_travel()
		return

	var collider: Object = hit.get("collider")
	var point: Vector3 = hit.get("position", to)

	# Pickups and other trigger volumes are not things you can shoot; step over
	# them and keep flying rather than burying the arrow in an apple.
	if collider is Area3D and not collider.has_method("hit"):
		global_position = to
		_face_travel()
		return

	if collider != null and collider.has_method("hit"):
		collider.call("hit", damage)
		Effects.spawn_blood(point, -velocity.normalized())
		queue_free()
		return

	# A tree, a wall or the ground: stick in it.
	hit_was_ground = float(hit.get("normal", Vector3.UP).y) > 0.7
	_embed(point)

# What the arrow struck, for the thump it makes. Whatever it hit is already
# gone from the query by this point, so it is decided from the surface angle:
# anything close to level under the arrow is ground, anything else is timber.
func _impact_sound() -> String:
	return "arrow_hit_ground" if hit_was_ground else "arrow_hit_wood"


func _embed(point: Vector3) -> void:
	stuck = true
	global_position = point - velocity.normalized() * EMBED
	velocity = Vector3.ZERO
	Sound.play_3d(_impact_sound(), global_position, -6.0)
	# Left lying a while so a missed shot is visible, then cleaned up.
	var tween: Tween = create_tween()
	tween.tween_interval(12.0)
	tween.tween_property(self, "scale", Vector3(0.01, 0.01, 0.01), 0.5)
	tween.tween_callback(queue_free)

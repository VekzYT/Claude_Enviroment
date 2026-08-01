extends StaticBody3D

@export var respawn_time := 1.4

@onready var collision: CollisionShape3D = $CollisionShape3D

func hit(_damage: int = 1) -> void:
	if not visible:
		return
	visible = false
	collision.disabled = true
	GameState.add_point()
	get_tree().create_timer(respawn_time).timeout.connect(respawn)

func respawn() -> void:
	visible = true
	collision.disabled = false

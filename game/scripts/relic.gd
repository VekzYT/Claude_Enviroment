extends Area3D

var collected := false
var base_y := 0.0

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	base_y = position.y

func _process(delta: float) -> void:
	rotate_y(delta * 1.2)
	position.y = base_y + sin(Time.get_ticks_msec() / 500.0) * 0.15

func _on_body_entered(body: Node3D) -> void:
	if collected:
		return
	if body.is_in_group("player"):
		collected = true
		GameState.collect_relic()
		Sound.play_ui("weapon_switch", -4.0)
		queue_free()

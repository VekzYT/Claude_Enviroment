extends Node3D

# Drives the day/night cycle: the sun's arc, its colour and strength, the sky,
# the ambient fill and the fog, plus the day counter everything else counts
# against. One node owns all of it so dawn, the sky and the fog can never
# disagree about what time it is.
#
# time_of_day runs 0..1 with 0 at midnight, so 0.25 is sunrise, 0.5 noon and
# 0.75 sunset.

const DAY_LENGTH := 480.0
const SUNRISE := 0.24
const SUNSET := 0.79

# There is one directional light, and it does double duty: the sun while it is
# up, and a cold moon on the opposite side of the sky once it has set. Without
# the moon, night is an unplayable black screen.
const MOON_COLOUR := Color(0.52, 0.63, 0.92)
const MOON_ENERGY := 0.22

# Keyframes for the sun's own light, sampled by time of day and blended.
const SUN_KEYS := [
	{"t": 0.00, "colour": Color(0.16, 0.20, 0.34), "energy": 0.05},
	{"t": 0.22, "colour": Color(0.30, 0.28, 0.36), "energy": 0.10},
	{"t": 0.28, "colour": Color(0.95, 0.56, 0.32), "energy": 0.52},
	{"t": 0.38, "colour": Color(0.94, 0.86, 0.74), "energy": 0.78},
	{"t": 0.50, "colour": Color(0.86, 0.88, 0.90), "energy": 0.92},
	{"t": 0.66, "colour": Color(0.94, 0.85, 0.70), "energy": 0.78},
	{"t": 0.76, "colour": Color(0.96, 0.48, 0.24), "energy": 0.50},
	{"t": 0.83, "colour": Color(0.32, 0.28, 0.38), "energy": 0.10},
	{"t": 1.00, "colour": Color(0.16, 0.20, 0.34), "energy": 0.05},
]

const SKY_TOP := [
	{"t": 0.00, "colour": Color(0.042, 0.055, 0.100)},
	{"t": 0.26, "colour": Color(0.16, 0.17, 0.26)},
	{"t": 0.36, "colour": Color(0.22, 0.28, 0.40)},
	{"t": 0.50, "colour": Color(0.25, 0.34, 0.48)},
	{"t": 0.68, "colour": Color(0.24, 0.26, 0.38)},
	{"t": 0.80, "colour": Color(0.14, 0.12, 0.20)},
	{"t": 1.00, "colour": Color(0.042, 0.055, 0.100)},
]

const SKY_HORIZON := [
	{"t": 0.00, "colour": Color(0.085, 0.105, 0.155)},
	{"t": 0.24, "colour": Color(0.36, 0.26, 0.26)},
	{"t": 0.30, "colour": Color(0.78, 0.52, 0.34)},
	{"t": 0.45, "colour": Color(0.60, 0.62, 0.62)},
	{"t": 0.62, "colour": Color(0.62, 0.60, 0.56)},
	{"t": 0.76, "colour": Color(0.82, 0.44, 0.24)},
	{"t": 0.86, "colour": Color(0.14, 0.13, 0.18)},
	{"t": 1.00, "colour": Color(0.085, 0.105, 0.155)},
]

@export var sun_path: NodePath
@export var fill_path: NodePath
@export var environment_path: NodePath
@export var lantern_paths: Array[NodePath] = []
@export var paused_at_start := false

var sun: DirectionalLight3D = null
var fill: DirectionalLight3D = null
var world_environment: WorldEnvironment = null
var sky_material: ProceduralSkyMaterial = null
var lanterns: Array[Light3D] = []
var lantern_energies: Array[float] = []

var elapsed := 0.0
var announced_horde := false
var warned_day := 0

func _ready() -> void:
	sun = get_node_or_null(sun_path) as DirectionalLight3D
	fill = get_node_or_null(fill_path) as DirectionalLight3D
	world_environment = get_node_or_null(environment_path) as WorldEnvironment
	if world_environment != null and world_environment.environment != null:
		# Duplicate so edits at runtime do not write back into the .tscn's
		# shared resource and leave the project dirty after a play session.
		world_environment.environment = world_environment.environment.duplicate(true)
		var sky: Sky = world_environment.environment.sky
		if sky != null:
			sky.sky_material = sky.sky_material.duplicate(true)
			sky_material = sky.sky_material as ProceduralSkyMaterial
	for path in lantern_paths:
		var light := get_node_or_null(path) as Light3D
		if light != null:
			lanterns.append(light)
			lantern_energies.append(light.light_energy)

	elapsed = GameState.time_of_day * DAY_LENGTH
	_apply(GameState.time_of_day)

func _process(delta: float) -> void:
	if paused_at_start:
		return
	elapsed += delta
	if elapsed >= DAY_LENGTH:
		elapsed -= DAY_LENGTH
		GameState.set_day(GameState.day + 1)
		_announce_day()
	var t: float = elapsed / DAY_LENGTH
	GameState.set_time_of_day(t)
	_apply(t)

func _announce_day() -> void:
	var left: int = GameState.days_until_horde()
	if left <= 0:
		if not announced_horde:
			announced_horde = true
			GameState.announce("Day %d. They are here." % GameState.day)
		else:
			GameState.announce("Day %d." % GameState.day)
	elif left <= 3:
		GameState.announce("Day %d. %d days until they come." % [GameState.day, left])
	else:
		GameState.announce("Day %d." % GameState.day)
	Sound.play_ui("day_change", -7.0)

# Samples a keyframe list by time of day, wrapping at midnight.
func _sample(keys: Array, t: float) -> Dictionary:
	for i in range(keys.size() - 1):
		var a: Dictionary = keys[i]
		var b: Dictionary = keys[i + 1]
		if t >= float(a["t"]) and t <= float(b["t"]):
			var span: float = maxf(float(b["t"]) - float(a["t"]), 0.0001)
			var k: float = (t - float(a["t"])) / span
			var out := {"blend": k, "a": a, "b": b}
			return out
	return {"blend": 0.0, "a": keys[keys.size() - 1], "b": keys[keys.size() - 1]}

func _sample_colour(keys: Array, t: float) -> Color:
	var hit: Dictionary = _sample(keys, t)
	return Color(hit["a"]["colour"]).lerp(Color(hit["b"]["colour"]), float(hit["blend"]))

func _sample_energy(keys: Array, t: float) -> float:
	var hit: Dictionary = _sample(keys, t)
	return lerpf(float(hit["a"]["energy"]), float(hit["b"]["energy"]), float(hit["blend"]))

# 1 in full daylight, 0 in full night, with soft edges over dawn and dusk.
func daylight(t: float) -> float:
	if t <= SUNRISE - 0.06 or t >= SUNSET + 0.06:
		return 0.0
	if t < SUNRISE + 0.06:
		return smoothstep(SUNRISE - 0.06, SUNRISE + 0.06, t)
	if t > SUNSET - 0.06:
		return 1.0 - smoothstep(SUNSET - 0.06, SUNSET + 0.06, t)
	return 1.0

func _apply(t: float) -> void:
	var light: float = daylight(t)

	if sun != null:
		# One continuous orbit: altitude peaks at noon and troughs at midnight,
		# and the azimuth walks the full circle.
		var altitude: float = sin((t - 0.25) * TAU) * 62.0
		var azimuth: float = fposmod(t * 360.0 - 90.0, 360.0)
		if altitude > 1.0:
			sun.rotation_degrees = Vector3(-altitude, azimuth, 0.0)
			sun.light_color = _sample_colour(SUN_KEYS, t)
			sun.light_energy = _sample_energy(SUN_KEYS, t)
		else:
			# Below the horizon: put the moon up on the opposite side instead,
			# lower in the sky and much dimmer, but enough to walk by.
			sun.rotation_degrees = Vector3(-maxf(-altitude * 0.7, 14.0), fposmod(azimuth + 180.0, 360.0), 0.0)
			sun.light_color = MOON_COLOUR
			sun.light_energy = lerpf(MOON_ENERGY, _sample_energy(SUN_KEYS, t), clampf(light * 4.0, 0.0, 1.0))
		sun.shadow_enabled = true

	if fill != null:
		# The fill turns cold and blue after dark so night is navigable but
		# clearly night, and never fully off or the forest becomes a black wall.
		fill.light_color = Color(0.30, 0.40, 0.62).lerp(Color(0.52, 0.58, 0.64), light)
		fill.light_energy = lerpf(0.42, 0.32, light)

	if world_environment != null and world_environment.environment != null:
		var env: Environment = world_environment.environment
		env.ambient_light_energy = lerpf(0.62, 1.05, light)
		env.fog_light_color = Color(0.16, 0.20, 0.30).lerp(Color(0.60, 0.63, 0.62), light)
		env.fog_light_energy = lerpf(0.50, 0.80, light)
		# Night mist thickens, which also hides how far the shadows do not reach.
		env.fog_density = lerpf(0.0090, 0.0058, light)
		env.volumetric_fog_albedo = Color(0.28, 0.33, 0.42).lerp(Color(0.60, 0.63, 0.60), light)

	if sky_material != null:
		sky_material.sky_top_color = _sample_colour(SKY_TOP, t)
		sky_material.sky_horizon_color = _sample_colour(SKY_HORIZON, t)
		sky_material.ground_horizon_color = _sample_colour(SKY_HORIZON, t).darkened(0.35)
		sky_material.ground_bottom_color = Color(0.05, 0.055, 0.05).lerp(Color(0.26, 0.27, 0.25), light)

	# Lamps come up as the light goes, which is most of what sells dusk.
	var lamp: float = 1.0 - light
	for i in lanterns.size():
		lanterns[i].light_energy = lantern_energies[i] * lerpf(0.25, 1.35, lamp)

# "Dawn", "Morning", ... for the HUD chip.
func phase_name(t: float) -> String:
	if t < 0.22:
		return "Night"
	if t < 0.32:
		return "Dawn"
	if t < 0.46:
		return "Morning"
	if t < 0.56:
		return "Midday"
	if t < 0.70:
		return "Afternoon"
	if t < 0.82:
		return "Dusk"
	return "Night"

class_name DayNight
extends Node3D
## Drives the sun, the moon, the sky colours and the ambient light.
##
## time_of_day runs 0 -> 1 across one full cycle: 0.0 midnight, 0.25 sunrise,
## 0.5 noon, 0.75 sunset.

signal day_started(day_number: int)

## Seconds of real time for one in-game day.
@export var day_length := 900.0
@export var paused := false

var time_of_day := 0.30

@onready var sun: DirectionalLight3D = $Sun
@onready var moon: DirectionalLight3D = $Moon
@onready var world_environment: WorldEnvironment = $WorldEnvironment

var _sky: ProceduralSkyMaterial
var _env: Environment

const NIGHT_TOP := Color(0.016, 0.024, 0.070)
const NIGHT_HORIZON := Color(0.045, 0.055, 0.115)
const DAWN_TOP := Color(0.180, 0.230, 0.480)
const DAWN_HORIZON := Color(0.760, 0.420, 0.280)
const DAY_TOP := Color(0.250, 0.470, 0.850)
const DAY_HORIZON := Color(0.620, 0.760, 0.930)

const SUN_COLOR_DAY := Color(1.0, 0.97, 0.90)
const SUN_COLOR_LOW := Color(1.0, 0.68, 0.42)


func _ready() -> void:
	add_to_group("day_night")
	_build_environment()
	_apply(0.0)


## The sky and environment are made in code so the scene file stays trivial and
## there is no resource to wire up by hand.
func _build_environment() -> void:
	_sky = ProceduralSkyMaterial.new()
	_sky.sky_top_color = DAY_TOP
	_sky.sky_horizon_color = DAY_HORIZON
	_sky.sky_curve = 0.15
	_sky.ground_bottom_color = DAY_HORIZON.darkened(0.7)
	_sky.ground_horizon_color = DAY_HORIZON.darkened(0.45)
	_sky.sun_angle_max = 6.0
	_sky.sun_curve = 0.12

	var sky := Sky.new()
	sky.sky_material = _sky
	sky.radiance_size = Sky.RADIANCE_SIZE_128

	_env = Environment.new()
	_env.background_mode = Environment.BG_SKY
	_env.sky = sky
	_env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	_env.ambient_light_color = Color(0.55, 0.62, 0.80)
	_env.ambient_light_energy = 0.45
	_env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	_env.tonemap_white = 1.2
	_env.ssao_enabled = false
	_env.glow_enabled = false
	world_environment.environment = _env


func _process(delta: float) -> void:
	if not paused and day_length > 0.0:
		var before := time_of_day
		time_of_day = fmod(time_of_day + delta / day_length, 1.0)
		if time_of_day < before:
			SaveManager.day_count += 1
			day_started.emit(SaveManager.day_count)
	_apply(delta)


func set_time(value: float) -> void:
	time_of_day = fposmod(value, 1.0)
	_apply(0.0)


## 0 at the horizon, 1 straight overhead, negative when the sun is down.
func sun_altitude() -> float:
	return sin((time_of_day - 0.25) * TAU)


func is_night() -> bool:
	return sun_altitude() < -0.08


func clock_string() -> String:
	var minutes := int(round(time_of_day * 1440.0)) % 1440
	return "%02d:%02d" % [minutes / 60, minutes % 60]


func _apply(_delta: float) -> void:
	var angle := (time_of_day - 0.25) * TAU
	sun.rotation = Vector3(-angle, deg_to_rad(-38.0), 0.0)
	moon.rotation = Vector3(-angle + PI, deg_to_rad(-38.0), 0.0)

	var alt := sun_altitude()
	# A smooth band rather than a hard cut, so dawn and dusk actually linger
	# instead of the light snapping off the moment the sun crosses the horizon.
	var day_amount := smoothstep(-0.26, 0.16, alt)
	# How much of a sunrise/sunset tint to mix in.
	var dusk_amount := clampf(1.0 - absf(alt) * 4.0, 0.0, 1.0)

	sun.light_energy = clampf(alt * 1.7, 0.0, 0.95)
	sun.visible = alt > -0.03
	sun.light_color = SUN_COLOR_LOW.lerp(SUN_COLOR_DAY, clampf(alt * 3.0, 0.0, 1.0))
	sun.shadow_enabled = sun.light_energy > 0.05

	moon.light_energy = clampf(-alt * 0.30, 0.0, 0.22)
	moon.visible = alt < 0.05
	moon.shadow_enabled = false

	var top := NIGHT_TOP.lerp(DAY_TOP, day_amount).lerp(DAWN_TOP, dusk_amount * 0.75)
	var horizon := NIGHT_HORIZON.lerp(DAY_HORIZON, day_amount).lerp(DAWN_HORIZON, dusk_amount * 0.85)

	if _sky != null:
		_sky.sky_top_color = top
		_sky.sky_horizon_color = horizon
		_sky.ground_bottom_color = horizon.darkened(0.7)
		_sky.ground_horizon_color = horizon.darkened(0.45)
		_sky.sun_angle_max = 6.0
		_sky.sun_curve = 0.12

	if _env != null:
		_env.ambient_light_energy = lerpf(0.11, 0.38, day_amount)
		_env.ambient_light_color = horizon.lerp(Color(0.55, 0.62, 0.80), 0.35)
		_env.fog_light_color = horizon
		_env.fog_light_energy = lerpf(0.25, 1.0, day_amount)


## Sets fog so the far edge of the loaded world fades out instead of popping.
func configure_fog(render_distance_chunks: int) -> void:
	if _env == null:
		return
	var far := float(render_distance_chunks) * 16.0
	_env.fog_enabled = true
	_env.fog_mode = Environment.FOG_MODE_DEPTH
	_env.fog_depth_begin = maxf(32.0, far * 0.55)
	_env.fog_depth_end = maxf(64.0, far * 0.98)
	_env.fog_density = 1.0

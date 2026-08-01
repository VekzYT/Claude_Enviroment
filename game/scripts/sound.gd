extends Node

const SAMPLE_RATE := 22050

var streams: Dictionary = {}
var music_player: AudioStreamPlayer

func _ready() -> void:
	_build_sounds()
	music_player = AudioStreamPlayer.new()
	music_player.stream = streams["music"]
	music_player.volume_db = -9.0
	add_child(music_player)
	music_player.play()

func play_3d(sound_name: String, position: Vector3, volume_db: float = 0.0, pitch_variance: float = 0.06) -> void:
	if not streams.has(sound_name):
		return
	var player := AudioStreamPlayer3D.new()
	player.stream = streams[sound_name]
	player.volume_db = volume_db
	player.pitch_scale = 1.0 + randf_range(-pitch_variance, pitch_variance)
	player.max_distance = 45.0
	player.unit_size = 6.0
	get_tree().current_scene.add_child(player)
	player.global_position = position
	player.play()
	player.finished.connect(player.queue_free)

func play_ui(sound_name: String, volume_db: float = 0.0) -> void:
	if not streams.has(sound_name):
		return
	var player := AudioStreamPlayer.new()
	player.stream = streams[sound_name]
	player.volume_db = volume_db
	add_child(player)
	player.play()
	player.finished.connect(player.queue_free)

func _make_stream(samples: PackedFloat32Array) -> AudioStreamWAV:
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = SAMPLE_RATE
	stream.stereo = false
	var data := PackedByteArray()
	data.resize(samples.size() * 2)
	for i in samples.size():
		var v: float = clamp(samples[i], -1.0, 1.0)
		data.encode_s16(i * 2, int(v * 32000.0))
	stream.data = data
	return stream

func _noise_burst(duration: float, decay: float, tone_freq: float, tone_amount: float) -> PackedFloat32Array:
	var n: int = int(SAMPLE_RATE * duration)
	var samples := PackedFloat32Array()
	samples.resize(n)
	for i in n:
		var t: float = float(i) / SAMPLE_RATE
		var envelope: float = exp(-t * decay)
		var noise: float = randf_range(-1.0, 1.0)
		var tone: float = sin(t * TAU * tone_freq)
		samples[i] = lerp(noise, tone, tone_amount) * envelope
	return samples

func _smoothed_noise_burst(duration: float, decay: float, smooth_passes: int) -> PackedFloat32Array:
	var n: int = int(SAMPLE_RATE * duration)
	var samples := PackedFloat32Array()
	samples.resize(n)
	for i in n:
		samples[i] = randf_range(-1.0, 1.0)
	for _pass_index in smooth_passes:
		var smoothed := PackedFloat32Array()
		smoothed.resize(n)
		for i in n:
			var prev: float = samples[i - 1] if i > 0 else samples[i]
			var next: float = samples[i + 1] if i < n - 1 else samples[i]
			smoothed[i] = (prev + samples[i] + next) / 3.0
		samples = smoothed
	for i in n:
		var t: float = float(i) / SAMPLE_RATE
		samples[i] *= exp(-t * decay)
	return samples

func _tone_sweep(duration: float, freq_start: float, freq_end: float, decay: float) -> PackedFloat32Array:
	var n: int = int(SAMPLE_RATE * duration)
	var samples := PackedFloat32Array()
	samples.resize(n)
	var phase: float = 0.0
	for i in n:
		var t: float = float(i) / SAMPLE_RATE
		var progress: float = t / duration
		var freq: float = lerp(freq_start, freq_end, progress)
		phase += TAU * freq / SAMPLE_RATE
		var envelope: float = exp(-t * decay)
		samples[i] = sin(phase) * envelope
	return samples

func _build_music_loop() -> PackedFloat32Array:
	var duration := 8.0
	var n: int = int(SAMPLE_RATE * duration)
	var samples := PackedFloat32Array()
	samples.resize(n)
	var freqs: Array = [55.0, 82.5, 110.0]
	for i in n:
		var t: float = float(i) / SAMPLE_RATE
		var value: float = 0.0
		for f in freqs:
			var freq: float = f
			value += sin(t * TAU * freq)
		value /= freqs.size()
		var lfo: float = 0.65 + 0.35 * sin(t * TAU / duration)
		samples[i] = value * lfo * 0.5
	return samples

func _build_sounds() -> void:
	streams["handgun_shot"] = _make_stream(_noise_burst(0.14, 28.0, 100.0, 0.35))
	streams["sniper_shot"] = _make_stream(_noise_burst(0.32, 12.0, 55.0, 0.4))
	streams["bot_shot"] = _make_stream(_noise_burst(0.13, 30.0, 130.0, 0.3))
	streams["knife_swing"] = _make_stream(_smoothed_noise_burst(0.22, 9.0, 3))
	streams["knife_hit"] = _make_stream(_noise_burst(0.09, 40.0, 70.0, 0.5))
	streams["reload_click"] = _make_stream(_noise_burst(0.035, 60.0, 900.0, 0.2))
	streams["bolt_cycle"] = _make_stream(_noise_burst(0.05, 45.0, 500.0, 0.25))
	streams["footstep"] = _make_stream(_noise_burst(0.07, 35.0, 90.0, 0.6))
	streams["jump"] = _make_stream(_noise_burst(0.1, 22.0, 150.0, 0.4))
	streams["land"] = _make_stream(_noise_burst(0.12, 20.0, 80.0, 0.55))
	streams["bot_alert"] = _make_stream(_tone_sweep(0.22, 400.0, 900.0, 5.0))
	streams["bot_death"] = _make_stream(_tone_sweep(0.5, 500.0, 80.0, 4.0))
	streams["player_hurt"] = _make_stream(_noise_burst(0.18, 14.0, 120.0, 0.45))
	streams["weapon_switch"] = _make_stream(_noise_burst(0.06, 50.0, 300.0, 0.3))
	streams["ui_toggle"] = _make_stream(_tone_sweep(0.08, 600.0, 900.0, 20.0))
	streams["target_hit"] = _make_stream(_tone_sweep(0.15, 800.0, 1200.0, 15.0))

	var music_samples: PackedFloat32Array = _build_music_loop()
	var music_stream: AudioStreamWAV = _make_stream(music_samples)
	music_stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	music_stream.loop_begin = 0
	music_stream.loop_end = music_samples.size()
	streams["music"] = music_stream

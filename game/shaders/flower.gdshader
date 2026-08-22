shader_type spatial;
render_mode cull_disabled, diffuse_burley, specular_schlick_ggx;

// One mesh, many flowers. Everything below the petal line renders as green
// stem; everything above takes the per-instance colour the MultiMesh supplies,
// so a single batch produces white, yellow, pink and violet blooms.

uniform vec4 stem_color : source_color = vec4(0.13, 0.22, 0.10, 1.0);
uniform vec4 bloom_tint : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform float total_height : hint_range(0.05, 2.0) = 0.30;
uniform float bloom_start : hint_range(0.0, 1.0) = 0.62;
uniform float wind_strength : hint_range(0.0, 1.0) = 0.10;
uniform float wind_speed : hint_range(0.0, 5.0) = 1.8;
uniform float wind_frequency : hint_range(0.0, 2.0) = 0.30;
uniform float roughness_value : hint_range(0.0, 1.0) = 0.9;

varying float h_frac;

void vertex() {
	vec3 wp = (MODEL_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
	h_frac = clamp(VERTEX.y / total_height, 0.0, 1.0);
	float influence = h_frac * h_frac;

	float phase = wp.x * wind_frequency + wp.z * wind_frequency * 0.7;
	float gust = sin(TIME * wind_speed * 0.3 + phase * 0.4) * 0.5 + 0.5;
	float sway = sin(TIME * wind_speed + phase) * wind_strength;
	sway += sin(TIME * wind_speed * 1.8 + phase * 1.4) * wind_strength * 0.4;
	sway *= 1.0 + gust * 0.6;

	VERTEX.x += sway * influence;
	VERTEX.z += sway * 0.5 * influence;
}

void fragment() {
	float petal = step(bloom_start, h_frac);
	ALBEDO = mix(stem_color.rgb, COLOR.rgb * bloom_tint.rgb, petal);
	ROUGHNESS = roughness_value;
	METALLIC = 0.0;
}

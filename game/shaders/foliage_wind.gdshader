shader_type spatial;
render_mode cull_disabled, diffuse_burley, specular_schlick_ggx;

// Wind-swayed foliage. Works for both plain MeshInstance3D and MultiMesh
// (per-instance tint arrives through COLOR when the MultiMesh uses colors).

uniform vec4 base_color : source_color = vec4(0.13, 0.22, 0.12, 1.0);
uniform vec4 tip_color : source_color = vec4(0.20, 0.30, 0.15, 1.0);
uniform float pivot_height : hint_range(0.05, 8.0) = 1.0;
uniform float roughness_value : hint_range(0.0, 1.0) = 0.92;
uniform float wind_strength : hint_range(0.0, 2.0) = 0.14;
uniform float wind_speed : hint_range(0.0, 5.0) = 1.1;
uniform float wind_frequency : hint_range(0.0, 2.0) = 0.22;
uniform float gust_strength : hint_range(0.0, 2.0) = 0.5;

varying float height_fade;

void vertex() {
	vec3 world_pos = (MODEL_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

	// Sway grows toward the top of the mesh so the base stays anchored.
	float influence = clamp(VERTEX.y / pivot_height, 0.0, 1.0);
	influence *= influence;
	height_fade = influence;

	float phase = world_pos.x * wind_frequency + world_pos.z * wind_frequency * 0.73;
	float gust = sin(TIME * wind_speed * 0.23 + phase * 0.35) * 0.5 + 0.5;
	float sway = sin(TIME * wind_speed + phase) * wind_strength;
	sway += sin(TIME * wind_speed * 1.9 + phase * 1.4) * wind_strength * 0.35;
	sway *= 1.0 + gust * gust_strength;

	VERTEX.x += sway * influence;
	VERTEX.z += sway * 0.55 * influence;
}

void fragment() {
	vec3 tint = mix(base_color.rgb, tip_color.rgb, height_fade);
	ALBEDO = tint * COLOR.rgb;
	ROUGHNESS = roughness_value;
	METALLIC = 0.0;
}

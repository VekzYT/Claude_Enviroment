shader_type spatial;
render_mode cull_disabled, diffuse_burley, specular_schlick_ggx;

// Per-blade wind for the MultiMesh undergrowth. Each blade's phase comes from
// its own world position, so gusts roll across the forest floor instead of
// every blade moving in lockstep.

uniform vec4 root_color : source_color = vec4(0.11, 0.16, 0.09, 1.0);
uniform vec4 tip_color : source_color = vec4(0.26, 0.34, 0.15, 1.0);
uniform float blade_height : hint_range(0.05, 3.0) = 0.34;
uniform float wind_strength : hint_range(0.0, 1.0) = 0.14;
uniform float wind_speed : hint_range(0.0, 5.0) = 1.7;
uniform float wind_frequency : hint_range(0.0, 2.0) = 0.32;
uniform float gust_strength : hint_range(0.0, 2.0) = 0.7;
uniform float roughness_value : hint_range(0.0, 1.0) = 0.95;

varying float blade_fade;

void vertex() {
	vec3 world_pos = (MODEL_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

	float influence = clamp(VERTEX.y / blade_height, 0.0, 1.0);
	influence *= influence;
	blade_fade = clamp(VERTEX.y / blade_height, 0.0, 1.0);

	float phase = world_pos.x * wind_frequency + world_pos.z * wind_frequency * 0.7;
	float gust = sin(TIME * wind_speed * 0.27 + phase * 0.3) * 0.5 + 0.5;
	float sway = sin(TIME * wind_speed + phase) * wind_strength;
	sway += sin(TIME * wind_speed * 1.7 + phase * 1.3) * wind_strength * 0.4;
	sway *= 1.0 + gust * gust_strength;

	VERTEX.x += sway * influence;
	VERTEX.z += sway * 0.5 * influence;
}

void fragment() {
	ALBEDO = mix(root_color.rgb, tip_color.rgb, blade_fade) * COLOR.rgb;
	ROUGHNESS = roughness_value;
	METALLIC = 0.0;
}

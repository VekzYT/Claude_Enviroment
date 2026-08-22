shader_type spatial;
render_mode cull_disabled, diffuse_burley, specular_schlick_ggx;

uniform vec4 base_color : source_color = vec4(0.24, 0.42, 0.16, 1.0);
uniform float blade_height : hint_range(0.1, 2.0) = 0.32;
uniform float wind_strength : hint_range(0.0, 1.0) = 0.12;
uniform float wind_speed : hint_range(0.0, 5.0) = 1.6;
uniform float wind_frequency : hint_range(0.0, 2.0) = 0.35;
uniform float roughness_value : hint_range(0.0, 1.0) = 0.9;

void vertex() {
	vec3 world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float sway_influence = clamp(VERTEX.y / blade_height, 0.0, 1.0);
	sway_influence *= sway_influence;
	float phase = world_pos.x * wind_frequency + world_pos.z * wind_frequency * 0.7;
	float sway = sin(TIME * wind_speed + phase) * wind_strength;
	float sway2 = sin(TIME * wind_speed * 1.7 + phase * 1.3) * wind_strength * 0.4;
	VERTEX.x += (sway + sway2) * sway_influence;
	VERTEX.z += sway * 0.5 * sway_influence;
}

void fragment() {
	ALBEDO = base_color.rgb * COLOR.rgb;
	ROUGHNESS = roughness_value;
	METALLIC = 0.0;
}

shader_type spatial;

uniform vec4 base_color : source_color = vec4(0.14, 0.32, 0.14, 1.0);
uniform sampler2D roughness_tex : hint_default_white;
uniform float roughness_value : hint_range(0.0, 1.0) = 0.9;
uniform float wind_strength : hint_range(0.0, 1.0) = 0.06;
uniform float wind_speed : hint_range(0.0, 5.0) = 1.2;
uniform float wind_frequency : hint_range(0.0, 2.0) = 0.4;

void vertex() {
	vec3 world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float phase = world_pos.x * wind_frequency + world_pos.z * wind_frequency * 0.6;
	float height_influence = clamp(VERTEX.y + 0.5, 0.0, 1.0);
	float sway = sin(TIME * wind_speed + phase) * wind_strength * height_influence;
	VERTEX.x += sway;
	VERTEX.z += sway * 0.6;
}

void fragment() {
	ALBEDO = base_color.rgb;
	ROUGHNESS = roughness_value * texture(roughness_tex, UV).r;
	METALLIC = 0.0;
}

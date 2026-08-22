shader_type spatial;
render_mode blend_mix, cull_back, diffuse_burley, specular_schlick_ggx, world_vertex_coords;

uniform vec4 shallow_color : source_color = vec4(0.15, 0.55, 0.65, 0.75);
uniform vec4 deep_color : source_color = vec4(0.03, 0.18, 0.35, 0.92);
uniform float wave_height : hint_range(0.0, 2.0) = 0.35;
uniform float wave_speed : hint_range(0.0, 3.0) = 0.6;
uniform float wave_scale : hint_range(0.0, 1.0) = 0.06;
uniform float fresnel_power : hint_range(0.1, 8.0) = 3.0;
uniform float roughness_value : hint_range(0.0, 1.0) = 0.1;
uniform float metallic_value : hint_range(0.0, 1.0) = 0.4;

varying vec2 world_xz;

float wave(vec2 pos, float t) {
	float w = sin(pos.x * wave_scale + t) * cos(pos.y * wave_scale * 1.3 - t * 0.7);
	w += sin(pos.x * wave_scale * 2.3 - t * 1.4) * 0.5;
	w += sin(pos.y * wave_scale * 1.7 + t * 1.1) * 0.5;
	return w;
}

void vertex() {
	float t = TIME * wave_speed;
	world_xz = VERTEX.xz;
	float h = wave(VERTEX.xz, t) * wave_height;
	VERTEX.y += h;

	float eps = 2.0;
	float h_dx = wave(VERTEX.xz + vec2(eps, 0.0), t) * wave_height;
	float h_dz = wave(VERTEX.xz + vec2(0.0, eps), t) * wave_height;
	vec3 tangent_x = normalize(vec3(eps, h_dx - h, 0.0));
	vec3 tangent_z = normalize(vec3(0.0, h_dz - h, eps));
	NORMAL = normalize(cross(tangent_z, tangent_x));
}

void fragment() {
	float t = TIME * wave_speed;
	vec2 uv1 = world_xz * 0.04 + vec2(t * 0.02, t * 0.015);
	vec2 uv2 = world_xz * 0.07 - vec2(t * 0.015, t * 0.025);
	float shimmer = sin((uv1.x + uv1.y) * 20.0) * 0.5 + 0.5;
	shimmer *= sin((uv2.x - uv2.y) * 24.0) * 0.5 + 0.5;

	float depth_mix = clamp(wave(world_xz, t) * 0.5 + 0.5, 0.0, 1.0);
	vec3 base_color = mix(deep_color.rgb, shallow_color.rgb, depth_mix * 0.4 + 0.3);

	float fresnel = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), fresnel_power);

	ALBEDO = base_color + shimmer * 0.05;
	ALPHA = mix(deep_color.a, shallow_color.a, fresnel);
	METALLIC = metallic_value;
	ROUGHNESS = roughness_value * (1.0 - fresnel * 0.5);
	EMISSION = base_color * fresnel * 0.15;
}

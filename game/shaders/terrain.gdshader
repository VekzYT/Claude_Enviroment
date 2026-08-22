shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

// Terrain surfacing: forest floor on gentle ground, rock on anything steep,
// blended by the real surface slope. UVs come from world position rather than
// the mesh, so texels stay square on slopes instead of smearing, and large
// hills need no UV unwrap at all.

uniform sampler2D ground_albedo : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D ground_normal : hint_normal, filter_linear_mipmap, repeat_enable;
uniform sampler2D ground_rough : filter_linear_mipmap, repeat_enable, hint_default_white;
uniform sampler2D cliff_albedo : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D cliff_normal : hint_normal, filter_linear_mipmap, repeat_enable;
uniform sampler2D cliff_rough : filter_linear_mipmap, repeat_enable, hint_default_white;

uniform vec4 ground_tint : source_color = vec4(0.60, 0.60, 0.55, 1.0);
uniform vec4 cliff_tint : source_color = vec4(0.62, 0.62, 0.63, 1.0);
uniform float ground_tile = 11.0;
uniform float cliff_tile = 15.0;
uniform float macro_tile = 160.0;
uniform float slope_start : hint_range(0.0, 1.0) = 0.30;
uniform float slope_end : hint_range(0.0, 1.0) = 0.58;
uniform float normal_strength : hint_range(0.0, 3.0) = 1.1;

varying vec3 w_pos;
varying vec3 w_nrm;

void vertex() {
	w_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	w_nrm = normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz);
}

void fragment() {
	vec2 uv_g = w_pos.xz / ground_tile;
	vec2 uv_c = w_pos.xz / cliff_tile;
	vec2 uv_m = w_pos.xz / macro_tile;

	float slope = 1.0 - clamp(w_nrm.y, 0.0, 1.0);
	float m = smoothstep(slope_start, slope_end, slope);

	vec3 g_col = texture(ground_albedo, uv_g).rgb * ground_tint.rgb;
	vec3 c_col = texture(cliff_albedo, uv_c).rgb * cliff_tint.rgb;

	// A very low-frequency read of the same texture mottles the ground so the
	// tiling pattern stops being obvious across open hillsides.
	float macro = texture(ground_albedo, uv_m).r;
	g_col *= mix(0.82, 1.18, macro);

	ALBEDO = mix(g_col, c_col, m);
	ROUGHNESS = mix(texture(ground_rough, uv_g).r, texture(cliff_rough, uv_c).r, m);
	METALLIC = 0.0;

	// Build the tangent frame in the shader by projecting world +X onto the
	// surface. That keeps normal mapping working without storing tangents on a
	// 14k-vertex mesh, and stays continuous everywhere (terrain normals never
	// point along X, so the projection never degenerates).
	vec3 nm = mix(texture(ground_normal, uv_g).xyz, texture(cliff_normal, uv_c).xyz, m) * 2.0 - 1.0;
	vec3 T = normalize(vec3(1.0, 0.0, 0.0) - w_nrm * w_nrm.x);
	vec3 B = normalize(cross(T, w_nrm));
	vec3 pn = normalize(w_nrm + (T * nm.x + B * nm.y) * normal_strength);
	NORMAL = normalize((VIEW_MATRIX * vec4(pn, 0.0)).xyz);
}

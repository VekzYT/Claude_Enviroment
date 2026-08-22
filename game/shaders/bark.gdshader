shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

// Textured bark for the batched trunk MultiMeshes. COLOR carries a per-tree
// tint so a thousand instances of the same trunk mesh don't read as clones.

uniform sampler2D albedo_tex : source_color, filter_linear_mipmap, hint_default_white;
uniform sampler2D normal_tex : hint_normal, filter_linear_mipmap;
uniform sampler2D roughness_tex : filter_linear_mipmap, hint_default_white;
uniform vec4 base_tint : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform vec2 uv_scale = vec2(1.0, 3.0);
uniform float normal_strength : hint_range(0.0, 4.0) = 1.4;
uniform float roughness_value : hint_range(0.0, 1.0) = 0.95;

void fragment() {
	vec2 uv = UV * uv_scale;
	ALBEDO = texture(albedo_tex, uv).rgb * base_tint.rgb * COLOR.rgb;
	NORMAL_MAP = texture(normal_tex, uv).rgb;
	NORMAL_MAP_DEPTH = normal_strength;
	ROUGHNESS = roughness_value * texture(roughness_tex, uv).r;
	METALLIC = 0.0;
}

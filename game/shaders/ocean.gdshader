shader_type spatial;
render_mode blend_mix, cull_back, diffuse_burley, specular_schlick_ggx, world_vertex_coords;

// Water that knows how deep it is. The bed under it is real geometry, so the
// distance from this surface down to whatever the camera can see behind it is
// what drives the colour, the clarity and the foam at the shore. Nothing here
// is a painted-on ring.

uniform vec4 shallow_color : source_color = vec4(0.15, 0.55, 0.65, 0.75);
uniform vec4 deep_color : source_color = vec4(0.03, 0.18, 0.35, 0.92);
uniform vec4 foam_color : source_color = vec4(0.86, 0.91, 0.88, 1.0);

// Metres from trough to crest, summed across every wave layer.
uniform float wave_height : hint_range(0.0, 2.0) = 0.26;
uniform float wave_speed : hint_range(0.0, 3.0) = 0.7;
// Spatial frequency of the longest layer. 0.55 puts its wavelength around
// eleven metres, which is the right size for a pond rather than an ocean.
uniform float wave_scale : hint_range(0.02, 2.0) = 0.55;

uniform float ripple_scale : hint_range(0.02, 4.0) = 0.9;
uniform float ripple_strength : hint_range(0.0, 4.0) = 1.4;

uniform float fresnel_power : hint_range(0.1, 8.0) = 3.5;
uniform float roughness_value : hint_range(0.0, 1.0) = 0.06;
uniform float metallic_value : hint_range(0.0, 1.0) = 0.25;

// How fast the bed disappears as the water deepens, in metres.
uniform float clarity_depth : hint_range(0.1, 20.0) = 1.9;
// Width of the wet band at the shoreline.
uniform float foam_depth : hint_range(0.0, 6.0) = 0.85;
uniform float refraction : hint_range(0.0, 0.2) = 0.035;

uniform sampler2D screen_tex : hint_screen_texture, repeat_disable, filter_linear_mipmap;

// How deep the water is at every point, baked off the terrain by pond.gd.
// Stored 0..1 against max_depth. See that script for why this is not read back
// out of the depth buffer.
uniform sampler2D bed_depth_tex : hint_default_black, repeat_disable, filter_linear;
uniform vec2 pond_center = vec2(0.0, 0.0);
uniform vec2 pond_size = vec2(40.0, 40.0);
uniform float max_depth = 3.0;

varying vec2 world_xz;
varying float crest;
varying float water_depth;

vec2 bed_uv(vec2 xz) {
	return clamp((xz - pond_center) / pond_size + 0.5, vec2(0.0), vec2(1.0));
}

// One travelling wave and its exact slope. Returning the derivative alongside
// the height is the whole point: the old version rebuilt the normal from a
// finite difference two metres wide, which averaged every wave away and shaded
// the surface as a flat plate no matter how much it was actually moving.
vec3 wave_layer(vec2 p, vec2 dir, float freq, float amp, float phase) {
	float x = dot(dir, p) * freq + phase;
	return vec3(sin(x) * amp, dir * (cos(x) * freq * amp));
}

// The slope of one fine directional ripple. Built this way rather than as a
// sin(x)*cos(y) product because that product is separable, and at the tight
// frequencies chop needs it collapses into an axis-aligned grid that reads as
// a net thrown over the pond.
vec2 ripple_wave(vec2 p, vec2 dir, float freq, float phase) {
	return dir * cos(dot(dir, p) * freq + phase);
}

// Four layers crossing at angles, normalised so wave_height is honestly the
// peak displacement in metres and the water can never climb its own bank.
vec3 water_surface(vec2 p, float t) {
	vec3 acc = vec3(0.0);
	acc += wave_layer(p, normalize(vec2( 1.00,  0.35)), wave_scale * 1.0, 1.00, t * 1.00);
	acc += wave_layer(p, normalize(vec2(-0.60,  1.00)), wave_scale * 1.7, 0.55, t * 1.35);
	acc += wave_layer(p, normalize(vec2( 0.40, -0.90)), wave_scale * 2.9, 0.28, t * 1.85);
	acc += wave_layer(p, normalize(vec2(-1.00, -0.25)), wave_scale * 4.6, 0.14, t * 2.40);
	return acc / 1.97;
}

void vertex() {
	world_xz = VERTEX.xz;
	float t = TIME * wave_speed;
	vec3 w = water_surface(VERTEX.xz, t);

	water_depth = textureLod(bed_depth_tex, bed_uv(VERTEX.xz), 0.0).r * max_depth;
	// Waves die out as the bed comes up, which is both what real water does and
	// what stops a crest climbing over the bank and leaving a shard of water
	// sitting out on the grass.
	float shore = clamp(water_depth / 0.7, 0.0, 1.0);
	float amp = wave_height * shore;
	VERTEX.y += w.x * amp;

	vec2 slope = w.yz * amp;
	NORMAL = normalize(vec3(-slope.x, 1.0, -slope.y));
	// A tangent frame the fine ripples can be expressed in.
	TANGENT = normalize(vec3(1.0, slope.x, 0.0));
	BINORMAL = normalize(cross(NORMAL, TANGENT));
	crest = clamp(w.x * 0.5 + 0.5, 0.0, 1.0);
}

void fragment() {
	float t = TIME * wave_speed;

	// Chop finer than the vertex grid can carry, folded in as a normal map so
	// the specular breaks up instead of sliding around in one sheet.
	vec2 ripple = vec2(0.0);
	ripple += ripple_wave(world_xz, vec2( 0.86,  0.51), ripple_scale * 1.0, t * 1.7);
	ripple += ripple_wave(world_xz, vec2(-0.42,  0.91), ripple_scale * 1.6, t * 2.3) * 0.70;
	ripple += ripple_wave(world_xz, vec2( 0.31, -0.95), ripple_scale * 2.4, t * 1.3) * 0.45;
	ripple += ripple_wave(world_xz, vec2(-0.97, -0.24), ripple_scale * 3.5, t * 2.9) * 0.30;
	ripple /= 2.45;
	NORMAL_MAP = vec3(ripple * 0.5 + 0.5, 1.0);
	NORMAL_MAP_DEPTH = ripple_strength;

	// How much water is under this point, straight off the baked bed.
	float thickness = texture(bed_depth_tex, bed_uv(world_xz)).r * max_depth;
	// Past the waterline there is no pond, so there is nothing to draw. This is
	// what gives the shore its shape: the terrain decides where the water ends,
	// not a circle drawn on top of it.
	if (thickness <= 0.02) {
		discard;
	}
	float here_dist = -VERTEX.z;

	// 0 at the shore where you can see every stone, 1 out in the middle.
	float murk = 1.0 - exp(-thickness / clarity_depth);

	// Refraction is scaled down with distance so the far side of the pond does
	// not smear, and clamped near the shore so nothing is dragged in from the
	// bank behind the waterline.
	vec2 offset = ripple * refraction * (1.0 - murk * 0.4) / max(here_dist * 0.25, 1.0);
	offset *= clamp(thickness * 2.0, 0.0, 1.0);
	vec3 under = texture(screen_tex, SCREEN_UV + offset).rgb;

	vec3 body = mix(shallow_color.rgb, deep_color.rgb, murk);
	// Near the shore the bed shows through, tinted by the water above it; out
	// in the middle the body colour has swallowed it entirely. The tint keeps a
	// floor under it so a dark bed does not go completely black.
	vec3 through = under * (body * 1.1 + 0.35);
	vec3 col = mix(through, body, clamp(murk * 1.3, 0.0, 1.0));

	// Sky on the surface at grazing angles.
	float fresnel = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), fresnel_power);

	// Wet band where the water runs out. The break-up has to be fine-grained
	// and weak -- a coarse, strong one turns the whole shallow end of the pond
	// into leopard spots rather than a shoreline.
	float edge = 1.0 - smoothstep(0.0, foam_depth, thickness);
	float lace = sin(world_xz.x * 9.0 + t * 1.6) * cos(world_xz.y * 11.0 - t * 1.1);
	lace += sin(world_xz.x * 17.0 - world_xz.y * 14.0 + t * 2.1) * 0.5;
	float foam = edge * (0.82 + 0.18 * lace) + crest * crest * edge * 0.18;
	foam = smoothstep(0.30, 0.86, clamp(foam, 0.0, 1.0));

	ALBEDO = mix(col, foam_color.rgb, foam);
	ALPHA = 1.0;
	METALLIC = metallic_value * (1.0 - foam);
	ROUGHNESS = mix(roughness_value + fresnel * 0.04, 0.85, foam);
	SPECULAR = mix(0.5, 0.1, foam);
	EMISSION = body * fresnel * 0.12 * (1.0 - foam);
}

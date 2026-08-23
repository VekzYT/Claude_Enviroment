shader_type spatial;
render_mode cull_disabled, diffuse_burley, specular_schlick_ggx;

// Canopies built from leaf cards rather than a solid blob. Each card carries
// its own data in UV/UV2 so the shader can move every spray independently:
//
//   UV.x   how far out in the crown this spray sits (dark inside, bright out)
//   UV.y   0 at the stem, 1 at the tip
//   UV2.x  this spray's own random phase, so no two flutter in step
//   UV2.y  bend weight, 0 at the stem, so a leaf pivots where it is attached
//
// Per-instance tint arrives through COLOR from the MultiMesh.

uniform vec4 base_color : source_color = vec4(0.10, 0.16, 0.08, 1.0);
uniform vec4 tip_color : source_color = vec4(0.22, 0.31, 0.13, 1.0);

// Height of the authored canopy in its own model space, so the sway can be
// anchored at the bottom of the crown whatever size the tree is instanced at.
uniform float crown_height : hint_range(0.1, 8.0) = 1.0;
uniform float roughness_value : hint_range(0.0, 1.0) = 0.92;

uniform float wind_strength : hint_range(0.0, 2.0) = 0.09;
uniform float wind_speed : hint_range(0.0, 5.0) = 1.0;
uniform float wind_frequency : hint_range(0.0, 2.0) = 0.22;
uniform float gust_strength : hint_range(0.0, 2.0) = 0.5;

// Metres the tip of a single spray travels. Small on purpose: leaves shiver,
// they do not swing.
uniform float leaf_flutter : hint_range(0.0, 0.5) = 0.05;
uniform float leaf_speed : hint_range(0.0, 8.0) = 2.6;

varying float shade;
varying float along;

void vertex() {
	vec3 world_pos = (MODEL_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

	// Displacement below is in model space, so without this a canopy instanced
	// six metres wide would sway six times as far as one instanced at one
	// metre. Dividing it out means every tree moves the same distance in the
	// world, which is what the old version got wrong: the big trees whipped
	// while the small ones barely twitched.
	vec3 inv_scale = vec3(
		1.0 / max(length(MODEL_MATRIX[0].xyz), 0.0001),
		1.0 / max(length(MODEL_MATRIX[1].xyz), 0.0001),
		1.0 / max(length(MODEL_MATRIX[2].xyz), 0.0001));

	float phase = world_pos.x * wind_frequency + world_pos.z * wind_frequency * 0.73;
	float gust = sin(TIME * wind_speed * 0.23 + phase * 0.35) * 0.5 + 0.5;

	// The whole crown leaning, anchored low so the trunk end stays put.
	float influence = clamp(VERTEX.y / crown_height + 0.35, 0.0, 1.0);
	influence *= influence;
	float sway = sin(TIME * wind_speed + phase) * wind_strength;
	sway += sin(TIME * wind_speed * 1.9 + phase * 1.4) * wind_strength * 0.35;
	sway *= 1.0 + gust * gust_strength;
	VERTEX.x += sway * influence * inv_scale.x;
	VERTEX.z += sway * 0.55 * influence * inv_scale.z;

	// Individual sprays shivering on top of that.
	float lp = UV2.x * 6.2831853;
	float lt = TIME * leaf_speed;
	float f = leaf_flutter * UV2.y * (0.55 + 0.45 * gust);
	VERTEX.x += sin(lt + lp) * f * inv_scale.x;
	VERTEX.y += sin(lt * 1.37 + lp * 1.7) * f * 0.6 * inv_scale.y;
	VERTEX.z += cos(lt * 0.93 + lp * 0.8) * f * inv_scale.z;

	shade = UV.x;
	along = UV.y;
}

void fragment() {
	vec3 tint = mix(base_color.rgb, tip_color.rgb, shade);
	// Darker down where the spray meets the branch.
	tint *= 0.70 + 0.30 * along;
	ALBEDO = tint * COLOR.rgb;
	ROUGHNESS = roughness_value;
	METALLIC = 0.0;
	SPECULAR = 0.25;
	// Leaves are thin; a little light comes through from behind them.
	BACKLIGHT = vec3(0.16, 0.20, 0.12);
}

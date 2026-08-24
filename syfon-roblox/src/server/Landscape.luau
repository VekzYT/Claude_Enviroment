--!strict
-- Landscape: sculpts each arena out of real Roblox terrain.
--
-- The first pass laid a flat green Part down and called it ground. Roblox has a
-- voxel terrain system with materials, water and smooth normals, and not using
-- it is the difference between a prototype and something that looks like a game.
--
-- The valley is built the way the Godot original described itself: rolling
-- hills, four mountain massifs on the horizon, a forest, a flat clearing for the
-- cabin, and a pond dug into the ground rather than a blue box laid on top.

local Landscape = {}

local terrain = workspace.Terrain

local CELL = 14 -- studs per sculpted column; smaller is smoother and slower
local YIELD_EVERY = 220 -- columns between yields, so the server never times out

export type Shape = {
	radius: number,
	waterLevel: number,
	pondCentre: Vector2,
	pondRadius: number,
	clearingRadius: number,
}

local SHAPE: Shape = {
	radius = 320,
	waterLevel = 4,
	pondCentre = Vector2.new(-150, -110),
	pondRadius = 62,
	clearingRadius = 58,
}

function Landscape.shape(): Shape
	return SHAPE
end

-- Height of the ground at a point, in studs. Deterministic per arena so a bug
-- seen in one seed can be reproduced.
function Landscape.heightAt(seed: number, x: number, z: number): number
	local distance = math.sqrt(x * x + z * z)

	-- Rolling hills: two octaves is enough at this scale and much cheaper than
	-- four, which nobody can see the difference of under a forest.
	local h = 10
	h += math.noise(x / 190 + seed, z / 190 - seed) * 26
	h += math.noise(x / 70 - seed, z / 70 + seed) * 8

	-- Four massifs, one per quadrant, rising steeply past the tree line. They
	-- are what makes the valley read as a valley rather than a field.
	for _, centre in {
		Vector2.new(-250, -250), Vector2.new(250, -250),
		Vector2.new(-250, 250), Vector2.new(250, 250),
	} do
		local d = (Vector2.new(x, z) - centre).Magnitude
		if d < 210 then
			local t = 1 - d / 210
			h += t * t * 110
		end
	end

	-- A rim so the arena is visually enclosed and players cannot wander off it.
	if distance > SHAPE.radius - 60 then
		local t = math.clamp((distance - (SHAPE.radius - 60)) / 60, 0, 1)
		h += t * t * 130
	end

	-- The pond: a bowl dug below the water line.
	local pondDistance = (Vector2.new(x, z) - SHAPE.pondCentre).Magnitude
	if pondDistance < SHAPE.pondRadius then
		local t = 1 - pondDistance / SHAPE.pondRadius
		h -= t * t * 26
	end

	-- The cabin clearing, flattened so the porch is not half buried.
	if distance < SHAPE.clearingRadius then
		local t = 1 - distance / SHAPE.clearingRadius
		h = h * (1 - t) + 12 * t
	end

	return h
end

-- Grass on gentle ground, rock where it is steep or high, sand at the waterline.
local function materialFor(height: number, slope: number): Enum.Material
	if height < SHAPE.waterLevel + 2.5 then
		return Enum.Material.Sand
	end
	if height > 92 then
		return Enum.Material.Rock
	end
	if slope > 15 then
		return Enum.Material.Slate
	end
	if height > 62 then
		return Enum.Material.Ground
	end
	return Enum.Material.Grass
end

-- Sculpt one arena. Yields periodically; call from a task.
function Landscape.build(origin: Vector3, seed: number)
	local extent = SHAPE.radius
	local worked = 0

	for x = -extent, extent, CELL do
		for z = -extent, extent, CELL do
			local h = Landscape.heightAt(seed, x, z)

			-- Slope from two neighbours is enough to pick a material and costs
			-- two extra samples rather than eight.
			local hx = Landscape.heightAt(seed, x + CELL, z)
			local hz = Landscape.heightAt(seed, x, z + CELL)
			local slope = math.max(math.abs(hx - h), math.abs(hz - h))

			local top = math.max(h, 1)
			-- Fill a crust, not a solid column. Filling from bedrock to the
			-- mountain tops came to 4.7 million voxels across three arenas;
			-- nobody digs, so everything below the surface is paid for and
			-- never seen.
			--
			-- The crust has to be deeper than the drop to the next column or a
			-- steep slope shows daylight through the seam between them, so it
			-- scales with the local gradient.
			local crust = math.max(26, slope * 2.2 + 14)
			crust = math.min(crust, top + 12)

			terrain:FillBlock(
				CFrame.new(origin.X + x, top - crust / 2, origin.Z + z),
				Vector3.new(CELL + 1, crust, CELL + 1),
				materialFor(h, slope)
			)

			worked += 1
			if worked % YIELD_EVERY == 0 then
				task.wait()
			end
		end
	end

	-- The pond, filled after the ground is cut so the water sits in the bowl.
	local pond = SHAPE.pondCentre
	terrain:FillBlock(
		CFrame.new(origin.X + pond.X, SHAPE.waterLevel - 7, origin.Z + pond.Y),
		Vector3.new(SHAPE.pondRadius * 2.1, 14, SHAPE.pondRadius * 2.1),
		Enum.Material.Water
	)
end

-- Clear an arena's terrain. Used only if arenas are ever regenerated.
function Landscape.clear(origin: Vector3)
	local extent = SHAPE.radius + 40
	terrain:FillBlock(
		CFrame.new(origin.X, 60, origin.Z),
		Vector3.new(extent * 2, 400, extent * 2),
		Enum.Material.Air
	)
end

-- Water tuning is global, but there is only one look wanted for it.
function Landscape.styleWater()
	terrain.WaterColor = Color3.fromRGB(48, 84, 96)
	terrain.WaterReflectance = 0.35
	terrain.WaterTransparency = 0.55
	terrain.WaterWaveSize = 0.12
	terrain.WaterWaveSpeed = 8
end

return Landscape

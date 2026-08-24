--!strict
-- Flora: trees, rocks and ground cover.
--
-- The first pass stacked three flat slabs on a box and called it a tree, which
-- reads as programmer art from any distance. These are built in layers with
-- tapered trunks, varied greens and a slight lean, and there are three species
-- so a forest does not look like one model copied two hundred times.

local Flora = {}

local TRUNK = {
	Color3.fromRGB(74, 56, 40),
	Color3.fromRGB(88, 66, 46),
	Color3.fromRGB(62, 48, 38),
}

local PINE = {
	Color3.fromRGB(38, 72, 50),
	Color3.fromRGB(46, 84, 56),
	Color3.fromRGB(32, 62, 44),
}

local BROADLEAF = {
	Color3.fromRGB(64, 96, 48),
	Color3.fromRGB(78, 108, 54),
	Color3.fromRGB(56, 86, 44),
	Color3.fromRGB(96, 112, 52),
}

local function piece(name: string, size: Vector3, cframe: CFrame, colour: Color3,
	material: Enum.Material, parent: Instance, collide: boolean): Part
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.CFrame = cframe
	p.Color = colour
	p.Material = material
	p.Anchored = true
	p.CanCollide = collide
	p.CanQuery = collide
	p.CastShadow = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = parent
	return p
end

local function mesh(part: Part, kind: Enum.MeshType)
	local m = Instance.new("SpecialMesh")
	m.MeshType = kind
	m.Parent = part
end

local function pick<T>(list: { T }, rng: Random): T
	return list[rng:NextInteger(1, #list)]
end

--------------------------------------------------------------------------------

-- A tapered trunk in two segments, leaning slightly. Returns the top position.
local function trunk(base: CFrame, height: number, radius: number, colour: Color3,
	parent: Instance, rng: Random): CFrame
	local lean = CFrame.Angles(
		math.rad(rng:NextNumber(-4, 4)), rng:NextNumber(0, math.pi * 2), math.rad(rng:NextNumber(-4, 4)))
	local axis = base * lean

	local lowerHeight = height * 0.55
	local lower = piece("Trunk", Vector3.new(radius * 2.2, lowerHeight, radius * 2.2),
		axis * CFrame.new(0, lowerHeight / 2, 0), colour, Enum.Material.Wood, parent, true)
	mesh(lower, Enum.MeshType.Cylinder)

	local upperHeight = height * 0.5
	local upper = piece("Trunk", Vector3.new(radius * 1.5, upperHeight, radius * 1.5),
		axis * CFrame.new(0, lowerHeight + upperHeight / 2 - 0.6, 0), colour, Enum.Material.Wood, parent, true)
	mesh(upper, Enum.MeshType.Cylinder)

	return axis * CFrame.new(0, height * 0.92, 0)
end

local function buildPine(base: CFrame, parent: Instance, rng: Random)
	local height = rng:NextNumber(30, 46)
	local needle = pick(PINE, rng)
	local top = trunk(base, height * 0.62, rng:NextNumber(1.1, 1.6), pick(TRUNK, rng), parent, rng)

	-- Five discs of shrinking radius read as a conifer without a cone mesh.
	local layers = 5
	for i = 1, layers do
		local t = (i - 1) / (layers - 1)
		local radius = 13 * (1 - t * 0.78)
		local thickness = 6 - t * 2.2
		local shade = needle:Lerp(Color3.new(0, 0, 0), t * 0.12)
		local disc = piece("Canopy", Vector3.new(radius * 2, thickness, radius * 2),
			top * CFrame.new(0, i * (height * 0.09), 0)
				* CFrame.Angles(0, rng:NextNumber(0, math.pi), 0),
			shade, Enum.Material.Grass, parent, false)
		mesh(disc, Enum.MeshType.Cylinder)
	end
end

local function buildBroadleaf(base: CFrame, parent: Instance, rng: Random)
	local height = rng:NextNumber(24, 36)
	local leaf = pick(BROADLEAF, rng)
	local top = trunk(base, height * 0.6, rng:NextNumber(1.3, 2.0), pick(TRUNK, rng), parent, rng)

	-- Overlapping spheres at slightly different heights and shades; the
	-- irregularity is what stops it looking like a lollipop.
	local blobs = rng:NextInteger(4, 6)
	for i = 1, blobs do
		local angle = (i / blobs) * math.pi * 2 + rng:NextNumber(-0.4, 0.4)
		local spread = rng:NextNumber(3, 8)
		local size = rng:NextNumber(13, 19)
		local shade = leaf:Lerp(Color3.new(1, 1, 1), rng:NextNumber(-0.08, 0.12))
		local blob = piece("Canopy", Vector3.new(size, size * 0.82, size),
			top * CFrame.new(math.cos(angle) * spread, rng:NextNumber(2, 8), math.sin(angle) * spread),
			shade, Enum.Material.Grass, parent, false)
		mesh(blob, Enum.MeshType.Sphere)
	end
end

local function buildDead(base: CFrame, parent: Instance, rng: Random)
	local height = rng:NextNumber(18, 28)
	local colour = Color3.fromRGB(96, 88, 78)
	local top = trunk(base, height, rng:NextNumber(1.0, 1.5), colour, parent, rng)

	for i = 1, rng:NextInteger(2, 4) do
		local angle = rng:NextNumber(0, math.pi * 2)
		local length = rng:NextNumber(5, 11)
		local branch = piece("Branch", Vector3.new(0.9, length, 0.9),
			top * CFrame.new(0, -rng:NextNumber(1, 7), 0)
				* CFrame.Angles(0, angle, math.rad(rng:NextNumber(48, 74)))
				* CFrame.new(0, length / 2, 0),
			colour, Enum.Material.Wood, parent, false)
		mesh(branch, Enum.MeshType.Cylinder)
		local _ = i
	end
end

-- Build one tree. `Species` decides how it is felled later, so it is recorded.
function Flora.tree(position: Vector3, parent: Instance, rng: Random): Model
	local model = Instance.new("Model")
	model.Name = "Tree"

	local roll = rng:NextNumber()
	local species = if roll < 0.5 then "pine" elseif roll < 0.88 then "broadleaf" else "dead"

	model:SetAttribute("Species", species)
	model:SetAttribute("Chops", 0)
	model:SetAttribute("Felled", false)
	model.Parent = parent

	local base = CFrame.new(position)
	if species == "pine" then
		buildPine(base, model, rng)
	elseif species == "broadleaf" then
		buildBroadleaf(base, model, rng)
	else
		buildDead(base, model, rng)
	end

	-- A slim invisible collider at the base is what the axe and the player hit,
	-- so a swing does not have to find the exact trunk segment.
	local hit = piece("Hitbox", Vector3.new(5, 14, 5), base * CFrame.new(0, 7, 0),
		Color3.new(1, 1, 1), Enum.Material.SmoothPlastic, model, false)
	hit.Transparency = 1
	hit.CanQuery = true
	model.PrimaryPart = hit

	return model
end

function Flora.rock(position: Vector3, parent: Instance, rng: Random): Model
	local model = Instance.new("Model")
	model.Name = "Rock"
	model.Parent = parent

	local scale = rng:NextNumber(3, 11)
	local colour = Color3.fromRGB(104, 104, 110):Lerp(Color3.fromRGB(78, 76, 82), rng:NextNumber())

	-- Three overlapping lumps make a boulder; one sphere makes a marble.
	for i = 1, 3 do
		local size = scale * rng:NextNumber(0.7, 1.15)
		local offset = Vector3.new(
			rng:NextNumber(-scale, scale) * 0.4, rng:NextNumber(-0.2, 0.3) * scale, rng:NextNumber(-scale, scale) * 0.4)
		local lump = piece("Lump", Vector3.new(size, size * 0.8, size * 0.9),
			CFrame.new(position + offset) * CFrame.Angles(rng:NextNumber(0, 1), rng:NextNumber(0, math.pi), rng:NextNumber(0, 1)),
			colour, Enum.Material.Rock, model, i == 1)
		mesh(lump, Enum.MeshType.Sphere)
		if i == 1 then
			model.PrimaryPart = lump
		end
	end

	return model
end

-- Low cover: fern clumps and grass tufts. Cheap, and the ground looks bare
-- without them once the terrain is smooth.
function Flora.tuft(position: Vector3, parent: Instance, rng: Random)
	local colour = Color3.fromRGB(70, 100, 48):Lerp(Color3.fromRGB(104, 118, 56), rng:NextNumber())
	for i = 1, rng:NextInteger(3, 5) do
		local height = rng:NextNumber(1.6, 3.4)
		local blade = piece("Blade", Vector3.new(0.5, height, 0.5),
			CFrame.new(position + Vector3.new(rng:NextNumber(-1.6, 1.6), height / 2, rng:NextNumber(-1.6, 1.6)))
				* CFrame.Angles(math.rad(rng:NextNumber(-16, 16)), rng:NextNumber(0, math.pi), math.rad(rng:NextNumber(-16, 16))),
			colour, Enum.Material.Grass, parent, false)
		blade.CastShadow = false
		local _ = i
	end
end

return Flora

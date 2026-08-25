--!strict
-- Arenas: builds and hands out the copies of the valley that runs happen in.
--
-- Roblox has one Workspace, so parties cannot each have their own place without
-- reserved servers. Every arena is built far enough apart that nobody can see or
-- reach a neighbour, and a run is given one for its lifetime.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Build = require(Shared:WaitForChild("Build"))
local Flora = require(Shared:WaitForChild("Flora"))

local Landscape = require(script.Parent:WaitForChild("Landscape"))

local Arenas = {}

local ARENA_COUNT = 3
local ARENA_SPACING = 3000
local TREE_COUNT = 130
local ROCK_COUNT = 34
local FLINT_COUNT = 22
local APPLE_COUNT = 26
local TUFT_COUNT = 260

local COLOURS = {
	plank = Color3.fromRGB(118, 90, 62),
	plankDark = Color3.fromRGB(88, 66, 46),
	roof = Color3.fromRGB(66, 50, 42),
	log = Color3.fromRGB(122, 92, 62),
	stone = Color3.fromRGB(104, 104, 110),
	flint = Color3.fromRGB(52, 54, 62),
	steel = Color3.fromRGB(158, 160, 168),
	ember = Color3.fromRGB(226, 122, 54),
}

export type Arena = {
	index: number,
	origin: Vector3,
	seed: number,
	folder: Folder,
	spawnCFrame: CFrame,
	inUse: boolean,
}

local arenas: { Arena } = {}

local function groundAt(arena: Arena, x: number, z: number): number
	return Landscape.heightAt(arena.seed, x, z)
end

-- Interactables carry a ProximityPrompt rather than being found by a cone test
-- from the character's facing. The prompt is what a Roblox player expects: it
-- appears when you are close, it says what the key does, and it cannot fire on
-- something behind you.
local function prompt(part: BasePart, action: string, object: string, tag: string): ProximityPrompt
	part:SetAttribute("Interact", tag)

	local p = Instance.new("ProximityPrompt")
	p.Name = "Prompt"
	p.ActionText = action
	p.ObjectText = object
	p.KeyboardKeyCode = Enum.KeyCode.E
	p.MaxActivationDistance = 12
	p.HoldDuration = 0
	p.RequiresLineOfSight = false
	p.Parent = part

	return p
end

--------------------------------------------------------------------------------
-- The cabin
--------------------------------------------------------------------------------

local function buildCabin(arena: Arena, parent: Instance): CFrame
	local origin = arena.origin
	local floorY = groundAt(arena, 0, 0)

	local cabin = Instance.new("Model")
	cabin.Name = "Cabin"
	cabin.Parent = parent

	local W, D, H = 28, 22, 12
	local base = Vector3.new(origin.X, floorY, origin.Z)

	-- Stilts, so the cabin sits on uneven ground without a floating edge.
	for _, corner in {
		Vector2.new(-1, -1), Vector2.new(1, -1), Vector2.new(-1, 1), Vector2.new(1, 1),
	} do
		local px, pz = corner.X * (W / 2 - 2), corner.Y * (D / 2 - 2)
		local groundY = groundAt(arena, px, pz)
		local height = math.max(floorY - groundY + 4, 2)
		Build.part({ name = "Stilt", size = Vector3.new(2.4, height, 2.4),
			cframe = CFrame.new(base.X + px, floorY - height / 2, base.Z + pz),
			colour = COLOURS.plankDark, material = Enum.Material.Wood }, cabin)
	end

	local floor = Build.part({ name = "Floor", size = Vector3.new(W, 1.2, D),
		cframe = CFrame.new(base.X, floorY + 0.6, base.Z),
		colour = COLOURS.plankDark, material = Enum.Material.WoodPlanks }, cabin)
	cabin.PrimaryPart = floor

	local function wall(name: string, size: Vector3, offset: Vector3)
		Build.part({ name = name, size = size,
			cframe = CFrame.new(base.X + offset.X, floorY + offset.Y, base.Z + offset.Z),
			colour = COLOURS.plank, material = Enum.Material.WoodPlanks }, cabin)
	end

	wall("WallBack", Vector3.new(W, H, 1), Vector3.new(0, H / 2, -D / 2))
	wall("WallLeft", Vector3.new(1, H, D), Vector3.new(-W / 2, H / 2, 0))
	wall("WallRight", Vector3.new(1, H, D), Vector3.new(W / 2, H / 2, 0))
	for _, side in { -1, 1 } do
		wall("WallFront", Vector3.new(W / 2 - 3.5, H, 1), Vector3.new(side * (W / 4 + 1.75), H / 2, D / 2))
	end
	wall("Lintel", Vector3.new(7, 4, 1), Vector3.new(0, H - 2, D / 2))

	-- A pitched roof out of two wedges reads far better than a flat slab.
	for _, side in { -1, 1 } do
		local roof = Build.wedge({ name = "Roof", size = Vector3.new(D + 5, 7, W / 2 + 2.5),
			cframe = CFrame.new(base.X + side * (W / 4 + 1.25), floorY + H + 3.5, base.Z)
				* CFrame.Angles(0, math.rad(90 * side), 0) * CFrame.Angles(0, 0, math.rad(90)),
			colour = COLOURS.roof, material = Enum.Material.Wood }, cabin)
		local _ = roof
	end

	-- Porch.
	Build.part({ name = "Porch", size = Vector3.new(W, 1, 9),
		cframe = CFrame.new(base.X, floorY + 0.4, base.Z + D / 2 + 4.5),
		colour = COLOURS.plankDark, material = Enum.Material.WoodPlanks }, cabin)

	local lamp = Build.part({ name = "PorchLamp", size = Vector3.new(1.4, 1.8, 1.4),
		cframe = CFrame.new(base.X + 4, floorY + H - 2, base.Z + D / 2 + 0.6),
		colour = COLOURS.ember, material = Enum.Material.Neon }, cabin)
	local lampLight = Instance.new("PointLight")
	lampLight.Color = Color3.fromRGB(255, 186, 118)
	lampLight.Range = 26
	lampLight.Brightness = 1.6
	lampLight.Parent = lamp

	-- The table with the valley map on it.
	local table_ = Build.part({ name = "MapTable", size = Vector3.new(7, 3.2, 4.5),
		cframe = CFrame.new(base.X - 7, floorY + 2.8, base.Z - 6),
		colour = COLOURS.plank, material = Enum.Material.Wood }, cabin)
	prompt(table_, "Read", "Valley map", "map")

	-- The chopping block, with the axe still buried in it.
	local blockY = groundAt(arena, 0, D / 2 + 12)
	local block = Build.part({ name = "ChoppingBlock", size = Vector3.new(4.4, 4.4, 4.4),
		cframe = CFrame.new(base.X, blockY + 2.2, base.Z + D / 2 + 12),
		colour = COLOURS.log, material = Enum.Material.Wood }, cabin)
	block:SetAttribute("Loaded", false)
	prompt(block, "Load log", "Chopping block", "block")

	local axeHead = Build.part({ name = "Axe", size = Vector3.new(0.5, 2.2, 1.8),
		cframe = CFrame.new(base.X, blockY + 5.6, base.Z + D / 2 + 12) * CFrame.Angles(0, 0, math.rad(20)),
		colour = COLOURS.steel, material = Enum.Material.Metal, canCollide = false }, cabin)
	Build.part({ name = "AxeHaft", size = Vector3.new(0.42, 3.4, 0.42),
		cframe = CFrame.new(base.X + 0.5, blockY + 7.4, base.Z + D / 2 + 12) * CFrame.Angles(0, 0, math.rad(20)),
		colour = Color3.fromRGB(120, 88, 58), material = Enum.Material.Wood, canCollide = false }, cabin)
	prompt(axeHead, "Take", "Axe", "axe")

	return CFrame.new(base.X, floorY + 6, base.Z + D / 2 + 20)
end

-- The fire pit: a ring of stones the party lights and cooks on.
local function buildFirePit(arena: Arena, parent: Instance)
	local x, z = 22, 26
	local y = groundAt(arena, x, z)

	local pit = Instance.new("Model")
	pit.Name = "FirePit"
	pit.Parent = parent

	for i = 1, 9 do
		local angle = (i / 9) * math.pi * 2
		Build.part({ name = "Stone", size = Vector3.new(2.2, 1.6, 2.2),
			cframe = CFrame.new(arena.origin.X + x + math.cos(angle) * 4.2, y + 0.6,
				arena.origin.Z + z + math.sin(angle) * 4.2) * CFrame.Angles(0, angle, 0),
			colour = COLOURS.stone, material = Enum.Material.Rock }, pit)
	end

	local hearth = Build.part({ name = "Hearth", size = Vector3.new(4, 1, 4),
		cframe = CFrame.new(arena.origin.X + x, y + 0.5, arena.origin.Z + z),
		colour = Color3.fromRGB(42, 36, 32), material = Enum.Material.Slate }, pit)
	hearth:SetAttribute("Lit", false)
	pit.PrimaryPart = hearth
	prompt(hearth, "Light", "Fire pit", "fire")
end

--------------------------------------------------------------------------------
-- Scatter
--------------------------------------------------------------------------------

-- Flint and apples are used up during a run, so they are scattered separately
-- and re-scattered when the arena is handed back.
local function scatterConsumables(arena: Arena)
	local rng = Build.rng(math.floor(arena.seed * 104729) + os.time() % 1000)
	local shape = Landscape.shape()

	local props = Instance.new("Folder")
	props.Name = "Props"
	props.Parent = arena.folder

	local function findGround(minRadius: number, maxRadius: number, maxHeight: number): Vector3?
		for _ = 1, 24 do
			local angle = rng:NextNumber(0, math.pi * 2)
			local radius = rng:NextNumber(minRadius, maxRadius)
			local x, z = math.cos(angle) * radius, math.sin(angle) * radius
			local y = Landscape.heightAt(arena.seed, x, z)
			if y > shape.waterLevel + 3 and y < maxHeight then
				return Vector3.new(arena.origin.X + x, y, arena.origin.Z + z)
			end
		end
		return nil
	end

	for i = 1, FLINT_COUNT do
		local point = if i <= 7 then findGround(14, 46, 80) else findGround(50, shape.radius - 70, 90)
		if point then
			local flint = Build.part({ name = "Flint", size = Vector3.new(1.8, 0.9, 1.5),
				cframe = CFrame.new(point + Vector3.new(0, 0.5, 0)) * CFrame.Angles(0, rng:NextNumber(0, math.pi), 0),
				colour = COLOURS.flint, material = Enum.Material.Slate, canCollide = false }, props)
			prompt(flint, "Pick up", "Flint", "flint")
		end
	end

	for _ = 1, APPLE_COUNT do
		local point = findGround(shape.clearingRadius, shape.radius - 80, 70)
		if point then
			local apple = Build.part({ name = "Apple", size = Vector3.new(1.4, 1.4, 1.4),
				cframe = CFrame.new(point + Vector3.new(0, 0.8, 0)),
				colour = Color3.fromRGB(178, 58, 48), material = Enum.Material.SmoothPlastic,
				canCollide = false }, props)
			local mesh = Instance.new("SpecialMesh")
			mesh.MeshType = Enum.MeshType.Sphere
			mesh.Parent = apple
			prompt(apple, "Pick up", "Apple", "apple")
		end
	end
end

local function scatter(arena: Arena, parent: Instance)
	local rng = Build.rng(math.floor(arena.seed * 7919))
	local shape = Landscape.shape()

	local trees = Instance.new("Folder")
	trees.Name = "Trees"
	trees.Parent = parent

	local rocks = Instance.new("Folder")
	rocks.Name = "Rocks"
	rocks.Parent = parent

	local detail = Instance.new("Folder")
	detail.Name = "Detail"
	detail.Parent = parent

	-- A candidate point that is on walkable land: above the waterline, off the
	-- mountains, and outside the cabin clearing unless asked otherwise.
	local function findGround(minRadius: number, maxRadius: number, maxHeight: number): (Vector3?, number)
		for _ = 1, 24 do
			local angle = rng:NextNumber(0, math.pi * 2)
			local radius = rng:NextNumber(minRadius, maxRadius)
			local x, z = math.cos(angle) * radius, math.sin(angle) * radius
			local y = groundAt(arena, x, z)
			if y > shape.waterLevel + 3 and y < maxHeight then
				return Vector3.new(arena.origin.X + x, y, arena.origin.Z + z), y
			end
		end
		return nil, 0
	end

	local placed = 0
	while placed < TREE_COUNT do
		local point = findGround(shape.clearingRadius + 12, shape.radius - 70, 88)
		if point then
			-- Seated a little into the ground: voxel terrain smooths away from
			-- the sampled height, and a floating trunk is very obvious.
			Flora.tree(point - Vector3.new(0, 1.5, 0), trees, rng)
			placed += 1
		else
			break
		end
	end

	for _ = 1, ROCK_COUNT do
		local point = findGround(shape.clearingRadius + 6, shape.radius - 50, 110)
		if point then
			Flora.rock(point, rocks, rng)
		end
	end

	for _ = 1, TUFT_COUNT do
		local point = findGround(10, shape.radius - 60, 84)
		if point then
			Flora.tuft(point, detail, rng)
		end
	end
end

--------------------------------------------------------------------------------

local function buildArena(index: number): Arena
	local origin = Vector3.new((index - 1) * ARENA_SPACING, 0, 0)
	local seed = index * 137.4

	local folder = Instance.new("Folder")
	folder.Name = "Arena" .. index
	folder.Parent = workspace

	local arena: Arena = {
		index = index, origin = origin, seed = seed,
		folder = folder, spawnCFrame = CFrame.new(origin), inUse = false,
	}

	Landscape.build(origin, seed)
	arena.spawnCFrame = buildCabin(arena, folder)
	buildFirePit(arena, folder)
	scatter(arena, folder)
	scatterConsumables(arena)

	return arena
end

function Arenas.build()
	Landscape.styleWater()
	for index = 1, ARENA_COUNT do
		table.insert(arenas, buildArena(index))
		task.wait()
	end
end

function Arenas.claim(): Arena?
	for _, arena in arenas do
		if not arena.inUse then
			arena.inUse = true
			return arena
		end
	end
	return nil
end

function Arenas.release(arena: Arena)
	local trees = arena.folder:FindFirstChild("Trees")
	if trees then
		for _, tree in trees:GetChildren() do
			tree:SetAttribute("Chops", 0)
			tree:SetAttribute("Felled", false)
			for _, piece in tree:GetDescendants() do
				if piece:IsA("BasePart") then
					piece.Transparency = if piece.Name == "Hitbox" then 1 else 0
					piece.CanCollide = piece.Name == "Trunk"
				end
			end
		end
	end

	local pit = arena.folder:FindFirstChild("FirePit")
	if pit then
		local hearth = pit:FindFirstChild("Hearth")
		if hearth then
			hearth:SetAttribute("Lit", false)
			local flame = hearth:FindFirstChild("Flame")
			if flame then
				flame:Destroy()
			end
		end
	end

	for _, name in { "Logs", "Zombies", "Drops", "Structures" } do
		local group = arena.folder:FindFirstChild(name)
		if group then
			group:Destroy()
		end
	end

	-- Animals are deliberately left alone: the herd belongs to the arena, not
	-- to the run, so the forest is alive whether or not anyone is in it.

	-- Flint and apples are consumed during a run and have to come back, or the
	-- second party to use this arena finds a valley picked clean.
	local props = arena.folder:FindFirstChild("Props")
	if props then
		props:Destroy()
		scatterConsumables(arena)
	end

	arena.inUse = false
end

function Arenas.at(index: number): Arena?
	return arenas[index]
end

function Arenas.count(): number
	return ARENA_COUNT
end

return Arenas

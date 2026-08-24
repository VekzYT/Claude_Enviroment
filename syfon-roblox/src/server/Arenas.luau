--!strict
-- Arenas: builds and hands out the copies of the valley that runs happen in.
--
-- Roblox has one Workspace, so parties cannot each have their own place without
-- reserved servers. Instead every arena is built far enough apart that nobody
-- can see or reach a neighbour, and a run is given one for its lifetime.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Build = require(Shared:WaitForChild("Build"))

local Arenas = {}

local ARENA_COUNT = 4
local ARENA_SPACING = 4000 -- studs between arena origins
local GROUND_SIZE = 520
local TREE_COUNT = 150
local FLINT_COUNT = 24
local ROCK_COUNT = 30

local COLOURS = {
	grass = Color3.fromRGB(78, 112, 62),
	dirt = Color3.fromRGB(104, 84, 60),
	water = Color3.fromRGB(58, 96, 118),
	trunk = Color3.fromRGB(84, 62, 44),
	leaves = Color3.fromRGB(58, 96, 52),
	leavesDark = Color3.fromRGB(44, 76, 42),
	log = Color3.fromRGB(122, 92, 62),
	plank = Color3.fromRGB(126, 96, 64),
	plankDark = Color3.fromRGB(94, 70, 48),
	roof = Color3.fromRGB(78, 58, 46),
	stone = Color3.fromRGB(112, 112, 116),
	flint = Color3.fromRGB(58, 58, 66),
	axe = Color3.fromRGB(150, 152, 158),
}

export type Arena = {
	index: number,
	origin: Vector3,
	folder: Folder,
	spawnCFrame: CFrame,
	inUse: boolean,
}

local arenas: { Arena } = {}

--------------------------------------------------------------------------------
-- Pieces of the valley
--------------------------------------------------------------------------------

-- A fellable tree. Health and the log it leaves are handled by Timber; this
-- only builds the shape and tags it.
local function buildTree(origin: Vector3, x: number, z: number, rng: Random, parent: Instance)
	local height = rng:NextNumber(16, 26)
	local model = Instance.new("Model")
	model.Name = "Tree"
	model:SetAttribute("Chops", 0)
	model:SetAttribute("Felled", false)
	model.Parent = parent

	local trunk = Build.part({
		name = "Trunk",
		size = Vector3.new(2.4, height, 2.4),
		cframe = CFrame.new(origin.X + x, height / 2, origin.Z + z),
		colour = COLOURS.trunk,
		material = Enum.Material.Wood,
	}, model)
	model.PrimaryPart = trunk

	-- Three offset canopy slabs read as foliage from any angle without the cost
	-- of a real leaf card system.
	for i = 1, 3 do
		local spread = 11 - i * 1.6
		Build.part({
			name = "Canopy",
			size = Vector3.new(spread, 3.4, spread),
			cframe = CFrame.new(origin.X + x, height - 1 + i * 2.6, origin.Z + z)
				* CFrame.Angles(0, rng:NextNumber(0, math.pi), 0),
			colour = if i % 2 == 0 then COLOURS.leavesDark else COLOURS.leaves,
			material = Enum.Material.Grass,
			canCollide = false,
		}, model)
	end
end

local function buildCabin(origin: Vector3, parent: Instance): CFrame
	local cabin = Instance.new("Model")
	cabin.Name = "Cabin"
	cabin.Parent = parent

	local base = origin + Vector3.new(0, 0, 0)
	local W, D, H = 26, 20, 11

	local floor = Build.part({
		name = "Floor",
		size = Vector3.new(W, 1, D),
		cframe = CFrame.new(base.X, 0.5, base.Z),
		colour = COLOURS.plankDark,
		material = Enum.Material.WoodPlanks,
	}, cabin)
	cabin.PrimaryPart = floor

	-- Back and side walls; the front is left open with a doorway gap.
	Build.part({ name = "WallBack", size = Vector3.new(W, H, 1),
		cframe = CFrame.new(base.X, H / 2, base.Z - D / 2),
		colour = COLOURS.plank, material = Enum.Material.WoodPlanks }, cabin)
	Build.part({ name = "WallLeft", size = Vector3.new(1, H, D),
		cframe = CFrame.new(base.X - W / 2, H / 2, base.Z),
		colour = COLOURS.plank, material = Enum.Material.WoodPlanks }, cabin)
	Build.part({ name = "WallRight", size = Vector3.new(1, H, D),
		cframe = CFrame.new(base.X + W / 2, H / 2, base.Z),
		colour = COLOURS.plank, material = Enum.Material.WoodPlanks }, cabin)

	-- Front wall in two pieces, leaving a doorway in the middle.
	for _, side in { -1, 1 } do
		Build.part({ name = "WallFront", size = Vector3.new(W / 2 - 3, H, 1),
			cframe = CFrame.new(base.X + side * (W / 4 + 1.5), H / 2, base.Z + D / 2),
			colour = COLOURS.plank, material = Enum.Material.WoodPlanks }, cabin)
	end
	Build.part({ name = "Lintel", size = Vector3.new(6, H - 8, 1),
		cframe = CFrame.new(base.X, H - (H - 8) / 2, base.Z + D / 2),
		colour = COLOURS.plank, material = Enum.Material.WoodPlanks }, cabin)

	Build.part({ name = "Roof", size = Vector3.new(W + 4, 1, D + 4),
		cframe = CFrame.new(base.X, H + 0.5, base.Z),
		colour = COLOURS.roof, material = Enum.Material.Wood }, cabin)

	-- The table the valley map sits on.
	local table_ = Build.part({ name = "MapTable", size = Vector3.new(6, 3, 4),
		cframe = CFrame.new(base.X - 6, 2.5, base.Z - 5),
		colour = COLOURS.plank, material = Enum.Material.Wood }, cabin)
	table_:SetAttribute("Interact", "map")
	Build.label(table_, "MAP  [E]", Color3.fromRGB(230, 220, 190), 3, 8)

	-- The chopping block outside the door, with the axe still in it.
	local block = Build.part({ name = "ChoppingBlock", size = Vector3.new(4, 4, 4),
		cframe = CFrame.new(base.X, 2, base.Z + D / 2 + 7),
		colour = COLOURS.log, material = Enum.Material.Wood }, cabin)
	block:SetAttribute("Interact", "block")
	block:SetAttribute("Loaded", false)

	local axe = Build.part({ name = "Axe", size = Vector3.new(0.4, 3.2, 1.6),
		cframe = CFrame.new(base.X, 5.2, base.Z + D / 2 + 7) * CFrame.Angles(0, 0, math.rad(18)),
		colour = COLOURS.axe, material = Enum.Material.Metal, canCollide = false }, cabin)
	axe:SetAttribute("Interact", "axe")
	Build.label(axe, "TAKE AXE  [E]", Color3.fromRGB(240, 236, 220), 3, 10)

	return CFrame.new(base.X, 6, base.Z + D / 2 + 16)
end

local function buildPond(origin: Vector3, parent: Instance)
	Build.part({ name = "Pond", size = Vector3.new(70, 2, 54),
		cframe = CFrame.new(origin.X - 120, 0.2, origin.Z - 90),
		colour = COLOURS.water, material = Enum.Material.Water,
		canCollide = false, transparency = 0.25 }, parent)
	Build.part({ name = "PondBed", size = Vector3.new(78, 2, 62),
		cframe = CFrame.new(origin.X - 120, -0.9, origin.Z - 90),
		colour = COLOURS.dirt, material = Enum.Material.Slate }, parent)
end

--------------------------------------------------------------------------------
-- Building a whole arena
--------------------------------------------------------------------------------

local function buildArena(index: number): Arena
	local origin = Vector3.new((index - 1) * ARENA_SPACING, 0, 0)
	local rng = Build.rng(index * 7919)

	local folder = Instance.new("Folder")
	folder.Name = "Arena" .. index
	folder.Parent = workspace

	Build.part({ name = "Ground", size = Vector3.new(GROUND_SIZE, 4, GROUND_SIZE),
		cframe = CFrame.new(origin.X, -2, origin.Z),
		colour = COLOURS.grass, material = Enum.Material.Grass }, folder)

	local spawnCFrame = buildCabin(origin, folder)
	buildPond(origin, folder)

	local trees = Instance.new("Folder")
	trees.Name = "Trees"
	trees.Parent = folder

	local placed = 0
	local attempts = 0
	while placed < TREE_COUNT and attempts < TREE_COUNT * 12 do
		attempts += 1
		local x = rng:NextNumber(-GROUND_SIZE / 2 + 20, GROUND_SIZE / 2 - 20)
		local z = rng:NextNumber(-GROUND_SIZE / 2 + 20, GROUND_SIZE / 2 - 20)
		-- Keep the clearing around the cabin and the pond free.
		if math.abs(x) < 34 and math.abs(z) < 40 then
			continue
		end
		if (Vector3.new(x, 0, z) - Vector3.new(-120, 0, -90)).Magnitude < 55 then
			continue
		end
		buildTree(origin, x, z, rng, trees)
		placed += 1
	end

	local ground = Instance.new("Folder")
	ground.Name = "GroundItems"
	ground.Parent = folder

	for _ = 1, ROCK_COUNT do
		local x = rng:NextNumber(-GROUND_SIZE / 2 + 20, GROUND_SIZE / 2 - 20)
		local z = rng:NextNumber(-GROUND_SIZE / 2 + 20, GROUND_SIZE / 2 - 20)
		local size = rng:NextNumber(3, 9)
		Build.part({ name = "Rock", size = Vector3.new(size, size * 0.7, size * 0.9),
			cframe = CFrame.new(origin.X + x, size * 0.25, origin.Z + z)
				* CFrame.Angles(0, rng:NextNumber(0, math.pi), 0),
			colour = COLOURS.stone, material = Enum.Material.Slate }, ground)
	end

	-- Flint, several pieces of it close to the cabin so the fire step is
	-- findable without a long hunt.
	for i = 1, FLINT_COUNT do
		local radius = if i <= 6 then rng:NextNumber(14, 30) else rng:NextNumber(40, GROUND_SIZE / 2 - 30)
		local angle = rng:NextNumber(0, math.pi * 2)
		local flint = Build.part({ name = "Flint", size = Vector3.new(1.6, 0.8, 1.4),
			cframe = CFrame.new(origin.X + math.cos(angle) * radius, 0.5, origin.Z + math.sin(angle) * radius)
				* CFrame.Angles(0, rng:NextNumber(0, math.pi), 0),
			colour = COLOURS.flint, material = Enum.Material.Slate, canCollide = false }, ground)
		flint:SetAttribute("Interact", "flint")
	end

	return {
		index = index,
		origin = origin,
		folder = folder,
		spawnCFrame = spawnCFrame,
		inUse = false,
	}
end

function Arenas.build()
	for index = 1, ARENA_COUNT do
		table.insert(arenas, buildArena(index))
	end
end

-- Take a free arena, or nil when every one is busy.
function Arenas.claim(): Arena?
	for _, arena in arenas do
		if not arena.inUse then
			arena.inUse = true
			return arena
		end
	end
	return nil
end

-- Hand an arena back, rebuilding anything a run consumed.
function Arenas.release(arena: Arena)
	local trees = arena.folder:FindFirstChild("Trees")
	if trees then
		for _, tree in trees:GetChildren() do
			tree:SetAttribute("Chops", 0)
			tree:SetAttribute("Felled", false)
			for _, piece in tree:GetChildren() do
				if piece:IsA("BasePart") then
					piece.Transparency = 0
					-- Felling cleared CanCollide; restore it per part or the
					-- next party walks straight through a standing forest.
					piece.CanCollide = piece.Name == "Trunk"
				end
			end
		end
	end

	for _, name in { "Logs", "Zombies", "Animals", "Fires" } do
		local group = arena.folder:FindFirstChild(name)
		if group then
			group:Destroy()
		end
	end

	arena.inUse = false
end

function Arenas.count(): number
	return ARENA_COUNT
end

return Arenas

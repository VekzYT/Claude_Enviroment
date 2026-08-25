--!strict
-- Building: spending the wood you chopped on something that keeps them out.
--
-- Syfon had a builder with five pieces on a two-metre grid, and it mattered for
-- a reason the original never got to use: the horde. Here a wall is the
-- difference between surviving night ten and not, so pieces have health and the
-- zombies chew through them.
--
-- Placement is validated entirely on the server. The client draws a ghost, but
-- the ghost is a suggestion -- the server re-derives the snapped cell, re-checks
-- the cost, and re-checks the cell is free before anything exists.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Tuning = require(Shared:WaitForChild("Tuning"))
local Build = require(Shared:WaitForChild("Build"))
local Audio = require(Shared:WaitForChild("Audio"))

local Run = require(script.Parent:WaitForChild("Run"))

local Building = {}

local GRID = Tuning.BUILD_GRID
local REACH = Tuning.BUILD_REACH
local TIMBER = Color3.fromRGB(126, 96, 64)
local TIMBER_DARK = Color3.fromRGB(96, 72, 50)

export type PieceSpec = {
	id: string,
	name: string,
	cost: number,
	refund: number,
	size: Vector3,
	health: number,
}

-- The list lives in Tuning so the client's ghost uses the same geometry.
local PIECES: { PieceSpec } = Tuning.Pieces

function Building.pieces(): { PieceSpec }
	return PIECES
end

function Building.specFor(id: string): PieceSpec?
	for _, spec in PIECES do
		if spec.id == id then
			return spec
		end
	end
	return nil
end

-- Snap a world point to the build grid, relative to the arena origin so two
-- arenas cannot ever share a cell key.
local function snap(origin: Vector3, point: Vector3): Vector3
	local localPoint = point - origin
	return Vector3.new(
		math.floor(localPoint.X / GRID + 0.5) * GRID,
		math.floor(localPoint.Y / GRID + 0.5) * GRID,
		math.floor(localPoint.Z / GRID + 0.5) * GRID
	)
end

local function cellKey(cell: Vector3): string
	return string.format("%d_%d_%d", cell.X, cell.Y, cell.Z)
end

local function structuresFolder(run: Run.Instance_): Folder
	local existing = run.arena.folder:FindFirstChild("Structures")
	if existing and existing:IsA("Folder") then
		return existing
	end
	local folder = Instance.new("Folder")
	folder.Name = "Structures"
	folder.Parent = run.arena.folder
	return folder
end

--------------------------------------------------------------------------------

local function buildPiece(spec: PieceSpec, cframe: CFrame, parent: Instance): Model
	local model = Instance.new("Model")
	model.Name = spec.id
	model:SetAttribute("Piece", spec.id)
	model:SetAttribute("Health", spec.health)
	model:SetAttribute("MaxHealth", spec.health)
	model:SetAttribute("Refund", spec.refund)
	model.Parent = parent

	if spec.id == "door" then
		-- A frame with a gap you can walk through, and a leaf hinged at the jamb
		-- rather than spun about its middle.
		local jambSize = Vector3.new(spec.size.X * 0.22, spec.size.Y, spec.size.Z)
		for _, side in { -1, 1 } do
			Build.part({ name = "Jamb", size = jambSize,
				cframe = cframe * CFrame.new(side * (spec.size.X / 2 - jambSize.X / 2), 0, 0),
				colour = TIMBER_DARK, material = Enum.Material.WoodPlanks }, model)
		end
		Build.part({ name = "Head", size = Vector3.new(spec.size.X, spec.size.Y * 0.18, spec.size.Z),
			cframe = cframe * CFrame.new(0, spec.size.Y / 2 - spec.size.Y * 0.09, 0),
			colour = TIMBER_DARK, material = Enum.Material.WoodPlanks }, model)

		local leaf = Build.part({ name = "Leaf",
			size = Vector3.new(spec.size.X * 0.56, spec.size.Y * 0.8, spec.size.Z * 0.7),
			cframe = cframe * CFrame.new(0, -spec.size.Y * 0.09, 0),
			colour = TIMBER, material = Enum.Material.Wood }, model)
		model.PrimaryPart = leaf
		leaf:SetAttribute("Open", false)

		local p = Instance.new("ProximityPrompt")
		p.ActionText = "Open"
		p.ObjectText = "Door"
		p.KeyboardKeyCode = Enum.KeyCode.E
		p.MaxActivationDistance = 10
		p.HoldDuration = 0
		p.RequiresLineOfSight = false
		p.Parent = leaf
		leaf:SetAttribute("Interact", "door")

	elseif spec.id == "ramp" then
		local wedge = Build.wedge({ name = "Ramp", size = spec.size, cframe = cframe,
			colour = TIMBER, material = Enum.Material.WoodPlanks }, model)
		model.PrimaryPart = wedge

	elseif spec.id == "post" then
		local post = Build.part({ name = "Post", size = spec.size, cframe = cframe,
			colour = TIMBER_DARK, material = Enum.Material.Wood }, model)
		model.PrimaryPart = post

		local head = Build.part({ name = "Torch", size = Vector3.new(1.8, 1.8, 1.8),
			cframe = cframe * CFrame.new(0, spec.size.Y / 2 + 0.6, 0),
			colour = Color3.fromRGB(226, 122, 54), material = Enum.Material.Neon }, model)

		local fire = Instance.new("Fire")
		fire.Heat = 8
		fire.Size = 5
		fire.Color = Color3.fromRGB(255, 168, 76)
		fire.SecondaryColor = Color3.fromRGB(190, 70, 30)
		fire.Parent = head

		local light = Instance.new("PointLight")
		light.Color = Color3.fromRGB(255, 176, 104)
		light.Range = 38
		light.Brightness = 2.2
		light.Shadows = true
		light.Parent = head

	else
		local part = Build.part({ name = "Panel", size = spec.size, cframe = cframe,
			colour = TIMBER, material = Enum.Material.WoodPlanks }, model)
		model.PrimaryPart = part

		-- Plank lines, so a wall is not one flat rectangle.
		for i = -1, 1 do
			Build.part({ name = "Plank", size = Vector3.new(spec.size.X, 0.3, spec.size.Z + 0.2),
				cframe = cframe * CFrame.new(0, i * spec.size.Y * 0.3, 0),
				colour = TIMBER_DARK, material = Enum.Material.Wood, canCollide = false }, model)
		end
	end

	return model
end

--------------------------------------------------------------------------------

-- Place a piece. Everything the client sent is re-derived or re-checked.
function Building.place(player: Player, pieceId: unknown, point: unknown, rotation: unknown)
	local run = Run.forPlayer(player)
	local stats = Run.statsFor(player)
	if not run or not stats or not stats.alive then
		return
	end
	if type(pieceId) ~= "string" or typeof(point) ~= "Vector3" then
		return
	end

	local spec = Building.specFor(pieceId)
	if not spec then
		return
	end

	local character = player.Character
	local root = if character then character:FindFirstChild("HumanoidRootPart") else nil
	if not root or not root:IsA("BasePart") then
		return
	end

	-- Reach is checked against the server's idea of where the player is.
	if (point - root.Position).Magnitude > REACH * 1.4 then
		return
	end

	if stats.wood < spec.cost then
		Run.announce(run, string.format("A %s costs %d wood.", string.lower(spec.name), spec.cost))
		return
	end

	local cell = snap(run.arena.origin, point)
	local key = cellKey(cell)
	local folder = structuresFolder(run)

	for _, existing in folder:GetChildren() do
		if existing:GetAttribute("Cell") == key then
			Run.announce(run, "Something is already there.")
			return
		end
	end

	local turns = if type(rotation) == "number" then math.floor(rotation) % 4 else 0
	local cframe = CFrame.new(run.arena.origin + cell + Vector3.new(0, spec.size.Y / 2, 0))
		* CFrame.Angles(0, math.rad(90 * turns), 0)

	local model = buildPiece(spec, cframe, folder)
	model:SetAttribute("Cell", key)
	model:SetAttribute("Owner", player.UserId)

	stats.wood -= spec.cost
	Audio.play("split", cell + run.arena.origin)
	Run.sync(player)
end

-- Take one back down, refunding what the original refunded.
function Building.remove(player: Player, point: unknown)
	local run = Run.forPlayer(player)
	local stats = Run.statsFor(player)
	if not run or not stats or not stats.alive then
		return
	end
	if typeof(point) ~= "Vector3" then
		return
	end

	local folder = run.arena.folder:FindFirstChild("Structures")
	if not folder then
		return
	end

	local key = cellKey(snap(run.arena.origin, point))
	for _, model in folder:GetChildren() do
		if model:GetAttribute("Cell") == key then
			stats.wood += (model:GetAttribute("Refund") or 0) :: number
			model:Destroy()
			Audio.play("pickup", point)
			Run.sync(player)
			return
		end
	end
end

-- Zombies hitting a wall. Returns true when the piece came down.
function Building.damage(model: Model, amount: number): boolean
	local health = ((model:GetAttribute("Health") or 0) :: number) - amount
	model:SetAttribute("Health", health)

	-- Show the wear: the panel darkens as it is chewed through.
	local maxHealth = (model:GetAttribute("MaxHealth") or 1) :: number
	local wear = math.clamp(1 - health / maxHealth, 0, 1)
	for _, part in model:GetDescendants() do
		if part:IsA("BasePart") and part.Name ~= "Torch" then
			part.Color = TIMBER:Lerp(Color3.fromRGB(48, 36, 28), wear * 0.8)
		end
	end

	if health <= 0 then
		if model.PrimaryPart then
			Audio.play("timber", model.PrimaryPart.Position)
		end
		model:Destroy()
		return true
	end
	return false
end

-- The nearest structure in front of a zombie, so it can hit what is in its way.
function Building.blockingAt(arenaFolder: Folder, position: Vector3, direction: Vector3, reach: number): Model?
	local folder = arenaFolder:FindFirstChild("Structures")
	if not folder then
		return nil
	end

	local best: Model? = nil
	local bestDistance = reach

	for _, model in folder:GetChildren() do
		if model:IsA("Model") and model.PrimaryPart then
			local offset = model.PrimaryPart.Position - position
			local distance = offset.Magnitude
			if distance < bestDistance and distance > 0 and offset.Unit:Dot(direction) > 0.45 then
				best = model
				bestDistance = distance
			end
		end
	end

	return best
end

function Building.toggleDoor(leaf: BasePart)
	local open = not (leaf:GetAttribute("Open") :: boolean)
	leaf:SetAttribute("Open", open)

	-- Hinge at the jamb rather than spinning about the middle, which is the fix
	-- the original release notes made a point of.
	local hinge = leaf:GetAttribute("Hinge")
	if typeof(hinge) ~= "CFrame" then
		hinge = leaf.CFrame * CFrame.new(-leaf.Size.X / 2, 0, 0)
		leaf:SetAttribute("Hinge", hinge)
	end

	local pivot = hinge :: CFrame
	local angle = if open then math.rad(92) else 0
	leaf.CFrame = pivot * CFrame.Angles(0, angle, 0) * CFrame.new(leaf.Size.X / 2, 0, 0)
	Audio.play("uiPick", leaf.Position)
end

return Building

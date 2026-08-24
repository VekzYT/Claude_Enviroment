--!strict
-- World: builds the map from scratch when the server starts.
--
-- Nothing here needs to exist in the .rbxlx beforehand -- open an empty
-- baseplate, sync, press play, and the whole map assembles itself. That keeps
-- the entire game in version control rather than half of it in a binary file.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local World = {}

local GROUND_SIZE = 620
local PLOT_SIZE = 44
local PLOT_RADIUS = 112
local SLOT_COLUMNS = 5
local SLOT_SPACING = 8
local SLOT_PAD_SIZE = 4.6

local COLOURS = {
	ground = Color3.fromRGB(96, 148, 82),
	plaza = Color3.fromRGB(178, 172, 160),
	plazaTrim = Color3.fromRGB(126, 120, 112),
	plotFloor = Color3.fromRGB(148, 142, 132),
	plotTrim = Color3.fromRGB(88, 84, 78),
	slotOpen = Color3.fromRGB(112, 176, 118),
	slotLocked = Color3.fromRGB(78, 74, 70),
	shop = Color3.fromRGB(72, 128, 196),
	craft = Color3.fromRGB(196, 118, 62),
}

local function newPart(name: string, size: Vector3, cframe: CFrame, colour: Color3, parent: Instance): Part
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.CFrame = cframe
	p.Color = colour
	p.Anchored = true
	p.Material = Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = parent
	return p
end

local function addBillboard(adornee: BasePart, text: string, colour: Color3, offsetY: number, scale: number): BillboardGui
	local gui = Instance.new("BillboardGui")
	gui.Name = "Label"
	gui.Size = UDim2.fromScale(scale, scale * 0.28)
	gui.StudsOffset = Vector3.new(0, offsetY, 0)
	gui.AlwaysOnTop = false
	gui.MaxDistance = 220
	gui.LightInfluence = 0
	gui.Adornee = adornee
	gui.Parent = adornee

	local label = Instance.new("TextLabel")
	label.Name = "Text"
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.FredokaOne
	label.Text = text
	label.TextColor3 = colour
	label.TextScaled = true
	label.TextStrokeTransparency = 0.3
	label.TextStrokeColor3 = Color3.new(0, 0, 0)
	label.Parent = gui

	return gui
end

local function addPrompt(parent: BasePart, actionText: string, objectText: string, keyCode: Enum.KeyCode): ProximityPrompt
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = actionText
	prompt.ObjectText = objectText
	prompt.KeyboardKeyCode = keyCode
	prompt.MaxActivationDistance = 14
	prompt.RequiresLineOfSight = false
	prompt.HoldDuration = 0
	prompt.Parent = parent
	return prompt
end

-- One player plot: a floor, a nameplate and a grid of slot pads.
local function buildPlot(index: number, parent: Instance): Model
	local angle = (index - 1) * (math.pi * 2 / Config.PLOT_COUNT)
	local centre = Vector3.new(math.cos(angle) * PLOT_RADIUS, 0, math.sin(angle) * PLOT_RADIUS)

	-- Face the hub so every plot's slot grid reads the same way walking in.
	local facing = CFrame.lookAt(centre, Vector3.new(0, centre.Y, 0))

	local plot = Instance.new("Model")
	plot.Name = "Plot" .. index
	plot:SetAttribute("Index", index)
	plot:SetAttribute("OwnerUserId", 0)
	plot.Parent = parent

	local floor = newPart("Floor", Vector3.new(PLOT_SIZE, 1, PLOT_SIZE), facing * CFrame.new(0, 0.5, 0), COLOURS.plotFloor, plot)
	floor.Material = Enum.Material.Concrete
	plot.PrimaryPart = floor

	-- A low kerb, purely so the plot edge is legible from ground level.
	for _, offset in { Vector3.new(0, 0, -PLOT_SIZE / 2), Vector3.new(0, 0, PLOT_SIZE / 2) } do
		newPart("Kerb", Vector3.new(PLOT_SIZE + 2, 1.6, 2), facing * CFrame.new(offset.X, 0.8, offset.Z), COLOURS.plotTrim, plot)
	end
	for _, offset in { Vector3.new(-PLOT_SIZE / 2, 0, 0), Vector3.new(PLOT_SIZE / 2, 0, 0) } do
		newPart("Kerb", Vector3.new(2, 1.6, PLOT_SIZE + 2), facing * CFrame.new(offset.X, 0.8, offset.Z), COLOURS.plotTrim, plot)
	end

	local signPost = newPart("SignPost", Vector3.new(1, 7, 1), facing * CFrame.new(0, 3.5, -PLOT_SIZE / 2 - 2), COLOURS.plotTrim, plot)
	addBillboard(signPost, "Empty Plot", Color3.fromRGB(230, 230, 235), 4.4, 12)

	local slots = Instance.new("Folder")
	slots.Name = "Slots"
	slots.Parent = plot

	for slotIndex = 1, Config.MAX_SLOTS do
		local column = (slotIndex - 1) % SLOT_COLUMNS
		local row = math.floor((slotIndex - 1) / SLOT_COLUMNS)

		local x = (column - (SLOT_COLUMNS - 1) / 2) * SLOT_SPACING
		local rows = math.ceil(Config.MAX_SLOTS / SLOT_COLUMNS)
		local z = (row - (rows - 1) / 2) * SLOT_SPACING

		local pad = newPart(
			"Slot" .. slotIndex,
			Vector3.new(SLOT_PAD_SIZE, 0.4, SLOT_PAD_SIZE),
			facing * CFrame.new(x, 1.2, z),
			COLOURS.slotLocked,
			slots
		)
		pad:SetAttribute("Index", slotIndex)
		pad.Material = Enum.Material.SmoothPlastic
	end

	return plot
end

local function buildHub(parent: Instance)
	local hub = Instance.new("Model")
	hub.Name = "Hub"
	hub.Parent = parent

	local plaza = newPart("Plaza", Vector3.new(72, 1, 72), CFrame.new(0, 0.5, 0), COLOURS.plaza, hub)
	plaza.Material = Enum.Material.Pavement
	hub.PrimaryPart = plaza

	newPart("PlazaTrim", Vector3.new(78, 0.8, 78), CFrame.new(0, 0.2, 0), COLOURS.plazaTrim, hub)

	-- Shop.
	local shop = newPart("ShopStand", Vector3.new(12, 8, 6), CFrame.new(-20, 5, -14), COLOURS.shop, hub)
	newPart("ShopCounter", Vector3.new(14, 1, 3), CFrame.new(-20, 4.2, -10.2), COLOURS.plazaTrim, hub)
	addBillboard(shop, "MATERIALS SHOP", Color3.fromRGB(160, 210, 255), 6, 16)
	local shopPrompt = addPrompt(shop, "Open", "Materials Shop", Enum.KeyCode.E)
	shopPrompt.Name = "ShopPrompt"

	-- Crafting machine.
	local craft = newPart("CraftMachine", Vector3.new(12, 9, 6), CFrame.new(20, 5.5, -14), COLOURS.craft, hub)
	newPart("CraftFunnel", Vector3.new(5, 3, 5), CFrame.new(20, 11.5, -14), COLOURS.plazaTrim, hub)
	addBillboard(craft, "CRAFTING MACHINE", Color3.fromRGB(255, 196, 140), 7, 18)
	local craftPrompt = addPrompt(craft, "Open", "Crafting Machine", Enum.KeyCode.E)
	craftPrompt.Name = "CraftPrompt"

	-- Rebirth plinth.
	local rebirth = newPart("RebirthPlinth", Vector3.new(8, 4, 8), CFrame.new(0, 3, 18), Color3.fromRGB(150, 110, 200), hub)
	rebirth.Material = Enum.Material.Neon
	addBillboard(rebirth, "REBIRTH", Color3.fromRGB(226, 196, 255), 4.5, 12)
	local rebirthPrompt = addPrompt(rebirth, "Open", "Rebirth", Enum.KeyCode.E)
	rebirthPrompt.Name = "RebirthPrompt"

	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "HubSpawn"
	spawn.Size = Vector3.new(12, 1, 12)
	spawn.CFrame = CFrame.new(0, 1.5, 6)
	spawn.Anchored = true
	spawn.Neutral = true
	spawn.Duration = 0
	spawn.Color = Color3.fromRGB(120, 190, 130)
	spawn.Material = Enum.Material.SmoothPlastic
	spawn.TopSurface = Enum.SurfaceType.Smooth
	spawn.Parent = hub

	return hub
end

-- Build the whole map. Safe to call once; later calls clear and rebuild.
function World.build(): Folder
	local existing = workspace:FindFirstChild("World")
	if existing then
		existing:Destroy()
	end

	-- Studio's Baseplate template ships a Baseplate and a SpawnLocation of its
	-- own. Left in place they sit inside the generated ground and steal spawns,
	-- so clear them before building.
	for _, name in { "Baseplate", "SpawnLocation" } do
		local leftover = workspace:FindFirstChild(name)
		if leftover then
			leftover:Destroy()
		end
	end

	local root = Instance.new("Folder")
	root.Name = "World"
	root.Parent = workspace

	local ground = newPart("Ground", Vector3.new(GROUND_SIZE, 2, GROUND_SIZE), CFrame.new(0, -1, 0), COLOURS.ground, root)
	ground.Material = Enum.Material.Grass

	buildHub(root)

	local plots = Instance.new("Folder")
	plots.Name = "Plots"
	plots.Parent = root

	for index = 1, Config.PLOT_COUNT do
		buildPlot(index, plots)
	end

	return root
end

return World

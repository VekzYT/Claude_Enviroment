--!strict
-- Models: builds the brainrot figures out of parts at runtime.
--
-- Everything in the game is generated from code rather than modelled by hand,
-- so the whole project stays inside version control and nothing has to be
-- rebuilt in Studio when a value changes. Swap these for real meshes later --
-- only this file needs to change.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local Models = {}

local function part(name: string, size: Vector3, colour: Color3, material: Enum.Material): Part
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.Color = colour
	p.Material = material
	p.Anchored = true
	p.CanCollide = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	return p
end

local function rounded(p: Part, radius: number)
	local mesh = Instance.new("SpecialMesh")
	mesh.MeshType = Enum.MeshType.Sphere
	mesh.Scale = Vector3.new(1, 1, 1)
	mesh.Parent = p
	local _ = radius
end

-- A shallow "eye": white disc with a dark pupil, both facing +Z.
local function addEyes(model: Model, bodyTop: number, spread: number, scale: number)
	for _, side in { -1, 1 } do
		local white = part("Eye", Vector3.new(0.55, 0.55, 0.2) * scale, Color3.fromRGB(250, 250, 250), Enum.Material.SmoothPlastic)
		rounded(white, 0)
		white.CFrame = CFrame.new(side * spread, bodyTop, -0.62 * scale)
		white.Parent = model

		local pupil = part("Pupil", Vector3.new(0.26, 0.26, 0.18) * scale, Color3.fromRGB(24, 24, 30), Enum.Material.SmoothPlastic)
		rounded(pupil, 0)
		pupil.CFrame = CFrame.new(side * spread, bodyTop, -0.72 * scale)
		pupil.Parent = model
	end
end

-- Build a brainrot figure. The result is anchored, unparented, and has its
-- PrimaryPart set so callers can position it with PivotTo.
function Models.buildBrainrot(brainrotId: string): Model?
	local data = Config.Brainrots[brainrotId]
	if not data then
		return nil
	end

	local model = Instance.new("Model")
	model.Name = brainrotId

	-- Higher tiers are physically bigger, which makes a full plot read at a
	-- glance -- you can see someone's progress from across the map.
	local scale = 1 + (data.tier - 1) * 0.09

	-- An invisible origin at the figure's feet is the PrimaryPart, so callers can
	-- PivotTo a pad surface without knowing how tall this particular tier is.
	local origin = part("Origin", Vector3.new(0.2, 0.2, 0.2), data.colour, Enum.Material.SmoothPlastic)
	origin.CFrame = CFrame.new(0, 0, 0)
	origin.Transparency = 1
	origin.Parent = model
	model.PrimaryPart = origin

	local root = part("Root", Vector3.new(2.2, 2.6, 1.6) * scale, data.colour, Enum.Material.SmoothPlastic)
	root.CFrame = CFrame.new(0, 1.7 * scale, 0)
	root.Parent = model

	local head = part("Head", Vector3.new(1.7, 1.5, 1.5) * scale, data.colour:Lerp(Color3.new(1, 1, 1), 0.18), Enum.Material.SmoothPlastic)
	head.CFrame = CFrame.new(0, 3.6 * scale, 0)
	head.Parent = model

	addEyes(model, 3.75 * scale, 0.42 * scale, scale)

	-- Legs, so it reads as a creature rather than a crate.
	for _, side in { -1, 1 } do
		local leg = part("Leg", Vector3.new(0.5, 1.1, 0.5) * scale, data.colour:Lerp(Color3.new(0, 0, 0), 0.25), Enum.Material.SmoothPlastic)
		leg.CFrame = CFrame.new(side * 0.62 * scale, 0.55 * scale, 0)
		leg.Parent = model
	end

	-- Arms.
	for _, side in { -1, 1 } do
		local arm = part("Arm", Vector3.new(0.45, 1.5, 0.45) * scale, data.colour:Lerp(Color3.new(0, 0, 0), 0.12), Enum.Material.SmoothPlastic)
		arm.CFrame = CFrame.new(side * 1.45 * scale, 2.0 * scale, 0) * CFrame.Angles(0, 0, math.rad(side * -12))
		arm.Parent = model
	end

	-- From Legendary up, add a floating ring so the rare ones are unmistakable.
	if data.tier >= 5 then
		local halo = part("Halo", Vector3.new(2.6, 0.18, 2.6) * scale, Config.Rarities[data.rarity].colour, Enum.Material.Neon)
		halo.CFrame = CFrame.new(0, 4.9 * scale, 0)
		halo.Parent = model

		local light = Instance.new("PointLight")
		light.Color = Config.Rarities[data.rarity].colour
		light.Range = 12
		light.Brightness = 1.4
		light.Parent = halo
	end

	return model
end

-- The floating label above a placed brainrot.
function Models.buildNameplate(brainrotId: string, multiplier: number): BillboardGui?
	local data = Config.Brainrots[brainrotId]
	if not data then
		return nil
	end

	local rarity = Config.Rarities[data.rarity]

	local gui = Instance.new("BillboardGui")
	gui.Name = "Nameplate"
	gui.Size = UDim2.fromScale(7, 2)
	gui.StudsOffset = Vector3.new(0, 5.6, 0)
	gui.AlwaysOnTop = false
	gui.MaxDistance = 120
	gui.LightInfluence = 0

	local title = Instance.new("TextLabel")
	title.Name = "Title"
	title.Size = UDim2.fromScale(1, 0.55)
	title.BackgroundTransparency = 1
	title.Font = Enum.Font.FredokaOne
	title.Text = data.name
	title.TextColor3 = rarity.colour
	title.TextScaled = true
	title.TextStrokeTransparency = 0.35
	title.TextStrokeColor3 = Color3.new(0, 0, 0)
	title.Parent = gui

	local income = Instance.new("TextLabel")
	income.Name = "Income"
	income.Position = UDim2.fromScale(0, 0.55)
	income.Size = UDim2.fromScale(1, 0.45)
	income.BackgroundTransparency = 1
	income.Font = Enum.Font.GothamBold
	income.Text = "$" .. Config.formatNumber(math.floor(data.income * multiplier)) .. "/s"
	income.TextColor3 = Color3.fromRGB(150, 240, 160)
	income.TextScaled = true
	income.TextStrokeTransparency = 0.45
	income.TextStrokeColor3 = Color3.new(0, 0, 0)
	income.Parent = gui

	return gui
end

return Models

--!strict
-- Build: part helpers. Syfon's world was modelled in Godot scenes; here it is
-- assembled from primitives at runtime, so the whole map stays in source.

local Build = {}

export type PartSpec = {
	size: Vector3,
	cframe: CFrame,
	colour: Color3,
	material: Enum.Material?,
	anchored: boolean?,
	canCollide: boolean?,
	transparency: number?,
	name: string?,
}

function Build.part(spec: PartSpec, parent: Instance?): Part
	local p = Instance.new("Part")
	p.Name = spec.name or "Part"
	p.Size = spec.size
	p.CFrame = spec.cframe
	p.Color = spec.colour
	p.Material = spec.material or Enum.Material.SmoothPlastic
	p.Anchored = if spec.anchored == nil then true else spec.anchored
	p.CanCollide = if spec.canCollide == nil then true else spec.canCollide
	p.Transparency = spec.transparency or 0
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = parent
	return p
end

function Build.wedge(spec: PartSpec, parent: Instance?): WedgePart
	local p = Instance.new("WedgePart")
	p.Name = spec.name or "Wedge"
	p.Size = spec.size
	p.CFrame = spec.cframe
	p.Color = spec.colour
	p.Material = spec.material or Enum.Material.SmoothPlastic
	p.Anchored = if spec.anchored == nil then true else spec.anchored
	p.CanCollide = if spec.canCollide == nil then true else spec.canCollide
	p.Parent = parent
	return p
end

function Build.label(adornee: BasePart, text: string, colour: Color3, offsetY: number, width: number): BillboardGui
	local gui = Instance.new("BillboardGui")
	gui.Name = "Label"
	gui.Size = UDim2.fromScale(width, width * 0.3)
	gui.StudsOffset = Vector3.new(0, offsetY, 0)
	gui.MaxDistance = 260
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

-- Deterministic per-arena randomness, so every arena builds the same forest and
-- a bug reported in one is reproducible in another.
function Build.rng(seed: number): Random
	return Random.new(seed)
end

return Build

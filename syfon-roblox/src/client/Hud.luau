--!strict
-- Hud: the interface, and the look of the world.
--
-- This file owns Lighting on purpose. Roblox has a single global Lighting, which
-- would force every arena to share one time of day -- but a LocalScript writing
-- to it only affects that client. So the server reports each run's clock and
-- each player draws their own sky from it, which is what lets one party be at
-- noon while another is at midnight in the same server.

local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Tuning = require(Shared:WaitForChild("Tuning"))

local Hud = {}

local INK = Color3.fromRGB(236, 233, 228)
local DIM = Color3.fromRGB(150, 148, 146)
local PANEL = Color3.fromRGB(16, 16, 19)
local BLOOD = Color3.fromRGB(190, 66, 56)
local BREATH = Color3.fromRGB(108, 168, 208)
local BREAD = Color3.fromRGB(202, 160, 88)

local screen: ScreenGui
local fills: { [string]: Frame } = {}
local dayLabel: TextLabel
local hordeLabel: TextLabel
local stockLabel: TextLabel
local objectiveLabel: TextLabel
local hintLabel: TextLabel
local bannerLabel: TextLabel
local buildLabel: TextLabel
local flash: Frame

local atmosphere: Atmosphere
local clouds: Clouds
local bloom: BloomEffect
local colour: ColorCorrectionEffect
local sunRays: SunRaysEffect
local depth: DepthOfFieldEffect

local lastHealth = Tuning.MAX_HEALTH
local shake = 0

--------------------------------------------------------------------------------
-- Builders
--------------------------------------------------------------------------------

local function corner(parent: Instance, radius: number)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, radius)
	c.Parent = parent
end

local function frame(name: string, parent: Instance): Frame
	local f = Instance.new("Frame")
	f.Name = name
	f.BorderSizePixel = 0
	f.BackgroundColor3 = PANEL
	f.Parent = parent
	return f
end

local function text(name: string, parent: Instance, size: number): TextLabel
	local l = Instance.new("TextLabel")
	l.Name = name
	l.BackgroundTransparency = 1
	l.Font = Enum.Font.GothamMedium
	l.TextColor3 = INK
	l.TextSize = size
	l.TextXAlignment = Enum.TextXAlignment.Left
	l.RichText = true
	l.Parent = parent
	return l
end

local function meter(name: string, y: number, tint: Color3, parent: Instance)
	local track = frame(name .. "Track", parent)
	track.Size = UDim2.fromOffset(196, 10)
	track.Position = UDim2.fromOffset(0, y)
	track.BackgroundColor3 = Color3.fromRGB(24, 24, 27)
	track.BackgroundTransparency = 0.15
	corner(track, 5)

	local fill = frame(name, track)
	fill.Size = UDim2.fromScale(1, 1)
	fill.BackgroundColor3 = tint
	corner(fill, 5)
	fills[name] = fill
end

--------------------------------------------------------------------------------
-- The world's look
--------------------------------------------------------------------------------

local function setupWorldLook()
	local function ensure<T>(className: string, parent: Instance): any
		local found = parent:FindFirstChildOfClass(className)
		if found then
			return found
		end
		local made = Instance.new(className :: any)
		made.Parent = parent
		return made
	end

	atmosphere = ensure("Atmosphere", Lighting)
	bloom = ensure("BloomEffect", Lighting)
	colour = ensure("ColorCorrectionEffect", Lighting)
	sunRays = ensure("SunRaysEffect", Lighting)
	depth = ensure("DepthOfFieldEffect", Lighting)
	clouds = ensure("Clouds", workspace.Terrain)

	Lighting.GlobalShadows = true
	Lighting.EnvironmentDiffuseScale = 0.6
	Lighting.EnvironmentSpecularScale = 0.4
	Lighting.ShadowSoftness = 0.35

	bloom.Intensity = 0.7
	bloom.Size = 26
	bloom.Threshold = 1.1

	sunRays.Intensity = 0.09
	sunRays.Spread = 0.85

	-- A long focus with a wide near-field: enough haze on the mountains to give
	-- the valley depth, without blurring anything the player is holding.
	depth.FarIntensity = 0.14
	depth.FocusDistance = 90
	depth.InFocusRadius = 240
	depth.NearIntensity = 0

	clouds.Cover = 0.62
	clouds.Density = 0.55
	clouds.Color = Color3.fromRGB(226, 226, 232)
end

-- Syfon's sun keyframes, reduced to what Roblox's Lighting exposes.
local function applySky(timeOfDay: number, horde: boolean)
	Lighting.ClockTime = timeOfDay * 24

	local night = timeOfDay < Tuning.SUNRISE or timeOfDay > Tuning.SUNSET
	local dayness = if night then 0
		elseif timeOfDay < 0.5 then math.clamp((timeOfDay - Tuning.SUNRISE) / 0.14, 0, 1)
		else math.clamp((Tuning.SUNSET - timeOfDay) / 0.14, 0, 1)

	Lighting.Ambient = Color3.fromRGB(22, 26, 42):Lerp(Color3.fromRGB(92, 92, 100), dayness)
	Lighting.OutdoorAmbient = Color3.fromRGB(34, 40, 62):Lerp(Color3.fromRGB(146, 146, 156), dayness)
	Lighting.Brightness = 0.6 + dayness * 2.2
	Lighting.FogEnd = 340 + dayness * 900

	atmosphere.Density = 0.44 - dayness * 0.16
	atmosphere.Offset = 0.15
	atmosphere.Color = Color3.fromRGB(112, 126, 164):Lerp(Color3.fromRGB(200, 202, 208), dayness)
	atmosphere.Decay = Color3.fromRGB(88, 96, 128):Lerp(Color3.fromRGB(160, 150, 140), dayness)
	atmosphere.Haze = 2.6 - dayness * 1.2

	clouds.Cover = 0.62
	sunRays.Intensity = 0.03 + dayness * 0.09
	bloom.Intensity = 0.5 + dayness * 0.35

	if horde then
		-- Night ten looks wrong on purpose: colour drains out, the fog closes
		-- in, and everything goes slightly red.
		colour.Saturation = -0.45
		colour.TintColor = Color3.fromRGB(255, 206, 200)
		colour.Contrast = 0.18
		colour.Brightness = -0.04
		atmosphere.Density = 0.55
		atmosphere.Color = Color3.fromRGB(96, 78, 84)
		Lighting.FogEnd = 220
		clouds.Cover = 0.9
		clouds.Color = Color3.fromRGB(120, 104, 108)
	else
		colour.Saturation = 0.06
		colour.TintColor = Color3.fromRGB(255, 250, 244)
		colour.Contrast = 0.08
		colour.Brightness = 0
		clouds.Color = Color3.fromRGB(226, 226, 232)
	end
end

--------------------------------------------------------------------------------

function Hud.build()
	local player = Players.LocalPlayer
	local playerGui = player:WaitForChild("PlayerGui")

	local existing = playerGui:FindFirstChild("Syfon")
	if existing then
		existing:Destroy()
	end

	screen = Instance.new("ScreenGui")
	screen.Name = "Syfon"
	screen.ResetOnSpawn = false
	screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	screen.Parent = playerGui

	-- Full-screen tint, flashed on damage.
	flash = frame("Flash", screen)
	flash.Size = UDim2.fromScale(1, 1)
	flash.BackgroundColor3 = BLOOD
	flash.BackgroundTransparency = 1
	flash.ZIndex = 20

	-- Bottom left: the three things that can kill you.
	local vitals = frame("Vitals", screen)
	vitals.Size = UDim2.fromOffset(196, 44)
	vitals.Position = UDim2.new(0, 24, 1, -80)
	vitals.BackgroundTransparency = 1

	meter("Health", 0, BLOOD, vitals)
	meter("Stamina", 16, BREATH, vitals)
	meter("Hunger", 32, BREAD, vitals)

	-- Top left: the clock everything counts against.
	local clock = frame("Clock", screen)
	clock.Size = UDim2.fromOffset(250, 74)
	clock.Position = UDim2.fromOffset(24, 24)
	clock.BackgroundTransparency = 1

	dayLabel = text("Day", clock, 34)
	dayLabel.Size = UDim2.fromOffset(250, 36)
	dayLabel.Font = Enum.Font.FredokaOne

	hordeLabel = text("Horde", clock, 16)
	hordeLabel.Position = UDim2.fromOffset(0, 37)
	hordeLabel.Size = UDim2.fromOffset(250, 20)
	hordeLabel.TextColor3 = DIM

	stockLabel = text("Stock", clock, 15)
	stockLabel.Position = UDim2.fromOffset(0, 57)
	stockLabel.Size = UDim2.fromOffset(250, 20)
	stockLabel.TextColor3 = DIM

	-- Bottom centre: what to do next.
	objectiveLabel = text("Objective", screen, 18)
	objectiveLabel.Size = UDim2.new(0, 700, 0, 24)
	objectiveLabel.Position = UDim2.new(0.5, -350, 1, -64)
	objectiveLabel.TextXAlignment = Enum.TextXAlignment.Center

	hintLabel = text("Hint", screen, 14)
	hintLabel.Size = UDim2.new(0, 700, 0, 20)
	hintLabel.Position = UDim2.new(0.5, -350, 1, -42)
	hintLabel.TextXAlignment = Enum.TextXAlignment.Center
	hintLabel.TextColor3 = DIM

	bannerLabel = text("Banner", screen, 23)
	bannerLabel.Size = UDim2.new(0, 640, 0, 42)
	bannerLabel.Position = UDim2.new(0.5, -320, 0, 92)
	bannerLabel.TextXAlignment = Enum.TextXAlignment.Center
	bannerLabel.Font = Enum.Font.FredokaOne
	bannerLabel.TextTransparency = 1
	bannerLabel.TextStrokeTransparency = 1
	bannerLabel.TextStrokeColor3 = Color3.new(0, 0, 0)

	-- Build mode's own status line, above the objective.
	buildLabel = text("BuildStatus", screen, 15)
	buildLabel.Size = UDim2.new(0, 860, 0, 22)
	buildLabel.Position = UDim2.new(0.5, -430, 1, -92)
	buildLabel.TextXAlignment = Enum.TextXAlignment.Center
	buildLabel.Visible = false

	setupWorldLook()

	-- Camera shake, driven by whatever set `shake`.
	RunService.RenderStepped:Connect(function(dt: number)
		if shake <= 0 then
			return
		end
		shake = math.max(shake - dt * 2.6, 0)
		local camera = workspace.CurrentCamera
		if camera then
			local amount = shake * 1.4
			camera.CFrame = camera.CFrame * CFrame.Angles(
				math.rad((math.random() - 0.5) * amount),
				math.rad((math.random() - 0.5) * amount),
				math.rad((math.random() - 0.5) * amount * 0.5))
		end
	end)
end

local function setMeter(name: string, fraction: number)
	local fill = fills[name]
	if fill then
		TweenService:Create(fill, TweenInfo.new(0.18), {
			Size = UDim2.fromScale(math.clamp(fraction, 0, 1), 1),
		}):Play()
	end
end

function Hud.update(state: { [string]: any })
	if not state.inRun then
		dayLabel.Text = "SYFON"
		hordeLabel.Text = "step onto a pad to go in"
		stockLabel.Text = ""
		objectiveLabel.Text = "SOLO   ·   DUO   ·   TRIO   ·   SQUAD"
		hintLabel.Text = "stand on a pad and wait for it to fill"
		setMeter("Health", 1)
		setMeter("Stamina", 1)
		setMeter("Hunger", 1)
		applySky(0.42, false)
		lastHealth = Tuning.MAX_HEALTH
		return
	end

	-- Losing health flashes the screen and knocks the camera.
	if state.health < lastHealth - 0.5 then
		shake = math.min(shake + 1.6, 4)
		flash.BackgroundTransparency = 0.72
		TweenService:Create(flash, TweenInfo.new(0.5), { BackgroundTransparency = 1 }):Play()
	end
	lastHealth = state.health

	setMeter("Health", state.health / Tuning.MAX_HEALTH)
	setMeter("Stamina", state.stamina)
	setMeter("Hunger", state.hunger)

	dayLabel.Text = "DAY " .. tostring(state.day)

	local horde = state.state == "horde"
	if horde then
		hordeLabel.Text = "<font color='#BE4238'>they are here</font>"
	elseif state.daysLeft <= 0 then
		hordeLabel.Text = "<font color='#BE4238'>they come tonight</font>"
	else
		hordeLabel.Text = string.format("%d day%s until they come",
			state.daysLeft, if state.daysLeft == 1 then "" else "s")
	end

	stockLabel.Text = string.format(
		"%d wood  ·  %d flint  ·  %d coins  ·  %d arrows%s%s",
		state.wood, state.flint, state.coins, state.arrows,
		if state.carryingLog then "   <font color='#CAA058'>carrying a log</font>" else "",
		if state.lampOn then "   <font color='#E2BC68'>lamp lit</font>" else "")

	local step = Tuning.Objectives[state.objective]
	if horde then
		objectiveLabel.Text = "Survive until dawn"
		hintLabel.Text = "swing with the axe  ·  R looses an arrow  ·  they do not stop coming"
	elseif step then
		objectiveLabel.Text = step.text
		hintLabel.Text = step.hint
	else
		objectiveLabel.Text = ""
		hintLabel.Text = ""
	end

	applySky(state.timeOfDay, horde)
end

function Hud.buildStatus(): TextLabel
	return buildLabel
end

function Hud.announce(message: string)
	bannerLabel.Text = message
	bannerLabel.TextTransparency = 0
	bannerLabel.TextStrokeTransparency = 0.35

	task.delay(3.4, function()
		TweenService:Create(bannerLabel, TweenInfo.new(0.9), {
			TextTransparency = 1, TextStrokeTransparency = 1,
		}):Play()
	end)
end

return Hud

--!strict
-- Hud: the bars, the day chip, the objective line and the banner.
--
-- Also owns the sky. Roblox has a single global Lighting, but a LocalScript
-- writing to it only affects that client -- which is the trick that lets four
-- arenas sit at four different times of day in one server.

local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Tuning = require(Shared:WaitForChild("Tuning"))

local Hud = {}

local INK = Color3.fromRGB(232, 230, 226)
local DIM = Color3.fromRGB(154, 152, 150)
local BLOOD = Color3.fromRGB(198, 74, 62)
local BREATH = Color3.fromRGB(122, 176, 214)
local BREAD = Color3.fromRGB(206, 166, 92)

local screen: ScreenGui
local bars: { [string]: Frame } = {}
local dayLabel: TextLabel
local hordeLabel: TextLabel
local stockLabel: TextLabel
local objectiveLabel: TextLabel
local hintLabel: TextLabel
local bannerLabel: TextLabel
local bannerFrame: Frame

local atmosphere: Atmosphere

local function frame(name: string, parent: Instance): Frame
	local f = Instance.new("Frame")
	f.Name = name
	f.BorderSizePixel = 0
	f.BackgroundColor3 = Color3.fromRGB(18, 18, 20)
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

local function bar(name: string, y: number, colour: Color3, parent: Instance): Frame
	local track = frame(name .. "Track", parent)
	track.Size = UDim2.fromOffset(190, 9)
	track.Position = UDim2.fromOffset(0, y)
	track.BackgroundColor3 = Color3.fromRGB(30, 30, 34)
	track.BackgroundTransparency = 0.25

	local fill = frame(name, track)
	fill.Size = UDim2.fromScale(1, 1)
	fill.BackgroundColor3 = colour
	bars[name] = fill

	return fill
end

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
	screen.IgnoreGuiInset = false
	screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	screen.Parent = playerGui

	-- Bottom left: the three things that can kill you.
	local vitals = frame("Vitals", screen)
	vitals.Size = UDim2.fromOffset(190, 40)
	vitals.Position = UDim2.new(0, 22, 1, -74)
	vitals.BackgroundTransparency = 1

	bar("Health", 0, BLOOD, vitals)
	bar("Stamina", 14, BREATH, vitals)
	bar("Hunger", 28, BREAD, vitals)

	-- Top left: the clock everything counts against.
	local clock = frame("Clock", screen)
	clock.Size = UDim2.fromOffset(220, 62)
	clock.Position = UDim2.fromOffset(22, 22)
	clock.BackgroundTransparency = 1

	dayLabel = text("Day", clock, 30)
	dayLabel.Size = UDim2.fromOffset(220, 32)
	dayLabel.Font = Enum.Font.FredokaOne

	hordeLabel = text("Horde", clock, 15)
	hordeLabel.Position = UDim2.fromOffset(0, 32)
	hordeLabel.Size = UDim2.fromOffset(220, 18)
	hordeLabel.TextColor3 = DIM

	stockLabel = text("Stock", clock, 15)
	stockLabel.Position = UDim2.fromOffset(0, 50)
	stockLabel.Size = UDim2.fromOffset(220, 18)
	stockLabel.TextColor3 = DIM

	-- Bottom centre: what to do next.
	objectiveLabel = text("Objective", screen, 17)
	objectiveLabel.Size = UDim2.new(0, 620, 0, 22)
	objectiveLabel.Position = UDim2.new(0.5, -310, 1, -60)
	objectiveLabel.TextXAlignment = Enum.TextXAlignment.Center

	hintLabel = text("Hint", screen, 14)
	hintLabel.Size = UDim2.new(0, 620, 0, 20)
	hintLabel.Position = UDim2.new(0.5, -310, 1, -40)
	hintLabel.TextXAlignment = Enum.TextXAlignment.Center
	hintLabel.TextColor3 = DIM

	-- Upper centre: announcements.
	bannerFrame = frame("Banner", screen)
	bannerFrame.Size = UDim2.new(0, 560, 0, 40)
	bannerFrame.Position = UDim2.new(0.5, -280, 0, 96)
	bannerFrame.BackgroundTransparency = 1

	bannerLabel = text("BannerText", bannerFrame, 21)
	bannerLabel.Size = UDim2.fromScale(1, 1)
	bannerLabel.TextXAlignment = Enum.TextXAlignment.Center
	bannerLabel.Font = Enum.Font.FredokaOne
	bannerLabel.TextTransparency = 1
	bannerLabel.TextStrokeTransparency = 1

	-- The sky. Built once, driven per frame from the run's clock.
	local found = Lighting:FindFirstChildOfClass("Atmosphere")
	if found then
		atmosphere = found
	else
		atmosphere = Instance.new("Atmosphere")
		atmosphere.Parent = Lighting
	end
	Lighting.GlobalShadows = true
	Lighting.Brightness = 2
end

--------------------------------------------------------------------------------

local function setBar(name: string, fraction: number)
	local fill = bars[name]
	if fill then
		fill.Size = UDim2.fromScale(math.clamp(fraction, 0, 1), 1)
	end
end

-- Syfon's sun keyframes, reduced to what Roblox's Lighting actually exposes.
local function applySky(timeOfDay: number)
	Lighting.ClockTime = timeOfDay * 24

	local isNight = timeOfDay < Tuning.SUNRISE or timeOfDay > Tuning.SUNSET

	if isNight then
		Lighting.Ambient = Color3.fromRGB(28, 32, 48)
		Lighting.OutdoorAmbient = Color3.fromRGB(38, 44, 66)
		Lighting.Brightness = 1
		atmosphere.Density = 0.42
		atmosphere.Color = Color3.fromRGB(120, 132, 168)
		atmosphere.Haze = 2.4
	else
		-- Dawn and dusk sit between the two, which is where the original spent
		-- most of its keyframes.
		local dayness = if timeOfDay < 0.5
			then math.clamp((timeOfDay - Tuning.SUNRISE) / 0.16, 0, 1)
			else math.clamp((Tuning.SUNSET - timeOfDay) / 0.16, 0, 1)

		Lighting.Ambient = Color3.fromRGB(28, 32, 48):Lerp(Color3.fromRGB(96, 96, 104), dayness)
		Lighting.OutdoorAmbient = Color3.fromRGB(38, 44, 66):Lerp(Color3.fromRGB(140, 140, 150), dayness)
		Lighting.Brightness = 1 + dayness * 1.6
		atmosphere.Density = 0.42 - dayness * 0.14
		atmosphere.Color = Color3.fromRGB(120, 132, 168):Lerp(Color3.fromRGB(198, 200, 206), dayness)
		atmosphere.Haze = 2.4 - dayness * 1.1
	end
end

function Hud.update(state: { [string]: any })
	if not state.inRun then
		dayLabel.Text = "SYFON"
		hordeLabel.Text = "step on a pad to go in"
		stockLabel.Text = ""
		objectiveLabel.Text = "SOLO  ·  DUO  ·  TRIO  ·  SQUAD"
		hintLabel.Text = "stand on a pad and wait for it to fill"
		setBar("Health", 1)
		setBar("Stamina", 1)
		setBar("Hunger", 1)
		applySky(0.42)
		return
	end

	setBar("Health", state.health / Tuning.MAX_HEALTH)
	setBar("Stamina", state.stamina)
	setBar("Hunger", state.hunger)

	dayLabel.Text = "DAY " .. tostring(state.day)

	if state.state == "horde" then
		hordeLabel.Text = "<font color='#C64A3E'>they are here</font>"
	elseif state.daysLeft <= 0 then
		hordeLabel.Text = "<font color='#C64A3E'>they come tonight</font>"
	else
		hordeLabel.Text = string.format("%d day%s until they come",
			state.daysLeft, if state.daysLeft == 1 then "" else "s")
	end

	stockLabel.Text = string.format("%d wood  ·  %d coins%s",
		state.wood, state.coins,
		if state.carryingLog then "  ·  <font color='#CEA65C'>carrying a log</font>" else "")

	local step = Tuning.Objectives[state.objective]
	if step and state.state ~= "horde" then
		objectiveLabel.Text = step.text
		hintLabel.Text = step.hint
	elseif state.state == "horde" then
		objectiveLabel.Text = "Survive until dawn"
		hintLabel.Text = "left click to swing  ·  they do not stop coming"
	else
		objectiveLabel.Text = ""
		hintLabel.Text = ""
	end

	applySky(state.timeOfDay)
end

function Hud.announce(message: string)
	bannerLabel.Text = message
	bannerLabel.TextTransparency = 0
	bannerLabel.TextStrokeTransparency = 0.4

	TweenService:Create(bannerLabel, TweenInfo.new(0.35), {
		TextTransparency = 0, TextStrokeTransparency = 0.4,
	}):Play()

	task.delay(3.4, function()
		TweenService:Create(bannerLabel, TweenInfo.new(0.8), {
			TextTransparency = 1, TextStrokeTransparency = 1,
		}):Play()
	end)
end

return Hud

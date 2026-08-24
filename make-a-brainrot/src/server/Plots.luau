--!strict
-- Plots: hands out a plot to each player and keeps its slots looking like
-- whatever the player's profile says is on them.
--
-- Rendering is diffed rather than rebuilt: a pad remembers what figure it is
-- currently showing in an attribute, so a sync that changes one slot does not
-- destroy and respawn nineteen models the player is looking at.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Models = require(Shared:WaitForChild("Models"))

local Plots = {}

local SLOT_OPEN = Color3.fromRGB(112, 176, 118)
local SLOT_LOCKED = Color3.fromRGB(78, 74, 70)
local SLOT_FILLED = Color3.fromRGB(96, 140, 100)

local assignments: { [Player]: Model } = {}
local plotsFolder: Folder? = nil

function Plots.setRoot(worldRoot: Folder)
	local folder = worldRoot:FindFirstChild("Plots")
	if folder and folder:IsA("Folder") then
		plotsFolder = folder
	end
end

local function setSignText(plot: Model, text: string, colour: Color3)
	local post = plot:FindFirstChild("SignPost")
	if not post then
		return
	end
	local gui = post:FindFirstChild("Label")
	if not gui then
		return
	end
	local label = gui:FindFirstChild("Text")
	if label and label:IsA("TextLabel") then
		label.Text = text
		label.TextColor3 = colour
	end
end

-- Give the player the first free plot. Returns nil when the server is full,
-- which the caller has to cope with rather than assume away.
function Plots.assign(player: Player): Model?
	local existing = assignments[player]
	if existing then
		return existing
	end

	local folder = plotsFolder
	if not folder then
		return nil
	end

	for _, child in folder:GetChildren() do
		if child:IsA("Model") and child:GetAttribute("OwnerUserId") == 0 then
			child:SetAttribute("OwnerUserId", player.UserId)
			assignments[player] = child
			setSignText(child, player.DisplayName, Color3.fromRGB(255, 240, 190))
			return child
		end
	end

	return nil
end

function Plots.plotFor(player: Player): Model?
	return assignments[player]
end

-- Hand the plot back and strip it so the next player gets a clean one.
function Plots.release(player: Player)
	local plot = assignments[player]
	assignments[player] = nil
	if not plot then
		return
	end

	plot:SetAttribute("OwnerUserId", 0)
	setSignText(plot, "Empty Plot", Color3.fromRGB(230, 230, 235))

	local slots = plot:FindFirstChild("Slots")
	if not slots then
		return
	end

	for _, pad in slots:GetChildren() do
		if pad:IsA("BasePart") then
			local figure = pad:FindFirstChild("Figure")
			if figure then
				figure:Destroy()
			end
			pad:SetAttribute("Rendered", "")
			pad.Color = SLOT_LOCKED
		end
	end
end

-- Redraw the plot to match the profile. Called after every state change.
function Plots.refresh(player: Player, placed: { string }, rebirths: number)
	local plot = assignments[player]
	if not plot then
		return
	end

	local slots = plot:FindFirstChild("Slots")
	if not slots then
		return
	end

	local available = Config.slotsForRebirth(rebirths)
	local multiplier = Config.incomeMultiplier(rebirths)

	for index = 1, Config.MAX_SLOTS do
		local pad = slots:FindFirstChild("Slot" .. index)
		if pad and pad:IsA("BasePart") then
			local unlocked = index <= available
			local wanted = if unlocked then (placed[index] or "") else ""
			local current = pad:GetAttribute("Rendered")

			if current ~= wanted then
				local figure = pad:FindFirstChild("Figure")
				if figure then
					figure:Destroy()
				end

				if wanted ~= "" then
					local model = Models.buildBrainrot(wanted)
					if model then
						model.Name = "Figure"
						model:PivotTo(pad.CFrame * CFrame.new(0, 0.2, 0))
						model.Parent = pad

						local nameplate = Models.buildNameplate(wanted, multiplier)
						local primary = model.PrimaryPart
						if nameplate and primary then
							nameplate.Adornee = primary
							nameplate.Parent = primary
						end
					end
				end

				pad:SetAttribute("Rendered", wanted)
			end

			if not unlocked then
				pad.Color = SLOT_LOCKED
			elseif wanted ~= "" then
				pad.Color = SLOT_FILLED
			else
				pad.Color = SLOT_OPEN
			end
		end
	end
end

-- Put a player on their own plot. Used once, right after they spawn.
function Plots.sendToPlot(player: Player)
	local plot = assignments[player]
	if not plot then
		return
	end

	local floor = plot:FindFirstChild("Floor")
	if not floor or not floor:IsA("BasePart") then
		return
	end

	local character = player.Character
	if not character then
		return
	end

	local root = character:FindFirstChild("HumanoidRootPart")
	if root and root:IsA("BasePart") then
		root.CFrame = floor.CFrame * CFrame.new(0, 5, 0)
	end
end

return Plots

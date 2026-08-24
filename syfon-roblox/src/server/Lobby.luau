--!strict
-- Lobby: where you land, and where you pick who you are going in with.
--
-- Four pads, one per party size. Standing on one puts you in that queue; the
-- queue starts a run the moment it is full. Solo starts the instant you step on.
--
-- Occupancy is polled rather than driven by Touched. Touched misfires when a
-- character is standing perfectly still on a part, which is exactly what a
-- player waiting on a matchmaking pad does.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Build = require(Shared:WaitForChild("Build"))

local Lobby = {}

local ORIGIN = Vector3.new(-3000, 0, 0)
local PAD_SIZE = 16
local PAD_GAP = 26
local POLL_INTERVAL = 0.4
local SOLO_DELAY = 2 -- brief pause so a stray step does not launch a run

export type Pad = {
	id: string,
	label: string,
	size: number,
	part: Part,
	sign: TextLabel,
	queue: { Player },
	countdown: number,
}

local pads: { Pad } = {}
local spawnCFrame = CFrame.new(ORIGIN.X, 6, ORIGIN.Z + 30)

-- Set by init.server: called with the party once a queue fills.
Lobby.onPartyReady = nil :: ((players: { Player }, size: number) -> boolean)?

local PAD_SPECS = {
	{ id = "solo", label = "SOLO", size = 1, colour = Color3.fromRGB(148, 156, 170) },
	{ id = "duo", label = "DUO", size = 2, colour = Color3.fromRGB(96, 148, 196) },
	{ id = "trio", label = "TRIO", size = 3, colour = Color3.fromRGB(122, 172, 108) },
	{ id = "squad", label = "SQUAD", size = 4, colour = Color3.fromRGB(206, 148, 82) },
}

function Lobby.spawn(): CFrame
	return spawnCFrame
end

local function updateSign(pad: Pad)
	if pad.size == 1 then
		pad.sign.Text = string.format("%s\n%s", pad.label,
			if #pad.queue > 0 then string.format("starting in %d", math.max(1, math.ceil(pad.countdown))) else "step on to begin")
	else
		pad.sign.Text = string.format("%s\n%d / %d waiting", pad.label, #pad.queue, pad.size)
	end
end

function Lobby.build()
	local folder = Instance.new("Folder")
	folder.Name = "Lobby"
	folder.Parent = workspace

	Build.part({ name = "Floor", size = Vector3.new(220, 4, 160),
		cframe = CFrame.new(ORIGIN.X, -2, ORIGIN.Z),
		colour = Color3.fromRGB(64, 66, 74), material = Enum.Material.Slate }, folder)

	-- A low wall so the lobby reads as a place rather than a floating slab.
	for _, spec in {
		{ Vector3.new(220, 14, 3), Vector3.new(0, 7, -80) },
		{ Vector3.new(220, 14, 3), Vector3.new(0, 7, 80) },
		{ Vector3.new(3, 14, 160), Vector3.new(-110, 7, 0) },
		{ Vector3.new(3, 14, 160), Vector3.new(110, 7, 0) },
	} do
		Build.part({ name = "Wall", size = spec[1],
			cframe = CFrame.new(ORIGIN + spec[2]),
			colour = Color3.fromRGB(48, 50, 58), material = Enum.Material.Concrete }, folder)
	end

	local title = Build.part({ name = "Sign", size = Vector3.new(60, 10, 2),
		cframe = CFrame.new(ORIGIN.X, 16, ORIGIN.Z - 60),
		colour = Color3.fromRGB(40, 42, 50), material = Enum.Material.Metal }, folder)
	Build.label(title, "SYFON", Color3.fromRGB(226, 92, 72), 8, 26)
	Build.label(title, "ten days until they come", Color3.fromRGB(190, 190, 200), 2, 22)

	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "LobbySpawn"
	spawn.Size = Vector3.new(18, 1, 18)
	spawn.CFrame = CFrame.new(ORIGIN.X, 0.5, ORIGIN.Z + 40)
	spawn.Anchored = true
	spawn.Neutral = true
	spawn.Duration = 0
	spawn.Color = Color3.fromRGB(88, 92, 102)
	spawn.Material = Enum.Material.SmoothPlastic
	spawn.TopSurface = Enum.SurfaceType.Smooth
	spawn.Parent = folder
	spawnCFrame = spawn.CFrame * CFrame.new(0, 4, 0)

	local total = #PAD_SPECS
	for index, spec in PAD_SPECS do
		local x = ORIGIN.X + (index - (total + 1) / 2) * (PAD_SIZE + PAD_GAP)
		local part = Build.part({ name = "Pad_" .. spec.id,
			size = Vector3.new(PAD_SIZE, 1, PAD_SIZE),
			cframe = CFrame.new(x, 0.5, ORIGIN.Z - 20),
			colour = spec.colour, material = Enum.Material.Neon }, folder)

		local gui = Build.label(part, spec.label, Color3.new(1, 1, 1), 7, 14)
		local sign = gui:FindFirstChild("Text") :: TextLabel
		sign.TextScaled = false
		sign.TextSize = 26
		sign.Font = Enum.Font.GothamBold

		table.insert(pads, {
			id = spec.id, label = spec.label, size = spec.size,
			part = part, sign = sign, queue = {}, countdown = SOLO_DELAY,
		})
	end

	for _, pad in pads do
		updateSign(pad)
	end
end

local function standingOn(pad: Pad, player: Player): boolean
	local character = player.Character
	if not character then
		return false
	end
	local root = character:FindFirstChild("HumanoidRootPart")
	if not root or not root:IsA("BasePart") then
		return false
	end
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health <= 0 then
		return false
	end

	local offset = root.Position - pad.part.Position
	return math.abs(offset.X) <= PAD_SIZE / 2 + 1
		and math.abs(offset.Z) <= PAD_SIZE / 2 + 1
		and math.abs(offset.Y) <= 12
end

-- Remove a player from every queue -- used when they leave, or when a run takes
-- them, so they cannot sit in two queues at once.
function Lobby.withdraw(player: Player)
	for _, pad in pads do
		local index = table.find(pad.queue, player)
		if index then
			table.remove(pad.queue, index)
			if pad.size == 1 then
				pad.countdown = SOLO_DELAY
			end
			updateSign(pad)
		end
	end
end

function Lobby.start()
	task.spawn(function()
		while true do
			task.wait(POLL_INTERVAL)

			for _, pad in pads do
				-- Refresh who is actually on the pad right now.
				local present: { Player } = {}
				for _, player in Players:GetPlayers() do
					if standingOn(pad, player) then
						table.insert(present, player)
					end
				end

				local changed = #present ~= #pad.queue
				if not changed then
					for _, player in present do
						if not table.find(pad.queue, player) then
							changed = true
							break
						end
					end
				end

				if changed then
					pad.queue = present
					if pad.size == 1 then
						pad.countdown = SOLO_DELAY
					end
				end

				local ready = false
				if pad.size == 1 then
					if #pad.queue >= 1 then
						pad.countdown -= POLL_INTERVAL
						ready = pad.countdown <= 0
					end
				else
					ready = #pad.queue >= pad.size
				end

				if ready then
					local party = table.clone(pad.queue)
					local handler = Lobby.onPartyReady
					if handler and handler(party, pad.size) then
						for _, player in party do
							Lobby.withdraw(player)
						end
					end
				end

				updateSign(pad)
			end
		end
	end)
end

return Lobby

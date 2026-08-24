--!strict
-- Server entry point. Builds the map, then wires players to their data.

local Players = game:GetService("Players")

local World = require(script:WaitForChild("World"))
local Plots = require(script:WaitForChild("Plots"))
local Data = require(script:WaitForChild("Data"))
local Economy = require(script:WaitForChild("Economy"))

local worldRoot = World.build()
Plots.setRoot(worldRoot)

Data.start()
Economy.start()

local function onPlayerAdded(player: Player)
	Economy.onPlayerAdded(player)

	-- Loading yields on a DataStore call, so the player may already have left.
	local profile = Data.load(player)
	if not player.Parent then
		Data.release(player)
		return
	end

	local plot = Plots.assign(player)
	if not plot then
		warn(string.format("[Server] no free plot for %s -- server is over capacity", player.Name))
	end

	Economy.sync(player)

	-- Put them on their own plot the first time they spawn, then leave them be.
	local placed = false
	local function onCharacter()
		if placed then
			return
		end
		placed = true
		task.wait(0.2)
		Plots.sendToPlot(player)
	end

	if player.Character then
		task.spawn(onCharacter)
	end
	player.CharacterAdded:Connect(onCharacter)

	local _ = profile
end

local function onPlayerRemoving(player: Player)
	Plots.release(player)
	Economy.onPlayerRemoving(player)
	-- Data.release saves; it is also hooked in Data.start, which is idempotent.
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)

-- Players who joined before this script finished running.
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

print("[Make a Brainrot] server ready")

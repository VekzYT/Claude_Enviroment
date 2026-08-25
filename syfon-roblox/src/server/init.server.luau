--!strict
-- Server entry point.

local Players = game:GetService("Players")
local ProximityPromptService = game:GetService("ProximityPromptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Tuning = require(Shared:WaitForChild("Tuning"))
local Net = require(Shared:WaitForChild("Net"))

local Arenas = require(script:WaitForChild("Arenas"))
local Landscape = require(script:WaitForChild("Landscape"))
local Lobby = require(script:WaitForChild("Lobby"))
local Run = require(script:WaitForChild("Run"))
local Zombies = require(script:WaitForChild("Zombies"))
local Actions = require(script:WaitForChild("Actions"))
local Wildlife = require(script:WaitForChild("Wildlife"))
local Building = require(script:WaitForChild("Building"))
local Trading = require(script:WaitForChild("Trading"))

Lobby.build()
Arenas.build()

Run.start()

-- A queue that fills asks for an arena; if every arena is busy the party stays
-- queued rather than being silently dropped.
Lobby.onPartyReady = function(party: { Player }, size: number): boolean
	return Run.create(party, size)
end

Run.onHorde = function(run)
	Zombies.unleash(
		run.id,
		run.arena.folder,
		run.arena.origin,
		function(x, z)
			return Landscape.heightAt(run.arena.seed, x, z)
		end,
		function()
			local alive: { Player } = {}
			for _, player in run.players do
				local stats = run.stats[player]
				if stats and stats.alive then
					table.insert(alive, player)
				end
			end
			return alive
		end,
		function(player, amount)
			Run.damage(player, amount)
		end,
		function()
			return run.state == "horde"
		end
	)
end

-- Wildlife lives in the arena rather than the run, so the forest is populated
-- whether or not anybody is currently in it.
for index = 1, Arenas.count() do
	local arena = Arenas.at(index)
	if arena then
		Wildlife.populate(
			arena.folder,
			arena.origin,
			function(x, z)
				return Landscape.heightAt(arena.seed, x, z)
			end,
			function()
				local watchers: { { root: BasePart, lamp: boolean } } = {}
				for _, player in Players:GetPlayers() do
					local run = Run.forPlayer(player)
					local stats = Run.statsFor(player)
					if run and stats and run.arena.index == arena.index then
						local character = player.Character
						local root = if character then character:FindFirstChild("HumanoidRootPart") else nil
						if root and root:IsA("BasePart") then
							table.insert(watchers, { root = root, lamp = stats.lampOn })
						end
					end
				end
				return watchers
			end
		)
	end
end

-- The pedlar walks his circuit on the run's own clock.
task.spawn(function()
	local last = os.clock()
	while true do
		task.wait(0.2)
		local now = os.clock()
		local dt = now - last
		last = now
		local live = Run.all()
		Trading.sweep(live)
		for _, run in live do
			Trading.update(run, function(x, z)
				return Landscape.heightAt(run.arena.seed, x, z)
			end, dt)
		end
	end
end)

Lobby.start()

--------------------------------------------------------------------------------
-- Players
--------------------------------------------------------------------------------

local function onCharacter(player: Player, character: Model)
	local humanoid = character:WaitForChild("Humanoid") :: Humanoid
	humanoid.WalkSpeed = Tuning.WALK_SPEED
	humanoid.JumpPower = Tuning.JUMP_POWER
	humanoid.UseJumpPower = true
	humanoid.MaxHealth = Tuning.MAX_HEALTH

	local stats = Run.statsFor(player)
	humanoid.Health = if stats then math.max(stats.health, 1) else Tuning.MAX_HEALTH

	humanoid.Died:Connect(function()
		Run.kill(player)
	end)

	task.wait(0.15)
	local run = Run.forPlayer(player)
	local root = character:FindFirstChild("HumanoidRootPart")
	if root and root:IsA("BasePart") then
		root.CFrame = if run then run.arena.spawnCFrame else Lobby.spawn()
	end
end

Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function(character)
		task.spawn(onCharacter, player, character)
	end)
	if player.Character then
		task.spawn(onCharacter, player, player.Character)
	end
	Run.sync(player)
end)

Players.PlayerRemoving:Connect(function(player)
	Lobby.withdraw(player)
	Run.remove(player)
	Actions.forget(player)
end)

--------------------------------------------------------------------------------
-- What the client asks for
--------------------------------------------------------------------------------

-- Interaction is by prompt now, which fires on the server directly. The client
-- no longer decides what it is standing in front of.
ProximityPromptService.PromptTriggered:Connect(function(promptInstance, player)
	Actions.handlePrompt(promptInstance, player)
end)

Net.get("Swing").OnServerEvent:Connect(function(player)
	Actions.swing(player)
end)

Net.get("Eat").OnServerEvent:Connect(function(player, foodId)
	Actions.eat(player, foodId)
end)

Net.get("Loose").OnServerEvent:Connect(function(player)
	Actions.loose(player)
end)

Net.get("Lamp").OnServerEvent:Connect(function(player)
	Actions.toggleLamp(player)
end)

Net.get("Place").OnServerEvent:Connect(function(player, pieceId, point, rotation)
	Building.place(player, pieceId, point, rotation)
end)

Net.get("Unplace").OnServerEvent:Connect(function(player, point)
	Building.remove(player, point)
end)

Net.get("Sell").OnServerEvent:Connect(function(player, itemId)
	Trading.sell(player, itemId)
end)

Net.get("Buy").OnServerEvent:Connect(function(player, itemId)
	Trading.buy(player, itemId)
end)

Net.get("Sprint").OnServerEvent:Connect(function(player, sprinting)
	Actions.setSprinting(player, sprinting)

	local character = player.Character
	local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
	local stats = Run.statsFor(player)
	if humanoid then
		humanoid.WalkSpeed = if sprinting == true and stats and stats.stamina > Tuning.STAMINA_SPRINT_FLOOR
			then Tuning.SPRINT_SPEED
			else Tuning.WALK_SPEED
	end
end)

print("[Syfon] server ready --", Arenas.count(), "arenas")

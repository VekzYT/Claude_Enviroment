--!strict
-- Run: one party's ten days.
--
-- Syfon was single-player with one global clock in an autoload. Here each run
-- owns its own clock, its own day counter and its own survivors, because four
-- parties can be mid-run in the same server on different days.
--
-- Lighting is deliberately not touched here. Roblox has one global Lighting, so
-- the server only reports the time and each client sets its own sky -- that is
-- what lets two arenas be at noon and midnight at once.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Tuning = require(Shared:WaitForChild("Tuning"))
local Net = require(Shared:WaitForChild("Net"))

local Arenas = require(script.Parent:WaitForChild("Arenas"))

local Run = {}

export type Stats = {
	health: number,
	stamina: number,
	hunger: number,
	sprinting: boolean,
	staminaHold: number,

	wood: number,
	coins: number,
	arrows: number,
	flint: number,
	apples: number,
	rawMeat: number,
	cookedMeat: number,

	hasAxe: boolean,
	hasBow: boolean,
	hasLamp: boolean,
	carryingLog: boolean,

	objective: number,
	alive: boolean,
}

export type Instance_ = {
	id: number,
	arena: Arenas.Arena,
	players: { Player },
	size: number,
	day: number,
	timeOfDay: number,
	state: string, -- "running" | "horde" | "won" | "lost"
	hordeSpawned: boolean,
	stats: { [Player]: Stats },
	endsAt: number,
}

local runs: { [number]: Instance_ } = {}
local runOf: { [Player]: Instance_ } = {}
local nextId = 1

local syncRemote: RemoteEvent
local announceRemote: RemoteEvent

-- Set by init.server so Run does not have to know about Zombies directly.
Run.onHorde = nil :: ((run: Instance_) -> ())?
Run.onFinish = nil :: ((run: Instance_, won: boolean) -> ())?

local function newStats(): Stats
	return {
		health = Tuning.MAX_HEALTH,
		stamina = 1,
		hunger = 1,
		sprinting = false,
		staminaHold = 0,
		wood = 0,
		coins = 0,
		arrows = 0,
		flint = 0,
		apples = 0,
		rawMeat = 0,
		cookedMeat = 0,
		hasAxe = false,
		hasBow = false,
		hasLamp = false,
		carryingLog = false,
		objective = 1,
		alive = true,
	}
end

function Run.statsFor(player: Player): Stats?
	local run = runOf[player]
	if not run then
		return nil
	end
	return run.stats[player]
end

function Run.forPlayer(player: Player): Instance_?
	return runOf[player]
end

function Run.announce(run: Instance_, text: string)
	for _, player in run.players do
		announceRemote:FireClient(player, text)
	end
end

function Run.sync(player: Player)
	local run = runOf[player]
	if not run then
		syncRemote:FireClient(player, { inRun = false })
		return
	end
	local stats = run.stats[player]
	if not stats then
		return
	end

	syncRemote:FireClient(player, {
		inRun = true,
		day = run.day,
		timeOfDay = run.timeOfDay,
		daysLeft = math.max(Tuning.HORDE_DAY - run.day, 0),
		state = run.state,
		partySize = run.size,
		alive = stats.alive,
		health = stats.health,
		stamina = stats.stamina,
		hunger = stats.hunger,
		wood = stats.wood,
		coins = stats.coins,
		arrows = stats.arrows,
		flint = stats.flint,
		apples = stats.apples,
		rawMeat = stats.rawMeat,
		cookedMeat = stats.cookedMeat,
		hasAxe = stats.hasAxe,
		hasBow = stats.hasBow,
		hasLamp = stats.hasLamp,
		carryingLog = stats.carryingLog,
		objective = stats.objective,
	})
end

local function place(player: Player, cframe: CFrame)
	local character = player.Character
	if not character then
		return
	end
	local root = character:FindFirstChild("HumanoidRootPart")
	if root and root:IsA("BasePart") then
		root.CFrame = cframe
	end
end

-- Start a run for a party. Returns false when no arena is free, which the lobby
-- treats as "keep them queued" rather than dropping them.
function Run.create(party: { Player }, size: number): boolean
	local arena = Arenas.claim()
	if not arena then
		return false
	end

	local run: Instance_ = {
		id = nextId,
		arena = arena,
		players = {},
		size = size,
		day = 1,
		timeOfDay = Tuning.START_TIME,
		state = "running",
		hordeSpawned = false,
		stats = {},
		endsAt = 0,
	}
	nextId += 1
	runs[run.id] = run

	for _, player in party do
		if player.Parent then
			table.insert(run.players, player)
			run.stats[player] = newStats()
			runOf[player] = run
			place(player, arena.spawnCFrame)
			Run.sync(player)
		end
	end

	if #run.players == 0 then
		Arenas.release(arena)
		runs[run.id] = nil
		return false
	end

	Run.announce(run, "Day 1. Ten days until they come.")
	return true
end

-- Take a player out of a run, without ending it for anyone else.
function Run.remove(player: Player)
	local run = runOf[player]
	if not run then
		return
	end
	runOf[player] = nil
	run.stats[player] = nil
	local index = table.find(run.players, player)
	if index then
		table.remove(run.players, index)
	end

	if #run.players == 0 then
		Arenas.release(run.arena)
		runs[run.id] = nil
	end
end

local function finish(run: Instance_, won: boolean)
	if run.state == "won" or run.state == "lost" then
		return
	end
	run.state = if won then "won" else "lost"

	Run.announce(run, if won
		then "Dawn. You held. The valley is quiet again."
		else "The cabin is quiet. They got in.")

	local handler = Run.onFinish
	if handler then
		handler(run, won)
	end

	-- Let the ending land before sending everyone back.
	task.delay(6, function()
		for _, player in table.clone(run.players) do
			Run.remove(player)
			if player.Parent then
				local character = player.Character
				local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
				if humanoid and humanoid.Health <= 0 then
					player:LoadCharacterAsync()
				else
					place(player, require(script.Parent:WaitForChild("Lobby")).spawn())
				end
				Run.sync(player)
			end
		end
		if runs[run.id] then
			Arenas.release(run.arena)
			runs[run.id] = nil
		end
	end)
end

function Run.kill(player: Player)
	local run = runOf[player]
	if not run then
		return
	end
	local stats = run.stats[player]
	if not stats or not stats.alive then
		return
	end

	stats.alive = false
	stats.health = 0

	local anyAlive = false
	for _, other in run.players do
		local otherStats = run.stats[other]
		if otherStats and otherStats.alive then
			anyAlive = true
			break
		end
	end

	if not anyAlive then
		finish(run, false)
	else
		Run.announce(run, player.DisplayName .. " is down.")
	end
end

function Run.damage(player: Player, amount: number)
	local stats = Run.statsFor(player)
	if not stats or not stats.alive then
		return
	end
	stats.health = math.max(stats.health - amount, 0)

	local character = player.Character
	local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
	if humanoid then
		humanoid.Health = math.max(stats.health, 0)
	end

	if stats.health <= 0 then
		Run.kill(player)
	end
end

--------------------------------------------------------------------------------
-- The clock
--------------------------------------------------------------------------------

local function step(run: Instance_, dt: number)
	if run.state == "won" or run.state == "lost" then
		return
	end

	run.timeOfDay += dt / Tuning.DAY_LENGTH

	if run.timeOfDay >= 1 then
		run.timeOfDay -= 1
		run.day += 1

		if run.day < Tuning.HORDE_DAY then
			local left = Tuning.HORDE_DAY - run.day
			Run.announce(run, string.format("Day %d. %d day%s until they come.",
				run.day, left, if left == 1 then "" else "s"))
		elseif run.day == Tuning.HORDE_DAY then
			Run.announce(run, "Day 10. They come at nightfall.")
		end
	end

	-- Nightfall on day 10 is the whole point of the countdown.
	if run.day >= Tuning.HORDE_DAY and not run.hordeSpawned and run.timeOfDay >= Tuning.SUNSET then
		run.hordeSpawned = true
		run.state = "horde"
		Run.announce(run, "They are here.")
		local handler = Run.onHorde
		if handler then
			handler(run)
		end
	end

	-- Surviving to sunrise the following morning wins it. The day has already
	-- rolled past HORDE_DAY by then, which is what separates this from the
	-- sunrise the horde was spawned after.
	if run.state == "horde" and run.day > Tuning.HORDE_DAY
		and run.timeOfDay >= Tuning.SUNRISE and run.timeOfDay < Tuning.SUNSET then
		finish(run, true)
		return
	end

	-- Hunger, and what it costs to ignore it.
	for _, player in run.players do
		local stats = run.stats[player]
		if stats and stats.alive then
			local drain = Tuning.HUNGER_DRAIN * dt
			if stats.sprinting then
				drain *= Tuning.HUNGER_SPRINT_EXTRA
			end
			stats.hunger = math.max(stats.hunger - drain, 0)

			if stats.hunger <= 0 then
				Run.damage(player, Tuning.HUNGER_STARVE_DAMAGE * dt)
			end

			if stats.sprinting and stats.stamina > 0 then
				stats.stamina = math.max(stats.stamina - Tuning.STAMINA_DRAIN * dt, 0)
				stats.staminaHold = Tuning.STAMINA_REGEN_DELAY
			else
				stats.staminaHold = math.max(stats.staminaHold - dt, 0)
				if stats.staminaHold <= 0 then
					stats.stamina = math.min(stats.stamina + Tuning.STAMINA_REGEN * dt, 1)
				end
			end
		end
	end
end

function Run.start()
	syncRemote = Net.get("Sync")
	announceRemote = Net.get("Announce")

	task.spawn(function()
		local last = os.clock()
		while true do
			task.wait(0.1)
			local now = os.clock()
			local dt = now - last
			last = now
			for _, run in runs do
				step(run, dt)
			end
		end
	end)

	-- Push state to everyone four times a second; the HUD is all this feeds.
	task.spawn(function()
		while true do
			task.wait(0.25)
			for _, player in Players:GetPlayers() do
				Run.sync(player)
			end
		end
	end)
end

function Run.all(): { [number]: Instance_ }
	return runs
end

return Run

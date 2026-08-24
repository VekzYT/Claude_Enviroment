--!strict
-- Data: loads, holds and saves each player's progress.
--
-- DataStores are unavailable in Studio until "Enable Studio Access to API
-- Services" is ticked in Game Settings, and there is no reason for that to make
-- the game unplayable while testing. If the probe below fails we keep every
-- profile in memory instead, log it once, and carry on. Nothing else in the
-- codebase has to care which mode we are in.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local STORE_NAME = "MakeABrainrot_v1"
local LOAD_ATTEMPTS = 3
local RETRY_DELAY = 2

export type Profile = {
	cash: number,
	rebirths: number,
	-- Entries are removed outright when a stack hits zero rather than left at 0,
	-- so these genuinely hold nil for anything the player does not have.
	materials: { [string]: number? },
	brainrots: { [string]: number? },
	placed: { string },
	-- False only when loading genuinely failed. Such a profile is playable but
	-- must never be written back, or a transient DataStore outage silently
	-- overwrites real progress with a starter profile.
	canSave: boolean,
}

local Data = {}

local profiles: { [Player]: Profile } = {}
local store: DataStore? = nil
local storeAvailable = false

do
	local ok, result = pcall(function()
		return DataStoreService:GetDataStore(STORE_NAME)
	end)
	if ok and result then
		store = result
		storeAvailable = true
	else
		warn("[Data] DataStore unavailable -- progress will not persist this session. " ..
			"In Studio: File > Game Settings > Security > Enable Studio Access to API Services.")
	end
end

-- A fresh profile for a player who has never played before.
local function newProfile(): Profile
	local placed = table.create(Config.MAX_SLOTS, "")
	return {
		cash = Config.STARTING_CASH,
		rebirths = 0,
		materials = {},
		brainrots = {},
		placed = placed,
		canSave = true,
	}
end

-- Saved data is untrusted: it may be from an older version, or hand-edited.
-- Rebuild it field by field rather than trusting the shape we got back.
local function sanitise(raw: any): Profile
	local profile = newProfile()

	if type(raw) ~= "table" then
		return profile
	end

	if type(raw.cash) == "number" and raw.cash == raw.cash and raw.cash >= 0 then
		profile.cash = math.floor(raw.cash)
	end

	if type(raw.rebirths) == "number" and raw.rebirths >= 0 then
		profile.rebirths = math.floor(raw.rebirths)
	end

	if type(raw.materials) == "table" then
		for id, count in raw.materials do
			if Config.Materials[id] and type(count) == "number" and count > 0 then
				profile.materials[id] = math.floor(count)
			end
		end
	end

	if type(raw.brainrots) == "table" then
		for id, count in raw.brainrots do
			if Config.Brainrots[id] and type(count) == "number" and count > 0 then
				profile.brainrots[id] = math.floor(count)
			end
		end
	end

	if type(raw.placed) == "table" then
		for index = 1, Config.MAX_SLOTS do
			local value = raw.placed[index]
			if type(value) == "string" and Config.Brainrots[value] then
				profile.placed[index] = value
			end
		end
	end

	return profile
end

local function keyFor(player: Player): string
	return "player_" .. tostring(player.UserId)
end

-- Load a player's profile, retrying a few times before giving them a fresh one.
function Data.load(player: Player): Profile
	if not storeAvailable or not store then
		local profile = newProfile()
		profiles[player] = profile
		return profile
	end

	local dataStore = store :: DataStore

	for attempt = 1, LOAD_ATTEMPTS do
		local ok, result = pcall(function()
			return dataStore:GetAsync(keyFor(player))
		end)

		if ok then
			local profile = if result == nil then newProfile() else sanitise(result)
			profiles[player] = profile
			return profile
		end

		warn(string.format("[Data] load failed for %s (attempt %d/%d): %s",
			player.Name, attempt, LOAD_ATTEMPTS, tostring(result)))

		if attempt < LOAD_ATTEMPTS then
			task.wait(RETRY_DELAY)
		end
	end

	-- Every attempt failed. Give them a working session but never save over the
	-- real record -- losing progress is far worse than not persisting a session.
	warn(string.format("[Data] giving %s a temporary profile; saving is disabled for them.", player.Name))
	local profile = newProfile()
	profile.canSave = false
	profiles[player] = profile
	return profile
end

function Data.get(player: Player): Profile?
	return profiles[player]
end

-- Write a profile back to the store. Returns whether it actually saved.
function Data.save(player: Player): boolean
	local profile = profiles[player]
	if not profile or not storeAvailable or not store then
		return false
	end

	if not profile.canSave then
		return false
	end

	local dataStore = store :: DataStore
	local payload = {
		cash = profile.cash,
		rebirths = profile.rebirths,
		materials = profile.materials,
		brainrots = profile.brainrots,
		placed = profile.placed,
	}

	local ok, err = pcall(function()
		dataStore:SetAsync(keyFor(player), payload)
	end)

	if not ok then
		warn(string.format("[Data] save failed for %s: %s", player.Name, tostring(err)))
	end

	return ok
end

function Data.release(player: Player)
	Data.save(player)
	profiles[player] = nil
end

-- Save everyone -- used by the autosave loop and by BindToClose.
function Data.saveAll()
	for player in profiles do
		task.spawn(Data.save, player)
	end
end

function Data.start()
	task.spawn(function()
		while true do
			task.wait(Config.AUTOSAVE_INTERVAL)
			Data.saveAll()
		end
	end)

	Players.PlayerRemoving:Connect(function(player)
		Data.release(player)
	end)

	-- On server shutdown Roblox gives us a short window to finish writes.
	game:BindToClose(function()
		for player in profiles do
			Data.save(player)
		end
	end)
end

return Data

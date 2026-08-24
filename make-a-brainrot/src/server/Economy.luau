--!strict
-- Economy: every rule about money, materials, crafting and rebirth.
--
-- The client sends requests; this decides what actually happens. Nothing the
-- client sends is trusted -- not the price, not the quantity, not whether the
-- player can afford it. The client's copy of the state is a display, and it is
-- replaced wholesale by the server after every change.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Net = require(Shared:WaitForChild("Net"))

local Data = require(script.Parent:WaitForChild("Data"))
local Plots = require(script.Parent:WaitForChild("Plots"))

local Economy = {}

-- A player may fire at most this many requests per second. Anything above it is
-- dropped silently -- a real player cannot click this fast, so there is nothing
-- to explain to them.
local REQUEST_BUDGET = 20
local MAX_BUY_QUANTITY = 500

local budgets: { [Player]: number } = {}

local syncRemote: RemoteEvent
local notifyRemote: RemoteEvent

--------------------------------------------------------------------------------
-- Helpers
--------------------------------------------------------------------------------

local function notify(player: Player, message: string, kind: string)
	notifyRemote:FireClient(player, message, kind)
end

-- Income per second, counting only brainrots on unlocked slots.
local function incomeFor(profile: Data.Profile): number
	local available = Config.slotsForRebirth(profile.rebirths)
	local multiplier = Config.incomeMultiplier(profile.rebirths)
	local total = 0

	for index = 1, available do
		local id = profile.placed[index]
		if id and id ~= "" then
			local brainrot = Config.Brainrots[id]
			if brainrot then
				total += brainrot.income
			end
		end
	end

	return math.floor(total * multiplier)
end

local function buildState(profile: Data.Profile)
	return {
		cash = profile.cash,
		rebirths = profile.rebirths,
		slots = Config.slotsForRebirth(profile.rebirths),
		maxSlots = Config.MAX_SLOTS,
		income = incomeFor(profile),
		multiplier = Config.incomeMultiplier(profile.rebirths),
		rebirthCost = Config.rebirthCost(profile.rebirths),
		materials = profile.materials,
		brainrots = profile.brainrots,
		placed = profile.placed,
	}
end

local function updateLeaderstats(player: Player, profile: Data.Profile)
	local stats = player:FindFirstChild("leaderstats")
	if not stats then
		return
	end
	local cash = stats:FindFirstChild("Cash")
	if cash and cash:IsA("StringValue") then
		cash.Value = "$" .. Config.formatNumber(profile.cash)
	end
	local rebirths = stats:FindFirstChild("Rebirths")
	if rebirths and rebirths:IsA("IntValue") then
		rebirths.Value = profile.rebirths
	end
end

-- Push the player's whole state and redraw their plot.
function Economy.sync(player: Player)
	local profile = Data.get(player)
	if not profile then
		return
	end
	syncRemote:FireClient(player, buildState(profile))
	Plots.refresh(player, profile.placed, profile.rebirths)
	updateLeaderstats(player, profile)
end

local function spend(profile: Data.Profile, amount: number): boolean
	if profile.cash < amount then
		return false
	end
	profile.cash -= amount
	return true
end

local function allowed(player: Player): boolean
	local remaining = budgets[player]
	if remaining == nil then
		return false
	end
	if remaining <= 0 then
		return false
	end
	budgets[player] = remaining - 1
	return true
end

--------------------------------------------------------------------------------
-- Actions
--------------------------------------------------------------------------------

local function handleBuy(player: Player, materialId: unknown, quantity: unknown)
	if not allowed(player) then
		return
	end

	local profile = Data.get(player)
	if not profile then
		return
	end

	if type(materialId) ~= "string" then
		return
	end
	local material = Config.Materials[materialId]
	if not material then
		return
	end

	if type(quantity) ~= "number" or quantity ~= quantity then
		return
	end
	local amount = math.floor(quantity)
	if amount < 1 or amount > MAX_BUY_QUANTITY then
		return
	end

	local cost = material.price * amount
	if not spend(profile, cost) then
		notify(player, "Not enough cash for " .. amount .. "x " .. material.name, "error")
		return
	end

	profile.materials[materialId] = (profile.materials[materialId] or 0) + amount
	notify(player, "Bought " .. amount .. "x " .. material.name, "good")
	Economy.sync(player)
end

local function handleCraft(player: Player, brainrotId: unknown)
	if not allowed(player) then
		return
	end

	local profile = Data.get(player)
	if not profile then
		return
	end

	if type(brainrotId) ~= "string" then
		return
	end
	local brainrot = Config.Brainrots[brainrotId]
	if not brainrot then
		return
	end

	-- Check the whole recipe before consuming any of it, or a failed craft
	-- eats the materials it did manage to take.
	for materialId, needed in brainrot.recipe do
		if (profile.materials[materialId] or 0) < needed then
			local material = Config.Materials[materialId]
			local name = if material then material.name else materialId
			notify(player, "Missing " .. name .. " for " .. brainrot.name, "error")
			return
		end
	end

	for materialId, needed in brainrot.recipe do
		local left = (profile.materials[materialId] or 0) - needed
		profile.materials[materialId] = if left > 0 then left else nil
	end

	profile.brainrots[brainrotId] = (profile.brainrots[brainrotId] or 0) + 1
	notify(player, "Crafted " .. brainrot.name .. "!", "good")
	Economy.sync(player)
end

local function handlePlace(player: Player, brainrotId: unknown)
	if not allowed(player) then
		return
	end

	local profile = Data.get(player)
	if not profile then
		return
	end

	if type(brainrotId) ~= "string" then
		return
	end
	local brainrot = Config.Brainrots[brainrotId]
	if not brainrot then
		return
	end

	if (profile.brainrots[brainrotId] or 0) < 1 then
		return
	end

	local available = Config.slotsForRebirth(profile.rebirths)
	for index = 1, available do
		if profile.placed[index] == "" then
			profile.placed[index] = brainrotId

			local left = (profile.brainrots[brainrotId] or 0) - 1
			profile.brainrots[brainrotId] = if left > 0 then left else nil

			notify(player, "Placed " .. brainrot.name, "good")
			Economy.sync(player)
			return
		end
	end

	notify(player, "No free slots -- rebirth for more", "error")
end

local function handleUnplace(player: Player, slotIndex: unknown)
	if not allowed(player) then
		return
	end

	local profile = Data.get(player)
	if not profile then
		return
	end

	if type(slotIndex) ~= "number" or slotIndex ~= slotIndex then
		return
	end
	local index = math.floor(slotIndex)
	if index < 1 or index > Config.MAX_SLOTS then
		return
	end

	local id = profile.placed[index]
	if not id or id == "" then
		return
	end

	profile.placed[index] = ""
	profile.brainrots[id] = (profile.brainrots[id] or 0) + 1

	local brainrot = Config.Brainrots[id]
	notify(player, "Picked up " .. (if brainrot then brainrot.name else id), "info")
	Economy.sync(player)
end

local function handleRebirth(player: Player)
	if not allowed(player) then
		return
	end

	local profile = Data.get(player)
	if not profile then
		return
	end

	if Config.slotsForRebirth(profile.rebirths) >= Config.MAX_SLOTS then
		notify(player, "You already have every slot", "info")
		return
	end

	local cost = Config.rebirthCost(profile.rebirths)
	if profile.cash < cost then
		notify(player, "Rebirth costs $" .. Config.formatNumber(cost), "error")
		return
	end

	-- Rebirth charges the cost and clears the material stock, but never takes
	-- brainrots away. Losing a collection you spent an hour building is the
	-- fastest way to make someone close the game.
	--
	-- It deducts rather than wiping cash to zero: the pacing in tools/balance.py
	-- is tuned against deduction, and wiping makes every late rebirth feel like
	-- a punishment for having played well.
	profile.cash -= cost
	profile.materials = {}
	profile.rebirths += 1

	notify(player, "Rebirth " .. profile.rebirths .. "! +" .. Config.SLOTS_PER_REBIRTH .. " slots", "good")
	Economy.sync(player)
end

--------------------------------------------------------------------------------
-- Lifecycle
--------------------------------------------------------------------------------

function Economy.onPlayerAdded(player: Player)
	budgets[player] = REQUEST_BUDGET

	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"

	local cash = Instance.new("StringValue")
	cash.Name = "Cash"
	cash.Value = "$0"
	cash.Parent = stats

	local rebirths = Instance.new("IntValue")
	rebirths.Name = "Rebirths"
	rebirths.Value = 0
	rebirths.Parent = stats

	stats.Parent = player
end

function Economy.onPlayerRemoving(player: Player)
	budgets[player] = nil
end

function Economy.start()
	syncRemote = Net.get("Sync")
	notifyRemote = Net.get("Notify")

	Net.get("Buy").OnServerEvent:Connect(handleBuy)
	Net.get("Craft").OnServerEvent:Connect(handleCraft)
	Net.get("Place").OnServerEvent:Connect(handlePlace)
	Net.get("Unplace").OnServerEvent:Connect(handleUnplace)
	Net.get("Rebirth").OnServerEvent:Connect(handleRebirth)

	-- Refill request budgets once a second.
	task.spawn(function()
		while true do
			task.wait(1)
			for _, player in Players:GetPlayers() do
				budgets[player] = REQUEST_BUDGET
			end
		end
	end)

	-- Pay out income.
	task.spawn(function()
		while true do
			task.wait(Config.INCOME_TICK)
			for _, player in Players:GetPlayers() do
				local profile = Data.get(player)
				if profile then
					local earned = incomeFor(profile) * Config.INCOME_TICK
					if earned > 0 then
						profile.cash += earned
						syncRemote:FireClient(player, buildState(profile))
						updateLeaderstats(player, profile)
					end
				end
			end
		end
	end)
end

return Economy

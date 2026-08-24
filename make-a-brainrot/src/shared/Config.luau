--!strict
-- Config: every tunable number in the game lives here.
-- Change values in this file to rebalance; no other file hardcodes economy data.

local Config = {}

-- How much cash a brand new player starts with.
-- Enough for exactly one Tung Tung Sahur (725) with a little spare.
Config.STARTING_CASH = 1000

-- Base plot slots, and how many more each rebirth grants.
Config.BASE_SLOTS = 6
Config.SLOTS_PER_REBIRTH = 2
Config.MAX_SLOTS = 20

-- Income is paid out on this interval (seconds).
Config.INCOME_TICK = 1

-- Each rebirth adds this much to the income multiplier (additive).
-- Rebirth 3 => 1 + 0.20 * 3 = 1.6x income.
Config.REBIRTH_INCOME_BONUS = 0.20

-- Rebirth cost curve: BASE * (GROWTH ^ rebirths)
Config.REBIRTH_BASE_COST = 250000
Config.REBIRTH_COST_GROWTH = 5.5

-- How often player data is written to the DataStore (seconds).
Config.AUTOSAVE_INTERVAL = 120

-- Number of player plots built into the world.
Config.PLOT_COUNT = 6

--------------------------------------------------------------------------------
-- Rarities
--------------------------------------------------------------------------------

export type Rarity = {
	name: string,
	colour: Color3,
}

Config.Rarities = {
	Common = { name = "Common", colour = Color3.fromRGB(170, 178, 189) },
	Uncommon = { name = "Uncommon", colour = Color3.fromRGB(106, 196, 122) },
	Rare = { name = "Rare", colour = Color3.fromRGB(84, 152, 235) },
	Epic = { name = "Epic", colour = Color3.fromRGB(166, 110, 232) },
	Legendary = { name = "Legendary", colour = Color3.fromRGB(240, 176, 62) },
	Mythic = { name = "Mythic", colour = Color3.fromRGB(238, 96, 96) },
	Divine = { name = "Divine", colour = Color3.fromRGB(92, 224, 214) },
	Secret = { name = "Secret", colour = Color3.fromRGB(232, 92, 196) },
	BrainrotGod = { name = "Brainrot God", colour = Color3.fromRGB(255, 233, 128) },
}

--------------------------------------------------------------------------------
-- Materials -- bought with cash from the shop.
--------------------------------------------------------------------------------

export type Material = {
	id: string,
	name: string,
	price: number,
	colour: Color3,
	order: number,
}

Config.Materials = {
	wood = { id = "wood", name = "Wood", price = 25, colour = Color3.fromRGB(138, 96, 58), order = 1 },
	rope = { id = "rope", name = "Rope", price = 60, colour = Color3.fromRGB(198, 178, 120), order = 2 },
	scale = { id = "scale", name = "Shark Scale", price = 200, colour = Color3.fromRGB(96, 148, 168), order = 3 },
	bat = { id = "bat", name = "Baseball Bat", price = 600, colour = Color3.fromRGB(176, 132, 74), order = 4 },
	steel = { id = "steel", name = "Steel Beam", price = 2000, colour = Color3.fromRGB(150, 158, 168), order = 5 },
	eye = { id = "eye", name = "Glass Eye", price = 9000, colour = Color3.fromRGB(214, 236, 244), order = 6 },
	bell = { id = "bell", name = "Golden Bell", price = 45000, colour = Color3.fromRGB(226, 182, 68), order = 7 },
	shard = { id = "shard", name = "Meteor Shard", price = 260000, colour = Color3.fromRGB(154, 118, 220), order = 8 },
	core = { id = "core", name = "Void Core", price = 1500000, colour = Color3.fromRGB(88, 72, 132), order = 9 },
	crown = { id = "crown", name = "Saturn Crown", price = 8500000, colour = Color3.fromRGB(244, 214, 140), order = 10 },
}

-- Stable, ordered list of material ids for UI that needs a consistent order.
Config.MaterialOrder = { "wood", "rope", "scale", "bat", "steel", "eye", "bell", "shard", "core", "crown" }

--------------------------------------------------------------------------------
-- Brainrots -- crafted from materials, placed on your plot, earn cash per second.
--
-- Recipes are costed so that payback time climbs with tier: a Tung Tung Sahur
-- pays for itself in about 35 seconds, a La Vacca in about five minutes.
--------------------------------------------------------------------------------

export type Brainrot = {
	id: string,
	name: string,
	rarity: string,
	income: number,
	recipe: { [string]: number },
	tier: number,
	colour: Color3,
}

Config.Brainrots = {
	tung = {
		id = "tung",
		name = "Tung Tung Sahur",
		rarity = "Common",
		income = 20,
		recipe = { wood = 5, bat = 1 },
		tier = 1,
		colour = Color3.fromRGB(150, 104, 62),
	},
	tralalero = {
		id = "tralalero",
		name = "Tralalero Tralala",
		rarity = "Uncommon",
		income = 65,
		recipe = { scale = 12, rope = 8, bat = 5 },
		tier = 2,
		colour = Color3.fromRGB(72, 132, 180),
	},
	patapim = {
		id = "patapim",
		name = "Brr Brr Patapim",
		rarity = "Rare",
		income = 210,
		recipe = { steel = 15, scale = 20, bat = 12, wood = 30 },
		tier = 3,
		colour = Color3.fromRGB(112, 156, 92),
	},
	bombardiro = {
		id = "bombardiro",
		name = "Bombardiro Crocodilo",
		rarity = "Epic",
		income = 700,
		recipe = { eye = 28, steel = 20, bat = 15 },
		tier = 4,
		colour = Color3.fromRGB(96, 116, 86),
	},
	lirili = {
		id = "lirili",
		name = "Lirili Larila",
		rarity = "Legendary",
		income = 2300,
		recipe = { bell = 35, eye = 30, steel = 25 },
		tier = 5,
		colour = Color3.fromRGB(196, 170, 118),
	},
	chimpanzini = {
		id = "chimpanzini",
		name = "Chimpanzini Bananini",
		rarity = "Mythic",
		income = 7500,
		recipe = { shard = 38, bell = 20, eye = 12 },
		tier = 6,
		colour = Color3.fromRGB(232, 202, 78),
	},
	bombombini = {
		id = "bombombini",
		name = "Bombombini Gusini",
		rarity = "Divine",
		income = 25000,
		recipe = { core = 32, shard = 35, bell = 15 },
		tier = 7,
		colour = Color3.fromRGB(120, 208, 200),
	},
	combinasion = {
		id = "combinasion",
		name = "Sahur Combinasion",
		rarity = "Secret",
		income = 82000,
		recipe = { crown = 30, core = 15, shard = 6 },
		tier = 8,
		colour = Color3.fromRGB(214, 104, 186),
	},
	vacca = {
		id = "vacca",
		name = "La Vacca Saturno Saturnita",
		rarity = "BrainrotGod",
		income = 270000,
		recipe = { crown = 145, core = 40, shard = 10 },
		tier = 9,
		colour = Color3.fromRGB(246, 222, 130),
	},
}

Config.BrainrotOrder = {
	"tung", "tralalero", "patapim", "bombardiro", "lirili",
	"chimpanzini", "bombombini", "combinasion", "vacca",
}

--------------------------------------------------------------------------------
-- Helpers
--------------------------------------------------------------------------------

-- Slots available to a player at a given rebirth count.
function Config.slotsForRebirth(rebirths: number): number
	local slots = Config.BASE_SLOTS + Config.SLOTS_PER_REBIRTH * rebirths
	if slots > Config.MAX_SLOTS then
		return Config.MAX_SLOTS
	end
	return slots
end

-- Cash required to perform the next rebirth.
function Config.rebirthCost(rebirths: number): number
	return math.floor(Config.REBIRTH_BASE_COST * (Config.REBIRTH_COST_GROWTH ^ rebirths))
end

-- Income multiplier granted by rebirths.
function Config.incomeMultiplier(rebirths: number): number
	return 1 + Config.REBIRTH_INCOME_BONUS * rebirths
end

-- Total shop cost of a brainrot's recipe, used for UI and for balance checks.
function Config.recipeCost(brainrotId: string): number
	local brainrot = Config.Brainrots[brainrotId]
	if not brainrot then
		return 0
	end
	local total = 0
	for materialId, amount in brainrot.recipe do
		local material = Config.Materials[materialId]
		if material then
			total += material.price * amount
		end
	end
	return total
end

-- "1.24M" style formatting. Roblox players read big numbers constantly, so
-- this needs to be compact and never show more than four significant figures.
function Config.formatNumber(value: number): string
	local suffixes = { "", "K", "M", "B", "T", "Qa", "Qi" }
	local index = 1
	local n = value

	while math.abs(n) >= 1000 and index < #suffixes do
		n /= 1000
		index += 1
	end

	if index == 1 then
		return tostring(math.floor(n))
	end

	-- Two decimals under 10, one under 100, none above.
	if math.abs(n) < 10 then
		return string.format("%.2f%s", n, suffixes[index])
	elseif math.abs(n) < 100 then
		return string.format("%.1f%s", n, suffixes[index])
	end
	return string.format("%.0f%s", n, suffixes[index])
end

return Config

--!strict
-- Tuning: Syfon's design, lifted number for number out of the Godot build.
--
-- Every value here was read out of the original GDScript rather than reinvented,
-- so the Roblox game plays like the game it came from. Where a value had to
-- change for Roblox, the original is kept in a comment beside it and the reason
-- is stated. Source files are named per section.

local Tuning = {}

--------------------------------------------------------------------------------
-- The clock  (world_clock.gd)
--------------------------------------------------------------------------------

-- Godot ran 480s per day, which is 80 minutes for the full ten-day arc. That is
-- far too long for a Roblox session, where people join for twenty minutes and
-- leave. 180s keeps the same shape at 30 minutes a run.
Tuning.DAY_LENGTH = 180 -- was 480
Tuning.SUNRISE = 0.24
Tuning.SUNSET = 0.79
Tuning.START_TIME = 0.30 -- a little after sunrise
Tuning.HORDE_DAY = 10

--------------------------------------------------------------------------------
-- The player  (player.gd)
--------------------------------------------------------------------------------

-- Godot metres per second. Roblox studs are ~0.28 m, so speeds are converted at
-- 3.57 studs per metre to preserve how fast the world actually feels.
local STUDS_PER_METRE = 3.57

Tuning.WALK_SPEED = 6.0 * STUDS_PER_METRE
Tuning.SPRINT_SPEED = 9.5 * STUDS_PER_METRE
Tuning.CROUCH_SPEED = 2.5 * STUDS_PER_METRE
Tuning.JUMP_POWER = 4.8 * STUDS_PER_METRE
Tuning.MAX_HEALTH = 100
Tuning.RESPAWN_DELAY = 2.0

Tuning.STAMINA_DRAIN = 0.28
Tuning.STAMINA_REGEN = 0.20
Tuning.STAMINA_REGEN_DELAY = 0.9
Tuning.STAMINA_SPRINT_FLOOR = 0.12

-- Hunger emptied over three full days in Godot; kept proportional to the new
-- day length so it still takes three days rather than three times as long.
Tuning.HUNGER_DRAIN = 1.0 / (3.0 * Tuning.DAY_LENGTH)
Tuning.HUNGER_SPRINT_EXTRA = 2.2
Tuning.HUNGER_STARVE_DAMAGE = 2.0

Tuning.INTERACT_RANGE = 3.2 * STUDS_PER_METRE

--------------------------------------------------------------------------------
-- Food  (player.gd)
--------------------------------------------------------------------------------

Tuning.Food = {
	apple = { name = "Apple", restore = 0.22, sell = 2 },
	raw = { name = "Raw meat", restore = 0.08, sell = 6 },
	cooked = { name = "Cooked meat", restore = 0.42, sell = 11 },
}

--------------------------------------------------------------------------------
-- Timber  (chopping_block.gd, forest_scatter.gd)
--------------------------------------------------------------------------------

Tuning.CHOPS_TO_FELL = 5
Tuning.SPLITS_PER_LOG = 4
Tuning.WOOD_PER_LOG = 12
Tuning.WOOD_SELL_PRICE = 3

--------------------------------------------------------------------------------
-- The pedlar  (pedlar.gd, trade_screen.gd)
--------------------------------------------------------------------------------

Tuning.PEDLAR_ARRIVE_DAY = 2
Tuning.PEDLAR_LEAVE_DAY = 10 -- he leaves the day the horde arrives

Tuning.ShopStock = {
	{ id = "bow", name = "Hunting bow", price = 70 },
	{ id = "arrows", name = "Arrows x6", price = 14 },
	{ id = "lamp", name = "Oil lamp", price = 45 },
}

--------------------------------------------------------------------------------
-- Building  (builder.gd)
--------------------------------------------------------------------------------

Tuning.BUILD_GRID = 2.0 * STUDS_PER_METRE
Tuning.BUILD_REACH = 8.0 * STUDS_PER_METRE

-- Sizes live here so the client's ghost and the server's real piece cannot
-- disagree about how big a wall is.
local G = Tuning.BUILD_GRID

Tuning.Pieces = {
	{ id = "wall", name = "Wall", cost = 6, refund = 3, size = Vector3.new(G, G * 1.6, 1.2), health = 260 },
	{ id = "door", name = "Doorway", cost = 10, refund = 5, size = Vector3.new(G, G * 1.6, 1.2), health = 200 },
	{ id = "floor", name = "Floor", cost = 5, refund = 2, size = Vector3.new(G, 1.2, G), health = 180 },
	{ id = "ramp", name = "Ramp", cost = 7, refund = 3, size = Vector3.new(G, G * 0.9, G), health = 180 },
	{ id = "post", name = "Torch post", cost = 4, refund = 2, size = Vector3.new(1.4, G * 1.5, 1.4), health = 90 },
}

Tuning.FIREWOOD_COST = 3

--------------------------------------------------------------------------------
-- Wildlife  (animal.gd)
--------------------------------------------------------------------------------

Tuning.Animals = {
	deer = { name = "Deer", scale = 1.0, meat = 2, health = 3 },
	boar = { name = "Boar", scale = 1.0, meat = 3, health = 4 },
	hare = { name = "Hare", scale = 0.34, meat = 1, health = 1 },
	elk = { name = "Elk", scale = 1.26, meat = 3, health = 5 },
}

Tuning.ANIMAL_NOTICE = 16.0 * STUDS_PER_METRE
Tuning.ANIMAL_ALERT = 24.0 * STUDS_PER_METRE
Tuning.ANIMAL_FLEE_TIME = 7.0
Tuning.ANIMAL_WANDER_RADIUS = 22.0 * STUDS_PER_METRE

-- The lamp is the least stealthy thing you can carry: animals notice you at
-- nearly twice the usual range while it is lit.
Tuning.LAMP_NOTICE_MULTIPLIER = 1.9

--------------------------------------------------------------------------------
-- The ten-step opening  (objectives.gd)
--------------------------------------------------------------------------------

Tuning.Objectives = {
	{ text = "Take the axe from the chopping block", hint = "It is outside the cabin door." },
	{ text = "Fell a tree", hint = "Five bites will drop it." },
	{ text = "Shoulder the log it leaves", hint = "Both hands will be full." },
	{ text = "Carry it to your chopping block", hint = "Back at the cabin." },
	{ text = "Split the log for firewood", hint = "Four splits gives 12 wood." },
	{ text = "Read the map on the cabin table", hint = "After reading it once, it opens anywhere." },
	{ text = "Hunt an animal", hint = "Deer and boar wander the forest." },
	{ text = "Light a fire, then cook on it", hint = "Set flint beside firewood and strike it." },
	{ text = "Eat, and keep eating", hint = "Watch the food bar under your stamina." },
	{ text = "Trade with the pedlar", hint = "He comes past the cabin from day 2." },
	{ text = "Buy a bow, and arrows for it", hint = "The bow is no use empty." },
}

return Tuning

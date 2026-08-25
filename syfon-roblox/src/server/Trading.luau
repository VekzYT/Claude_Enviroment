--!strict
-- Trading: Tomas, who walks a circuit past your cabin from day 2 and is gone on
-- day 10 -- which is the day they come, so his leaving is the last warning.
--
-- He is the only way to turn wood and meat into a bow, and the bow is the only
-- ranged thing you will have on night ten. That is the whole reason the chopping
-- matters before the horde arrives.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Tuning = require(Shared:WaitForChild("Tuning"))
local Build = require(Shared:WaitForChild("Build"))
local Audio = require(Shared:WaitForChild("Audio"))

local Run = require(script.Parent:WaitForChild("Run"))

local Trading = {}

local WALK_SPEED = 4.8
local CIRCUIT_RADIUS = 46

local COAT = Color3.fromRGB(92, 66, 88)
local SKIN = Color3.fromRGB(206, 166, 130)
local PACK = Color3.fromRGB(104, 78, 52)

-- What he pays for what you bring him, straight from the Godot trade screen.
local SELL_PRICES = {
	wood = Tuning.WOOD_SELL_PRICE,
	raw = Tuning.Food.raw.sell,
	cooked = Tuning.Food.cooked.sell,
	apple = Tuning.Food.apple.sell,
}

local pedlars: { [number]: { model: Model, root: BasePart, angle: number } } = {}

local function buildPedlar(position: Vector3, parent: Instance): (Model, BasePart)
	local model = Instance.new("Model")
	model.Name = "Tomas"
	model.Parent = parent

	local root = Build.part({ name = "Torso", size = Vector3.new(2.6, 4, 1.6),
		cframe = CFrame.new(position + Vector3.new(0, 5, 0)),
		colour = COAT, material = Enum.Material.Fabric }, model)
	model.PrimaryPart = root

	Build.part({ name = "Head", size = Vector3.new(1.7, 1.7, 1.7),
		cframe = root.CFrame * CFrame.new(0, 2.9, 0),
		colour = SKIN, material = Enum.Material.SmoothPlastic, canCollide = false }, model)
	Build.part({ name = "Hat", size = Vector3.new(3.4, 0.4, 3.4),
		cframe = root.CFrame * CFrame.new(0, 3.8, 0),
		colour = Color3.fromRGB(58, 44, 52), material = Enum.Material.Fabric, canCollide = false }, model)
	Build.part({ name = "Pack", size = Vector3.new(2.2, 2.4, 1.4),
		cframe = root.CFrame * CFrame.new(0, 0.4, 1.3),
		colour = PACK, material = Enum.Material.Fabric, canCollide = false }, model)

	for _, side in { -1, 1 } do
		Build.part({ name = "Arm", size = Vector3.new(0.8, 3.2, 0.8),
			cframe = root.CFrame * CFrame.new(side * 1.7, -0.2, 0),
			colour = COAT, material = Enum.Material.Fabric, canCollide = false }, model)
		Build.part({ name = "Leg", size = Vector3.new(0.9, 3.4, 0.9),
			cframe = root.CFrame * CFrame.new(side * 0.7, -3.6, 0),
			colour = Color3.fromRGB(56, 48, 44), material = Enum.Material.Fabric, canCollide = false }, model)
	end

	Build.label(root, "TOMAS", Color3.fromRGB(226, 200, 150), 6, 10)

	root:SetAttribute("Interact", "trade")
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "Trade"
	prompt.ObjectText = "Tomas the pedlar"
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.MaxActivationDistance = 14
	prompt.HoldDuration = 0
	prompt.RequiresLineOfSight = false
	prompt.Parent = root

	return model, root
end

-- He arrives on day 2 and leaves on day 10, and walks a slow circuit in between.
function Trading.update(run: Run.Instance_, groundAt: (x: number, z: number) -> number, dt: number)
	local existing = pedlars[run.id]

	if run.day < Tuning.PEDLAR_ARRIVE_DAY or run.day >= Tuning.PEDLAR_LEAVE_DAY then
		if existing then
			existing.model:Destroy()
			pedlars[run.id] = nil
			if run.day >= Tuning.PEDLAR_LEAVE_DAY then
				Run.announce(run, "Tomas has gone. Nobody else is coming.")
			end
		end
		return
	end

	if not existing then
		local y = groundAt(CIRCUIT_RADIUS, 0)
		local model, root = buildPedlar(
			Vector3.new(run.arena.origin.X + CIRCUIT_RADIUS, y, run.arena.origin.Z), run.arena.folder)
		pedlars[run.id] = { model = model, root = root, angle = 0 }
		Run.announce(run, "Tomas the pedlar is here. He buys wood and meat.")
		return
	end

	-- Walk the circuit, and face the way he is going.
	existing.angle += (WALK_SPEED / CIRCUIT_RADIUS) * dt
	local x = math.cos(existing.angle) * CIRCUIT_RADIUS
	local z = math.sin(existing.angle) * CIRCUIT_RADIUS
	local y = groundAt(x, z)

	local position = Vector3.new(run.arena.origin.X + x, y + 5, run.arena.origin.Z + z)
	local facing = Vector3.new(-math.sin(existing.angle), 0, math.cos(existing.angle))
	existing.model:PivotTo(CFrame.lookAt(position, position + facing))
end

-- Drop pedlars whose run no longer exists. Self-cleaning beats wiring a
-- teardown callback through Run, which does not otherwise know Trading exists.
function Trading.sweep(liveRuns: { [number]: any })
	for runId, entry in pedlars do
		if not liveRuns[runId] then
			entry.model:Destroy()
			pedlars[runId] = nil
		end
	end
end

function Trading.clear(runId: number)
	local existing = pedlars[runId]
	if existing then
		existing.model:Destroy()
		pedlars[runId] = nil
	end
end

--------------------------------------------------------------------------------

function Trading.sell(player: Player, itemId: unknown)
	local run = Run.forPlayer(player)
	local stats = Run.statsFor(player)
	if not run or not stats or not stats.alive then
		return
	end
	if type(itemId) ~= "string" then
		return
	end

	local price = SELL_PRICES[itemId]
	if not price then
		return
	end

	local have = if itemId == "wood" then stats.wood
		elseif itemId == "raw" then stats.rawMeat
		elseif itemId == "cooked" then stats.cookedMeat
		else stats.apples

	if have <= 0 then
		Run.announce(run, "You have none to sell.")
		return
	end

	if itemId == "wood" then
		stats.wood = 0
	elseif itemId == "raw" then
		stats.rawMeat = 0
	elseif itemId == "cooked" then
		stats.cookedMeat = 0
	else
		stats.apples = 0
	end

	local earned = have * price
	stats.coins += earned
	Audio.play("pickup", workspace)
	Run.announce(run, string.format("Sold %d for %d coins.", have, earned))

	if stats.objective == 10 then
		stats.objective = 11
	end
	Run.sync(player)
end

function Trading.buy(player: Player, itemId: unknown)
	local run = Run.forPlayer(player)
	local stats = Run.statsFor(player)
	if not run or not stats or not stats.alive then
		return
	end
	if type(itemId) ~= "string" then
		return
	end

	local item: { id: string, name: string, price: number }? = nil
	for _, entry in Tuning.ShopStock do
		if entry.id == itemId then
			item = entry
		end
	end
	if not item then
		return
	end

	local stock = item :: { id: string, name: string, price: number }
	if stats.coins < stock.price then
		Run.announce(run, string.format("%s costs %d coins.", stock.name, stock.price))
		return
	end

	if stock.id == "bow" and stats.hasBow then
		Run.announce(run, "You already have a bow.")
		return
	end
	if stock.id == "lamp" and stats.hasLamp then
		Run.announce(run, "You already have a lamp.")
		return
	end

	stats.coins -= stock.price

	if stock.id == "bow" then
		stats.hasBow = true
		Run.announce(run, "A hunting bow. Press R to loose an arrow.")
		if stats.objective == 11 then
			stats.objective = 11
		end
	elseif stock.id == "arrows" then
		stats.arrows += 6
		Run.announce(run, string.format("Arrows. You have %d.", stats.arrows))
	elseif stock.id == "lamp" then
		stats.hasLamp = true
		Run.announce(run, "An oil lamp. Press L to light it.")
	end

	Audio.play("uiPick", workspace)
	Run.sync(player)
end

function Trading.priceList(): { [string]: number }
	return SELL_PRICES
end

return Trading

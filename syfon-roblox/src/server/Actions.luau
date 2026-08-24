--!strict
-- Actions: what pressing E or swinging actually does.
--
-- Syfon's chain was deliberate and it is kept intact: a tree does not give you
-- wood. It gives you a log, the log has to be carried home on your shoulder,
-- and the block turns it into firewood. Five chops, then four splits, then
-- twelve wood.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Tuning = require(Shared:WaitForChild("Tuning"))
local Build = require(Shared:WaitForChild("Build"))

local Run = require(script.Parent:WaitForChild("Run"))
local Zombies = require(script.Parent:WaitForChild("Zombies"))

local Actions = {}

local LOG_COLOUR = Color3.fromRGB(122, 92, 62)

local function rootOf(player: Player): BasePart?
	local character = player.Character
	if not character then
		return nil
	end
	local root = character:FindFirstChild("HumanoidRootPart")
	if root and root:IsA("BasePart") then
		return root
	end
	return nil
end

-- What the player is looking at, within reach. Godot used a raycast from the
-- camera; the server has no camera, so this is a cone test around the character's
-- facing, which is what INTERACT_COS was doing in the original anyway.
local function targetFor(player: Player, tags: { string }): BasePart?
	local run = Run.forPlayer(player)
	local root = rootOf(player)
	if not run or not root then
		return nil
	end

	local best: BasePart? = nil
	local bestScore = -1

	local function consider(part: BasePart)
		local offset = part.Position - root.Position
		local distance = offset.Magnitude
		if distance > Tuning.INTERACT_RANGE * 2.2 then
			return
		end
		local facing = offset.Unit:Dot(root.CFrame.LookVector)
		if facing < 0.4 then
			return
		end
		local score = facing / math.max(distance, 1)
		if score > bestScore then
			best = part
			bestScore = score
		end
	end

	for _, group in run.arena.folder:GetChildren() do
		if group:IsA("Folder") or group:IsA("Model") then
			for _, child in group:GetDescendants() do
				if child:IsA("BasePart") then
					local tag = child:GetAttribute("Interact")
					if tag and table.find(tags, tag :: string) then
						consider(child)
					end
				end
			end
		end
	end

	return best
end

--------------------------------------------------------------------------------
-- Interact  (E)
--------------------------------------------------------------------------------

function Actions.interact(player: Player)
	local run = Run.forPlayer(player)
	local stats = Run.statsFor(player)
	if not run or not stats or not stats.alive then
		return
	end

	local target = targetFor(player, { "axe", "block", "map", "flint", "log" })
	if not target then
		return
	end

	local tag = target:GetAttribute("Interact")

	if tag == "axe" then
		if stats.hasAxe then
			return
		end
		stats.hasAxe = true
		target:Destroy()
		Run.announce(run, "You take the axe.")
		if stats.objective == 1 then
			stats.objective = 2
		end

	elseif tag == "log" then
		if stats.carryingLog then
			Run.announce(run, "Your hands are already full.")
			return
		end
		stats.carryingLog = true
		target:Destroy()
		Run.announce(run, "You shoulder the log.")
		if stats.objective == 3 then
			stats.objective = 4
		end

	elseif tag == "block" then
		if stats.carryingLog then
			stats.carryingLog = false
			target:SetAttribute("Loaded", true)
			target:SetAttribute("Splits", 0)
			Run.announce(run, "Log on the block. Swing the axe at it.")
			if stats.objective == 4 then
				stats.objective = 5
			end
		elseif not target:GetAttribute("Loaded") then
			Run.announce(run, "You need a log to split.")
		end

	elseif tag == "map" then
		Run.announce(run, string.format("Day %d. %d days until they come.",
			run.day, math.max(Tuning.HORDE_DAY - run.day, 0)))
		if stats.objective == 6 then
			stats.objective = 7
		end

	elseif tag == "flint" then
		stats.flint += 1
		target:Destroy()
		Run.announce(run, "Flint picked up.")
	end

	Run.sync(player)
end

--------------------------------------------------------------------------------
-- Swing  (left click)
--------------------------------------------------------------------------------

local function dropLog(run: Run.Instance_, position: Vector3)
	local logs = run.arena.folder:FindFirstChild("Logs")
	if not logs then
		local folder = Instance.new("Folder")
		folder.Name = "Logs"
		folder.Parent = run.arena.folder
		logs = folder
	end

	local log = Build.part({
		name = "Log",
		size = Vector3.new(3, 3, 9),
		cframe = CFrame.new(position.X, 1.6, position.Z) * CFrame.Angles(0, math.random() * math.pi, 0),
		colour = LOG_COLOUR,
		material = Enum.Material.Wood,
	}, logs)
	log:SetAttribute("Interact", "log")
	Build.label(log, "CARRY  [E]", Color3.fromRGB(230, 210, 170), 3, 9)
end

function Actions.swing(player: Player)
	local run = Run.forPlayer(player)
	local stats = Run.statsFor(player)
	local root = rootOf(player)
	if not run or not stats or not stats.alive or not root then
		return
	end

	-- A swing is a swing whether or not it lands on wood; check the horde first
	-- so fighting takes priority over chopping when both are in front of you.
	if Zombies.strike(root.Position, root.CFrame.LookVector, run.arena.folder,
		if stats.hasAxe then 20 else 8) then
		Run.sync(player)
		return
	end

	if not stats.hasAxe then
		return
	end

	-- The block, if it has a log on it.
	local block = targetFor(player, { "block" })
	if block and block:GetAttribute("Loaded") then
		local splits = ((block:GetAttribute("Splits") or 0) :: number) + 1
		block:SetAttribute("Splits", splits)

		if splits >= Tuning.SPLITS_PER_LOG then
			block:SetAttribute("Loaded", false)
			block:SetAttribute("Splits", 0)
			stats.wood += Tuning.WOOD_PER_LOG
			Run.announce(run, string.format("Split. +%d wood.", Tuning.WOOD_PER_LOG))
			if stats.objective == 5 then
				stats.objective = 6
			end
		else
			Run.announce(run, string.format("Split %d of %d.", splits, Tuning.SPLITS_PER_LOG))
		end
		Run.sync(player)
		return
	end

	-- Otherwise, a tree.
	local trees = run.arena.folder:FindFirstChild("Trees")
	if not trees then
		return
	end

	local best: Model? = nil
	local bestDistance = Tuning.INTERACT_RANGE * 2.4

	for _, tree in trees:GetChildren() do
		if tree:IsA("Model") and not tree:GetAttribute("Felled") and tree.PrimaryPart then
			local offset = tree.PrimaryPart.Position - root.Position
			local flat = Vector3.new(offset.X, 0, offset.Z)
			local distance = flat.Magnitude
			if distance < bestDistance and flat.Unit:Dot(root.CFrame.LookVector) > 0.45 then
				best = tree
				bestDistance = distance
			end
		end
	end

	if not best then
		return
	end

	local chops = ((best:GetAttribute("Chops") or 0) :: number) + 1
	best:SetAttribute("Chops", chops)

	if chops >= Tuning.CHOPS_TO_FELL then
		best:SetAttribute("Felled", true)
		local where = if best.PrimaryPart then best.PrimaryPart.Position else root.Position
		for _, piece in best:GetChildren() do
			if piece:IsA("BasePart") then
				piece.Transparency = 1
				piece.CanCollide = false
			end
		end
		dropLog(run, where + root.CFrame.LookVector * 6)
		Run.announce(run, "Timber. Shoulder the log.")
		if stats.objective == 2 then
			stats.objective = 3
		end
	else
		Run.announce(run, string.format("Chop %d of %d.", chops, Tuning.CHOPS_TO_FELL))
	end

	Run.sync(player)
end

--------------------------------------------------------------------------------
-- Eat  (F)
--------------------------------------------------------------------------------

function Actions.eat(player: Player, foodId: unknown)
	local run = Run.forPlayer(player)
	local stats = Run.statsFor(player)
	if not run or not stats or not stats.alive then
		return
	end
	if type(foodId) ~= "string" then
		return
	end

	-- "auto" is what F sends: eat the best thing on you rather than failing
	-- because the one named food happens to be the one you are out of.
	if foodId == "auto" then
		if stats.cookedMeat > 0 then
			foodId = "cooked"
		elseif stats.apples > 0 then
			foodId = "apple"
		elseif stats.rawMeat > 0 then
			foodId = "raw"
		else
			Run.announce(run, "You have nothing to eat.")
			return
		end
	end

	local food = Tuning.Food[foodId]
	if not food then
		return
	end

	local have = if foodId == "apple" then stats.apples
		elseif foodId == "raw" then stats.rawMeat
		else stats.cookedMeat

	if have <= 0 then
		Run.announce(run, "You have no " .. string.lower(food.name) .. ".")
		return
	end

	if foodId == "apple" then
		stats.apples -= 1
	elseif foodId == "raw" then
		stats.rawMeat -= 1
	else
		stats.cookedMeat -= 1
	end

	stats.hunger = math.min(stats.hunger + food.restore, 1)
	Run.announce(run, "You eat the " .. string.lower(food.name) .. ".")
	if stats.objective == 9 then
		stats.objective = 10
	end
	Run.sync(player)
end

function Actions.setSprinting(player: Player, sprinting: unknown)
	local stats = Run.statsFor(player)
	if not stats then
		return
	end
	stats.sprinting = sprinting == true and stats.stamina > Tuning.STAMINA_SPRINT_FLOOR
end

return Actions

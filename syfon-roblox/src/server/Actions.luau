--!strict
-- Actions: what the player actually does, and what it feels like when they do.
--
-- Syfon's chain is kept intact: a tree does not give you wood. It gives you a
-- log, the log is carried home on your shoulder, and the block turns it into
-- firewood. Five chops, four splits, twelve wood.
--
-- Interaction is by ProximityPrompt rather than the cone test the first pass
-- used. A prompt is what a Roblox player expects, it says what the key does, and
-- it cannot fire on something behind you.

local Debris = game:GetService("Debris")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Tuning = require(Shared:WaitForChild("Tuning"))
local Build = require(Shared:WaitForChild("Build"))
local Audio = require(Shared:WaitForChild("Audio"))

local Run = require(script.Parent:WaitForChild("Run"))
local Zombies = require(script.Parent:WaitForChild("Zombies"))

local Actions = {}

local LOG_COLOUR = Color3.fromRGB(122, 92, 62)
local SWING_COOLDOWN = 0.45

local lastSwing: { [Player]: number } = {}

--------------------------------------------------------------------------------
-- Feel
--------------------------------------------------------------------------------

-- A short burst of debris at a point. Chips for wood, dust for stone.
local function burst(position: Vector3, colour: Color3, count: number, speed: number)
	local anchor = Instance.new("Part")
	anchor.Name = "Burst"
	anchor.Size = Vector3.one
	anchor.Transparency = 1
	anchor.Anchored = true
	anchor.CanCollide = false
	anchor.CanQuery = false
	anchor.CFrame = CFrame.new(position)
	anchor.Parent = workspace

	local emitter = Instance.new("ParticleEmitter")
	emitter.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	emitter.Color = ColorSequence.new(colour)
	emitter.LightEmission = 0
	emitter.Size = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.5),
		NumberSequenceKeypoint.new(1, 0),
	})
	emitter.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.1),
		NumberSequenceKeypoint.new(1, 1),
	})
	emitter.Lifetime = NumberRange.new(0.35, 0.8)
	emitter.Speed = NumberRange.new(speed * 0.5, speed)
	emitter.SpreadAngle = Vector2.new(180, 180)
	emitter.Acceleration = Vector3.new(0, -60, 0)
	emitter.Rate = 0
	emitter.Parent = anchor

	emitter:Emit(count)
	Debris:AddItem(anchor, 2)
end

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

--------------------------------------------------------------------------------
-- The axe, as a real Tool
--------------------------------------------------------------------------------

-- Handing the player a Tool rather than setting a boolean gets the grip, the
-- hold pose and the swing animation from Roblox for nothing, and puts an axe in
-- their hand that they can see.
local function giveAxe(player: Player)
	local backpack = player:FindFirstChildOfClass("Backpack")
	if not backpack or backpack:FindFirstChild("Axe") then
		return
	end

	local tool = Instance.new("Tool")
	tool.Name = "Axe"
	tool.RequiresHandle = true
	tool.CanBeDropped = false
	tool.ToolTip = "Fell trees, split logs, and swing at what comes on day 10"
	tool.GripPos = Vector3.new(0, -0.6, 0.2)
	tool.GripForward = Vector3.new(0, 0, -1)
	tool.GripRight = Vector3.new(1, 0, 0)
	tool.GripUp = Vector3.new(0, 1, 0)

	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(0.45, 4.2, 0.45)
	handle.Color = Color3.fromRGB(120, 88, 58)
	handle.Material = Enum.Material.Wood
	handle.CanCollide = false
	handle.Parent = tool

	local head = Instance.new("Part")
	head.Name = "Head"
	head.Size = Vector3.new(0.45, 1.9, 1.6)
	head.Color = Color3.fromRGB(158, 160, 168)
	head.Material = Enum.Material.Metal
	head.CanCollide = false
	head.CFrame = handle.CFrame * CFrame.new(0, 1.7, -0.5)
	head.Parent = tool

	local weld = Instance.new("WeldConstraint")
	weld.Part0 = handle
	weld.Part1 = head
	weld.Parent = handle

	tool.Activated:Connect(function()
		Actions.swing(player)
	end)

	tool.Parent = backpack

	-- Equip it straight away; nobody wants to hunt the backpack for the thing
	-- they just picked up.
	local character = player.Character
	local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
	if humanoid then
		humanoid:EquipTool(tool)
	end
end

--------------------------------------------------------------------------------
-- Fire
--------------------------------------------------------------------------------

local function lightFire(hearth: BasePart)
	hearth:SetAttribute("Lit", true)

	local flame = Instance.new("Part")
	flame.Name = "Flame"
	flame.Size = Vector3.new(2.4, 2.4, 2.4)
	flame.Transparency = 1
	flame.Anchored = true
	flame.CanCollide = false
	flame.CanQuery = false
	flame.CFrame = hearth.CFrame * CFrame.new(0, 1.6, 0)
	flame.Parent = hearth

	local fire = Instance.new("Fire")
	fire.Heat = 14
	fire.Size = 8
	fire.Color = Color3.fromRGB(255, 168, 76)
	fire.SecondaryColor = Color3.fromRGB(190, 70, 30)
	fire.Parent = flame

	local light = Instance.new("PointLight")
	light.Color = Color3.fromRGB(255, 172, 96)
	light.Range = 42
	light.Brightness = 2.6
	light.Shadows = true
	light.Parent = flame

	local smoke = Instance.new("Smoke")
	smoke.Color = Color3.fromRGB(72, 66, 60)
	smoke.Opacity = 0.22
	smoke.RiseVelocity = 8
	smoke.Size = 6
	smoke.Parent = flame

	Audio.play("ignite", hearth)

	-- The looping bass doubles as a fire crackle; it has to come right down or
	-- it sounds like the horde arriving eight days early.
	local crackle = Audio.loop("horde", flame)
	if crackle then
		crackle.Volume = 0.16
		crackle.PlaybackSpeed = 0.72
	end
end

--------------------------------------------------------------------------------
-- Prompts
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
		size = Vector3.new(3.2, 3.2, 10),
		cframe = CFrame.new(position.X, position.Y + 1.7, position.Z)
			* CFrame.Angles(0, math.random() * math.pi, math.rad(4)),
		colour = LOG_COLOUR,
		material = Enum.Material.Wood,
	}, logs)

	log:SetAttribute("Interact", "log")
	local p = Instance.new("ProximityPrompt")
	p.ActionText = "Shoulder"
	p.ObjectText = "Log"
	p.KeyboardKeyCode = Enum.KeyCode.E
	p.MaxActivationDistance = 12
	p.HoldDuration = 0
	p.RequiresLineOfSight = false
	p.Parent = log
end

function Actions.handlePrompt(promptInstance: ProximityPrompt, player: Player)
	local target = promptInstance.Parent
	if not target or not target:IsA("BasePart") then
		return
	end

	local run = Run.forPlayer(player)
	local stats = Run.statsFor(player)
	if not run or not stats or not stats.alive then
		return
	end

	-- A prompt in another party's arena is not yours to press.
	if not target:IsDescendantOf(run.arena.folder) then
		return
	end

	local tag = target:GetAttribute("Interact")

	if tag == "axe" then
		if stats.hasAxe then
			return
		end
		stats.hasAxe = true
		giveAxe(player)
		Audio.play("takeAxe", target)
		local haft = target.Parent and target.Parent:FindFirstChild("AxeHaft")
		if haft then
			haft:Destroy()
		end
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
		Audio.play("pickup", target.Position)
		target:Destroy()
		Run.announce(run, "You shoulder the log. Take it to the block.")
		if stats.objective == 3 then
			stats.objective = 4
		end

	elseif tag == "block" then
		if stats.carryingLog then
			stats.carryingLog = false
			target:SetAttribute("Loaded", true)
			target:SetAttribute("Splits", 0)
			Audio.play("split", target)
			Run.announce(run, "Log on the block. Swing the axe at it.")
			if stats.objective == 4 then
				stats.objective = 5
			end
		elseif not target:GetAttribute("Loaded") then
			Run.announce(run, "You need a log to split.")
		end

	elseif tag == "map" then
		Audio.play("uiPick", target)
		Run.announce(run, string.format("Day %d. %d days until they come.",
			run.day, math.max(Tuning.HORDE_DAY - run.day, 0)))
		if stats.objective == 6 then
			stats.objective = 7
		end

	elseif tag == "flint" then
		stats.flint += 1
		Audio.play("pickup", target.Position)
		target:Destroy()
		Run.announce(run, string.format("Flint. You have %d.", stats.flint))

	elseif tag == "fire" then
		if target:GetAttribute("Lit") then
			Run.announce(run, "It is already burning.")
			return
		end
		if stats.flint < 1 then
			Run.announce(run, "You need flint to strike a spark.")
			return
		end
		if stats.wood < Tuning.FIREWOOD_COST then
			Run.announce(run, string.format("You need %d wood to lay a fire.", Tuning.FIREWOOD_COST))
			return
		end
		stats.flint -= 1
		stats.wood -= Tuning.FIREWOOD_COST
		lightFire(target)
		Run.announce(run, "The fire catches.")
		if stats.objective == 8 then
			stats.objective = 9
		end
	end

	Run.sync(player)
end

--------------------------------------------------------------------------------
-- Swinging
--------------------------------------------------------------------------------

function Actions.swing(player: Player)
	local run = Run.forPlayer(player)
	local stats = Run.statsFor(player)
	local root = rootOf(player)
	if not run or not stats or not stats.alive or not root then
		return
	end

	local now = os.clock()
	if now - (lastSwing[player] or 0) < SWING_COOLDOWN then
		return
	end
	lastSwing[player] = now

	local damage = if stats.hasAxe then 20 else 8
	local hit, where = Zombies.strike(root.Position, root.CFrame.LookVector, run.arena.folder, damage)
	if hit then
		burst(where, Color3.fromRGB(96, 116, 78), 18, 26)
		Audio.play("hitFlesh", where)
		Run.sync(player)
		return
	end

	if not stats.hasAxe then
		Audio.play("strike", root.Position)
		return
	end

	-- The block, if a log is on it.
	local cabin = run.arena.folder:FindFirstChild("Cabin")
	local block = if cabin then cabin:FindFirstChild("ChoppingBlock") else nil
	if block and block:IsA("BasePart") and block:GetAttribute("Loaded")
		and (block.Position - root.Position).Magnitude < 14 then

		local splits = ((block:GetAttribute("Splits") or 0) :: number) + 1
		block:SetAttribute("Splits", splits)
		burst(block.Position + Vector3.new(0, 2.4, 0), LOG_COLOUR, 14, 22)
		Audio.play("split", block)

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
	local bestDistance = 16

	for _, tree in trees:GetChildren() do
		if tree:IsA("Model") and not tree:GetAttribute("Felled") and tree.PrimaryPart then
			local offset = tree.PrimaryPart.Position - root.Position
			local flat = Vector3.new(offset.X, 0, offset.Z)
			local distance = flat.Magnitude
			if distance < bestDistance and distance > 0 and flat.Unit:Dot(root.CFrame.LookVector) > 0.4 then
				best = tree
				bestDistance = distance
			end
		end
	end

	if not best then
		Audio.play("strike", root.Position)
		return
	end

	local primary = best.PrimaryPart :: BasePart
	local chops = ((best:GetAttribute("Chops") or 0) :: number) + 1
	best:SetAttribute("Chops", chops)

	burst(primary.Position + Vector3.new(0, 3, 0), LOG_COLOUR, 12, 20)
	Audio.play("chop", primary.Position)

	if chops >= Tuning.CHOPS_TO_FELL then
		best:SetAttribute("Felled", true)
		local where2 = primary.Position

		-- Tip it over rather than blinking it out. The trunk falls away from the
		-- player, which is both what happens and what reads as cause and effect.
		local away = Vector3.new(root.CFrame.LookVector.X, 0, root.CFrame.LookVector.Z).Unit
		local axis = Vector3.new(-away.Z, 0, away.X)

		-- Rotate about the foot of the trunk. Rotating each part by a bare
		-- CFrame.Angles pivots it about the world origin instead, which throws
		-- the tree thousands of studs across the map -- arenas are not at 0,0.
		local foot = CFrame.new(primary.Position - Vector3.new(0, primary.Size.Y / 2, 0))
		local originals: { [BasePart]: CFrame } = {}
		for _, piece in best:GetDescendants() do
			if piece:IsA("BasePart") and piece.Name ~= "Hitbox" then
				originals[piece] = piece.CFrame
				piece.CanCollide = false
			end
		end

		task.spawn(function()
			for stepIndex = 1, 16 do
				local angle = math.rad(86 * (stepIndex / 16) ^ 1.7)
				local turn = foot * CFrame.fromAxisAngle(axis, angle) * foot:Inverse()
				for piece, original in originals do
					piece.CFrame = turn * original
				end
				task.wait(0.03)
			end
			task.wait(1.1)
			for piece in originals do
				piece.Transparency = 1
			end
		end)

		Audio.play("timber", where2)
		dropLog(run, where2 + away * 8)
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

function Actions.eat(player: Player, foodId: unknown)
	local run = Run.forPlayer(player)
	local stats = Run.statsFor(player)
	if not run or not stats or not stats.alive then
		return
	end
	if type(foodId) ~= "string" then
		return
	end

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

	if foodId == "apple" then
		if stats.apples <= 0 then return end
		stats.apples -= 1
	elseif foodId == "raw" then
		if stats.rawMeat <= 0 then return end
		stats.rawMeat -= 1
	else
		if stats.cookedMeat <= 0 then return end
		stats.cookedMeat -= 1
	end

	stats.hunger = math.min(stats.hunger + food.restore, 1)
	Audio.play("pickup", rootOf(player) or workspace)
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

function Actions.forget(player: Player)
	lastSwing[player] = nil
end

return Actions

--!strict
-- Zombies: the horde the original counted down to and never had.
--
-- Syfon's README was blunt about it -- "zombies are not in yet" -- while every
-- other system pointed at day 10. A run-based structure does not allow that:
-- the horde is the ending, so it has to exist.
--
-- They are deliberately slow and deliberately many. A single one is no threat;
-- what kills you is being surrounded away from your fire at three in the
-- morning with no stamina left.

local Debris = game:GetService("Debris")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Build = require(Shared:WaitForChild("Build"))
local Audio = require(Shared:WaitForChild("Audio"))

local Zombies = {}

local BASE_COUNT = 14 -- per player in the run
local WAVE_INTERVAL = 22
local SPAWN_RING = 190 -- studs from the cabin: out of sight, within earshot
local WALK_SPEED = 7.5
local LUNGE_SPEED = 13
local ATTACK_RANGE = 6
local ATTACK_DAMAGE = 9
local ATTACK_COOLDOWN = 1.4
local HEALTH = 40
local SIGHT = 140

local COLOURS = {
	flesh = Color3.fromRGB(104, 116, 92),
	fleshDark = Color3.fromRGB(78, 88, 70),
	rag = Color3.fromRGB(62, 58, 54),
	eye = Color3.fromRGB(210, 78, 62),
}

export type Zombie = {
	model: Model,
	root: BasePart,
	health: number,
	nextAttack: number,
	target: Player?,
}

-- Built from parts rather than an R15 rig: a rig needs an uploaded animation
-- set to look like anything, and there is no asset pipeline yet.
local function buildBody(cframe: CFrame, parent: Instance): (Model, BasePart)
	local model = Instance.new("Model")
	model.Name = "Zombie"
	model.Parent = parent

	-- One invisible collider spanning the whole body. Colliding on the torso
	-- alone left it resting 2.2 studs up with the legs through the floor.
	local root = Build.part({ name = "Hitbox", size = Vector3.new(3, 8.6, 2),
		cframe = cframe * CFrame.new(0, 4.3, 0), colour = COLOURS.rag,
		material = Enum.Material.SmoothPlastic, anchored = false,
		canCollide = true, transparency = 1 }, model)
	root.CanQuery = false
	model.PrimaryPart = root

	local torso = Build.part({ name = "Torso", size = Vector3.new(3, 4.4, 1.8),
		cframe = cframe * CFrame.new(0, 5.4, 0), colour = COLOURS.rag,
		material = Enum.Material.Fabric, anchored = false, canCollide = false }, model)
	local torsoWeld = Instance.new("WeldConstraint")
	torsoWeld.Part0 = root
	torsoWeld.Part1 = torso
	torsoWeld.Parent = root

	local head = Build.part({ name = "Head", size = Vector3.new(1.9, 1.9, 1.9),
		cframe = cframe * CFrame.new(0, 8.3, 0), colour = COLOURS.flesh,
		material = Enum.Material.SmoothPlastic, anchored = false, canCollide = false }, model)

	local neck = Instance.new("WeldConstraint")
	neck.Part0 = root
	neck.Part1 = head
	neck.Parent = root

	for _, side in { -1, 1 } do
		local eye = Build.part({ name = "Eye", size = Vector3.new(0.34, 0.34, 0.2),
			cframe = cframe * CFrame.new(side * 0.45, 8.5, -0.95), colour = COLOURS.eye,
			material = Enum.Material.Neon, anchored = false, canCollide = false }, model)
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = head
		weld.Part1 = eye
		weld.Parent = head

		-- Arms out in front, which is both the silhouette people expect and a
		-- cheap way to show reach without an animation.
		local arm = Build.part({ name = "Arm", size = Vector3.new(0.9, 0.9, 3.4),
			cframe = cframe * CFrame.new(side * 1.7, 6.0, -1.6), colour = COLOURS.fleshDark,
			material = Enum.Material.SmoothPlastic, anchored = false, canCollide = false }, model)
		local armWeld = Instance.new("WeldConstraint")
		armWeld.Part0 = root
		armWeld.Part1 = arm
		armWeld.Parent = root

		local leg = Build.part({ name = "Leg", size = Vector3.new(1.1, 3.6, 1.1),
			cframe = cframe * CFrame.new(side * 0.8, 1.8, 0), colour = COLOURS.rag,
			material = Enum.Material.Fabric, anchored = false, canCollide = false }, model)
		local legWeld = Instance.new("WeldConstraint")
		legWeld.Part0 = root
		legWeld.Part1 = leg
		legWeld.Parent = root
	end

	-- One BodyVelocity-free approach: the torso is driven by AlignPosition so a
	-- zombie cannot be shoved through the floor by a pile-up.
	root.CustomPhysicalProperties = PhysicalProperties.new(1.2, 0.6, 0.2)

	return model, root
end

local function nearestTarget(root: BasePart, players: { Player }): Player?
	local best: Player? = nil
	local bestDistance = SIGHT

	for _, player in players do
		local character = player.Character
		if character then
			local target = character:FindFirstChild("HumanoidRootPart")
			local humanoid = character:FindFirstChildOfClass("Humanoid")
			if target and target:IsA("BasePart") and humanoid and humanoid.Health > 0 then
				local distance = (target.Position - root.Position).Magnitude
				if distance < bestDistance then
					best = player
					bestDistance = distance
				end
			end
		end
	end

	return best
end

-- Drive one horde for one run until the run ends.
function Zombies.unleash(runId: number, arenaFolder: Folder, origin: Vector3,
	groundAt: (x: number, z: number) -> number,
	players: () -> { Player },
	damage: (player: Player, amount: number) -> (),
	stillRunning: () -> boolean)

	local group = Instance.new("Folder")
	group.Name = "Zombies"
	group.Parent = arenaFolder

	local live: { Zombie } = {}

	local function spawnWave(count: number)
		for i = 1, count do
			local angle = (i / count) * math.pi * 2 + math.random() * 0.6
			local radius = SPAWN_RING + math.random() * 40
			local localX, localZ = math.cos(angle) * radius, math.sin(angle) * radius
			local position = Vector3.new(
				origin.X + localX,
				groundAt(localX, localZ) + 5,
				origin.Z + localZ
			)
			local model, root = buildBody(CFrame.new(position), group)
			-- Health lives on the model as an attribute so Zombies.strike, which
			-- only has the Instance, and this loop cannot disagree about it.
			model:SetAttribute("Health", HEALTH)
			table.insert(live, {
				model = model, root = root, health = HEALTH,
				nextAttack = 0, target = nil,
			})
		end
	end

	spawnWave(BASE_COUNT * math.max(#players(), 1))

	task.spawn(function()
		while stillRunning() do
			task.wait(WAVE_INTERVAL)
			if not stillRunning() then
				break
			end
			-- Each wave is smaller than the first but never stops, so holding
			-- out is about attrition rather than clearing the map.
			spawnWave(math.max(4, math.floor(BASE_COUNT * 0.4) * math.max(#players(), 1)))
		end
	end)

	task.spawn(function()
		while stillRunning() do
			task.wait(0.2)
			local now = os.clock()
			local currentPlayers = players()

			for index = #live, 1, -1 do
				local zombie = live[index]
				zombie.health = (zombie.model:GetAttribute("Health") or 0) :: number

				-- Drop it from the AI list but leave the body alone: Zombies.strike
				-- has already given it a death, and Debris will clear it up. The
				-- first pass destroyed it here on the next tick, so the death
				-- never played.
				if zombie.health <= 0 or not zombie.model.Parent then
					table.remove(live, index)
					continue
				end

				local target = nearestTarget(zombie.root, currentPlayers)
				zombie.target = target

				-- The horde should be heard coming. One in roughly ninety ticks
				-- per zombie keeps it a soundscape rather than a wall of noise.
				if target and math.random() < 0.011 then
					Audio.play("zombieCall", zombie.root.Position)
				end

				if target and target.Character then
					local targetRoot = target.Character:FindFirstChild("HumanoidRootPart")
					if targetRoot and targetRoot:IsA("BasePart") then
						local toTarget = targetRoot.Position - zombie.root.Position
						local distance = toTarget.Magnitude

						if distance <= ATTACK_RANGE then
							if now >= zombie.nextAttack then
								zombie.nextAttack = now + ATTACK_COOLDOWN
								damage(target, ATTACK_DAMAGE)
							end
							zombie.root.AssemblyLinearVelocity = Vector3.new(0, zombie.root.AssemblyLinearVelocity.Y, 0)
						else
							local speed = if distance < 26 then LUNGE_SPEED else WALK_SPEED
							local direction = Vector3.new(toTarget.X, 0, toTarget.Z).Unit
							zombie.root.AssemblyLinearVelocity = Vector3.new(
								direction.X * speed,
								zombie.root.AssemblyLinearVelocity.Y,
								direction.Z * speed
							)
							-- Face the way they are going.
							local look = CFrame.lookAt(zombie.root.Position, zombie.root.Position + direction)
							zombie.root.CFrame = CFrame.new(zombie.root.Position) * (look - look.Position)
						end
					end
				end
			end
		end

		group:Destroy()
	end)

	local _ = runId
end

-- Called when a player swings. Returns whether a zombie was hit and where, so
-- the caller can put the blood and the sound at the point of contact rather
-- than at the player's feet.
function Zombies.strike(origin: Vector3, direction: Vector3, arenaFolder: Folder, damageAmount: number): (boolean, Vector3)
	local group = arenaFolder:FindFirstChild("Zombies")
	if not group then
		return false, origin
	end

	local best: Model? = nil
	local bestDistance = 12

	for _, model in group:GetChildren() do
		if model:IsA("Model") and model.PrimaryPart then
			local offset = model.PrimaryPart.Position - origin
			local distance = offset.Magnitude
			if distance < bestDistance and offset.Unit:Dot(direction) > 0.6 then
				best = model
				bestDistance = distance
			end
		end
	end

	if not best then
		return false, origin
	end

	local model = best :: Model
	local primary = model.PrimaryPart :: BasePart
	local where = primary.Position + Vector3.new(0, 2, 0)

	local health = (model:GetAttribute("Health") or HEALTH) :: number
	health -= damageAmount
	model:SetAttribute("Health", health)

	if health <= 0 then
		Audio.play("zombieDown", where)
		-- Let it drop rather than vanish: unweld nothing, just release the
		-- anchor state and tip it, then clear up a moment later.
		primary.CanCollide = false
		primary.AssemblyLinearVelocity = direction * 14 + Vector3.new(0, 12, 0)
		primary.AssemblyAngularVelocity = Vector3.new(math.random() * 6 - 3, 0, math.random() * 6 - 3)
		Debris:AddItem(model, 3.5)
	end

	return true, where
end

local _ = Players
return Zombies

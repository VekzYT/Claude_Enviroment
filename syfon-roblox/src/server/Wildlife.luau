--!strict
-- Wildlife: the deer, boar, hare and elk that make the forest worth walking into.
--
-- Syfon's animals had a specific behaviour worth keeping: they notice you at 16
-- metres, they bolt for seven seconds, and they turn before they walk so nothing
-- moonwalks. Carrying a lit lamp roughly doubles the distance at which they
-- notice you, which is the cost of being able to see at night.

local Debris = game:GetService("Debris")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Tuning = require(Shared:WaitForChild("Tuning"))
local Build = require(Shared:WaitForChild("Build"))
local Audio = require(Shared:WaitForChild("Audio"))

local Wildlife = {}

local PER_ARENA = 11
local WALK_SPEED = 7
local FLEE_SPEED = 21
local BOAR_CHARGE_SPEED = 17
local TICK = 0.25
local RESPAWN_DELAY = 40

local HIDES = {
	deer = Color3.fromRGB(140, 104, 68),
	boar = Color3.fromRGB(84, 70, 62),
	hare = Color3.fromRGB(168, 156, 138),
	elk = Color3.fromRGB(112, 84, 56),
}

export type Animal = {
	model: Model,
	root: BasePart,
	species: string,
	health: number,
	home: Vector3,
	goal: Vector3,
	fleeUntil: number,
	nextCall: number,
	dead: boolean,
}

-- Four legs, a body, a head and ears. Enough silhouette to tell a hare from an
-- elk at fifty studs, which is all the identification a player needs.
local function buildBody(species: string, position: Vector3, parent: Instance): (Model, BasePart)
	local spec = Tuning.Animals[species]
	local scale = spec.scale
	local hide = HIDES[species]

	local model = Instance.new("Model")
	model.Name = species
	model:SetAttribute("Species", species)
	model.Parent = parent

	local bodyLength = 6.5 * scale
	local bodyHeight = 3.2 * scale
	local legLength = 3.4 * scale

	local root = Build.part({
		name = "Body",
		size = Vector3.new(2.8 * scale, bodyHeight, bodyLength),
		cframe = CFrame.new(position + Vector3.new(0, legLength + bodyHeight / 2, 0)),
		colour = hide, material = Enum.Material.Fabric,
		anchored = false, canCollide = true,
	}, model)
	model.PrimaryPart = root

	local function weldTo(part: BasePart)
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = root
		weld.Part1 = part
		weld.Parent = root
	end

	local neck = Build.part({ name = "Neck", size = Vector3.new(1.5 * scale, 2.6 * scale, 1.5 * scale),
		cframe = root.CFrame * CFrame.new(0, 1.4 * scale, -bodyLength / 2 + 0.4),
		colour = hide, material = Enum.Material.Fabric, anchored = false, canCollide = false }, model)
	weldTo(neck)

	local head = Build.part({ name = "Head", size = Vector3.new(1.6 * scale, 1.5 * scale, 2.6 * scale),
		cframe = root.CFrame * CFrame.new(0, 2.9 * scale, -bodyLength / 2 - 0.7),
		colour = hide, material = Enum.Material.Fabric, anchored = false, canCollide = false }, model)
	weldTo(head)

	for _, side in { -1, 1 } do
		local ear = Build.part({ name = "Ear", size = Vector3.new(0.3 * scale, 1.3 * scale, 0.6 * scale),
			cframe = root.CFrame * CFrame.new(side * 0.6 * scale, 3.8 * scale, -bodyLength / 2 - 0.5)
				* CFrame.Angles(0, 0, math.rad(side * 18)),
			colour = hide, material = Enum.Material.Fabric, anchored = false, canCollide = false }, model)
		weldTo(ear)

		-- Antlers, which is the whole reason an elk reads as an elk.
		if species == "elk" or species == "deer" then
			local spread = if species == "elk" then 1.9 else 1.2
			for tine = 1, 3 do
				local antler = Build.part({ name = "Antler",
					size = Vector3.new(0.28, 1.5 * scale * spread / 1.4, 0.28),
					cframe = root.CFrame
						* CFrame.new(side * 0.7 * scale, 4.2 * scale + tine * 0.5, -bodyLength / 2 - 0.4 + tine * 0.45)
						* CFrame.Angles(math.rad(-24), 0, math.rad(side * (22 + tine * 9))),
					colour = Color3.fromRGB(196, 182, 156), material = Enum.Material.Sand,
					anchored = false, canCollide = false }, model)
				weldTo(antler)
			end
		end

		for _, front in { -1, 1 } do
			local leg = Build.part({ name = "Leg", size = Vector3.new(0.7 * scale, legLength, 0.7 * scale),
				cframe = root.CFrame * CFrame.new(side * 1.0 * scale, -bodyHeight / 2 - legLength / 2 + 0.2,
					front * (bodyLength / 2 - 1.1)),
				colour = hide:Lerp(Color3.new(0, 0, 0), 0.25), material = Enum.Material.Fabric,
				anchored = false, canCollide = false }, model)
			weldTo(leg)
		end
	end

	local tail = Build.part({ name = "Tail", size = Vector3.new(0.6 * scale, 0.9 * scale, 0.6 * scale),
		cframe = root.CFrame * CFrame.new(0, 1.1 * scale, bodyLength / 2 + 0.3),
		colour = Color3.new(1, 1, 1):Lerp(hide, 0.3), material = Enum.Material.Fabric,
		anchored = false, canCollide = false }, model)
	weldTo(tail)

	root.CustomPhysicalProperties = PhysicalProperties.new(0.9, 0.6, 0.1)
	return model, root
end

--------------------------------------------------------------------------------

local function dropMeat(arenaFolder: Folder, position: Vector3, count: number)
	local group = arenaFolder:FindFirstChild("Drops")
	if not group then
		local folder = Instance.new("Folder")
		folder.Name = "Drops"
		folder.Parent = arenaFolder
		group = folder
	end

	local meat = Build.part({
		name = "Meat",
		size = Vector3.new(2.4, 1.2, 2.4),
		cframe = CFrame.new(position + Vector3.new(0, 1, 0)),
		colour = Color3.fromRGB(158, 74, 68),
		material = Enum.Material.Fabric,
		canCollide = false,
	}, group)
	meat:SetAttribute("Interact", "meat")
	meat:SetAttribute("Amount", count)

	local p = Instance.new("ProximityPrompt")
	p.ActionText = "Take meat"
	p.ObjectText = count .. "x raw meat"
	p.KeyboardKeyCode = Enum.KeyCode.E
	p.MaxActivationDistance = 12
	p.HoldDuration = 0
	p.RequiresLineOfSight = false
	p.Parent = meat
end

-- One herd for one arena, running until the server stops.
function Wildlife.populate(arenaFolder: Folder, origin: Vector3,
	groundAt: (x: number, z: number) -> number,
	nearbyPlayers: () -> { { root: BasePart, lamp: boolean } })

	local group = Instance.new("Folder")
	group.Name = "Animals"
	group.Parent = arenaFolder

	local herd: { Animal } = {}
	local rng = Random.new(origin.X + 4211)

	local function findSpot(): Vector3
		for _ = 1, 20 do
			local angle = rng:NextNumber(0, math.pi * 2)
			local radius = rng:NextNumber(70, 250)
			local x, z = math.cos(angle) * radius, math.sin(angle) * radius
			local y = groundAt(x, z)
			if y > 8 and y < 80 then
				return Vector3.new(origin.X + x, y, origin.Z + z)
			end
		end
		return origin + Vector3.new(120, 20, 120)
	end

	local function spawnOne()
		local roll = rng:NextNumber()
		local species = if roll < 0.42 then "deer"
			elseif roll < 0.68 then "hare"
			elseif roll < 0.88 then "boar"
			else "elk"

		local spot = findSpot()
		local model, root = buildBody(species, spot, group)
		table.insert(herd, {
			model = model, root = root, species = species,
			health = Tuning.Animals[species].health,
			home = spot, goal = spot,
			fleeUntil = 0, nextCall = 0, dead = false,
		})
		model:SetAttribute("Health", Tuning.Animals[species].health)
	end

	for _ = 1, PER_ARENA do
		spawnOne()
	end

	task.spawn(function()
		while group.Parent do
			task.wait(TICK)
			local now = os.clock()
			local watchers = nearbyPlayers()

			for index = #herd, 1, -1 do
				local animal = herd[index]

				if animal.dead or not animal.model.Parent then
					table.remove(herd, index)
					task.delay(RESPAWN_DELAY, function()
						if group.Parent then
							spawnOne()
						end
					end)
					continue
				end

				animal.health = (animal.model:GetAttribute("Health") or 0) :: number
				if animal.health <= 0 then
					continue
				end

				local position = animal.root.Position

				-- Who has spooked it. A lit lamp nearly doubles the range.
				local threat: BasePart? = nil
				local threatDistance = math.huge
				for _, watcher in watchers do
					local notice = Tuning.ANIMAL_NOTICE * (if watcher.lamp then Tuning.LAMP_NOTICE_MULTIPLIER else 1)
					local d = (watcher.root.Position - position).Magnitude
					if d < notice and d < threatDistance then
						threat = watcher.root
						threatDistance = d
					end
				end

				if threat then
					animal.fleeUntil = now + Tuning.ANIMAL_FLEE_TIME
					if now >= animal.nextCall then
						animal.nextCall = now + rng:NextNumber(4, 11)
						Audio.play("zombieCall", position)
					end
				end

				local fleeing = now < animal.fleeUntil
				local speed = WALK_SPEED
				local direction: Vector3

				if fleeing and threat then
					local away = position - threat.Position
					direction = Vector3.new(away.X, 0, away.Z)
					-- A boar turns and charges instead of running, which is the
					-- only animal in the valley that can hurt you.
					if animal.species == "boar" and threatDistance < 34 then
						direction = -direction
						speed = BOAR_CHARGE_SPEED
					else
						speed = FLEE_SPEED
					end
				else
					if (Vector3.new(position.X, 0, position.Z) - Vector3.new(animal.goal.X, 0, animal.goal.Z)).Magnitude < 8 then
						local angle = rng:NextNumber(0, math.pi * 2)
						local radius = rng:NextNumber(20, Tuning.ANIMAL_WANDER_RADIUS)
						animal.goal = animal.home + Vector3.new(math.cos(angle) * radius, 0, math.sin(angle) * radius)
					end
					direction = Vector3.new(animal.goal.X - position.X, 0, animal.goal.Z - position.Z)
				end

				if direction.Magnitude > 0.1 then
					local unit = direction.Unit
					animal.root.AssemblyLinearVelocity = Vector3.new(
						unit.X * speed, animal.root.AssemblyLinearVelocity.Y, unit.Z * speed)
					-- Turn before you go: this is what stopped them moonwalking
					-- in the original, and it still does.
					local look = CFrame.lookAt(position, position + unit)
					animal.root.CFrame = CFrame.new(position) * (look - look.Position)
				end
			end
		end
	end)

	return group
end

-- A swing or an arrow. Returns whether it connected, and where.
function Wildlife.strike(origin: Vector3, direction: Vector3, arenaFolder: Folder,
	damage: number, reach: number): (boolean, Vector3, string?, number)

	local group = arenaFolder:FindFirstChild("Animals")
	if not group then
		return false, origin, nil, 0
	end

	local best: Model? = nil
	local bestDistance = reach

	for _, model in group:GetChildren() do
		if model:IsA("Model") and model.PrimaryPart and (model:GetAttribute("Health") or 0) > 0 then
			local offset = model.PrimaryPart.Position - origin
			local distance = offset.Magnitude
			if distance < bestDistance and distance > 0 and offset.Unit:Dot(direction) > 0.6 then
				best = model
				bestDistance = distance
			end
		end
	end

	if not best then
		return false, origin, nil, 0
	end

	local model = best :: Model
	local primary = model.PrimaryPart :: BasePart
	local where = primary.Position
	local species = model:GetAttribute("Species") :: string

	local health = ((model:GetAttribute("Health") or 0) :: number) - damage
	model:SetAttribute("Health", health)

	if health <= 0 then
		local spec = Tuning.Animals[species]
		Audio.play("hitFlesh", where)
		dropMeat(arenaFolder, where, spec.meat)

		-- Topple it rather than deleting it: a carcass on its side reads as a
		-- kill, an instant disappearance reads as a bug.
		primary.CanCollide = false
		primary.AssemblyAngularVelocity = Vector3.new(0, 0, 8)
		Debris:AddItem(model, 4)
		return true, where, species, spec.meat
	end

	Audio.play("hitFlesh", where)
	return true, where, species, 0
end

return Wildlife

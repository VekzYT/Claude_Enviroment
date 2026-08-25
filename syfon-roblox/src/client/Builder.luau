--!strict
-- Builder: the green ghost that shows where a wall will actually stand.
--
-- The ghost is a suggestion only. It snaps to the same grid the server uses and
-- turns red where it thinks placement will fail, but the server re-derives the
-- cell and re-checks the cost regardless -- a client that lies about where it
-- is aiming gets nothing.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Tuning = require(Shared:WaitForChild("Tuning"))
local Net = require(Shared:WaitForChild("Net"))

local Builder = {}

local GRID = Tuning.BUILD_GRID
local REACH = Tuning.BUILD_REACH

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

local active = false
local pieceIndex = 1
local rotation = 0
local ghost: Part? = nil
local wood = 0

local placeRemote = Net.get("Place")
local unplaceRemote = Net.get("Unplace")

local statusLabel: TextLabel? = nil

function Builder.attachStatus(label: TextLabel)
	statusLabel = label
end

function Builder.setWood(amount: number)
	wood = amount
end

local function currentPiece()
	return Tuning.Pieces[pieceIndex]
end

local function refreshStatus()
	local label = statusLabel
	if not label then
		return
	end
	if not active then
		label.Text = ""
		label.Visible = false
		return
	end

	local piece = currentPiece()
	local affordable = wood >= piece.cost
	label.Visible = true
	label.Text = string.format(
		"<b>%s</b>  ·  <font color='#%s'>%d wood</font>   |   scroll to change  ·  R to turn  ·  RMB removes  ·  B to stop",
		piece.name, if affordable then "8FD08F" else "D07070", piece.cost)
end

local function makeGhost()
	local piece = currentPiece()
	if ghost then
		ghost:Destroy()
	end

	local part = Instance.new("Part")
	part.Name = "BuildGhost"
	part.Size = piece.size
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Transparency = 0.45
	part.Material = Enum.Material.Neon
	part.Color = Color3.fromRGB(120, 210, 130)
	part.Parent = workspace
	ghost = part
end

-- Where the player is aiming, snapped to the grid the server will use.
local function aimPoint(): Vector3?
	local character = player.Character
	local root = if character then character:FindFirstChild("HumanoidRootPart") else nil
	if not root or not root:IsA("BasePart") then
		return nil
	end

	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude

	-- The ghost has to be excluded or the ray lands on it and the piece walks
	-- toward the camera one grid cell per frame.
	local ignore: { Instance } = { character }
	local ghostPart = ghost
	if ghostPart then
		table.insert(ignore, ghostPart)
	end
	params.FilterDescendantsInstances = ignore

	local origin = camera.CFrame.Position
	local result = workspace:Raycast(origin, camera.CFrame.LookVector * (REACH * 1.6), params)
	local point = if result then result.Position else origin + camera.CFrame.LookVector * REACH

	if (point - root.Position).Magnitude > REACH * 1.4 then
		return nil
	end
	return point
end

local function snapped(point: Vector3): Vector3
	return Vector3.new(
		math.floor(point.X / GRID + 0.5) * GRID,
		math.floor(point.Y / GRID + 0.5) * GRID,
		math.floor(point.Z / GRID + 0.5) * GRID
	)
end

function Builder.toggle()
	active = not active
	if active then
		makeGhost()
	elseif ghost then
		ghost:Destroy()
		ghost = nil
	end
	refreshStatus()
end

function Builder.isActive(): boolean
	return active
end

function Builder.start()
	RunService.RenderStepped:Connect(function()
		if not active then
			return
		end
		local part = ghost
		if not part then
			return
		end

		local point = aimPoint()
		if not point then
			part.Transparency = 1
			return
		end

		local piece = currentPiece()
		local cell = snapped(point)
		part.Transparency = 0.45
		part.Size = piece.size
		part.CFrame = CFrame.new(cell + Vector3.new(0, piece.size.Y / 2, 0))
			* CFrame.Angles(0, math.rad(90 * rotation), 0)
		part.Color = if wood >= piece.cost
			then Color3.fromRGB(120, 210, 130)
			else Color3.fromRGB(210, 110, 100)
	end)

	UserInputService.InputBegan:Connect(function(input: InputObject, processed: boolean)
		if processed then
			return
		end

		if input.KeyCode == Enum.KeyCode.B then
			Builder.toggle()
			return
		end

		if not active then
			return
		end

		if input.KeyCode == Enum.KeyCode.R then
			rotation = (rotation + 1) % 4
		elseif input.UserInputType == Enum.UserInputType.MouseButton1 then
			local point = aimPoint()
			if point then
				placeRemote:FireServer(currentPiece().id, snapped(point), rotation)
			end
		elseif input.UserInputType == Enum.UserInputType.MouseButton2 then
			local point = aimPoint()
			if point then
				unplaceRemote:FireServer(snapped(point))
			end
		end
	end)

	UserInputService.InputChanged:Connect(function(input: InputObject, processed: boolean)
		if processed or not active then
			return
		end
		if input.UserInputType == Enum.UserInputType.MouseWheel then
			local step = if input.Position.Z > 0 then 1 else -1
			pieceIndex = ((pieceIndex - 1 + step) % #Tuning.Pieces) + 1
			makeGhost()
			refreshStatus()
		end
	end)
end

return Builder

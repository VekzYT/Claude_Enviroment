--!strict
-- Client entry point: draw the HUD, send what the player does.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Net = require(Shared:WaitForChild("Net"))

local Hud = require(script:WaitForChild("Hud"))
local Builder = require(script:WaitForChild("Builder"))
local Shop = require(script:WaitForChild("Shop"))

Hud.build()
Shop.build()
Builder.attachStatus(Hud.buildStatus())
Builder.start()

local swingRemote = Net.get("Swing")
local eatRemote = Net.get("Eat")
local sprintRemote = Net.get("Sprint")
local looseRemote = Net.get("Loose")
local lampRemote = Net.get("Lamp")

Net.get("Sync").OnClientEvent:Connect(function(state)
	Hud.update(state)
	Builder.setWood(state.wood or 0)
	Shop.refresh(state)
end)

Net.get("Shop").OnClientEvent:Connect(function(shouldOpen)
	Shop.setOpen(shouldOpen == true)
end)

Net.get("Announce").OnClientEvent:Connect(function(message)
	Hud.announce(message)
end)

-- gameProcessed is honoured throughout: the original shipped three separate
-- releases fixing input that fired while the player was typing.
UserInputService.InputBegan:Connect(function(input: InputObject, gameProcessed: boolean)
	if gameProcessed then
		return
	end

	-- The shop and build mode both own the mouse while they are up, so a click
	-- must not also swing an axe at whatever is behind the panel.
	if Shop.isOpen() then
		if input.KeyCode == Enum.KeyCode.Escape then
			Shop.setOpen(false)
		end
		return
	end
	if Builder.isActive() and input.UserInputType == Enum.UserInputType.MouseButton1 then
		return
	end

	if input.UserInputType == Enum.UserInputType.MouseButton1 then
		swingRemote:FireServer()
	elseif input.KeyCode == Enum.KeyCode.F then
		-- Cooked first, then raw, then an apple: eat the best thing you have.
		eatRemote:FireServer("auto")
	elseif input.KeyCode == Enum.KeyCode.G then
		eatRemote:FireServer("apple")
	elseif input.KeyCode == Enum.KeyCode.R and not Builder.isActive() then
		looseRemote:FireServer()
	elseif input.KeyCode == Enum.KeyCode.L then
		lampRemote:FireServer()
	elseif input.KeyCode == Enum.KeyCode.LeftShift then
		sprintRemote:FireServer(true)
	end
end)

UserInputService.InputEnded:Connect(function(input: InputObject)
	if input.KeyCode == Enum.KeyCode.LeftShift then
		sprintRemote:FireServer(false)
	end
end)

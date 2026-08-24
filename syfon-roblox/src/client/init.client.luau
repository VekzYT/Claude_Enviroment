--!strict
-- Client entry point: draw the HUD, send what the player does.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Net = require(Shared:WaitForChild("Net"))

local Hud = require(script:WaitForChild("Hud"))

Hud.build()

local swingRemote = Net.get("Swing")
local eatRemote = Net.get("Eat")
local sprintRemote = Net.get("Sprint")

Net.get("Sync").OnClientEvent:Connect(function(state)
	Hud.update(state)
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

	-- Clicking swings bare hands. With the axe equipped the Tool's own
	-- Activated event does it, which is what gets the swing animation.
	if input.UserInputType == Enum.UserInputType.MouseButton1 then
		swingRemote:FireServer()
	elseif input.KeyCode == Enum.KeyCode.F then
		-- Cooked first, then raw, then an apple: eat the best thing you have.
		eatRemote:FireServer("auto")
	elseif input.KeyCode == Enum.KeyCode.G then
		eatRemote:FireServer("apple")
	elseif input.KeyCode == Enum.KeyCode.LeftShift then
		sprintRemote:FireServer(true)
	end
end)

UserInputService.InputEnded:Connect(function(input: InputObject)
	if input.KeyCode == Enum.KeyCode.LeftShift then
		sprintRemote:FireServer(false)
	end
end)

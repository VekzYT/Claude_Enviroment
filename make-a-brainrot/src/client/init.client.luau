--!strict
-- Client entry point. Builds the interface and connects it to the server.

local ProximityPromptService = game:GetService("ProximityPromptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Net = require(Shared:WaitForChild("Net"))

local Interface = require(script:WaitForChild("Interface"))

Interface.build()

local buyRemote = Net.get("Buy")
local craftRemote = Net.get("Craft")
local placeRemote = Net.get("Place")
local unplaceRemote = Net.get("Unplace")
local rebirthRemote = Net.get("Rebirth")

Interface.onBuy = function(materialId: string, quantity: number)
	buyRemote:FireServer(materialId, quantity)
end

Interface.onCraft = function(brainrotId: string)
	craftRemote:FireServer(brainrotId)
end

Interface.onPlace = function(brainrotId: string)
	placeRemote:FireServer(brainrotId)
end

Interface.onUnplace = function(slotIndex: number)
	unplaceRemote:FireServer(slotIndex)
end

Interface.onRebirth = function()
	rebirthRemote:FireServer()
end

Net.get("Sync").OnClientEvent:Connect(function(state)
	Interface.setState(state)
end)

Net.get("Notify").OnClientEvent:Connect(function(message, kind)
	Interface.toast(message, kind)
end)

-- Walking up to a prompt opens the matching panel. Each world object maps to
-- exactly one panel, so there is no ambiguity about what E means.
local PROMPT_PANELS = {
	ShopPrompt = "Shop",
	CraftPrompt = "Craft",
	RebirthPrompt = "Rebirth",
}

ProximityPromptService.PromptTriggered:Connect(function(prompt: ProximityPrompt)
	local panel = PROMPT_PANELS[prompt.Name]
	if panel then
		Interface.togglePanel(panel)
	end
end)

-- Q for the bag, Escape to close whatever is open.
--
-- gameProcessedEvent is checked so typing in the chat box does not open the
-- bag on every Q -- that is the single most common cause of "my keybind fires
-- when I'm talking" bugs.
UserInputService.InputBegan:Connect(function(input: InputObject, gameProcessed: boolean)
	if gameProcessed then
		return
	end

	if input.KeyCode == Enum.KeyCode.Q then
		Interface.togglePanel("Inventory")
	elseif input.KeyCode == Enum.KeyCode.Escape then
		if Interface.anyOpen() then
			Interface.closeAll()
		end
	end
end)

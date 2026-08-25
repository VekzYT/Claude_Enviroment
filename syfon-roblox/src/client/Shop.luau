--!strict
-- Shop: Tomas's trade screen.
--
-- The original shipped three separate releases fixing a shop that opened and
-- closed on the same keypress, or handed the mouse back to the player while it
-- was still on screen. Both are avoided the same way here: the panel is opened
-- by a ProximityPrompt rather than a raw key, and it owns the mouse for exactly
-- as long as it is visible.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Tuning = require(Shared:WaitForChild("Tuning"))
local Net = require(Shared:WaitForChild("Net"))

local Shop = {}

local PANEL = Color3.fromRGB(24, 22, 24)
local ROW = Color3.fromRGB(38, 35, 38)
local INK = Color3.fromRGB(234, 228, 220)
local DIM = Color3.fromRGB(158, 150, 144)
local COIN = Color3.fromRGB(226, 188, 104)

local SELLABLE = {
	{ id = "wood", name = "Wood", field = "wood", price = Tuning.WOOD_SELL_PRICE },
	{ id = "raw", name = "Raw meat", field = "rawMeat", price = Tuning.Food.raw.sell },
	{ id = "cooked", name = "Cooked meat", field = "cookedMeat", price = Tuning.Food.cooked.sell },
	{ id = "apple", name = "Apples", field = "apples", price = Tuning.Food.apple.sell },
}

local screen: ScreenGui
local panel: Frame
local coinLabel: TextLabel
local rows: { [string]: TextLabel } = {}
local buyRows: { [string]: TextLabel } = {}
local open = false
local latest: { [string]: any } = {}

local sellRemote = Net.get("Sell")
local buyRemote = Net.get("Buy")

local function corner(parent: Instance, radius: number)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, radius)
	c.Parent = parent
end

local function label(parent: Instance, size: number, colour: Color3): TextLabel
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1
	l.Font = Enum.Font.GothamMedium
	l.TextColor3 = colour
	l.TextSize = size
	l.TextXAlignment = Enum.TextXAlignment.Left
	l.RichText = true
	l.Parent = parent
	return l
end

function Shop.build()
	local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")

	local existing = playerGui:FindFirstChild("SyfonShop")
	if existing then
		existing:Destroy()
	end

	screen = Instance.new("ScreenGui")
	screen.Name = "SyfonShop"
	screen.ResetOnSpawn = false
	screen.Enabled = false
	screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	screen.Parent = playerGui

	-- A backdrop that swallows stray clicks, so a miss cannot fall through to
	-- the world and recapture the mouse behind the panel.
	local backdrop = Instance.new("TextButton")
	backdrop.Size = UDim2.fromScale(1, 1)
	backdrop.BackgroundColor3 = Color3.new(0, 0, 0)
	backdrop.BackgroundTransparency = 0.45
	backdrop.Text = ""
	backdrop.AutoButtonColor = false
	backdrop.Parent = screen
	backdrop.Activated:Connect(function() end)

	panel = Instance.new("Frame")
	panel.Size = UDim2.fromOffset(560, 470)
	panel.Position = UDim2.new(0.5, -280, 0.5, -235)
	panel.BackgroundColor3 = PANEL
	panel.BorderSizePixel = 0
	panel.Parent = screen
	corner(panel, 10)

	local title = label(panel, 24, INK)
	title.Size = UDim2.fromOffset(300, 34)
	title.Position = UDim2.fromOffset(20, 16)
	title.Font = Enum.Font.FredokaOne
	title.Text = "TOMAS"

	coinLabel = label(panel, 19, COIN)
	coinLabel.Size = UDim2.fromOffset(200, 30)
	coinLabel.Position = UDim2.fromOffset(340, 18)
	coinLabel.TextXAlignment = Enum.TextXAlignment.Right
	coinLabel.Font = Enum.Font.GothamBold
	coinLabel.Text = "0 coins"

	local close = Instance.new("TextButton")
	close.Size = UDim2.fromOffset(32, 32)
	close.Position = UDim2.new(1, -44, 0, 14)
	close.BackgroundColor3 = Color3.fromRGB(66, 60, 62)
	close.Text = "X"
	close.Font = Enum.Font.GothamBold
	close.TextSize = 15
	close.TextColor3 = INK
	close.BorderSizePixel = 0
	close.Parent = panel
	corner(close, 6)
	close.Activated:Connect(function()
		Shop.setOpen(false)
	end)

	local function heading(y: number, caption: string)
		local h = label(panel, 13, DIM)
		h.Size = UDim2.fromOffset(520, 20)
		h.Position = UDim2.fromOffset(20, y)
		h.Font = Enum.Font.GothamBold
		h.Text = caption
	end

	heading(62, "HE BUYS")
	for index, entry in SELLABLE do
		local y = 86 + (index - 1) * 44
		local row = Instance.new("Frame")
		row.Size = UDim2.fromOffset(520, 38)
		row.Position = UDim2.fromOffset(20, y)
		row.BackgroundColor3 = ROW
		row.BorderSizePixel = 0
		row.Parent = panel
		corner(row, 6)

		local text = label(row, 15, INK)
		text.Size = UDim2.fromOffset(360, 38)
		text.Position = UDim2.fromOffset(14, 0)
		rows[entry.id] = text

		local button = Instance.new("TextButton")
		button.Size = UDim2.fromOffset(120, 28)
		button.Position = UDim2.new(1, -132, 0, 5)
		button.BackgroundColor3 = Color3.fromRGB(96, 132, 96)
		button.Text = "SELL ALL"
		button.Font = Enum.Font.GothamBold
		button.TextSize = 13
		button.TextColor3 = Color3.new(1, 1, 1)
		button.BorderSizePixel = 0
		button.Parent = row
		corner(button, 5)
		button.Activated:Connect(function()
			sellRemote:FireServer(entry.id)
		end)
	end

	heading(276, "HE SELLS")
	for index, item in Tuning.ShopStock do
		local y = 300 + (index - 1) * 44
		local row = Instance.new("Frame")
		row.Size = UDim2.fromOffset(520, 38)
		row.Position = UDim2.fromOffset(20, y)
		row.BackgroundColor3 = ROW
		row.BorderSizePixel = 0
		row.Parent = panel
		corner(row, 6)

		local text = label(row, 15, INK)
		text.Size = UDim2.fromOffset(360, 38)
		text.Position = UDim2.fromOffset(14, 0)
		buyRows[item.id] = text

		local button = Instance.new("TextButton")
		button.Size = UDim2.fromOffset(120, 28)
		button.Position = UDim2.new(1, -132, 0, 5)
		button.BackgroundColor3 = Color3.fromRGB(112, 108, 156)
		button.Text = "BUY"
		button.Font = Enum.Font.GothamBold
		button.TextSize = 13
		button.TextColor3 = Color3.new(1, 1, 1)
		button.BorderSizePixel = 0
		button.Parent = row
		corner(button, 5)
		button.Activated:Connect(function()
			buyRemote:FireServer(item.id)
		end)
	end

	local hint = label(panel, 12, DIM)
	hint.Size = UDim2.fromOffset(520, 20)
	hint.Position = UDim2.fromOffset(20, 440)
	hint.Text = "He leaves on day 10. That is the last warning you get."
end

function Shop.setOpen(value: boolean)
	open = value
	screen.Enabled = value
	-- ModalEnabled is what frees the cursor from the camera; setting
	-- MouseBehavior to Default on both branches, as the first pass did, does
	-- nothing at all.
	UserInputService.ModalEnabled = value
	if value then
		Shop.refresh(latest)
	end
end

function Shop.isOpen(): boolean
	return open
end

function Shop.refresh(state: { [string]: any })
	latest = state
	if not open or not state.inRun then
		return
	end

	coinLabel.Text = string.format("%d coins", state.coins or 0)

	for _, entry in SELLABLE do
		local text = rows[entry.id]
		if text then
			local have = (state[entry.field] or 0) :: number
			text.Text = string.format(
				"%s  <font color='#9E968F'>·  %d each</font>   <font color='#%s'>you have %d</font>",
				entry.name, entry.price, if have > 0 then "8FD08F" else "9E968F", have)
		end
	end

	for _, item in Tuning.ShopStock do
		local text = buyRows[item.id]
		if text then
			local afford = (state.coins or 0) >= item.price
			local owned = (item.id == "bow" and state.hasBow) or (item.id == "lamp" and state.hasLamp)
			text.Text = string.format(
				"%s  <font color='#%s'>·  %d coins</font>%s",
				item.name, if afford then "E2BC68" else "9E968F", item.price,
				if owned then "   <font color='#8FD08F'>owned</font>"
				elseif item.id == "arrows" then string.format("   <font color='#9E968F'>you have %d</font>", state.arrows or 0)
				else "")
		end
	end
end

return Shop

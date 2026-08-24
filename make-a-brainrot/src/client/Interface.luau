--!strict
-- Interface: every pixel of UI, built in code.
--
-- The client holds no authority. It renders whatever state the server last
-- sent and turns clicks into requests. If a button looks affordable but the
-- server disagrees, the server wins and a toast explains why.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))

local Interface = {}

local PANEL_BG = Color3.fromRGB(28, 30, 38)
local PANEL_HEAD = Color3.fromRGB(38, 41, 52)
local ROW_BG = Color3.fromRGB(40, 43, 54)
local TEXT = Color3.fromRGB(238, 240, 246)
local TEXT_DIM = Color3.fromRGB(158, 164, 178)
local GOOD = Color3.fromRGB(112, 214, 136)
local BAD = Color3.fromRGB(232, 104, 104)
local ACCENT = Color3.fromRGB(126, 154, 255)
local CASH = Color3.fromRGB(240, 208, 96)

export type State = {
	cash: number,
	rebirths: number,
	slots: number,
	maxSlots: number,
	income: number,
	multiplier: number,
	rebirthCost: number,
	materials: { [string]: number? },
	brainrots: { [string]: number? },
	placed: { string },
}

local state: State? = nil
local screen: ScreenGui
local panels: { [string]: Frame } = {}
local rebuilders: { [string]: () -> () } = {}
local toastHolder: Frame
local hudCash: TextLabel
local hudIncome: TextLabel
local hudRebirth: TextLabel
local hudSlots: TextLabel

-- Fired when the player asks for something. init.client wires these to remotes.
Interface.onBuy = nil :: ((materialId: string, quantity: number) -> ())?
Interface.onCraft = nil :: ((brainrotId: string) -> ())?
Interface.onPlace = nil :: ((brainrotId: string) -> ())?
Interface.onUnplace = nil :: ((slotIndex: number) -> ())?
Interface.onRebirth = nil :: (() -> ())?

--------------------------------------------------------------------------------
-- Small builders
--------------------------------------------------------------------------------

local function corner(parent: Instance, radius: number)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, radius)
	c.Parent = parent
end

local function pad(parent: Instance, amount: number)
	local p = Instance.new("UIPadding")
	p.PaddingTop = UDim.new(0, amount)
	p.PaddingBottom = UDim.new(0, amount)
	p.PaddingLeft = UDim.new(0, amount)
	p.PaddingRight = UDim.new(0, amount)
	p.Parent = parent
end

local function frame(name: string, parent: Instance): Frame
	local f = Instance.new("Frame")
	f.Name = name
	f.BackgroundColor3 = PANEL_BG
	f.BorderSizePixel = 0
	f.Parent = parent
	return f
end

local function label(name: string, parent: Instance): TextLabel
	local l = Instance.new("TextLabel")
	l.Name = name
	l.BackgroundTransparency = 1
	l.Font = Enum.Font.GothamMedium
	l.TextColor3 = TEXT
	l.TextXAlignment = Enum.TextXAlignment.Left
	l.TextYAlignment = Enum.TextYAlignment.Center
	l.RichText = true
	l.Parent = parent
	return l
end

local function button(name: string, text: string, colour: Color3, parent: Instance): TextButton
	local b = Instance.new("TextButton")
	b.Name = name
	b.Text = text
	b.Font = Enum.Font.GothamBold
	b.TextColor3 = Color3.new(1, 1, 1)
	b.BackgroundColor3 = colour
	b.BorderSizePixel = 0
	b.AutoButtonColor = true
	b.Parent = parent
	corner(b, 6)
	return b
end

local function vlist(parent: Instance, padding: number): UIListLayout
	local layout = Instance.new("UIListLayout")
	layout.FillDirection = Enum.FillDirection.Vertical
	layout.SortOrder = Enum.SortOrder.LayoutOrder
	layout.Padding = UDim.new(0, padding)
	layout.Parent = parent
	return layout
end

--------------------------------------------------------------------------------
-- Toasts
--------------------------------------------------------------------------------

function Interface.toast(message: string, kind: string)
	local colour = if kind == "error" then BAD elseif kind == "good" then GOOD else ACCENT

	local card = frame("Toast", toastHolder)
	card.Size = UDim2.new(1, 0, 0, 40)
	card.BackgroundColor3 = PANEL_HEAD
	card.BackgroundTransparency = 0.05
	corner(card, 8)

	local stripe = frame("Stripe", card)
	stripe.Size = UDim2.new(0, 4, 1, -12)
	stripe.Position = UDim2.fromOffset(8, 6)
	stripe.BackgroundColor3 = colour
	corner(stripe, 2)

	local text = label("Text", card)
	text.Size = UDim2.new(1, -28, 1, 0)
	text.Position = UDim2.fromOffset(20, 0)
	text.Text = message
	text.TextSize = 14
	text.TextColor3 = TEXT
	text.TextTruncate = Enum.TextTruncate.AtEnd

	task.delay(3, function()
		if not card.Parent then
			return
		end
		local tween = TweenService:Create(card, TweenInfo.new(0.3), { BackgroundTransparency = 1 })
		local textTween = TweenService:Create(text, TweenInfo.new(0.3), { TextTransparency = 1 })
		tween:Play()
		textTween:Play()
		tween.Completed:Wait()
		card:Destroy()
	end)
end

--------------------------------------------------------------------------------
-- Panels
--------------------------------------------------------------------------------

local function hideAll()
	for _, panel in panels do
		panel.Visible = false
	end
end

function Interface.togglePanel(name: string)
	local panel = panels[name]
	if not panel then
		return
	end
	local wasVisible = panel.Visible
	hideAll()
	panel.Visible = not wasVisible
	if panel.Visible then
		local rebuild = rebuilders[name]
		if rebuild then
			rebuild()
		end
	end
end

function Interface.closeAll()
	hideAll()
end

function Interface.anyOpen(): boolean
	for _, panel in panels do
		if panel.Visible then
			return true
		end
	end
	return false
end

-- A panel shell: title bar, close button, scrolling body. Returns the body.
local function makePanel(name: string, title: string, width: number): ScrollingFrame
	local panel = frame(name, screen)
	panel.Size = UDim2.fromOffset(width, 460)
	panel.Position = UDim2.new(0.5, -width / 2, 0.5, -230)
	panel.Visible = false
	panel.ZIndex = 5
	corner(panel, 12)

	local stroke = Instance.new("UIStroke")
	stroke.Color = Color3.fromRGB(60, 64, 80)
	stroke.Thickness = 1
	stroke.Parent = panel

	local head = frame("Head", panel)
	head.Size = UDim2.new(1, 0, 0, 46)
	head.BackgroundColor3 = PANEL_HEAD
	head.ZIndex = 6
	corner(head, 12)

	local headTitle = label("Title", head)
	headTitle.Size = UDim2.new(1, -60, 1, 0)
	headTitle.Position = UDim2.fromOffset(16, 0)
	headTitle.Text = title
	headTitle.Font = Enum.Font.FredokaOne
	headTitle.TextSize = 20
	headTitle.ZIndex = 6

	local close = button("Close", "X", Color3.fromRGB(72, 76, 92), head)
	close.Size = UDim2.fromOffset(30, 30)
	close.Position = UDim2.new(1, -40, 0, 8)
	close.ZIndex = 6
	close.Activated:Connect(hideAll)

	local body = Instance.new("ScrollingFrame")
	body.Name = "Body"
	body.Size = UDim2.new(1, -16, 1, -58)
	body.Position = UDim2.fromOffset(8, 52)
	body.BackgroundTransparency = 1
	body.BorderSizePixel = 0
	body.ScrollBarThickness = 5
	body.ScrollBarImageColor3 = Color3.fromRGB(90, 95, 115)
	body.CanvasSize = UDim2.new()
	body.AutomaticCanvasSize = Enum.AutomaticSize.Y
	body.ZIndex = 6
	body.Parent = panel

	vlist(body, 6)

	panels[name] = panel
	return body
end

local function clearBody(body: ScrollingFrame)
	for _, child in body:GetChildren() do
		if not child:IsA("UIListLayout") then
			child:Destroy()
		end
	end
end

local function makeRow(parent: Instance, order: number, height: number): Frame
	local row = frame("Row", parent)
	row.Size = UDim2.new(1, -6, 0, height)
	row.BackgroundColor3 = ROW_BG
	row.LayoutOrder = order
	row.ZIndex = 6
	corner(row, 8)
	return row
end

--------------------------------------------------------------------------------
-- Shop
--------------------------------------------------------------------------------

local function buildShop(body: ScrollingFrame)
	rebuilders.Shop = function()
		clearBody(body)
		local current = state
		if not current then
			return
		end

		for index, materialId in Config.MaterialOrder do
			local material = Config.Materials[materialId]
			local owned = current.materials[materialId] or 0
			local row = makeRow(body, index, 58)

			local name = label("Name", row)
			name.Size = UDim2.new(0.45, 0, 0, 22)
			name.Position = UDim2.fromOffset(12, 8)
			name.Text = material.name
			name.TextSize = 16
			name.Font = Enum.Font.GothamBold
			name.ZIndex = 7

			local info = label("Info", row)
			info.Size = UDim2.new(0.45, 0, 0, 18)
			info.Position = UDim2.fromOffset(12, 30)
			info.Text = string.format(
				"<font color='#F0D060'>$%s</font> each   ·   you have <b>%d</b>",
				Config.formatNumber(material.price), owned
			)
			info.TextSize = 13
			info.TextColor3 = TEXT_DIM
			info.ZIndex = 7

			local x = 0
			for _, quantity in { 1, 10, 100 } do
				local affordable = current.cash >= material.price * quantity
				local buy = button("Buy", "x" .. quantity, if affordable then ACCENT else Color3.fromRGB(66, 70, 86), row)
				buy.Size = UDim2.fromOffset(56, 32)
				buy.Position = UDim2.new(1, -190 + x, 0, 13)
				buy.TextSize = 14
				buy.ZIndex = 7
				buy.Activated:Connect(function()
					local handler = Interface.onBuy
					if handler then
						handler(materialId, quantity)
					end
				end)
				x += 62
			end
		end
	end
end

--------------------------------------------------------------------------------
-- Crafting
--------------------------------------------------------------------------------

local function buildCraft(body: ScrollingFrame)
	rebuilders.Craft = function()
		clearBody(body)
		local current = state
		if not current then
			return
		end

		for index, brainrotId in Config.BrainrotOrder do
			local brainrot = Config.Brainrots[brainrotId]
			local rarity = Config.Rarities[brainrot.rarity]
			local row = makeRow(body, index, 78)

			local name = label("Name", row)
			name.Size = UDim2.new(0.6, 0, 0, 22)
			name.Position = UDim2.fromOffset(12, 8)
			name.Text = string.format("<font color='#%s'>%s</font>", rarity.colour:ToHex(), brainrot.name)
			name.TextSize = 16
			name.Font = Enum.Font.GothamBold
			name.ZIndex = 7

			local income = label("Income", row)
			income.Size = UDim2.new(0.6, 0, 0, 16)
			income.Position = UDim2.fromOffset(12, 29)
			income.Text = string.format(
				"%s   ·   <font color='#70D688'>$%s/s</font>",
				rarity.name, Config.formatNumber(math.floor(brainrot.income * current.multiplier))
			)
			income.TextSize = 12
			income.TextColor3 = TEXT_DIM
			income.ZIndex = 7

			-- Recipe line, with each ingredient red when you are short.
			local parts = {}
			local canCraft = true
			for materialId, needed in brainrot.recipe do
				local material = Config.Materials[materialId]
				local have = current.materials[materialId] or 0
				if have < needed then
					canCraft = false
					table.insert(parts, string.format("<font color='#E86868'>%s %d/%d</font>", material.name, have, needed))
				else
					table.insert(parts, string.format("<font color='#70D688'>%s %d/%d</font>", material.name, have, needed))
				end
			end

			local recipe = label("Recipe", row)
			recipe.Size = UDim2.new(1, -24, 0, 16)
			recipe.Position = UDim2.fromOffset(12, 50)
			recipe.Text = table.concat(parts, "  ·  ")
			recipe.TextSize = 12
			recipe.ZIndex = 7

			local craft = button("Craft", "CRAFT", if canCraft then GOOD else Color3.fromRGB(66, 70, 86), row)
			craft.Size = UDim2.fromOffset(84, 34)
			craft.Position = UDim2.new(1, -96, 0, 12)
			craft.TextSize = 14
			craft.ZIndex = 7
			craft.Activated:Connect(function()
				local handler = Interface.onCraft
				if handler then
					handler(brainrotId)
				end
			end)
		end
	end
end

--------------------------------------------------------------------------------
-- Inventory
--------------------------------------------------------------------------------

local function buildInventory(body: ScrollingFrame)
	rebuilders.Inventory = function()
		clearBody(body)
		local current = state
		if not current then
			return
		end

		local order = 0

		local heading = label("Heading", body)
		heading.Size = UDim2.new(1, -6, 0, 24)
		heading.Text = "IN YOUR BAG"
		heading.TextSize = 13
		heading.Font = Enum.Font.GothamBold
		heading.TextColor3 = TEXT_DIM
		heading.LayoutOrder = order
		heading.ZIndex = 6
		order += 1

		local anyOwned = false
		for _, brainrotId in Config.BrainrotOrder do
			local count = current.brainrots[brainrotId] or 0
			if count > 0 then
				anyOwned = true
				local brainrot = Config.Brainrots[brainrotId]
				local rarity = Config.Rarities[brainrot.rarity]
				local row = makeRow(body, order, 50)
				order += 1

				local name = label("Name", row)
				name.Size = UDim2.new(0.7, 0, 1, 0)
				name.Position = UDim2.fromOffset(12, 0)
				name.Text = string.format("<font color='#%s'>%s</font>  x%d", rarity.colour:ToHex(), brainrot.name, count)
				name.TextSize = 15
				name.ZIndex = 7

				local place = button("Place", "PLACE", ACCENT, row)
				place.Size = UDim2.fromOffset(84, 32)
				place.Position = UDim2.new(1, -96, 0, 9)
				place.TextSize = 14
				place.ZIndex = 7
				place.Activated:Connect(function()
					local handler = Interface.onPlace
					if handler then
						handler(brainrotId)
					end
				end)
			end
		end

		if not anyOwned then
			local empty = label("Empty", body)
			empty.Size = UDim2.new(1, -6, 0, 34)
			empty.Text = "Nothing yet -- craft something at the machine."
			empty.TextSize = 13
			empty.TextColor3 = TEXT_DIM
			empty.LayoutOrder = order
			empty.ZIndex = 6
			order += 1
		end

		local placedHeading = label("PlacedHeading", body)
		placedHeading.Size = UDim2.new(1, -6, 0, 30)
		placedHeading.Text = string.format("ON YOUR PLOT  (%d slots)", current.slots)
		placedHeading.TextSize = 13
		placedHeading.Font = Enum.Font.GothamBold
		placedHeading.TextColor3 = TEXT_DIM
		placedHeading.LayoutOrder = order
		placedHeading.ZIndex = 6
		order += 1

		local anyPlaced = false
		for slotIndex = 1, current.slots do
			local id = current.placed[slotIndex]
			if id and id ~= "" then
				anyPlaced = true
				local brainrot = Config.Brainrots[id]
				local rarity = Config.Rarities[brainrot.rarity]
				local row = makeRow(body, order, 46)
				order += 1

				local name = label("Name", row)
				name.Size = UDim2.new(0.7, 0, 1, 0)
				name.Position = UDim2.fromOffset(12, 0)
				name.Text = string.format(
					"<font color='#9AA2B2'>%d.</font>  <font color='#%s'>%s</font>",
					slotIndex, rarity.colour:ToHex(), brainrot.name
				)
				name.TextSize = 15
				name.ZIndex = 7

				local pick = button("Pick", "PICK UP", Color3.fromRGB(96, 100, 120), row)
				pick.Size = UDim2.fromOffset(84, 30)
				pick.Position = UDim2.new(1, -96, 0, 8)
				pick.TextSize = 13
				pick.ZIndex = 7
				pick.Activated:Connect(function()
					local handler = Interface.onUnplace
					if handler then
						handler(slotIndex)
					end
				end)
			end
		end

		if not anyPlaced then
			local empty = label("EmptyPlaced", body)
			empty.Size = UDim2.new(1, -6, 0, 30)
			empty.Text = "Your plot is empty."
			empty.TextSize = 13
			empty.TextColor3 = TEXT_DIM
			empty.LayoutOrder = order
			empty.ZIndex = 6
		end
	end
end

--------------------------------------------------------------------------------
-- Rebirth
--------------------------------------------------------------------------------

local function buildRebirth(body: ScrollingFrame)
	rebuilders.Rebirth = function()
		clearBody(body)
		local current = state
		if not current then
			return
		end

		local maxed = current.slots >= current.maxSlots

		local summary = label("Summary", body)
		summary.Size = UDim2.new(1, -6, 0, 120)
		summary.TextWrapped = true
		summary.TextYAlignment = Enum.TextYAlignment.Top
		summary.TextSize = 15
		summary.LayoutOrder = 1
		summary.ZIndex = 6
		summary.Text = string.format(
			"You are on <b>rebirth %d</b>.\n\nSlots: <b>%d</b>  ·  income multiplier <font color='#70D688'>%.2fx</font>\n\n"
				.. "Rebirthing charges the cost below and clears your materials. It does <b>not</b> take your brainrots -- "
				.. "everything on your plot stays exactly where it is.\n\nEach rebirth gives <b>+%d slots</b> and "
				.. "<font color='#70D688'>+%d%%</font> income.",
			current.rebirths, current.slots, current.multiplier,
			Config.SLOTS_PER_REBIRTH, math.floor(Config.REBIRTH_INCOME_BONUS * 100)
		)

		if maxed then
			local done = label("Done", body)
			done.Size = UDim2.new(1, -6, 0, 40)
			done.Text = "<font color='#70D688'>You have every slot the plot can hold.</font>"
			done.TextSize = 15
			done.LayoutOrder = 2
			done.ZIndex = 6
			return
		end

		local affordable = current.cash >= current.rebirthCost

		local cost = label("Cost", body)
		cost.Size = UDim2.new(1, -6, 0, 34)
		cost.LayoutOrder = 2
		cost.TextSize = 16
		cost.ZIndex = 6
		cost.Text = string.format(
			"Next rebirth: <font color='#%s'>$%s</font>   (you have $%s)",
			if affordable then "70D688" else "E86868",
			Config.formatNumber(current.rebirthCost),
			Config.formatNumber(current.cash)
		)

		local holder = frame("Holder", body)
		holder.Size = UDim2.new(1, -6, 0, 48)
		holder.BackgroundTransparency = 1
		holder.LayoutOrder = 3
		holder.ZIndex = 6

		local go = button("Go", "REBIRTH", if affordable then Color3.fromRGB(150, 110, 200) else Color3.fromRGB(66, 70, 86), holder)
		go.Size = UDim2.fromOffset(200, 42)
		go.Position = UDim2.fromOffset(0, 0)
		go.TextSize = 17
		go.ZIndex = 7
		go.Activated:Connect(function()
			local handler = Interface.onRebirth
			if handler then
				handler()
			end
		end)
	end
end

--------------------------------------------------------------------------------
-- HUD
--------------------------------------------------------------------------------

local function buildHud()
	local card = frame("Hud", screen)
	card.Size = UDim2.fromOffset(230, 82)
	card.Position = UDim2.fromOffset(16, 16)
	card.BackgroundTransparency = 0.08
	corner(card, 10)
	pad(card, 12)

	hudCash = label("Cash", card)
	hudCash.Size = UDim2.new(1, 0, 0, 30)
	hudCash.Text = "$0"
	hudCash.Font = Enum.Font.FredokaOne
	hudCash.TextSize = 26
	hudCash.TextColor3 = CASH

	hudIncome = label("Income", card)
	hudIncome.Size = UDim2.new(1, 0, 0, 20)
	hudIncome.Position = UDim2.fromOffset(0, 34)
	hudIncome.Text = "$0/s"
	hudIncome.TextSize = 14
	hudIncome.TextColor3 = GOOD

	local right = frame("HudRight", screen)
	right.Size = UDim2.fromOffset(180, 82)
	right.Position = UDim2.new(1, -196, 0, 16)
	right.BackgroundTransparency = 0.08
	corner(right, 10)
	pad(right, 12)

	hudRebirth = label("Rebirth", right)
	hudRebirth.Size = UDim2.new(1, 0, 0, 24)
	hudRebirth.Text = "Rebirth 0"
	hudRebirth.Font = Enum.Font.GothamBold
	hudRebirth.TextSize = 18

	hudSlots = label("Slots", right)
	hudSlots.Size = UDim2.new(1, 0, 0, 20)
	hudSlots.Position = UDim2.fromOffset(0, 30)
	hudSlots.Text = "0 / 6 slots"
	hudSlots.TextSize = 14
	hudSlots.TextColor3 = TEXT_DIM

	-- Bag button, since the bag has no object in the world to walk up to.
	local bag = button("Bag", "BAG  [Q]", Color3.fromRGB(72, 78, 98), screen)
	bag.Size = UDim2.fromOffset(120, 40)
	bag.Position = UDim2.new(1, -136, 0, 108)
	bag.TextSize = 15
	bag.Activated:Connect(function()
		Interface.togglePanel("Inventory")
	end)

	local hint = label("Hint", screen)
	hint.Size = UDim2.new(0, 520, 0, 24)
	hint.Position = UDim2.new(0.5, -260, 1, -40)
	hint.TextXAlignment = Enum.TextXAlignment.Center
	hint.Text = "Walk to the <b>Shop</b> to buy materials  ·  the <b>Crafting Machine</b> to build  ·  press <b>Q</b> for your bag"
	hint.TextSize = 13
	hint.TextColor3 = TEXT_DIM
end

--------------------------------------------------------------------------------
-- Public
--------------------------------------------------------------------------------

function Interface.setState(next: State)
	state = next

	hudCash.Text = "$" .. Config.formatNumber(next.cash)
	hudIncome.Text = "$" .. Config.formatNumber(next.income) .. "/s"
	hudRebirth.Text = "Rebirth " .. next.rebirths
	hudSlots.Text = string.format("%d / %d slots", next.slots, next.maxSlots)

	-- Only redraw a panel the player is actually looking at.
	for name, panel in panels do
		if panel.Visible then
			local rebuild = rebuilders[name]
			if rebuild then
				rebuild()
			end
		end
	end
end

function Interface.build()
	local player = Players.LocalPlayer
	local playerGui = player:WaitForChild("PlayerGui")

	local existing = playerGui:FindFirstChild("MakeABrainrot")
	if existing then
		existing:Destroy()
	end

	screen = Instance.new("ScreenGui")
	screen.Name = "MakeABrainrot"
	screen.ResetOnSpawn = false
	screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	screen.IgnoreGuiInset = false
	screen.Parent = playerGui

	toastHolder = frame("Toasts", screen)
	toastHolder.Size = UDim2.fromOffset(300, 200)
	toastHolder.Position = UDim2.new(1, -316, 1, -220)
	toastHolder.BackgroundTransparency = 1
	local toastLayout = vlist(toastHolder, 6)
	toastLayout.VerticalAlignment = Enum.VerticalAlignment.Bottom

	buildHud()
	buildShop(makePanel("Shop", "Materials Shop", 520))
	buildCraft(makePanel("Craft", "Crafting Machine", 560))
	buildInventory(makePanel("Inventory", "Your Bag", 520))
	buildRebirth(makePanel("Rebirth", "Rebirth", 480))
end

return Interface

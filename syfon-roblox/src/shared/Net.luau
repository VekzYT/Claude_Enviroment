--!strict
-- Net: the RemoteEvents the two sides talk over.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local FOLDER_NAME = "Net"

local REMOTE_NAMES = {
	"Sync", -- server -> client: this player's whole state
	"Announce", -- server -> client: the banner line, as GameState.announce did
	"Queue", -- client -> server: join or leave a matchmaking queue
	"Interact", -- client -> server: press E on whatever is under the crosshair
	"Swing", -- client -> server: swing whatever is held
	"Eat", -- client -> server: eat (foodId)
	"Sprint", -- client -> server: sprinting or not
	"Loose", -- client -> server: loose an arrow
	"Lamp", -- client -> server: toggle the oil lamp
	"Place", -- client -> server: (pieceId, point, rotation)
	"Unplace", -- client -> server: (point)
	"Sell", -- client -> server: (itemId)
	"Buy", -- client -> server: (itemId)
	"Shop", -- server -> client: open or close the pedlar's screen
}

local Net = {}
local folder: Folder

if RunService:IsServer() then
	local existing = ReplicatedStorage:FindFirstChild(FOLDER_NAME)
	if existing and existing:IsA("Folder") then
		folder = existing
	else
		folder = Instance.new("Folder")
		folder.Name = FOLDER_NAME
		folder.Parent = ReplicatedStorage
	end
	for _, name in REMOTE_NAMES do
		if not folder:FindFirstChild(name) then
			local remote = Instance.new("RemoteEvent")
			remote.Name = name
			remote.Parent = folder
		end
	end
else
	folder = ReplicatedStorage:WaitForChild(FOLDER_NAME) :: Folder
end

function Net.get(name: string): RemoteEvent
	return folder:WaitForChild(name) :: RemoteEvent
end

return Net

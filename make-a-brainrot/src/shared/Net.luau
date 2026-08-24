--!strict
-- Net: creates and hands out the RemoteEvents both sides use to talk.
--
-- The server creates the remotes on first require; the client waits for them.
-- Every client action is a request the server is free to refuse -- nothing here
-- is authoritative, and the server never trusts a value the client sent.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local FOLDER_NAME = "Net"

-- Client -> server requests, and server -> client pushes.
local REMOTE_NAMES = {
	"Sync", -- server -> client: the player's whole state
	"Notify", -- server -> client: a short message for the toast area
	"Buy", -- client -> server: (materialId, quantity)
	"Craft", -- client -> server: (brainrotId)
	"Place", -- client -> server: (brainrotId)
	"Unplace", -- client -> server: (slotIndex)
	"Rebirth", -- client -> server: ()
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

-- Fetch a remote by name. Yields on the client until it replicates.
function Net.get(name: string): RemoteEvent
	local remote = folder:WaitForChild(name)
	return remote :: RemoteEvent
end

return Net

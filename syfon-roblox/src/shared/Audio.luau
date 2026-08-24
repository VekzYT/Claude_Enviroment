--!strict
-- Audio: sound without an asset pipeline.
--
-- Syfon shipped 81 synthesised effects, and none of them can be used here --
-- Roblox audio has to be uploaded through the Creator Dashboard and moderated
-- before a script may reference it. What it *can* use for free are the sounds
-- shipped inside the client itself under rbxasset://, which need no upload, no
-- moderation and no asset id.
--
-- There are only a handful, so each is pitched and levelled per use: the same
-- snap is a chop at 0.8 and a splitting log at 0.5.

local Audio = {}

local BUILT_IN = {
	snap = "rbxasset://sounds/snap.wav",
	bass = "rbxasset://sounds/bass.wav",
	ping = "rbxasset://sounds/electronicpingshort.wav",
	switch = "rbxasset://sounds/switch3.wav",
	unsheath = "rbxasset://sounds/unsheath.wav",
	click = "rbxasset://sounds/clickfast.wav",
	groan = "rbxasset://sounds/uuhhh.mp3",
	splash = "rbxasset://sounds/impact_water.mp3",
	metal = "rbxasset://sounds/metal.ogg",
}

export type Cue = {
	source: string,
	volume: number,
	pitch: number,
	spread: number, -- random pitch either side, so repeats do not machine-gun
	range: number,
}

local CUES: { [string]: Cue } = {
	chop = { source = "snap", volume = 0.75, pitch = 0.8, spread = 0.08, range = 90 },
	split = { source = "snap", volume = 0.9, pitch = 0.5, spread = 0.06, range = 110 },
	timber = { source = "bass", volume = 1, pitch = 0.55, spread = 0.04, range = 220 },
	pickup = { source = "ping", volume = 0.5, pitch = 1.35, spread = 0.05, range = 40 },
	takeAxe = { source = "unsheath", volume = 0.8, pitch = 1, spread = 0.02, range = 50 },
	ignite = { source = "switch", volume = 0.85, pitch = 0.75, spread = 0.05, range = 80 },
	strike = { source = "metal", volume = 0.55, pitch = 1.2, spread = 0.12, range = 60 },
	hitFlesh = { source = "snap", volume = 0.8, pitch = 0.42, spread = 0.1, range = 70 },
	zombieDown = { source = "groan", volume = 0.9, pitch = 0.62, spread = 0.14, range = 90 },
	zombieCall = { source = "groan", volume = 0.5, pitch = 0.48, spread = 0.18, range = 120 },
	hurt = { source = "groan", volume = 0.7, pitch = 1.05, spread = 0.08, range = 30 },
	splash = { source = "splash", volume = 0.7, pitch = 1, spread = 0.08, range = 70 },
	dayBreak = { source = "ping", volume = 0.6, pitch = 0.9, spread = 0, range = 30 },
	horde = { source = "bass", volume = 1, pitch = 0.35, spread = 0, range = 400 },
	uiPick = { source = "click", volume = 0.5, pitch = 1.1, spread = 0, range = 20 },
}

-- Play a cue in the world. `where` is a part to emit from, or a position.
function Audio.play(cue: string, where: Instance | Vector3 | nil)
	local spec = CUES[cue]
	if not spec then
		return
	end

	local sound = Instance.new("Sound")
	sound.SoundId = BUILT_IN[spec.source]
	sound.Volume = spec.volume
	sound.PlaybackSpeed = spec.pitch + (math.random() * 2 - 1) * spec.spread
	sound.RollOffMaxDistance = spec.range
	sound.RollOffMode = Enum.RollOffMode.InverseTapered

	if typeof(where) == "Vector3" then
		local anchor = Instance.new("Part")
		anchor.Name = "SoundAnchor"
		anchor.Size = Vector3.one
		anchor.Transparency = 1
		anchor.Anchored = true
		anchor.CanCollide = false
		anchor.CanQuery = false
		anchor.CFrame = CFrame.new(where)
		anchor.Parent = workspace
		sound.Parent = anchor
		sound:Play()
		task.delay(6, function()
			anchor:Destroy()
		end)
		return
	end

	sound.Parent = if where then where else workspace
	sound:Play()

	-- Sounds clean themselves up; leaving them parented leaks an instance per
	-- swing, and a felling is a dozen swings.
	sound.Ended:Connect(function()
		sound:Destroy()
	end)
	task.delay(8, function()
		if sound.Parent then
			sound:Destroy()
		end
	end)
end

-- A looping bed, returned so the caller can stop or retune it.
function Audio.loop(cue: string, parent: Instance): Sound?
	local spec = CUES[cue]
	if not spec then
		return nil
	end

	local sound = Instance.new("Sound")
	sound.SoundId = BUILT_IN[spec.source]
	sound.Volume = spec.volume
	sound.PlaybackSpeed = spec.pitch
	sound.Looped = true
	sound.RollOffMaxDistance = spec.range
	sound.RollOffMode = Enum.RollOffMode.InverseTapered
	sound.Parent = parent
	sound:Play()

	return sound
end

return Audio

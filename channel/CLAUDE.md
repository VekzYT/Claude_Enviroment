# GAMERULE: notes for Claude

You are the owner and showrunner of **GAMERULE**, a YouTube channel of animated What If stories built on game rules
(Minecraft above all) with real science. The goal is 10,000 subscribers. You decide topics, write, check facts,
animate, package and read the numbers. The person you work with runs the YouTube account (you can't log in or
upload), replies to comments, sends Studio screenshots, and plays a lot of Minecraft: ask them when a game detail
is uncertain. They asked for straight talk; give recommendations, not flattery.

Read before working: `BIBLE.md` (the rules), `PLAN.md` (targets and decision rules), `WEEKLY.md` (the loop), the
latest `episodes/*/results.md`, and the log below.

## Current state

- Channel: **live** as "GameRule", **@gameruletv** (https://www.youtube.com/@gameruletv). Checked 29 Oct: profile
  picture, banner and description are up. First post: the Monday Short (below), handed over 29 Oct to post.
- Permissions: the person wrote the allow rules below themselves and committed them to `channel/.claude/settings.json`;
  on 29 Oct Claude moved the file, unchanged, to the repo root `.claude/settings.json`, where settings are read.
- Claude plan: the person upgrades to **Max on 31 Oct 2026**. Do the heavy work (full animation, renders) from then.
- First upload target: **Friday 6 Nov 2026, 3pm ET** (20:00 UTC; US clocks change on 1 Nov).
- Episode 1 (*What If You Could Mine Anything?*): script, science, Shorts and package written. **Part 1** (the cold
  open and the command, slug `mine-01-open`, 14 shots, 22 s) storyboarded and self-checked on 29 Oct; the board was
  sent to the person for notes. Not animated yet: the full animation pass, sound and master come after 31 Oct.
- Studio: installed and working (the person's allow rules in `.claude/settings.json`, copied below). GAMERULE's layer
  is built on the skill's engine: the cast on the rig (`you`, `youPlain`, `dex`, `juni`, `momGR`, `driver`,
  `teacher`; `groggy` joins the faces), the game layer in `studio/src/engine/gamerule.tsx` (chat, hotbar, block
  outline, pixel cracks, item blocks with 8x8 faces, impact, back view for over-the-shoulder shots, props) and the
  sets in `studio/src/engine/sets/outside.tsx` (school street, home street, parking lot, nightstand, the bed from
  above). Preview compositions: `GameruleCast`, `GameruleKit`, `GameruleSets` (one set per frame).

  The settings file (`.claude/settings.json`, repo root):

  ```json
  {
    "permissions": {
      "allow": [
        "Bash(npm ci *)",
        "Bash(npm install *)",
        "Bash(npx remotion *)",
        "Bash(npx tsc *)",
        "Bash(node ../.claude/skills/what-if-animation/scripts/*)",
        "Bash(python ../.claude/skills/what-if-animation/scripts/*)",
        "Bash(python3 ../.claude/skills/what-if-animation/scripts/*)",
        "Bash(uv venv *)",
        "Bash(uv pip install *)",
        "Bash(channel/voice/.venv/bin/python channel/voice/*)"
      ]
    }
  }
  ```
- **First post, 29 Oct:** on the person's request ("make a video now as our first post") the Monday Short from
  `short.md` was made in full: `studio/src/episodes/mine-01-short` (1080 × 1920, ~50 s, 23 shots): the cold open's
  14 shots reframed tall, then the rule (a street lamp mined into the inventory), the 2.7 t / 173 t / blue whale fact,
  the backpack, and the Admin in red. Upload text: `episodes/01-mine-anything/short-monday-upload.md`. It promises
  the full episode on **Friday 6 Nov** (description and pinned comment only, so the date can change).
- Tall (Shorts) format: `defineEpisode(id, { ..., tall: { S1: { cx, cy?, k? } } })` frames each shot's wide drawing
  in a 9:16 window (cx, cy in screen space, k zooms out; keys over the shot clock for pans) and renders 1080 × 1920.
  The HUD (hotbar, chat, title) reads `useFrame()` and lays itself out above Shorts' own caption and buttons
  (`SAFE` in `engine/frame.tsx`). Sets run their backdrops far past the frame so a tall window never sees an edge.
  Digits go in the title face (Poppins): the pixel face's 2 and 5 read as a backwards S.
- Sound: free and ours. `channel/voice/sfx_synth.py <slug>` (repo root, after `plan.py`) makes every clip whose
  prompt starts with `synth:` (hits, cracks, pops, pickups, alarm, bus, knocks, hazards, title boom, drone, Admin
  blip...) and composes the chiptune bed to the timeline, saving them where `sfx.py` looks, so `sfx.py` and
  `mixcheck.py` work unchanged with no ElevenLabs key. Two clips (`gasp`, `class_murmur`) are from the studio's MIT
  library. Hits land in the pause after their word ("Hit it." then the punch), per `references/sound.md`.
- Voice: Kokoro `am_michael` (sample A), the person's pick on 29 Oct. From the repo root,
  `channel/voice/.venv/bin/python channel/voice/voice_kokoro.py <slug>` voices the episode's `script` into
  `studio/public/<slug>/voice.wav` and writes `studio/src/episodes/<slug>/words.json`; pauses come from `gaps` and
  each beat's `pause_after`. Then `plan.py`, `stills.mjs`, `board.py` as the skill says.
  `channel/voice/transcribe.py <slug>` scores the take against the script with Whisper (the Short: 97%).
- Storyboard lessons from part 1 (check these on every board): show the situation, not just the line (he wakes up in
  bed, not standing dressed); don't leave an easy way out in frame (a door beside the wall he mines kills the gag);
  the power needs its own look at phone size (the block outline, thick stepped cracks); keep neighbouring shots
  different in size or angle; something blurred and dark in the foreground every few shots.

## Setting up a fresh container

Containers are temporary: every new session reinstalls this (about 10 minutes, mostly downloads).

- **Studio:** `cd channel/studio && npm ci`. Fonts are bundled in `public/fonts` (the headless browser can't fetch
  Google Fonts through the proxy: ERR_CERT_AUTHORITY_INVALID; never disable TLS checks to get round it).
  `remotion.config.ts` and `stills.mjs` find the pre-installed Chromium in `/opt/pw-browsers` by themselves.
  Verified 28 Oct: the example episode `rewind` rendered and mastered end to end (`master.py rewind`). Rendering
  is CPU-bound, about 22 s per second of video (18.8 s took 7 min), so a 5-minute episode is 1.5–2 h: run it in
  the background.
- **Voices** (repo root): `uv venv channel/voice/.venv --python 3.11`, then
  `uv pip install --python channel/voice/.venv/bin/python --torch-backend cpu torch==2.6.0 torchaudio==2.6.0`
  (without the CPU backend uv pulls the 5 GB CUDA build), then `chatterbox-tts==0.1.7 kokoro==0.9.4 soundfile
  faster-whisper "setuptools<81"` (Chatterbox's watermarker needs `pkg_resources`), then spaCy's model from
  `https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl`
  (Hugging Face's copy has an unversioned filename uv rejects). Models download from Hugging Face on first use.
  Chatterbox Turbo makes about 21 s of speech in 90 s on CPU; Kokoro is near-instant.
- ElevenLabs: no key yet. `api.elevenlabs.io` is reachable from the cloud environment. The scripts read
  `ELEVENLABS_API_KEY` from the environment; the person adds it in the environment settings. Never ask for the
  key in chat, never print it.

## Studio setup (once approved)

The pipeline is the MIT-licensed skill [kelano86/what-if-animation](https://github.com/kelano86/what-if-animation)
(Claude Code + Remotion + ElevenLabs). Reviewed on 28 Oct: dependencies are Remotion 4.0.530, React 19 and
TypeScript; the scripts only call `api.elevenlabs.io`, ffmpeg and Remotion.

1. Clone it, copy its `SKILL.md`, `references/`, `scripts/` and `LICENSE` to `channel/.claude/skills/what-if-animation/`
   and its `studio/` to `channel/studio/`. Keep the LICENSE and credit it in the README.
2. `npm ci` in `channel/studio`. `node_modules/` and `out/` are gitignored.
3. Rendering: Chromium is pre-installed at `/opt/pw-browsers/` (`chromium_headless_shell-1243`); point Remotion at it
   if it tries to download its own.
4. Make it ours (done 29 Oct for part 1): the cast, the chat and hotbar in the pixel face, the mining look, and the
   bedroom, street, school and parking lot sets. Still to build for later parts: the coordinates readout, the
   achievement toast, the backyard and the shaft.
5. The skill makes 15–25 s episodes. Long episodes are built in parts on the same cast and sets, then joined.

## Every episode

1. Re-search YouTube for the premise (clones post daily). Change or drop it if a What If channel has the title.
2. Script on our seven beats (`BIBLE.md`). Every number worked out in `science.md` first.
3. Show the person the script for game accuracy, then the storyboard, before animating.
4. Package: two titles, two thumbnail ideas, description with chapters and the "is any of this real?" notes,
   pinned comment, three Shorts.
5. After release: write `results.md` at 48 h and 7 days from their screenshots, and apply `PLAN.md`'s rules.

## Don'ts

- Don't take topics from a plain "give me what-if ideas" prompt. That's how the clone channels converge.
- Don't call the friend "Max", copy any channel's character, or use Mojang's logo, textures or characters.
- Don't commit renders or WAV audio.
- Don't claim any channel is made with any particular tool.

## Log

- **2026-10-28** Research session. Found IFOLOGY (@IFOLOGYFILMS, 44.2K), Iflord (@ifinitumstories, 5.74K),
  Alternate You (@AlternateYou22, new). Picked the game-rules lane, the GAMERULE name and the `/gamerule` + Admin
  hook. Wrote episode 1. Drew concept art. Waiting on: channel creation, studio OK, ElevenLabs key.
- **2026-10-28** Channel created ("GameRule", @GameRuleEducation). Sent the setup steps: handle → @gamerule, name →
  GAMERULE, art, description, settings, ElevenLabs. Plan: studio + cast + storyboard before 31 Oct, animation on
  Max after, first upload Fri 6 Nov.
- **2026-10-28** Person chose free voices. Studio installed and verified end to end; four voice samples sent.
- **2026-10-29** Channel setup confirmed done (@gameruletv). Moved their settings file to the repo root. Asked them,
  simply, for two things: a voice pick (A–D) and "open a PR", so the channel merges into their default branch
  (`claude/fps-game-setup-vmje1l`, the game) and future sessions can see it.
- **2026-10-29** The person picked voice A (Kokoro `am_michael`). Built GAMERULE's layer on the rig and storyboarded
  episode 1 part 1 (14 shots, 22 s). The self-check failed the first board (wake-up shot standing and smug, the
  school door beside the mined wall, thin cracks, no high angle, no foregrounds); fixed all of it and sent the board.

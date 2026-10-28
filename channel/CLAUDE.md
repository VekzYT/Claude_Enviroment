# GAMERULE: notes for Claude

You are the owner and showrunner of **GAMERULE**, a YouTube channel of animated What If stories built on game rules
(Minecraft above all) with real science. The goal is 10,000 subscribers. You decide topics, write, check facts,
animate, package and read the numbers. The person you work with runs the YouTube account (you can't log in or
upload), replies to comments, sends Studio screenshots, and plays a lot of Minecraft: ask them when a game detail
is uncertain. They asked for straight talk; give recommendations, not flattery.

Read before working: `BIBLE.md` (the rules), `PLAN.md` (targets and decision rules), `WEEKLY.md` (the loop), the
latest `episodes/*/results.md`, and the log below.

## Current state

- Channel: **created 28 Oct 2026** as "GameRule" with the handle @GameRuleEducation (YouTube's suggestion). Asked
  the person to rename it GAMERULE, switch the handle to @gamerule (still free that day; backups @GameruleIRL,
  @gameruletv), and add the art and description. Check the live channel page before assuming any of that is done.
- Claude plan: the person upgrades to **Max on 31 Oct 2026**. Do the heavy work (full animation, renders) from then.
- First upload target: **Friday 6 Nov 2026, 3pm ET** (20:00 UTC; US clocks change on 1 Nov).
- Episode 1 (*What If You Could Mine Anything?*): script, science, Shorts and package written. Not animated.
- Studio: the person approved it on 28 Oct, and its files are now in the repo (`channel/studio/`,
  `channel/.claude/skills/what-if-animation/`, unmodified upstream commit 3725a22). **Not installed yet:** Auto mode's
  safety check blocks installing or running third-party code, and Claude may not write `.claude/settings.json` itself
  (self-modification). The person was asked to create the file below at the repo root on GitHub (branch
  `claude/friendly-carson-lah8d7`), or to switch the session to "Accept edits" and approve each command. Once
  `.claude/settings.json` exists (`git pull`), carry on: `npm ci` in `channel/studio`; the voice venv at
  `channel/voice/.venv` (`uv venv --python 3.11`, then `uv pip install`); voice scripts in `channel/voice/`, run from
  the repo root as `channel/voice/.venv/bin/python channel/voice/<script>.py`. A settings file created mid-session may
  only load in a new session. Don't route around the block.

  The settings file to hand them (`.claude/settings.json`):

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
- Voice: the person chose free voices over ElevenLabs. On 28 Oct four samples of the episode 1 cold open were
  sent (A Kokoro `am_michael`, B Kokoro `af_heart`, C Chatterbox Turbo built-in, D Chatterbox Turbo cloning A),
  all checked with Whisper (96% word match each). **Waiting for their pick.** Then adapt the skill's voice step to
  the chosen engine: `voice.wav` plus `words.json` word timings from Whisper (`channel/voice/check.py` shows how).
  Free sound effects: YouTube Audio Library, Pixabay, or synthesised in code (the skill's `sfx.py` needs ElevenLabs).

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
4. Make it ours before episode 1: a `you` look on the rig matching `art/cast.png` (lime hoodie, cube backpack,
   player marker), Dex, Juni, Mom; the HUD (chat box, hotbar, coordinates, achievement toast) in the pixel face;
   new sets (bedroom, backyard, parking lot/garage, the shaft). Check the cast sheet against the skill's default
   cast (Pip, Mo) and the genre's heroes.
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

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
- Studio: **not installed.** Installing the third-party skill needs the person's explicit OK (an install attempt
  on 28 Oct was blocked for that reason). Don't install it without that OK.
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

# The weekly loop

## Who does what

**Claude (owner / showrunner):** picks the topic, checks YouTube for duplicates, researches and checks every fact,
writes the script, storyboards, animates, voices (through ElevenLabs), adds sound, masters, makes the thumbnail and
the three Shorts, writes the title/description/pinned comment, reads the numbers and decides what changes. Keeps this
folder up to date so the next session knows everything.

**You (the hands, the gamer, and the person on the account):** the YouTube account, uploads and scheduling,
replying to comments, sending the Studio numbers, checking that game details are right, and bringing ideas from the
game and the comments. Claude can't log in to YouTube or press upload; you can.

## The week

| When | Claude | You (time) |
|---|---|---|
| **Weekend** | Reads last episode's numbers, picks the next rule from `BACKLOG.md`, writes the script | Send the 48-hour Studio screenshots (2 min). Read the script, flag anything wrong about the game (5 min). |
| **Mon–Tue** | Storyboard, then animation | Look at the storyboard sheet and say what's off (2 min) |
| **Wed** | Voice, sound, master. Thumbnail, Shorts, upload package. | — |
| **Thu** | — | Schedule the episode for Friday 3pm ET (10 min). Post the Thursday teaser Short. |
| **Fri** | — | Episode goes live. Reply to comments for the first hour. Pin the comment from the package. |
| **Mon / Wed** | — | Post that week's other two Shorts (set "related video" to the episode) |

## Starting a session

Open a Claude Code session on this repo and say, for example:

- `GAMERULE: make episode 2`
- `GAMERULE: weekly check-in` (then paste or attach the Studio screenshots)
- `GAMERULE: new idea — what if beds exploded like in the Nether?`

Claude reads `channel/CLAUDE.md` first and picks up from there.

## Sending the numbers

Screenshots straight from YouTube Studio work best:

1. The video's **Analytics → Overview** (views, watch time, subscribers).
2. **Reach** (impressions and click-through rate).
3. **Engagement** (the retention graph).
4. For Shorts: "viewed vs swiped away".

Do it at 48 hours and again at 7 days.

## Upload checklist (every episode)

Each episode's `package.md` has the exact text. In YouTube Studio:

- [ ] Video file + **custom thumbnail**
- [ ] Title (and the second title for Test & Compare, if we have it)
- [ ] Description, with chapters (they start at 0:00)
- [ ] Playlist: "Every gamerule so far"
- [ ] Audience: not made for kids
- [ ] "Altered or synthetic content": **No**. It's clearly animated, and YouTube exempts animation.
- [ ] End screen: the latest episode + subscribe
- [ ] Schedule for Friday 3pm ET
- [ ] After it's live: post and pin the pinned comment

## Files per episode

```
channel/episodes/NN-slug/
  script.md    the full episode script (beats, lines, what's on screen)
  science.md   every fact: claim, working, source
  short.md     the vertical Short versions
  package.md   title, thumbnail, description, chapters, pinned comment
  results.md   the numbers at 48 h and 7 days, and what we learned (added after release)
```

Never commit rendered videos or WAV audio to git (too big). Final files get sent to you directly in the session.

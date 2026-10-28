# Market scan: the AI "What If" genre (28 Oct 2026)

Pulled live from YouTube on 28 Oct 2026. View counts move fast; treat them as a snapshot.

## The channels you named

| Name you gave | Actual channel | Subs | Videos | Notes |
|---|---|---|---|---|
| IFOLOGY | [@IFOLOGYFILMS](https://www.youtube.com/@IFOLOGYFILMS) | 44.2K | 38 | All uploaded in ~2.5 weeks. 1–2 long videos a day. Best: *What IF You Were 10x Faster?* 832K, *Stop Time* 607K, *Shapeshift* 382K. |
| Iflord | [@ifinitumstories](https://www.youtube.com/@ifinitumstories) (display name "Iflord") | 5.74K | 10 | All in the last 8 days. *What If You Were Immortal?* 675K, *Never Missed* 351K. Channel description is a near copy of IFOLOGY's. |
| Alternate You | [@AlternateYou22](https://www.youtube.com/@AlternateYou22) | — | 1 | First video went up 4 hours before this scan, 0 views. Same character style, same friend name ("Max") as Iflord. Discloses "made with the help of AI tools". |

(@AlternateYou is a different channel, "Life Shifted", 21 subs. @ifology is an empty channel called "Obscory".)

## The rest of the genre

| Channel | Subs | Notes |
|---|---|---|
| [Ifverse](https://www.youtube.com/@IfverseTales) | 56.1K | The leader. Its top episode had 4.2M views (per FreshStack's 21 Oct analysis). |
| [FunNotSoFun](https://www.youtube.com/@FunNotSoFunUS) | 17.3K | A second channel with the same description has 5.26K. |
| [Jeremy Bearimy](https://www.youtube.com/@JeremyBearimyTheory) | 11K | 22 videos in ~2 weeks. **Its game-mechanic episodes are 3 of its 5 best recent ones:** *Respawn* 163K, *Creative Mode in Real Life* 138K, *Level Up in Real Life* 106K. Its other recent powers (firebending, psychic, clone, luck) got 3–25K. |
| [IFINITY](https://www.youtube.com/@Infinity-IF) | 4.67K | |
| Could've Been Tales | 607 | |
| **Dozens of clones** | **0–500** | Searching "Ifology" alone finds 12 copycat channels with 5–89 subs. "Save and reload your life" was made by at least 5 tiny channels this month (5–1,389 views each). One clone is called "CurioPip", named after the free skill's default hero. |

## What the winners do

- **Title grammar:** `What IF You Could ___?` / `What IF You Were 10x ___?` Second person, one power, simple words.
- **Thumbnail:** one faceless character in a hoodie, dark dusk/night background, one or two huge words with the last one in yellow ("TOO SLOW.", "PAUSED.", "CAN'T DIE.", "RESPAWN").
- **Length:** started at 3–7 minutes (IFOLOGY's first videos were 3:30–6:22 and got 131K–246K; Jeremy Bearimy's first four were 5–7.5 min and got 304K–585K), then stretched to 10–24 minutes once the audience was there.
- **Cadence:** daily or more. This is a gold rush and they're mining it.
- **Description:** a one-line hook, a "who's the villain? / would you do it?" comment prompt, chapters, hashtags. Iflord's *Immortal* lists every real-science beat (telomeres, the immortal jellyfish, Greenland sharks, the Sun's red giant phase).

## Why the clones get nothing

Their thumbnails are often fine. One with 108 views is a near-copy of Jeremy Bearimy's 163K-view *Respawn* thumbnail. What they share:

1. **Same title as an existing winner.** The algorithm already has a video for that premise.
2. **Same topics as each other.** They appear to generate ideas the same way, so they land on the same "what ifs" (save/load, health bars, see the future).
3. **Same look.** The default character and style of the free tool.
4. **Late.** The breakout channels started in early October.

## The formula (decoded by FreshStack from Ifverse, FunNotSoFun, IFinity, Could've Been Tales)

1. Cold open in the middle of the action: three quick demos of the power, or a flash-forward.
2. The premise and its rules.
3. The fun part: escalating wins.
4. The not-so-fun part: the cost, with real science and real numbers ("That's real.").
5. Someone powerful notices.
6. A moral choice with family at stake (usually a little sister).
7. Cliffhanger: "Part 1", a question for the comments.

Opening pace is about 27 cuts a minute. Every line is a picture. The power gets a word, a sound and a look.

## How they're made

There's a free, MIT-licensed Claude Code skill, [kelano86/what-if-animation](https://github.com/kelano86/what-if-animation) ([FreshStack write-up, 24 Oct 2026](https://www.freshstack.ai/resources/claude-2d-animation)). Claude writes the script, draws every frame as code (SVG, rendered by Remotion), ElevenLabs does the voice and sound effects (about $0.12 an episode), and it masters to -14 LUFS. The character is a code rig, so it never drifts. Out of the box it makes 15–25 s episodes (a cold open); long episodes are built in parts.

Nobody has confirmed how the leading channels make theirs. But the tool is free and public, so **the tool is not an edge**. Taste, topics, story and packaging are.

## The algorithm (what's solid vs. what's blog noise)

Solid (YouTube's own docs or consistent across sources):

- Recommendations follow viewer behaviour: what they click, how long they watch, likes/dislikes, "not interested", and satisfaction surveys. YouTube doesn't publish weights.
- Every new video gets tested on a small audience first. Click-through and how long people stay decide whether it spreads. Channel size isn't a gate.
- Home/browse, suggested (the "up next" column), search and the Shorts feed are separate surfaces. Shorts and long-form are ranked separately.
- **Suggested traffic is how this genre spreads.** A new video that looks and reads like the genre gets tested next to the winners' videos. That's why Iflord's second video could hit 675K.
- Since 24 Aug 2026, a "view" counts from the first frame; the old count lives on as "engaged views", which is what monetization uses.
- Shorts can run up to 3 minutes (since late 2025).
- Test & Compare lets you A/B up to 3 titles/thumbnails; the winner is picked by watch time. Needs advanced features (verification) and desktop Studio.

Blog claims I couldn't verify (ignore): exact satisfaction weights, "24–72 hour windows", specific demonetization percentages.

## Policy that affects us

- **Inauthentic content (monetization), clarified 16 July 2026, enforced per channel:** no ad money for "generic, repetitive, or template-based content … easily made with AI … with little variation between videos." YouTube's example of the problem: videos that "don't really have a narrative arc and don't really show your creativity." A channel of unmodified skill output is exactly this. Ours needs its own cast, look and stories. ([TechCrunch](https://techcrunch.com/2026/07/20/youtube-clarifies-policies-around-ai-slop-and-upsetting-videos/))
- **AI disclosure label:** only required for *realistic* altered/synthetic content. Animation and clearly unrealistic content are exempt. Disclosing doesn't limit reach. ([YouTube Help](https://support.google.com/youtube/answer/14328491))
- **Monetization (YPP):** 1,000 subs + 4,000 public watch hours in 12 months, or 1,000 subs + 10M Shorts views in 90 days. An earlier fan-funding tier opens at 500 subs in supported countries. Check the exact numbers in Studio when we get close.

## The gap we're taking

- Game-mechanic what-ifs outperform the rest of Jeremy Bearimy's catalogue, and nobody runs a channel dedicated to them.
- **Minecraft mechanics are untouched by the genre.** On YouTube: "Minecraft but you can mine anything" has 27M, 19M, 14M, 14M, 11M and 5M view videos; "Minecraft but you can craft anything" 2–4.6M; "unlimited inventory" 12M. Zero What-If channel episodes on mine anything, inventory, crafting, fall damage, lag or patch notes. (Cheat codes is taken: Ifinity, 44K views, 7 days ago.)
- The person co-running this channel plays a lot of Minecraft. That's a topic source the clones don't have.

## Sources

- Channel and video numbers: youtube.com channel pages and search, fetched 28 Oct 2026.
- [FreshStack: How to make viral-style What If cartoons with Claude Code](https://www.freshstack.ai/resources/claude-2d-animation)
- [kelano86/what-if-animation](https://github.com/kelano86/what-if-animation) (README, SKILL.md, references/formula.md, references/look.md)
- [TechCrunch: YouTube clarifies policies around AI slop](https://techcrunch.com/2026/07/20/youtube-clarifies-policies-around-ai-slop-and-upsetting-videos/)
- [YouTube Help: Disclosing altered or synthetic content](https://support.google.com/youtube/answer/14328491)
- [YouTube blog: engaged views explained](https://blog.youtube/inside-youtube/engaged-views-youtube-explained/)
- [YouTube Help: A/B test titles & thumbnails](https://support.google.com/youtube/answer/16391400)
- [Outlierkit: Shorts algorithm in YouTube's words](https://outlierkit.com/resources/youtube-shorts-algorithm/)
- [AIR Media-Tech: YPP requirements 2026](https://air.io/en/monetization/youtube-partner-program-requirements-2026-the-complete-guide)
- [Smallest.ai: ElevenLabs pricing 2026](https://smallest.ai/blog/elevenlabs-pricing-plans-cost-what-you-get-in-2026)

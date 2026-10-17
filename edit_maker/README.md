# Edit Maker

Auto-makes beat-synced car edits from your clips: it finds the beats in the song, cuts your clips on them, and adds zoom punches, shake, white flashes, motion blur, slow-mo and a color grade.

Needs `ffmpeg` and `numpy`.

```bash
# clips + use their own audio as the music
python3 editmaker.py clips.mp4 -o edit.mp4

# a folder of clips + your own song, 15 seconds, widescreen
python3 editmaker.py my_clips/ --music song.mp3 --duration 15 --aspect 16:9 -o edit.mp4

# don't like it? change the seed for a different edit
python3 editmaker.py clips.mp4 --seed 42 -o edit2.mp4
```

| Option | What it does |
|---|---|
| `--music` | song to cut to (default: audio of the first clip) |
| `--music-start` | seconds into the song to start (default: auto-picks the hype part) |
| `--duration` | length of the edit in seconds (default 20) |
| `--aspect` | `9:16` (default, TikTok), `16:9` or `1:1` |
| `--stretch` | how much the picture may be stretched to fill the frame instead of cropped (default 1.15, `1` = crop only) |
| `--seed` | same seed = same edit, new seed = new variation |

How the edit is built: the first ~15% is slow-mo with smooth slow zoom-ins, the middle cuts every beat (or every 2 beats when the music is calmer) with slow zooms, drifting pans, punch zooms, shake and flashes on the downbeats, and the last bar ends on a slow-mo zoom-out. Zooms are rendered with sub-pixel interpolation so they glide instead of jittering.

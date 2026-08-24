"""Assembles a listenable montage of the game's audio.

Sound is the one thing a screenshot cannot show, so this stitches the finished
files back together into a single track: the sound effects grouped the way you
meet them in the game, then a passage of each of the three music cues.

It reads the generated files rather than re-synthesising them, so what you hear
is exactly what the game loads -- including the Vorbis encoding on the loops.

    python3 tools/make_preview.py

Writes build/syfon_audio_preview.mp3.
"""

from __future__ import annotations

import os
import subprocess
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_dsp as d  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX = os.path.join(ROOT, "audio", "sfx")
MUSIC = os.path.join(ROOT, "audio", "music")
OUT = os.path.join(ROOT, "build", "syfon_audio_preview.mp3")

# One-shots play back to back with a short breath between them; loops and music
# get a window long enough to hear them actually loop.
GAP = 0.22
GROUP_GAP = 0.85
LOOP_SECONDS = 5.0
MUSIC_SECONDS = 22.0
FADE = 1.6

# Grouped the way the sounds turn up in play rather than alphabetically, so the
# montage reads as a walkthrough instead of a directory listing.
GROUPS: list[tuple[str, list[str]]] = [
    ("Footsteps -- grass, dirt, wood, stone, water", [
        "step_grass_0", "step_grass_2", "step_grass_4",
        "step_dirt_0", "step_dirt_3",
        "step_wood_0", "step_wood_2",
        "step_stone_1", "step_stone_3",
        "step_water_0", "step_water_2",
    ]),
    ("Movement", [
        "jump", "land_soft", "land_hard", "crouch_down", "crouch_up", "winded",
    ]),
    ("Axe and timber", [
        "axe_swing", "axe_hit_wood", "axe_hit_stone", "swing_light",
        "tree_creak", "tree_fall", "axe_split",
    ]),
    ("Bow", [
        "bow_draw", "bow_release", "arrow_flight",
        "arrow_hit_wood", "arrow_hit_flesh", "arrow_hit_ground",
    ]),
    ("Items and inventory", [
        "pickup_item", "pickup_wood", "pickup_food", "pickup_meat",
        "pickup_flint", "pickup_coin", "place_item", "eat", "weapon_switch",
    ]),
    ("Interface", [
        "ui_hover", "ui_click", "ui_open", "ui_close",
        "ui_buy", "ui_denied", "ui_objective", "ui_discover", "day_change",
    ]),
    ("Building", [
        "build_cycle", "build_place", "build_remove", "door_open", "door_close",
    ]),
    ("Fire and cooking", ["fire_ignite", "cook_done", "lamp_on", "lamp_off"]),
    ("Animals and hurt", [
        "deer_call", "boar_grunt", "hare_squeak",
        "animal_hurt", "animal_death", "player_hurt", "player_death",
    ]),
]

LOOPS = [
    ("Campfire", "fire_loop"),
    ("Meat on the spit", "cook_sizzle"),
    ("Pond", "amb_water"),
    ("Wind", "amb_wind"),
    ("Forest, day", "amb_forest_day"),
    ("Forest, night", "amb_forest_night"),
]

TRACKS = [
    ("Menu", "music_menu"),
    ("Exploring", "music_explore"),
    ("Day 8 onward", "music_tension"),
]


# ---------------------------------------------------------------- file access

def ffmpeg() -> str:
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def read_wav(path: str) -> np.ndarray:
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        raw = np.frombuffer(w.readframes(n), dtype="<i2").astype(np.float64) / 32767.0
        if w.getnchannels() == 2:
            raw = raw.reshape(-1, 2)
        if w.getframerate() != d.SR:
            raise RuntimeError("%s is %d Hz, expected %d" % (path, w.getframerate(), d.SR))
    return raw


def read_any(name: str, exe: str) -> np.ndarray:
    """Reads a generated sound whether it landed as WAV or Vorbis."""
    wav = os.path.join(SFX, name + ".wav")
    if os.path.exists(wav):
        return read_wav(wav)
    for src in (os.path.join(SFX, name + ".ogg"), os.path.join(MUSIC, name + ".ogg")):
        if os.path.exists(src):
            tmp = os.path.join(ROOT, "build", "_decode.wav")
            os.makedirs(os.path.dirname(tmp), exist_ok=True)
            subprocess.run([exe, "-y", "-loglevel", "error", "-i", src,
                            "-ar", str(d.SR), tmp], check=True)
            out = read_wav(tmp)
            os.remove(tmp)
            return out
    raise FileNotFoundError(name)


def to_stereo(x: np.ndarray) -> np.ndarray:
    if x.ndim == 2:
        return x
    return np.stack([x, x], axis=1)


# ------------------------------------------------------------------ assembly

def window(x: np.ndarray, seconds: float) -> np.ndarray:
    """A fading slice of a loop, taken from a little way in so it is up to
    speed -- the first second of an ambience is usually its quietest."""
    st = to_stereo(x)
    n = int(seconds * d.SR)
    start = min(int(1.2 * d.SR), max(len(st) - n, 0))
    if len(st) < start + n:
        reps = int(np.ceil((start + n) / len(st)))
        st = np.tile(st, (reps, 1))
    piece = st[start:start + n].copy()
    ramp = int(FADE * d.SR)
    ramp = min(ramp, len(piece) // 2)
    curve = np.linspace(0.0, 1.0, ramp)[:, None]
    piece[:ramp] *= curve
    piece[-ramp:] *= curve[::-1]
    return piece


def build() -> np.ndarray:
    exe = ffmpeg()
    parts: list[np.ndarray] = [np.zeros((int(0.4 * d.SR), 2))]
    gap = np.zeros((int(GAP * d.SR), 2))
    group_gap = np.zeros((int(GROUP_GAP * d.SR), 2))

    for title, names in GROUPS:
        print("  %s" % title)
        for name in names:
            parts.append(to_stereo(read_any(name, exe)))
            parts.append(gap)
        parts.append(group_gap)

    for title, name in LOOPS:
        print("  %s (loop)" % title)
        parts.append(window(read_any(name, exe), LOOP_SECONDS))
        parts.append(group_gap)

    for title, name in TRACKS:
        print("  %s (music)" % title)
        parts.append(window(read_any(name, exe), MUSIC_SECONDS))
        parts.append(group_gap)

    return np.concatenate(parts, axis=0)


def main() -> None:
    print("assembling preview")
    mont = build()
    # Levelled as one piece so nothing in it needs riding on a volume knob,
    # which is the whole point of the montage.
    mont = d.to_rms(mont, -20.0)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    tmp = OUT + ".tmp.wav"
    d.write_wav(tmp, mont)
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", tmp,
                    "-c:a", "libmp3lame", "-q:a", "3", OUT], check=True)
    os.remove(tmp)
    secs = len(mont) / d.SR
    print("wrote %s -- %d:%02d, %.1f KB"
          % (OUT, int(secs) // 60, int(secs) % 60, os.path.getsize(OUT) / 1024))


if __name__ == "__main__":
    main()

"""Writes the game's three music tracks.

These are composed rather than noodled: a key, a chord progression, and parts
that play against it -- pad, bass, plucked arpeggio, a lead line, and brushed
percussion. Each track is built to loop, so the last bar leads back into the
first instead of stopping dead.

  music_menu     sparse and cold, for the title screen
  music_explore  the daytime bed, warm but unsettled
  music_tension  from day eight, as the horde gets close

Run:  python3 tools/make_music.py
"""

from __future__ import annotations

import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_dsp as d  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "audio", "music")

# Semitone offsets from A2 for the note names used below.
A2 = 110.0
NAMES = {"A": 0, "A#": 1, "B": 2, "C": 3, "C#": 4, "D": 5, "D#": 6,
         "E": 7, "F": 8, "F#": 9, "G": 10, "G#": 11}


def note(name: str, octave: int = 0) -> float:
    return A2 * (2 ** ((NAMES[name] + 12 * octave) / 12.0))


def chord(root: str, kind: str, octave: int = 0) -> list:
    base = NAMES[root] + 12 * octave
    intervals = {
        "min": [0, 3, 7], "maj": [0, 4, 7],
        "min7": [0, 3, 7, 10], "maj7": [0, 4, 7, 11],
        "sus2": [0, 2, 7], "sus4": [0, 5, 7],
        "dim": [0, 3, 6],
    }[kind]
    return [A2 * (2 ** ((base + i) / 12.0)) for i in intervals]


# ------------------------------------------------------------------- voices

def pad(freqs, dur: float, level: float = 0.16, detune: float = 0.006,
        cutoff: float = 900.0, seed: int = 1) -> np.ndarray:
    """Wide, slow strings: three detuned saws per note through a moving filter."""
    n = int(d.SR * dur)
    out = np.zeros(n)
    rng = np.random.default_rng(seed)
    for f in freqs:
        for k in (-1, 0, 1):
            voice = d.saw(f * (1 + detune * k), dur)
            voice *= 1.0 + 0.004 * d.sine(rng.uniform(3.5, 5.5), dur)
            out += voice / 3.0
    out /= max(len(freqs), 1)
    # A slow filter sweep keeps a long pad from sitting still.
    out = d.lowpass(out, cutoff, 0.8)
    out = d.lowpass(out, cutoff * 1.4, 0.7)
    env = d.env_adsr(dur, dur * 0.28, dur * 0.2, 0.82, dur * 0.34)
    return out * env * level


def bass(f: float, dur: float, level: float = 0.30) -> np.ndarray:
    sub = d.sine(f, dur)
    body = d.saw(f, dur) * 0.35
    sig = d.lowpass(sub + body, 260, 0.9)
    sig = d.saturate(sig, 1.6)
    return sig * d.env_adsr(dur, 0.012, dur * 0.35, 0.55, dur * 0.4) * level


def pluck(f: float, dur: float, level: float = 0.20, bright: float = 1.0) -> np.ndarray:
    """A soft mallet: a couple of partials with a quick decay."""
    sig = np.zeros(int(d.SR * dur))
    for i, mult in enumerate((1.0, 2.0, 3.01, 4.02)):
        g = (1.0 / (i + 1.5)) * (bright if i else 1.0)
        sig += d.sine(f * mult, dur) * d.env_exp(dur, 0.003, dur * 0.30 / (i + 1), 1.2) * g
    click = d.highpass(d.noise(dur, int(f) % 9999), 3000)
    click *= d.env_exp(dur, 0.0005, 0.006, 2.6) * 0.10 * bright
    return (sig * 0.5 + click) * level


def lead(f: float, dur: float, level: float = 0.16, vib: float = 4.5) -> np.ndarray:
    n = int(d.SR * dur)
    freq = f * (1.0 + 0.006 * d.sine(vib, dur) * np.linspace(0, 1, n))
    sig = d.sine(freq, dur) + d.triangle(freq, dur) * 0.25
    sig = d.lowpass(sig, 2200, 0.8)
    return sig * d.env_adsr(dur, 0.05, dur * 0.25, 0.7, dur * 0.35) * level


def kick(dur: float = 0.5, level: float = 0.5) -> np.ndarray:
    f = np.linspace(120, 42, int(d.SR * dur))
    sig = d.sine(f, dur) * d.env_exp(dur, 0.001, 0.10, 1.4)
    sig += d.lowpass(d.noise(dur, 3), 500) * d.env_exp(dur, 0.001, 0.02, 2.4) * 0.3
    return d.saturate(sig, 1.5) * level


def brush(dur: float = 0.28, level: float = 0.22, seed: int = 4) -> np.ndarray:
    sig = d.bandpass(d.noise(dur, seed), 2400, 0.7)
    return sig * d.env_exp(dur, 0.004, 0.06, 1.5) * level


def shaker(dur: float = 0.14, level: float = 0.12, seed: int = 5) -> np.ndarray:
    sig = d.highpass(d.noise(dur, seed), 5000)
    return sig * d.env_exp(dur, 0.002, 0.025, 2.0) * level


def taiko(dur: float = 0.9, level: float = 0.45) -> np.ndarray:
    """A low drum for the tense track."""
    f = np.linspace(90, 55, int(d.SR * dur))
    sig = d.sine(f, dur) * d.env_exp(dur, 0.002, 0.16, 1.3)
    sig += d.sine(f * 1.6, dur) * d.env_exp(dur, 0.002, 0.08, 1.6) * 0.3
    sig += d.lowpass(d.noise(dur, 6), 900) * d.env_exp(dur, 0.001, 0.05, 2.0) * 0.35
    return d.saturate(sig, 1.4) * level


# -------------------------------------------------------------------- tracks

def _lay(track: np.ndarray, sig: np.ndarray, start: float) -> None:
    i = int(d.SR * start)
    end = min(len(track), i + len(sig))
    if end > i:
        track[i:end] += sig[: end - i]


def build_menu() -> np.ndarray:
    """Slow, sparse, minor. Four bars of six seconds."""
    bpm = 62.0
    beat = 60.0 / bpm
    bar = beat * 4
    prog = [("A", "min"), ("F", "maj7"), ("C", "maj"), ("E", "min7")]
    # Three passes: bare, then a high voice joins, then it thins out again so
    # the loop point arrives on the quietest bar rather than mid-swell.
    passes = 3
    total = bar * len(prog) * passes
    n = int(d.SR * total)
    track = np.zeros(n)

    for rep in range(passes):
        for i, (root, kind) in enumerate(prog):
            start = (rep * len(prog) + i) * bar
            notes = chord(root, kind, 1)
            depth = (0.72, 1.0, 0.82)[rep]
            _lay(track, pad(notes, bar * 1.02, 0.15 * depth, 0.007, 720, seed=10 + rep * 8 + i), start)
            if rep >= 1:
                _lay(track, pad([f * 2 for f in notes[:2]], bar * 1.02, 0.05,
                                0.01, 1600, seed=30 + rep * 8 + i), start)
            _lay(track, bass(chord(root, kind, -1)[0], bar * 0.95, 0.22 * depth), start)
            if rep == 0 and i % 2 == 0:
                _lay(track, pluck(notes[-1] * 2, beat * 2.2, 0.11, 0.7), start + beat * 0.5)
            elif rep >= 1:
                _lay(track, pluck(notes[-1] * 2, beat * 2.2, 0.13, 0.7), start + beat * 0.5)
                if i % 2 == 1:
                    _lay(track, pluck(notes[1] * 2, beat * 1.6, 0.09, 0.6), start + beat * 2.4)
            if rep == 1 and i == 3:
                _lay(track, lead(notes[-1] * 2, beat * 2.6, 0.10, 3.8), start + beat * 1.2)

    track = d.reverb(track, 0.82, 0.36, 2.2)
    return d.fit(track, n)


def build_explore() -> np.ndarray:
    """Warmer, moving, but never resolving comfortably."""
    bpm = 84.0
    beat = 60.0 / bpm
    bar = beat * 4
    prog = [("D", "min"), ("A", "min7"), ("F", "maj"), ("C", "sus2"),
            ("D", "min"), ("G", "min7"), ("A", "min"), ("A", "sus4")]
    # Three passes so the loop runs well over a minute: the first is just pad
    # and pulse, the second adds the arpeggio and lead, the third pulls the
    # drums back out again.
    passes = 3
    total = bar * len(prog) * passes
    n = int(d.SR * total)
    track = np.zeros(n)

    # Arpeggio pattern in sixteenths, wandering through each chord.
    pattern = [0, 2, 1, 2, 0, 1, 2, 1]
    melody = [None, 7, None, 5, 3, None, 2, 0]

    for rep in range(passes):
     for i, (root, kind) in enumerate(prog):
        start = (rep * len(prog) + i) * bar
        notes = chord(root, kind, 1)
        _lay(track, pad(notes, bar * 1.03, 0.13, 0.006, 820, seed=50 + i), start)
        _lay(track, bass(chord(root, kind, -1)[0], bar * 0.92, 0.24), start)

        if rep >= 1:
            for step in range(8):
                idx = pattern[step % len(pattern)]
                f = notes[idx % len(notes)] * (2.0 if step % 4 == 3 else 1.0)
                _lay(track, pluck(f, beat * 0.9, 0.13 if step % 2 == 0 else 0.08),
                     start + step * beat * 0.5)

        # A lead phrase over every other bar.
        m = melody[i % len(melody)]
        if m is not None and rep >= 1:
            root_hz = chord(root, kind, 2)[0]
            f = root_hz * (2 ** (m / 12.0))
            _lay(track, lead(f, beat * 2.2, 0.13), start + beat * 1.0)

        # Percussion: soft pulse, brushed off-beats. Thinner on the last pass.
        drums = (0.85, 1.0, 0.55)[rep]
        _lay(track, kick(0.45, 0.30 * drums), start)
        _lay(track, kick(0.4, 0.20 * drums), start + beat * 2)
        if rep >= 1:
            for step in range(8):
                if step % 2 == 1:
                    _lay(track, shaker(0.12, 0.075 * drums, seed=60 + step),
                         start + step * beat * 0.5)
        _lay(track, brush(0.26, 0.13 * drums, seed=70 + rep * 8 + i), start + beat * 1)
        _lay(track, brush(0.26, 0.13 * drums, seed=80 + rep * 8 + i), start + beat * 3)

    track = d.reverb(track, 0.62, 0.24, 1.4)
    return d.fit(track, n)


def build_tension() -> np.ndarray:
    """Day eight onward: a pulse under it, and the harmony stops being kind."""
    bpm = 96.0
    beat = 60.0 / bpm
    bar = beat * 4
    prog = [("D", "min"), ("D", "min"), ("A#", "maj"), ("C", "maj"),
            ("D", "min"), ("G", "dim"), ("A", "min"), ("A", "min")]
    passes = 3
    total = bar * len(prog) * passes
    n = int(d.SR * total)
    track = np.zeros(n)

    for rep in range(passes):
     for i, (root, kind) in enumerate(prog):
        start = (rep * len(prog) + i) * bar
        notes = chord(root, kind, 1)
        _lay(track, pad(notes, bar * 1.03, 0.12, 0.009, 640, seed=90 + i), start)
        # A drone a fifth up, held throughout, that never quite settles.
        _lay(track, pad([note("A", 1) * 1.5], bar * 1.03, 0.04, 0.012, 1100, seed=95 + i), start)

        # Driving eighth-note bass.
        for step in range(8):
            f = chord(root, kind, -1)[0]
            if step in (3, 6):
                f *= 2 ** (3 / 12.0)
            _lay(track, bass(f, beat * 0.46, 0.22 if step % 2 == 0 else 0.14),
                 start + step * beat * 0.5)

        # Heartbeat drum, doubling in the second half.
        _lay(track, taiko(0.8, 0.40), start)
        _lay(track, taiko(0.7, 0.26), start + beat * 1.5)
        if i >= 4 or rep >= 1:
            _lay(track, taiko(0.6, 0.22), start + beat * 2.5)
            _lay(track, taiko(0.6, 0.20), start + beat * 3.25)

        for step in range(8):
            _lay(track, shaker(0.1, 0.05 if step % 2 else 0.085, seed=100 + step),
                 start + step * beat * 0.5)

        # A high, thin figure that only appears late.
        if i in (2, 3, 6, 7):
            f = chord(root, kind, 2)[-1]
            _lay(track, lead(f, beat * 1.4, 0.09, 6.0), start + beat * 2.0)

    track = d.reverb(track, 0.7, 0.26, 1.6)
    return d.fit(track, n)


def main() -> None:
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    os.makedirs(OUT, exist_ok=True)

    tracks = {
        "music_menu": (build_menu(), -22.0),
        "music_explore": (build_explore(), -21.0),
        "music_tension": (build_tension(), -20.0),
    }
    for name, (mono, target) in tracks.items():
        mono = d.loopable(mono, 1.6)
        # Levelled after widening: the delayed second channel changes the RMS,
        # so measuring before it lands every track a few dB under target.
        st = d.to_rms(d.widen(mono, 0.010), target)
        path = os.path.join(OUT, name + ".ogg")
        d.write_ogg(path, st, ffmpeg, quality=4)
        size = os.path.getsize(path) / 1024.0
        print("  %-16s %6.1f dB  %5.1fs  %6.0f KB" % (
            name, d.loudness(st), len(st) / d.SR, size))


if __name__ == "__main__":
    main()

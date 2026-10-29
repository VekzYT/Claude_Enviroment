"""GAMERULE's sound effects and music, made in code: no paid service, nothing licensed, all ours.

Every clip in an episode's "sound" whose prompt starts with "synth:" is made by the recipe of the same name below and
saved where the studio's sfx.py looks for its clips (studio/library/sfx/<name>-<hash>.mp3), so sfx.py lines it up,
mixes and levels it like any other. The music bed ("music") is composed to the episode's timeline: a chiptune run
under the cold open that stops dead on the command, a lighter, curious one under the rule and the science, gone before
the turn.

Run from the repo root, after plan.py and before sfx.py:
    channel/voice/.venv/bin/python channel/voice/sfx_synth.py <slug>
"""
import os
import pathlib
import subprocess
import sys

import numpy as np
from scipy import signal

HERE = pathlib.Path(__file__).resolve().parent
STUDIO = HERE.parent / 'studio'
os.chdir(STUDIO)  # wi.py works out every path from the studio folder
sys.path.insert(0, str(HERE.parent / '.claude' / 'skills' / 'what-if-animation' / 'scripts'))
from wi import SR, clip_path, ep_dir, load_episode, load_json  # noqa: E402

RNG = np.random.default_rng(7)


# ---------------------------------------------------------------- building blocks
def T(d):
    return np.arange(int(d * SR)) / SR


def env(n, a, d, hold=0.0):
    """An attack (a seconds) then an exponential decay (d: time to about -60 dB), over n samples."""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-6), np.exp(-6.9 * np.maximum(0, t - a - hold) / max(d, 1e-6)))
    e[(t >= a) & (t < a + hold)] = 1
    return e


def noise(d):
    return RNG.standard_normal(int(d * SR))


def brown(d):
    x = np.cumsum(noise(d))
    x = signal.sosfilt(signal.butter(1, 20, 'hp', fs=SR, output='sos'), x)
    return x / (np.abs(x).max() + 1e-9)


def filt(x, kind, f, order=2):
    return signal.sosfilt(signal.butter(order, f, kind, fs=SR, output='sos'), x)


def bp(x, lo, hi):
    return filt(x, 'bandpass', [lo, hi])


def sweep(f0, f1, d, curve='exp'):
    t = T(d)
    f = f0 * (f1 / f0) ** (t / d) if curve == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def square(f, d, duty=0.5):
    t = T(d)
    return np.where((t * f) % 1 < duty, 1.0, -1.0)


def tri(f, d):
    t = T(d)
    return 2 * np.abs(2 * ((t * f) % 1) - 1) - 1


def pad(x, d):
    n = int(d * SR)
    return np.pad(x, (0, max(0, n - len(x))))[:n]


def at(buf, t0, x, g=1.0):
    """Adds x into buf starting at t0 seconds (clipped to the buffer)."""
    i = int(t0 * SR)
    if i < 0:
        x, i = x[-i:], 0
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i] * g


def reverb(x, decay=0.8, mix=0.25):
    n = int(decay * SR)
    ir = RNG.standard_normal(n) * np.exp(-6.9 * np.arange(n) / n)
    ir = filt(ir, 'lp', 5000)
    wet = pad(signal.fftconvolve(x, ir), (len(x) + n) / SR)
    wet /= np.abs(wet).max() + 1e-9
    dry = np.pad(x, (0, n))
    dry /= np.abs(dry).max() + 1e-9
    return dry * (1 - mix) + wet * mix


def partials(fs, amps, decays, d, attack=0.001):
    out = np.zeros(int(d * SR))
    t = T(d)
    for f, a, dc in zip(fs, amps, decays):
        out += a * np.sin(2 * np.pi * f * t) * env(len(t), attack, dc)
    return out


def norm(x):
    return x / (np.abs(x).max() + 1e-9)


# ---------------------------------------------------------------- the mine power (the same every time)
def mine_hit(d):
    n = int(d * SR)
    thump = sweep(140, 48, d) * env(n, 0.003, 0.14)
    click = filt(noise(d), 'hp', 2500) * env(n, 0.0005, 0.012) * 0.5
    thwack = bp(noise(d), 300, 1500) * env(n, 0.002, 0.05) * 0.7
    return np.tanh(1.6 * (thump + click + thwack))


def mine_crack(d):
    out = np.zeros(int(d * SR))
    for k, t0 in enumerate(np.sort(RNG.uniform(0, 0.22, 12))):
        burst = bp(noise(0.006), 1500, 6500) * env(int(0.006 * SR), 0.0003, 0.005)
        at(out, t0, burst, 1.0 - k / 16)
    crunch = filt(noise(d), 'lp', 700) * env(len(out), 0.004, 0.16) * 0.45
    return out + crunch


def mine_pop(d):
    n = int(d * SR)
    cork = pad(sweep(480, 1150, 0.035), d) * env(n, 0.001, 0.045)
    burst = filt(noise(d), 'hp', 3000) * env(n, 0.001, 0.07) * 0.5
    low = np.sin(2 * np.pi * 95 * T(d)) * env(n, 0.002, 0.09) * 0.55
    out = cork + burst + low
    for f, t0 in [(2640, 0.04), (3320, 0.07), (3960, 0.1), (4700, 0.13)]:
        at(out, t0, np.sin(2 * np.pi * f * T(0.25)) * env(int(0.25 * SR), 0.002, 0.16), 0.16)
    return out


def pickup(d):
    out = np.zeros(int(d * SR))
    for f, t0, dur in [(1318.5, 0.0, 0.06), (1975.5, 0.055, 0.11)]:
        at(out, t0, square(f, dur, 0.25) * env(int(dur * SR), 0.002, dur * 0.9), 0.6)
    return filt(out, 'lp', 7000)


# ---------------------------------------------------------------- the bedroom
def alarm(d):
    out = np.zeros(int(d * SR))
    rate = 17.0
    for k in range(int(d * rate)):
        base = 2093 if k % 2 == 0 else 1976
        strike = partials([base, base * 2.76, base * 5.4], [1, 0.45, 0.2], [0.07, 0.04, 0.02], 0.09)
        at(out, k / rate, strike, 0.9 + 0.1 * RNG.random())
    out += bp(noise(d), 2000, 5000) * 0.05
    out *= np.minimum(1, T(d) / 0.01)
    return out


def room_tone(d):
    return filt(brown(d), 'lp', 260) * 0.7 + np.sin(2 * np.pi * 60 * T(d)) * 0.015 + filt(noise(d), 'lp', 1800) * 0.03


def step_soft(d):
    n = int(d * SR)
    return filt(noise(d), 'lp', 320) * env(n, 0.002, 0.06) + filt(noise(d), 'hp', 2500) * env(n, 0.001, 0.015) * 0.25


# ---------------------------------------------------------------- the street and the school
def street_amb(d):
    out = filt(brown(d), 'lp', 380) * 0.55 + bp(noise(d), 250, 1400) * 0.06
    # a car passing far off, now and then
    for t0 in np.arange(1.5, d - 3, 4.7):
        w = np.hanning(int(3.0 * SR))
        at(out, t0, filt(noise(3.0), 'lp', 600) * w, 0.1)
    return out


def birds(d):
    out = np.zeros(int(d * SR))
    t0 = 0.2
    while t0 < d - 0.4:
        n_chirps = RNG.integers(1, 4)
        f0 = RNG.uniform(3200, 4400)
        far = RNG.random() < 0.4
        for k in range(n_chirps):
            dur = RNG.uniform(0.05, 0.11)
            tt = T(dur)
            f = f0 + 1400 * np.sin(np.pi * tt / dur) + 160 * np.sin(2 * np.pi * 38 * tt)
            chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(len(tt))
            at(out, t0 + k * (dur + 0.03), filt(chirp, 'lp', 3500) if far else chirp, 0.25 if far else 0.6)
        t0 += RNG.uniform(0.45, 1.1)
    return out


def bus_go(d):
    t = T(d)
    n = len(t)
    f0 = 30 + 22 * np.clip(t / 1.4, 0, 1) ** 1.3
    ph = 2 * np.pi * np.cumsum(f0) / SR
    engine = sum(np.sin(k * ph) / k for k in range(1, 14))
    engine = filt(engine, 'lp', 900) + filt(noise(d), 'lp', 220) * 0.5
    amp = np.interp(t, [0, 0.25, 1.0, 1.5, d], [0.45, 0.7, 1.0, 0.8, 0.0])
    hiss = filt(noise(d), 'hp', 2000) * env(n, 0.005, 0.32) * 0.45
    return engine * amp + hiss


def run_steps(d):
    out = np.zeros(int(d * SR))
    for k, t0 in enumerate(np.arange(0.0, 1.0, 0.17)):
        at(out, t0 + RNG.uniform(-0.01, 0.01), step_soft(0.12), 1.0 if k % 2 == 0 else 0.8)
    return out


def stop_skid(d):
    n = int(d * SR)
    return bp(noise(d), 900, 3200) * env(n, 0.03, 0.3) * 0.8 + filt(noise(d), 'lp', 300) * env(n, 0.002, 0.08)


def whoosh(d):
    t = T(d)
    x = noise(d)
    cut = 400 + 2600 * np.sin(np.pi * t / d) ** 2
    y = np.zeros_like(x)
    a = 0.0
    for i in range(len(x)):  # a lowpass that opens and closes: the air going past
        k = 1 - np.exp(-2 * np.pi * cut[i] / SR)
        a += k * (x[i] - a)
        y[i] = a
    return filt(y, 'hp', 200) * np.sin(np.pi * t / d) ** 1.5


# ---------------------------------------------------------------- the parking lot
def hazard(d):
    out = np.zeros(int(d * SR))
    for k, t0 in enumerate(np.arange(0, d - 0.05, 0.3)):
        f = 3200 if k % 2 == 0 else 1500
        at(out, t0, bp(noise(0.012), f * 0.7, f * 1.3) * env(int(0.012 * SR), 0.0005, 0.008), 1.0 if k % 2 == 0 else 0.7)
    return out


def knock(d):
    body = partials([196, 470, 1050, 2200], [1, 0.6, 0.35, 0.15], [0.12, 0.07, 0.04, 0.02], d)
    thud = filt(noise(d), 'lp', 800) * env(int(d * SR), 0.001, 0.03) * 0.8
    return body * 0.8 + thud


def car_pop(d):
    n = int(d * SR)
    out = pad(mine_pop(0.45), d)
    out += np.sin(2 * np.pi * 55 * T(d)) * env(n, 0.005, 0.35) * 0.9
    for t0 in RNG.uniform(0.08, 0.5, 6):
        f = RNG.uniform(900, 3000)
        at(out, t0, partials([f, f * 2.4], [1, 0.4], [0.06, 0.03], 0.12), 0.25)
    return out


def typing(d):
    out = np.zeros(int(d * SR))
    t0 = 0.0
    while t0 < d - 0.02:
        click = filt(noise(0.02), 'hp', 2500) * env(int(0.02 * SR), 0.0005, 0.008) + bp(noise(0.02), 800, 2000) * env(int(0.02 * SR), 0.001, 0.015) * 0.3
        at(out, t0, click, RNG.uniform(0.6, 1.0))
        t0 += RNG.uniform(0.035, 0.055)
    return out


def chat_sys(d):
    out = np.zeros(int(d * SR))
    for f, t0, dur in [(987.8, 0, 0.13), (1318.5, 0.1, 0.22)]:
        at(out, t0, (np.sin(2 * np.pi * f * T(dur)) + 0.2 * np.sin(4 * np.pi * f * T(dur))) * env(int(dur * SR), 0.004, dur), 0.7)
    return out


def title_hit(d):
    out = np.zeros(int(d * SR))
    rise = 0.45
    tt = T(rise)
    riser = bp(noise(rise), 300, 4000) * (tt / rise) ** 2
    at(out, 0, riser, 0.5)
    n = int((d - rise) * SR)
    boom = (np.sin(2 * np.pi * 48 * T(d - rise)) + 0.5 * np.sin(2 * np.pi * 96 * T(d - rise))) * env(n, 0.003, 1.1)
    hit = filt(noise(d - rise), 'lp', 2000) * env(n, 0.001, 0.15) * 0.6
    chime = partials([523.3, 784, 1046.5], [0.3, 0.25, 0.2], [1.0, 0.9, 0.8], d - rise, attack=0.004)
    at(out, rise, boom + hit + chime, 1.0)
    return reverb(out, 0.9, 0.2)[: len(out)]


def flicker(d):
    out = np.zeros(int(d * SR))
    buzz = filt(square(120, d, 0.5), 'lp', 3000) * 0.5
    gate = np.zeros(len(out))
    for t0 in [0.0, 0.06, 0.12]:
        at(gate, t0, np.ones(int(0.03 * SR)))
    out += buzz * gate
    for t0 in RNG.uniform(0, d * 0.8, 5):
        at(out, t0, filt(noise(0.003), 'hp', 3000), 0.6)
    return out


def lamp_out(d):
    n = int(d * SR)
    t = T(d)
    f = 120 - 60 * np.clip(t / 0.3, 0, 1)
    buzz = filt(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 'lp', 2500) * np.exp(-t / 0.15) * 0.6
    tink = partials([3500, 5200], [1, 0.5], [0.15, 0.1], d)
    out = buzz + np.roll(tink, int(0.04 * SR)) * 0.6
    out += filt(noise(d), 'lp', 400) * env(n, 0.002, 0.06) * 0.5
    return out


# ---------------------------------------------------------------- the inventory and the schematic
def inv_open(d):
    n = int(d * SR)
    return bp(noise(d), 1500, 4500) * np.sin(np.pi * T(d) / d) * 0.5 + filt(noise(d), 'hp', 3000) * env(n, 0.0005, 0.01) * 0.6


def slot_land(d):
    return partials([600, 1500], [1, 0.4], [0.03, 0.02], d) + filt(noise(d), 'lp', 900) * env(int(d * SR), 0.001, 0.03) * 0.7


def draw_line(d):
    t = T(d)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * 11 * t + 2 * np.sin(2 * np.pi * 3 * t))
    return bp(noise(d), 2000, 6000) * trem * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.15)


def count_tick(d):
    out = np.zeros(int(d * SR))
    t0, gap = 0.0, 0.09
    while t0 < d - 0.2:
        at(out, t0, filt(noise(0.006), 'hp', 4000) * env(int(0.006 * SR), 0.0003, 0.004), 0.8)
        t0 += gap
        gap = max(0.028, gap * 0.9)
    at(out, d - 0.2, np.sin(2 * np.pi * 1568 * T(0.2)) * env(int(0.2 * SR), 0.002, 0.18), 0.6)
    return out


def block_place(d):
    n = int(d * SR)
    return filt(noise(d), 'bandpass', [200, 900]) * env(n, 0.001, 0.04) + np.sin(2 * np.pi * 700 * T(d)) * env(n, 0.001, 0.025) * 0.4


def stone_thud(d):
    n = int(d * SR)
    return sweep(90, 40, d) * env(n, 0.003, 0.25) + filt(noise(d), 'lp', 600) * env(n, 0.002, 0.12) * 0.6


def whale(d):
    t = T(d)
    f = np.interp(t, [0, 0.5 * d, d], [175, 112, 138]) * (1 + 0.03 * np.sin(2 * np.pi * 5 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    shape = np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.8)
    return reverb(filt(tone * shape, 'lp', 1500), 1.2, 0.35)[: len(t)]


def stamp(d):
    n = int(d * SR)
    thump = sweep(120, 60, d) * env(n, 0.002, 0.08)
    slap = bp(noise(d), 800, 4000) * env(n, 0.001, 0.04) * 0.7
    return reverb(thump + slap, 0.35, 0.15)[:n]


# ---------------------------------------------------------------- the end: the cost and the Admin
def bounce(d):
    n = int(d * SR)
    return filt(noise(d), 'lp', 300) * env(n, 0.002, 0.04) + np.sin(2 * np.pi * 2200 * T(d)) * env(n, 0.002, 0.03) * 0.08


def glow_hum(d):
    t = T(d)
    chord = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(220, 0.5), (329.6, 0.4), (440, 0.35), (554.4, 0.25)])
    chord *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.5 * t)
    shimmer = sum(np.sin(2 * np.pi * f * t) * (0.5 + 0.5 * np.sin(2 * np.pi * r * t)) for f, r in [(1760, 3.1), (2637, 4.3)]) * 0.12
    shape = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.5)
    return filt((chord + shimmer) * shape, 'lp', 3000)


def drone(d):
    t = T(d)
    saw = lambda f: 2 * ((t * f) % 1) - 1  # noqa: E731
    body = filt(saw(55) + saw(55.6), 'lp', 420) + np.sin(2 * np.pi * 41.2 * t) * 0.35
    body += filt(brown(d), 'lp', 120) * 0.25
    shape = np.minimum(1, t / 0.8) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.25 * t)) * np.minimum(1, (d - t) / 0.6)
    return body * shape


def admin_blip(d):
    out = np.zeros(int(d * SR))
    for f, t0, dur in [(440, 0, 0.12), (311.1, 0.12, 0.24)]:
        x = square(f, dur, 0.5) + square(f * 1.01, dur, 0.5) * 0.6
        at(out, t0, np.tanh(2 * x) * env(int(dur * SR), 0.003, dur * 1.2), 0.5)
    return filt(out, 'lp', 4000)


# ---------------------------------------------------------------- the music bed, composed to the timeline
NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}


def hz(name, octave):
    return NOTE[name] * 2 ** (octave - 4)


def kick(d=0.12):
    return sweep(130, 45, d) * env(int(d * SR), 0.002, d)


def snare(d=0.11):
    n = int(d * SR)
    return bp(noise(d), 1000, 6000) * env(n, 0.001, d * 0.8) * 0.7 + np.sin(2 * np.pi * 185 * T(d)) * env(n, 0.001, 0.05) * 0.5


def hat(d=0.03):
    return filt(noise(d), 'hp', 7000) * env(int(d * SR), 0.0005, d)


def section(length, bars, chords, energetic):
    """Bars of 4 beats fitted exactly to `length` seconds; chords: (root, quality) per bar, cycling."""
    out = np.zeros(int(length * SR) + SR)
    bar = length / bars
    beat = bar / 4
    six = beat / 4
    for b in range(bars):
        root, minor = chords[b % len(chords)]
        r = hz(root, 2)
        third = r * 2 ** ((3 if minor else 4) / 12)
        fifth = r * 2 ** (7 / 12)
        t0 = b * bar
        # bass: eighths on the root, the octave on the off-beats
        for e in range(8):
            f = r * (2 if e % 2 else 1)
            note = tri(f, beat / 2 * 0.95) * env(int(beat / 2 * 0.95 * SR), 0.004, beat / 2)
            at(out, t0 + e * beat / 2, note, 0.55 if energetic else 0.4)
        # the arpeggio: sixteenths (energetic, square) or eighths (curious, triangle) up the chord
        tones = [r * 4, third * 4, fifth * 4, r * 8]
        step = six if energetic else beat / 2
        for k in range(int(bar / step)):
            f = tones[k % 4]
            dur = step * 0.9
            wave = square(f, dur, 0.25) if energetic else tri(f, dur)
            at(out, t0 + k * step, wave * env(int(dur * SR), 0.002, dur * 0.8), 0.16 if energetic else 0.2)
        # drums
        for q in range(4):
            if energetic:
                if q in (0, 2):
                    at(out, t0 + q * beat, kick(), 0.9)
                if q in (1, 3):
                    at(out, t0 + q * beat, snare(), 0.45)
            for h in range(2):
                at(out, t0 + q * beat + h * beat / 2, hat(), (0.18 if energetic else 0.08) * (1.3 if h else 1))
        if not energetic:
            # a soft chord pad under the curious run
            d = bar
            pad_ = sum(np.sin(2 * np.pi * f * T(d)) for f in [r * 2, third * 2, fifth * 2]) * np.minimum(1, T(d) / 0.3) * np.minimum(1, (d - T(d)) / 0.3)
            at(out, t0, pad_, 0.08)
    return out[: int(length * SR)]


def music(d, tl):
    fps = tl['fps']
    first = {}
    for s in tl['segments']:
        first.setdefault(s['shot'], s['a'] / fps)
    out = np.zeros(int(d * SR))
    a_end = first['S14']
    a = section(a_end, 9, [('A', True), ('F', False), ('C', False), ('G', False)], True)
    at(out, 0, a)
    b0, b1 = first['S15'], first['S21'] + 1.6
    b = section(b1 - b0, 8, [('A', True), ('F', False), ('D', True), ('E', False)], False)
    b *= np.minimum(1, T(b1 - b0) / 0.25)[: len(b)]
    fade = int(1.4 * SR)
    b[-fade:] *= np.linspace(1, 0, fade)
    at(out, b0, b)
    return out


RECIPES = {
    'mine_hit': mine_hit, 'mine_crack': mine_crack, 'mine_pop': mine_pop, 'pickup': pickup, 'alarm': alarm, 'room_tone': room_tone,
    'step_soft': step_soft, 'street_amb': street_amb, 'birds': birds, 'bus_go': bus_go, 'run_steps': run_steps, 'stop_skid': stop_skid,
    'whoosh': whoosh, 'hazard': hazard, 'knock': knock, 'car_pop': car_pop, 'typing': typing, 'chat_sys': chat_sys, 'title_hit': title_hit,
    'flicker': flicker, 'lamp_out': lamp_out, 'inv_open': inv_open, 'slot_land': slot_land, 'draw_line': draw_line, 'count_tick': count_tick,
    'block_place': block_place, 'stone_thud': stone_thud, 'whale': whale, 'stamp': stamp, 'bounce': bounce, 'glow_hum': glow_hum,
    'drone': drone, 'admin_blip': admin_blip,
}


def main():
    slug = sys.argv[1]
    ep = load_episode(slug)
    tl = load_json(ep_dir(slug) / 'timeline.json')
    clips = ep['sound']['clips']
    made = 0
    for name, (prompt, secs) in clips.items():
        if not prompt.startswith('synth:'):
            continue
        out = clip_path(name, prompt, secs)
        x = music(secs, tl) if name == 'music' else RECIPES[name](secs)
        x = norm(pad(np.asarray(x, dtype=np.float64), secs)) * 0.89
        raw = (np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '192k', str(out)], input=raw, check=True)
        made += 1
    print(f'{made} clips synthesised into {clip_path("x", "x", 1).parent}')


if __name__ == '__main__':
    main()

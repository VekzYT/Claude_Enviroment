"""Generates every sound effect the game plays.

Each sound is built rather than sampled, which buys three things a scraped pile
of clips cannot: they are all the same sample rate, they are all levelled to the
same loudness target, and the ones that loop actually loop without a seam.

Run:  python3 tools/make_sfx.py
"""

from __future__ import annotations

import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_dsp as d  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "audio", "sfx")

# Every one-shot is levelled to roughly this RMS so nothing in the game is
# wildly louder than anything else; the per-sound trims are relative to it.
ONESHOT_DB = -20.0
LOOP_DB = -27.0


# ------------------------------------------------------------------ footsteps

def _step_body(seed: int, surface: str) -> np.ndarray:
    """One footfall: a transient, a body, and some surface texture."""
    rng = np.random.default_rng(seed)
    dur = 0.24

    if surface == "grass":
        # Dry rustle: bandpassed noise with a soft, quick envelope.
        body = d.bandpass(d.noise(dur, seed), rng.uniform(1500, 2600), 1.1)
        body *= d.env_exp(dur, 0.004, 0.075, 1.3)
        crunch = d.highpass(d.noise(dur, seed + 91), 3200)
        crunch *= d.env_exp(dur, 0.001, 0.035, 2.2) * 0.5
        thud = d.sine(np.linspace(120, 62, int(d.SR * dur)), dur)
        thud *= d.env_exp(dur, 0.003, 0.05, 1.6) * 0.28
        out = body * 0.7 + crunch + thud
    elif surface == "dirt":
        body = d.lowpass(d.noise(dur, seed), rng.uniform(900, 1500))
        body *= d.env_exp(dur, 0.003, 0.06, 1.5)
        thud = d.sine(np.linspace(150, 55, int(d.SR * dur)), dur)
        thud *= d.env_exp(dur, 0.002, 0.055, 1.4) * 0.5
        grit = d.highpass(d.noise(dur, seed + 7), 2600)
        grit *= d.env_exp(dur, 0.001, 0.025, 2.5) * 0.22
        out = body * 0.8 + thud + grit
    elif surface == "wood":
        # A board has a pitch to it: a couple of damped resonances.
        out = np.zeros(int(d.SR * dur))
        for f, g in ((196.0, 1.0), (312.0, 0.55), (505.0, 0.3)):
            tone = d.sine(f * rng.uniform(0.96, 1.04), dur)
            out += tone * d.env_exp(dur, 0.001, 0.05 * g, 1.4) * g
        knock = d.lowpass(d.noise(dur, seed), 2200) * d.env_exp(dur, 0.001, 0.02, 2.6)
        out = out * 0.42 + knock * 0.55
    elif surface == "stone":
        out = d.bandpass(d.noise(dur, seed), rng.uniform(2200, 3400), 0.9)
        out *= d.env_exp(dur, 0.001, 0.03, 2.2)
        clack = d.sine(np.linspace(900, 380, int(d.SR * dur)), dur)
        clack *= d.env_exp(dur, 0.0008, 0.018, 2.4) * 0.4
        out = out * 0.7 + clack
    else:  # water
        splash = d.bandpass(d.noise(dur * 1.6, seed), rng.uniform(900, 1800), 0.8)
        splash *= d.env_exp(dur * 1.6, 0.006, 0.16, 1.1)
        fizz = d.highpass(d.noise(dur * 1.6, seed + 31), 4000)
        fizz *= d.env_exp(dur * 1.6, 0.01, 0.2, 1.0) * 0.4
        gulp = d.sine(np.linspace(300, 120, int(d.SR * dur * 1.6)), dur * 1.6)
        gulp *= d.env_exp(dur * 1.6, 0.004, 0.06, 1.6) * 0.3
        out = splash + fizz + gulp
    return d.fade(out, 0.001, 0.03)


def footsteps() -> dict:
    made = {}
    for surface, count in (("grass", 5), ("dirt", 5), ("wood", 4),
                           ("stone", 4), ("water", 4)):
        for i in range(count):
            made["step_%s_%d" % (surface, i)] = _step_body(1000 + hash(surface) % 500 + i * 17, surface)
    return made


# ------------------------------------------------------------------- movement

def movement() -> dict:
    out = {}

    # A grunt of effort plus the scuff of leaving the ground.
    dur = 0.34
    breath = d.bandpass(d.noise(dur, 5), 720, 0.8) * d.env_exp(dur, 0.02, 0.11, 1.2)
    voice = d.sine(np.linspace(190, 150, int(d.SR * dur)), dur) * d.env_exp(dur, 0.02, 0.09, 1.5)
    scuff = _step_body(77, "dirt") * 0.5
    out["jump"] = d.mix(breath * 0.5, voice * 0.22, scuff)

    for name, weight in (("land_soft", 0.55), ("land_hard", 1.0)):
        dur = 0.40
        thud = d.sine(np.linspace(190 * weight, 44, int(d.SR * dur)), dur)
        thud *= d.env_exp(dur, 0.002, 0.09 * weight, 1.3)
        body = d.lowpass(d.noise(dur, 12), 1100) * d.env_exp(dur, 0.002, 0.06, 1.8)
        grit = d.highpass(d.noise(dur, 13), 3000) * d.env_exp(dur, 0.001, 0.03, 2.4)
        sig = thud * 0.9 + body * 0.6 * weight + grit * 0.25 * weight
        if weight > 0.9:
            sig = d.saturate(sig, 1.6)
        out[name] = d.fade(sig, 0.001, 0.06)

    # Cloth movement for going down and coming back up.
    for name, f0, f1 in (("crouch_down", 2400, 1100), ("crouch_up", 1200, 2500)):
        dur = 0.26
        sweep = np.linspace(f0, f1, int(d.SR * dur))
        cloth = d.bandpass(d.noise(dur, 21), 1800, 0.7)
        cloth = cloth * d.env_exp(dur, 0.01, 0.09, 1.2)
        # A gentle formant sweep on top so the two read as opposites.
        cloth += d.bandpass(d.noise(dur, 22), float(np.mean(sweep)), 2.0) * 0.5 * \
            d.env_exp(dur, 0.02, 0.07, 1.0)
        out[name] = d.fade(cloth, 0.004, 0.05)

    # Winded: two shallow breaths.
    dur = 1.1
    b = np.zeros(int(d.SR * dur))
    for k, start in enumerate((0.0, 0.52)):
        seg = d.bandpass(d.noise(0.38, 40 + k), 620 + k * 120, 0.75)
        seg *= d.env_adsr(0.38, 0.06, 0.10, 0.5, 0.2)
        b += d.at(seg, start, dur)
    out["winded"] = d.fade(b, 0.02, 0.12)
    return out


# ----------------------------------------------------------------------- axe

def axe_and_wood() -> dict:
    out = {}

    # Swing: a noise band swept up then down, which is what a whoosh is.
    dur = 0.42
    n = int(d.SR * dur)
    centre = 400 + 1500 * np.sin(np.linspace(0, np.pi, n)) ** 1.5
    src = d.noise(dur, 101)
    sw = np.zeros(n)
    # Approximate a sweeping bandpass with three fixed bands crossfaded.
    for f, lo, hi in ((520, 0.0, 0.45), (1250, 0.25, 0.8), (2100, 0.55, 1.0)):
        band = d.bandpass(src, f, 1.2)
        w = np.clip((np.linspace(0, 1, n) - lo) / max(hi - lo, 1e-6), 0, 1)
        w = np.sin(w * np.pi) ** 1.2
        sw += band * w
    sw *= d.env_adsr(dur, 0.05, 0.12, 0.6, 0.24)
    out["axe_swing"] = d.fade(sw * 0.8, 0.01, 0.08)
    out["swing_light"] = d.fade(d.highpass(sw, 700) * 0.55, 0.01, 0.07)

    # Chop: a hard transient with the low knock of a struck trunk.
    dur = 0.5
    crack = d.highpass(d.noise(dur, 111), 1800) * d.env_exp(dur, 0.0006, 0.028, 2.6)
    knock = np.zeros(int(d.SR * dur))
    for f, g in ((88.0, 1.0), (146.0, 0.6), (231.0, 0.35)):
        knock += d.sine(f, dur) * d.env_exp(dur, 0.001, 0.10 * g, 1.5) * g
    split = d.bandpass(d.noise(dur, 112), 900, 0.9) * d.env_exp(dur, 0.001, 0.06, 1.8)
    chop = d.saturate(crack * 0.9 + knock * 0.75 + split * 0.5, 1.8)
    out["axe_hit_wood"] = d.fade(d.reverb(chop, 0.45, 0.16, 0.5), 0.0005, 0.1)

    # Striking stone: brighter, shorter, with a spark ring.
    dur = 0.42
    tick = d.highpass(d.noise(dur, 121), 4200) * d.env_exp(dur, 0.0004, 0.012, 3.0)
    ring = d.sine(np.linspace(2600, 1700, int(d.SR * dur)), dur)
    ring *= d.env_exp(dur, 0.0006, 0.05, 2.0) * 0.35
    clack = d.bandpass(d.noise(dur, 122), 1500, 1.4) * d.env_exp(dur, 0.0008, 0.02, 2.6)
    out["axe_hit_stone"] = d.fade(d.reverb(tick + ring + clack * 0.7, 0.4, 0.2, 0.5), 0.0005, 0.09)

    # Splitting a log on the block: chop plus a tearing crack and two halves.
    dur = 0.9
    tear = d.bandpass(d.noise(0.36, 131), 700, 0.7) * d.env_exp(0.36, 0.002, 0.16, 1.1)
    halves = np.zeros(int(d.SR * dur))
    for k, start in enumerate((0.30, 0.44)):
        piece = np.zeros(int(d.SR * 0.3))
        for f, g in ((150.0, 1.0), (243.0, 0.5)):
            piece += d.sine(f * (1 + 0.1 * k), 0.3) * d.env_exp(0.3, 0.001, 0.05 * g, 1.6) * g
        halves += d.at(piece * 0.5, start, dur)
    out["axe_split"] = d.fade(d.mix(d.fit(chop, int(d.SR * dur)),
                                    d.at(tear, 0.02, dur), halves), 0.0005, 0.15)

    # A tree going over: a long groan, then the crash.
    dur = 2.6
    groan = d.sine(np.linspace(70, 52, int(d.SR * 1.5)), 1.5)
    groan += d.sine(np.linspace(141, 103, int(d.SR * 1.5)), 1.5) * 0.4
    groan *= d.env_adsr(1.5, 0.25, 0.4, 0.55, 0.7)
    groan = d.saturate(groan, 1.4) * 0.5
    creak = d.bandpass(d.noise(1.5, 141), 1200, 3.0)
    creak *= (0.4 + 0.6 * np.abs(d.sine(7.0, 1.5))) * d.env_adsr(1.5, 0.3, 0.5, 0.5, 0.6)
    crash = d.lowpass(d.noise(1.1, 142), 2400) * d.env_exp(1.1, 0.004, 0.34, 1.15)
    boom = d.sine(np.linspace(96, 34, int(d.SR * 1.1)), 1.1) * d.env_exp(1.1, 0.006, 0.22, 1.2)
    snap = d.highpass(d.noise(0.3, 143), 2200) * d.env_exp(0.3, 0.001, 0.05, 2.2)
    fall = d.mix(d.at(groan, 0.0, dur), d.at(creak * 0.35, 0.05, dur),
                 d.at(snap * 0.7, 1.35, dur), d.at(crash * 0.8, 1.45, dur),
                 d.at(boom * 0.9, 1.5, dur))
    out["tree_fall"] = d.fade(d.reverb(fall, 0.7, 0.3, 1.4), 0.02, 0.4)

    # The shudder of a blow that did not fell it.
    out["tree_creak"] = d.fade(d.bandpass(d.noise(0.55, 151), 900, 4.0) *
                               d.env_adsr(0.55, 0.03, 0.15, 0.4, 0.3) * 0.6, 0.01, 0.12)
    return out


# ----------------------------------------------------------------------- bow

def bow() -> dict:
    out = {}

    # Draw: creaking limbs and string tension rising in pitch.
    dur = 0.62
    n = int(d.SR * dur)
    creak = d.bandpass(d.noise(dur, 201), 1150, 3.5)
    # Irregular, so it reads as fibres giving rather than a tone.
    stutter = 0.55 + 0.45 * np.abs(d.sine(np.linspace(9, 17, n), dur))
    creak *= stutter * d.env_adsr(dur, 0.08, 0.2, 0.75, 0.2)
    tension = d.sine(np.linspace(160, 320, n), dur) * 0.10
    tension *= d.env_adsr(dur, 0.12, 0.25, 0.7, 0.2)
    nock = d.highpass(d.noise(0.05, 202), 3000) * d.env_exp(0.05, 0.0005, 0.012, 2.5)
    out["bow_draw"] = d.fade(d.mix(creak * 0.5, tension, d.at(nock * 0.5, 0.0, dur)), 0.01, 0.1)

    # Release: the string's snap, the limb thump, and the arrow leaving.
    dur = 0.65
    snap = d.sine(np.linspace(420, 150, int(d.SR * 0.18)), 0.18)
    snap += d.sine(np.linspace(880, 300, int(d.SR * 0.18)), 0.18) * 0.5
    snap *= d.env_exp(0.18, 0.0004, 0.035, 2.0)
    thump = d.sine(np.linspace(150, 70, int(d.SR * 0.3)), 0.3) * d.env_exp(0.3, 0.001, 0.06, 1.6)
    air = d.highpass(d.noise(0.3, 211), 2500) * d.env_exp(0.3, 0.002, 0.05, 1.8)
    hum = d.sine(np.linspace(240, 210, int(d.SR * 0.4)), 0.4) * d.env_exp(0.4, 0.004, 0.12, 1.4) * 0.18
    rel = d.mix(d.at(snap, 0.0, dur), d.at(thump * 0.7, 0.004, dur),
                d.at(air * 0.55, 0.0, dur), d.at(hum, 0.02, dur))
    out["bow_release"] = d.fade(d.saturate(rel, 1.5), 0.0004, 0.12)

    # Arrow in flight, heard as it goes past.
    dur = 0.5
    n = int(d.SR * dur)
    fly = d.bandpass(d.noise(dur, 221), 2400, 1.1)
    fly += d.bandpass(d.noise(dur, 222), 4200, 1.6) * 0.5
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2.2
    out["arrow_flight"] = d.fade(fly * shape * 0.5, 0.01, 0.12)

    # Arrow into a tree: a woody thock with a shaft wobble after it.
    dur = 0.7
    thock = np.zeros(int(d.SR * dur))
    for f, g in ((210.0, 1.0), (357.0, 0.5), (640.0, 0.25)):
        thock += d.sine(f, dur) * d.env_exp(dur, 0.0008, 0.04 * g, 1.7) * g
    bite = d.highpass(d.noise(dur, 231), 2000) * d.env_exp(dur, 0.0005, 0.02, 2.6)
    wobble = d.sine(np.linspace(150, 128, int(d.SR * 0.45)), 0.45)
    wobble *= d.env_exp(0.45, 0.01, 0.16, 1.3) * (0.5 + 0.5 * d.sine(38.0, 0.45)) * 0.22
    out["arrow_hit_wood"] = d.fade(d.mix(thock * 0.8, bite * 0.7, d.at(wobble, 0.03, dur)), 0.0005, 0.12)

    # Into an animal: duller, wetter, no ring.
    dur = 0.45
    body = d.lowpass(d.noise(dur, 241), 700) * d.env_exp(dur, 0.001, 0.05, 1.8)
    smack = d.sine(np.linspace(240, 90, int(d.SR * dur)), dur) * d.env_exp(dur, 0.001, 0.035, 1.9)
    out["arrow_hit_flesh"] = d.fade(d.saturate(body * 0.9 + smack * 0.7, 1.5), 0.0005, 0.1)

    # Into the dirt.
    dur = 0.4
    dirt = d.lowpass(d.noise(dur, 251), 1400) * d.env_exp(dur, 0.001, 0.035, 2.2)
    tap = d.sine(np.linspace(300, 120, int(d.SR * dur)), dur) * d.env_exp(dur, 0.001, 0.02, 2.2)
    out["arrow_hit_ground"] = d.fade(dirt * 0.8 + tap * 0.4, 0.0005, 0.09)
    return out


# --------------------------------------------------------------------- items

def items() -> dict:
    out = {}

    def pluck(freqs, dur, decay, bright=0.0, seed=1):
        sig = np.zeros(int(d.SR * dur))
        for i, f in enumerate(freqs):
            g = 1.0 / (i + 1.4)
            sig += d.sine(f, dur) * d.env_exp(dur, 0.001, decay * g, 1.4) * g
        if bright > 0:
            sig += d.highpass(d.noise(dur, seed), 4000) * d.env_exp(dur, 0.0005, 0.012, 2.6) * bright
        return d.fade(sig, 0.0008, dur * 0.4)

    out["pickup_item"] = pluck([660, 990, 1320], 0.28, 0.09, 0.25, 301)
    out["pickup_wood"] = d.fade(d.mix(
        d.lowpass(d.noise(0.3, 311), 1300) * d.env_exp(0.3, 0.001, 0.05, 1.8),
        pluck([180, 268], 0.3, 0.07) * 0.6), 0.001, 0.1)
    out["pickup_food"] = pluck([520, 780], 0.24, 0.07, 0.12, 321)
    out["pickup_meat"] = d.fade(d.mix(
        d.lowpass(d.noise(0.26, 331), 900) * d.env_exp(0.26, 0.002, 0.05, 1.6) * 0.8,
        pluck([300, 450], 0.26, 0.06) * 0.4), 0.002, 0.08)
    out["pickup_flint"] = d.fade(d.mix(
        d.bandpass(d.noise(0.22, 341), 2600, 1.2) * d.env_exp(0.22, 0.0006, 0.02, 2.4),
        pluck([880, 1310], 0.22, 0.03, 0.2, 342) * 0.5), 0.0006, 0.07)
    out["pickup_coin"] = d.fade(d.mix(
        pluck([1180, 1760, 2350], 0.42, 0.13, 0.3, 351),
        d.at(pluck([1480, 2210], 0.3, 0.09, 0.2, 352) * 0.5, 0.06, 0.42)), 0.0006, 0.14)

    # Setting something down.
    out["place_item"] = d.fade(d.mix(
        d.lowpass(d.noise(0.24, 361), 1000) * d.env_exp(0.24, 0.002, 0.04, 1.9),
        d.sine(np.linspace(160, 80, int(d.SR * 0.24)), 0.24) * d.env_exp(0.24, 0.002, 0.03, 1.8) * 0.6),
        0.002, 0.08)

    # Swapping what is in your hands: leather and a knock of wood.
    dur = 0.34
    cloth = d.bandpass(d.noise(dur, 381), 1600, 0.7) * d.env_exp(dur, 0.006, 0.07, 1.4)
    tap = d.sine(np.linspace(230, 140, int(d.SR * dur)), dur) * d.env_exp(dur, 0.002, 0.03, 2.0)
    out["weapon_switch"] = d.fade(cloth * 0.7 + tap * 0.45, 0.003, 0.09)

    # Eating: two soft bites.
    dur = 0.7
    bites = np.zeros(int(d.SR * dur))
    for k, start in enumerate((0.0, 0.34)):
        b = d.bandpass(d.noise(0.26, 371 + k), 1400 + k * 300, 0.9)
        b *= d.env_exp(0.26, 0.004, 0.06, 1.5)
        bites += d.at(b, start, dur)
    out["eat"] = d.fade(bites * 0.8, 0.004, 0.12)
    return out


# ------------------------------------------------------------------------ ui

def ui() -> dict:
    out = {}

    def blip(f0, f1, dur, shape=1.0, level=1.0):
        sig = d.sine(np.linspace(f0, f1, int(d.SR * dur)), dur)
        sig += d.sine(np.linspace(f0 * 2, f1 * 2, int(d.SR * dur)), dur) * 0.3
        sig *= d.env_exp(dur, 0.003, dur * 0.4, shape)
        return d.fade(sig * level, 0.002, dur * 0.5)

    out["ui_click"] = blip(880, 1180, 0.09, 1.4, 0.7)
    out["ui_hover"] = blip(1320, 1400, 0.05, 1.6, 0.3)
    out["ui_open"] = d.fade(d.mix(blip(420, 760, 0.18, 1.1),
                                  d.at(blip(760, 1140, 0.16, 1.2, 0.6), 0.06, 0.24)), 0.003, 0.1)
    out["ui_close"] = d.fade(d.mix(blip(900, 560, 0.16, 1.2),
                                   d.at(blip(560, 340, 0.16, 1.3, 0.6), 0.05, 0.22)), 0.003, 0.1)
    # A purchase: a small rising figure with coins under it.
    out["ui_buy"] = d.fade(d.mix(
        blip(660, 660, 0.1, 1.4, 0.5),
        d.at(blip(880, 880, 0.1, 1.4, 0.5), 0.08, 0.42),
        d.at(blip(1320, 1320, 0.22, 1.2, 0.6), 0.16, 0.42)), 0.002, 0.12)
    # Refusal: a flat, low double tap. Unmistakably "no".
    out["ui_denied"] = d.fade(d.mix(
        blip(220, 200, 0.09, 1.6, 0.7),
        d.at(blip(180, 160, 0.14, 1.6, 0.7), 0.1, 0.26)), 0.002, 0.08)
    out["ui_objective"] = d.fade(d.mix(
        blip(784, 784, 0.16, 1.3, 0.45),
        d.at(blip(1046, 1046, 0.16, 1.3, 0.45), 0.1, 0.5),
        d.at(blip(1318, 1318, 0.3, 1.1, 0.5), 0.2, 0.55)), 0.002, 0.16)
    out["ui_discover"] = d.fade(d.reverb(d.mix(
        blip(587, 587, 0.3, 1.0, 0.4),
        d.at(blip(880, 880, 0.36, 0.9, 0.45), 0.12, 0.52)), 0.6, 0.28, 0.7), 0.003, 0.2)
    out["day_change"] = d.fade(d.reverb(d.mix(
        blip(330, 330, 0.5, 0.8, 0.5),
        d.at(blip(494, 494, 0.55, 0.8, 0.4), 0.18, 0.75),
        d.at(blip(659, 659, 0.6, 0.7, 0.35), 0.36, 0.98)), 0.7, 0.3, 1.0), 0.004, 0.3)
    out["lamp_on"] = d.fade(d.mix(
        d.highpass(d.noise(0.08, 401), 2000) * d.env_exp(0.08, 0.0004, 0.01, 2.8),
        blip(1500, 900, 0.07, 1.6, 0.4)), 0.0005, 0.04)
    out["lamp_off"] = d.fade(d.mix(
        d.highpass(d.noise(0.08, 402), 1600) * d.env_exp(0.08, 0.0004, 0.009, 2.8),
        blip(900, 600, 0.07, 1.6, 0.35)), 0.0005, 0.04)
    return out


# ---------------------------------------------------------------------- fire

def fire() -> dict:
    out = {}

    # Catching: a whoosh with crackle riding on it.
    dur = 1.5
    whoosh = d.bandpass(d.noise(dur, 501), 700, 0.6)
    whoosh *= d.env_adsr(dur, 0.12, 0.3, 0.45, 0.6)
    rng = np.random.default_rng(502)
    crackle = np.zeros(int(d.SR * dur))
    for _ in range(70):
        start = rng.uniform(0.05, dur - 0.1)
        pop = d.highpass(d.noise(0.04, int(rng.integers(0, 9999))), rng.uniform(1800, 5000))
        pop *= d.env_exp(0.04, 0.0004, 0.008, 2.8) * rng.uniform(0.2, 1.0)
        crackle += d.at(pop, start, dur)
    out["fire_ignite"] = d.fade(whoosh * 0.7 + crackle * 0.6, 0.02, 0.25)

    # The loop. Ten seconds, crossfaded so it does not tick.
    dur = 10.0
    bed = d.lowpass(d.pink(dur, 511), 620) * 0.5
    bed *= 0.7 + 0.3 * d.sine(0.23, dur)
    rng = np.random.default_rng(512)
    pops = np.zeros(int(d.SR * dur))
    for _ in range(420):
        start = rng.uniform(0.0, dur - 0.08)
        pop = d.highpass(d.noise(0.05, int(rng.integers(0, 99999))), rng.uniform(1600, 6000))
        pop *= d.env_exp(0.05, 0.0004, rng.uniform(0.004, 0.012), 2.6) * rng.uniform(0.15, 1.0)
        pops += d.at(pop, start, dur)
    out["fire_loop"] = d.loopable(bed + pops * 0.55, 0.5)

    # Meat over the flame.
    dur = 6.0
    sizzle = d.highpass(d.pink(dur, 521), 2600) * 0.5
    sizzle *= 0.6 + 0.4 * d.sine(0.7, dur)
    rng = np.random.default_rng(522)
    spits = np.zeros(int(d.SR * dur))
    for _ in range(90):
        start = rng.uniform(0.0, dur - 0.05)
        s = d.highpass(d.noise(0.03, int(rng.integers(0, 99999))), 5000)
        s *= d.env_exp(0.03, 0.0003, 0.005, 3.0) * rng.uniform(0.2, 1.0)
        spits += d.at(s, start, dur)
    out["cook_sizzle"] = d.loopable(sizzle * 0.7 + spits * 0.4, 0.4)

    out["cook_done"] = d.fade(d.mix(
        d.sine(523.25, 0.5) * d.env_exp(0.5, 0.004, 0.16, 1.2) * 0.5,
        d.at(d.sine(783.99, 0.6) * d.env_exp(0.6, 0.004, 0.2, 1.1) * 0.42, 0.11, 0.75)), 0.004, 0.25)
    return out


# ------------------------------------------------------------------- animals

def animals() -> dict:
    out = {}

    def call(f0, f1, dur, formant, rough=0.0, seed=1):
        n = int(d.SR * dur)
        base = np.linspace(f0, f1, n)
        sig = d.saw(base, dur) * 0.5 + d.sine(base, dur) * 0.5
        if rough > 0:
            sig *= 1.0 - rough * 0.5 * (1 + d.sine(28.0, dur))
        sig = d.bandpass(sig, formant, 1.4) + d.bandpass(sig, formant * 2.1, 2.0) * 0.4
        sig *= d.env_adsr(dur, 0.03, 0.12, 0.7, 0.3)
        breath = d.bandpass(d.noise(dur, seed), formant * 1.4, 0.8) * 0.18
        breath *= d.env_adsr(dur, 0.05, 0.15, 0.6, 0.3)
        return d.fade(sig * 0.7 + breath, 0.006, dur * 0.25)

    out["deer_call"] = call(330, 250, 0.55, 900, 0.15, 601)
    out["boar_grunt"] = d.fade(d.mix(
        call(150, 110, 0.3, 420, 0.6, 611),
        d.at(call(130, 100, 0.26, 380, 0.7, 612) * 0.7, 0.3, 0.62)), 0.006, 0.14)
    out["hare_squeak"] = call(1500, 1900, 0.16, 2400, 0.1, 621)
    out["animal_hurt"] = d.fade(d.mix(
        call(420, 300, 0.34, 1100, 0.45, 631),
        d.lowpass(d.noise(0.2, 632), 900) * d.env_exp(0.2, 0.002, 0.04, 2.0) * 0.5), 0.004, 0.12)
    out["animal_death"] = d.fade(d.mix(
        call(340, 150, 0.85, 800, 0.5, 641),
        d.at(d.lowpass(d.noise(0.5, 642), 700) * d.env_exp(0.5, 0.02, 0.16, 1.2) * 0.4, 0.3, 1.0)),
        0.006, 0.3)

    # Being hit yourself.
    out["player_hurt"] = d.fade(d.mix(
        call(240, 190, 0.36, 700, 0.3, 651) * 0.8,
        d.lowpass(d.noise(0.22, 652), 800) * d.env_exp(0.22, 0.001, 0.045, 1.9) * 0.6), 0.002, 0.14)
    out["player_death"] = d.fade(d.reverb(d.mix(
        call(220, 90, 1.1, 600, 0.35, 661) * 0.85,
        d.at(d.lowpass(d.noise(0.6, 662), 500) * d.env_exp(0.6, 0.02, 0.2, 1.1) * 0.4, 0.4, 1.3)),
        0.7, 0.3, 1.2), 0.006, 0.4)
    return out


# --------------------------------------------------------------------- build

def building() -> dict:
    out = {}
    dur = 0.55
    # Timber dropping into place: a knock, a settle, and a bit of grit.
    knock = np.zeros(int(d.SR * dur))
    for f, g in ((120.0, 1.0), (196.0, 0.6), (300.0, 0.3)):
        knock += d.sine(f, dur) * d.env_exp(dur, 0.001, 0.06 * g, 1.5) * g
    grit = d.lowpass(d.noise(dur, 701), 1600) * d.env_exp(dur, 0.001, 0.03, 2.2)
    settle = d.sine(np.linspace(90, 60, int(d.SR * 0.3)), 0.3) * d.env_exp(0.3, 0.004, 0.08, 1.4)
    out["build_place"] = d.fade(d.saturate(knock * 0.8 + grit * 0.5 +
                                           d.fit(settle, int(d.SR * dur)) * 0.4, 1.5), 0.001, 0.12)
    out["build_remove"] = d.fade(d.mix(
        d.bandpass(d.noise(0.4, 711), 800, 0.8) * d.env_exp(0.4, 0.004, 0.1, 1.3),
        d.sine(np.linspace(200, 90, int(d.SR * 0.4)), 0.4) * d.env_exp(0.4, 0.002, 0.06, 1.6) * 0.5),
        0.003, 0.12)
    out["build_cycle"] = d.fade(d.sine(np.linspace(700, 900, int(d.SR * 0.06)), 0.06) *
                                d.env_exp(0.06, 0.002, 0.02, 1.6) * 0.45, 0.002, 0.03)

    # A door on timber hinges.
    for name, f0, f1 in (("door_open", 260, 520), ("door_close", 520, 240)):
        dur = 0.75
        n = int(d.SR * dur)
        squeal = d.bandpass(d.noise(dur, 721), 1500, 6.0)
        wob = 0.5 + 0.5 * d.sine(np.linspace(11, 6, n), dur)
        squeal *= wob * d.env_adsr(dur, 0.05, 0.2, 0.55, 0.35) * 0.5
        pitchy = d.sine(np.linspace(f0, f1, n), dur) * 0.10 * d.env_adsr(dur, 0.06, 0.2, 0.6, 0.3)
        latch = d.mix(d.lowpass(d.noise(0.12, 722), 1400) * d.env_exp(0.12, 0.0008, 0.02, 2.4),
                      d.sine(np.linspace(180, 90, int(d.SR * 0.12)), 0.12) *
                      d.env_exp(0.12, 0.001, 0.02, 2.0) * 0.6)
        sig = d.mix(squeal, pitchy, d.at(latch * 0.8, 0.55, dur))
        out[name] = d.fade(sig, 0.006, 0.12)
    return out


# ------------------------------------------------------------------ ambience

def ambience() -> dict:
    out = {}
    rng = np.random.default_rng(801)

    # Daytime forest: wind through leaves, with birds.
    dur = 24.0
    n = int(d.SR * dur)
    wind = d.lowpass(d.pink(dur, 802), 900) * 0.55
    gust = 0.55 + 0.45 * d.lowpass(d.noise(dur, 803), 0.35)
    gust = gust / (np.max(np.abs(gust)) + 1e-9)
    wind *= 0.5 + 0.5 * np.abs(gust)
    leaves = d.bandpass(d.pink(dur, 804), 2600, 0.8) * 0.22
    leaves *= 0.5 + 0.5 * np.abs(d.lowpass(d.noise(dur, 805), 0.6) * 4)

    birds = np.zeros(n)
    for _ in range(46):
        start = rng.uniform(0.0, dur - 1.0)
        notes = int(rng.integers(2, 5))
        f = rng.uniform(2200, 4200)
        song = np.zeros(int(d.SR * 0.9))
        for k in range(notes):
            nd = rng.uniform(0.05, 0.11)
            sweep = np.linspace(f * rng.uniform(0.9, 1.15), f * rng.uniform(0.85, 1.3), int(d.SR * nd))
            note = d.sine(sweep, nd) * d.env_adsr(nd, 0.01, 0.02, 0.7, 0.03)
            note += d.sine(sweep * 2.0, nd) * 0.2 * d.env_adsr(nd, 0.01, 0.02, 0.7, 0.03)
            song += d.at(note, k * rng.uniform(0.1, 0.2), 0.9)
        birds += d.at(song * rng.uniform(0.15, 0.4), start, dur)

    day = wind + leaves + birds * 0.5
    out["amb_forest_day"] = d.loopable(day, 1.2)

    # Night: lower wind, crickets, the odd owl.
    dur = 24.0
    n = int(d.SR * dur)
    nwind = d.lowpass(d.pink(dur, 811), 480) * 0.6
    nwind *= 0.6 + 0.4 * np.abs(d.lowpass(d.noise(dur, 812), 0.3) * 5)

    # Crickets: a dense pulse train around 4.5 kHz.
    chirp_env = np.clip(np.sin(2 * np.pi * 22.0 * d.t(dur)) ** 8, 0, 1)
    crickets = d.bandpass(d.noise(dur, 813), 4600, 12.0) * chirp_env * 0.30
    crickets += d.bandpass(d.noise(dur, 814), 5300, 14.0) * \
        np.clip(np.sin(2 * np.pi * 19.0 * d.t(dur) + 1.1) ** 8, 0, 1) * 0.20

    owls = np.zeros(n)
    rng2 = np.random.default_rng(815)
    for _ in range(7):
        start = rng2.uniform(1.0, dur - 2.0)
        hoot = np.zeros(int(d.SR * 1.4))
        for k, off in enumerate((0.0, 0.42)):
            hd = 0.3
            f = rng2.uniform(360, 440) * (1.0 if k == 0 else 0.92)
            note = d.sine(np.linspace(f, f * 0.94, int(d.SR * hd)), hd)
            note += d.sine(np.linspace(f, f * 0.94, int(d.SR * hd)), hd) * 0.0
            note *= d.env_adsr(hd, 0.05, 0.08, 0.65, 0.15)
            note = d.lowpass(note, 900)
            hoot += d.at(note, off, 1.4)
        owls += d.at(hoot * rng2.uniform(0.2, 0.4), start, dur)

    night = nwind + crickets + owls * 0.6
    out["amb_forest_night"] = d.loopable(night, 1.2)

    # Wind on high ground, and water at the pond.
    dur = 16.0
    hw = d.lowpass(d.pink(dur, 821), 700)
    hw *= 0.4 + 0.6 * np.abs(d.lowpass(d.noise(dur, 822), 0.45) * 4)
    hw += d.bandpass(d.pink(dur, 823), 1800, 0.6) * 0.25
    out["amb_wind"] = d.loopable(hw * 0.8, 1.0)

    dur = 12.0
    lap = d.lowpass(d.pink(dur, 831), 1400) * 0.5
    lap *= 0.45 + 0.55 * np.abs(d.sine(0.4, dur) + 0.4 * d.sine(0.27, dur))
    trickle = d.bandpass(d.pink(dur, 832), 3200, 1.2) * 0.18
    out["amb_water"] = d.loopable(lap + trickle, 0.9)
    return out


# ----------------------------------------------------------------------- run

def main() -> None:
    groups = {}
    groups.update(footsteps())
    groups.update(movement())
    groups.update(axe_and_wood())
    groups.update(bow())
    groups.update(items())
    groups.update(ui())
    groups.update(fire())
    groups.update(animals())
    groups.update(building())
    groups.update(ambience())

    loops = {"fire_loop", "cook_sizzle", "amb_forest_day", "amb_forest_night",
             "amb_wind", "amb_water"}
    # A few want to sit deliberately below or above the common target.
    trims = {
        "ui_hover": -8.0, "ui_click": -3.0, "build_cycle": -6.0,
        "arrow_flight": -4.0, "tree_fall": +3.0, "player_death": +2.0,
        "winded": -5.0, "swing_light": -4.0,
    }

    os.makedirs(OUT, exist_ok=True)
    made = 0
    for name, sig in sorted(groups.items()):
        target = LOOP_DB if name in loops else ONESHOT_DB
        target += trims.get(name, 0.0)
        sig = d.to_rms(np.asarray(sig, dtype=np.float64), target)
        if name in loops:
            # Loops are long; Vorbis keeps the download sane.
            path = os.path.join(OUT, name + ".ogg")
            d.write_ogg(path, sig, FFMPEG, quality=4)
        else:
            path = os.path.join(OUT, name + ".wav")
            d.write_wav(path, sig)
        made += 1
        print("  %-22s %6.1f dB  %5.2fs" % (name, d.loudness(sig), len(sig) / d.SR))
    print("wrote %d sounds to %s" % (made, OUT))


if __name__ == "__main__":
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
    main()

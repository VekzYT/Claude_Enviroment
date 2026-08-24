"""Small DSP toolkit for generating the game's audio.

Everything the game plays is synthesised rather than sampled, so this module is
the instrument. It is deliberately plain numpy: oscillators, noise, filters,
envelopes and a reverb, with a `render` helper that normalises and writes.

Sample rate is 44.1 kHz throughout. Signals are float32 in roughly [-1, 1] and
are only converted to 16-bit on the way out.
"""

from __future__ import annotations

import math
import os
import struct
import subprocess
import wave

import numpy as np
from scipy.signal import lfilter

SR = 44100


# ----------------------------------------------------------------- utilities

def t(dur: float) -> np.ndarray:
    """A time axis in seconds."""
    return np.arange(int(SR * dur), dtype=np.float64) / SR


def silence(dur: float) -> np.ndarray:
    return np.zeros(int(SR * dur), dtype=np.float64)


def fit(a: np.ndarray, n: int) -> np.ndarray:
    """Pad or trim to exactly n samples."""
    if len(a) == n:
        return a
    if len(a) > n:
        return a[:n]
    return np.concatenate([a, np.zeros(n - len(a))])


def mix(*parts: np.ndarray) -> np.ndarray:
    """Sum signals of differing length, padding to the longest."""
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[: len(p)] += p
    return out


def at(signal: np.ndarray, start: float, total: float) -> np.ndarray:
    """Place a signal at `start` seconds inside a buffer of `total` seconds."""
    out = np.zeros(int(SR * total))
    i = int(SR * start)
    end = min(len(out), i + len(signal))
    if end > i:
        out[i:end] += signal[: end - i]
    return out


# --------------------------------------------------------------- oscillators

def sine(freq, dur: float, phase: float = 0.0) -> np.ndarray:
    x = t(dur)
    f = np.asarray(freq, dtype=np.float64)
    if f.ndim == 0:
        return np.sin(2 * np.pi * f * x + phase)
    f = fit(f, len(x))
    # Integrate frequency so a swept tone stays phase-continuous.
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def saw(freq, dur: float) -> np.ndarray:
    x = t(dur)
    f = np.asarray(freq, dtype=np.float64)
    if f.ndim == 0:
        ph = f * x
    else:
        ph = np.cumsum(fit(f, len(x))) / SR
    return 2.0 * (ph - np.floor(ph + 0.5))


def triangle(freq, dur: float) -> np.ndarray:
    return 2.0 * np.abs(saw(freq, dur)) - 1.0


def square(freq, dur: float, duty: float = 0.5) -> np.ndarray:
    x = t(dur)
    f = np.asarray(freq, dtype=np.float64)
    ph = (f * x if f.ndim == 0 else np.cumsum(fit(f, len(x))) / SR) % 1.0
    return np.where(ph < duty, 1.0, -1.0)


def noise(dur: float, seed: int = 0) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return rng.uniform(-1.0, 1.0, int(SR * dur))


def pink(dur: float, seed: int = 0) -> np.ndarray:
    """Pink-ish noise via a cascade of one-pole filters (Voss-McCartney style)."""
    w = noise(dur, seed)
    out = np.zeros_like(w)
    state = 0.0
    coeffs = [0.99765, 0.96300, 0.57000]
    gains = [0.0990460, 0.2965164, 1.0526913]
    b = [0.0, 0.0, 0.0]
    # Vectorised approximation: sum of three lowpassed copies.
    for c, g, i in zip(coeffs, gains, range(3)):
        b[i] = lowpass_one_pole(w, cutoff_from_coeff(c)) * g
    out = b[0] + b[1] + b[2] + w * 0.1848
    return out / (np.max(np.abs(out)) + 1e-9)


def cutoff_from_coeff(c: float) -> float:
    return max(20.0, -math.log(max(c, 1e-6)) * SR / (2 * math.pi))


def brown(dur: float, seed: int = 0) -> np.ndarray:
    w = noise(dur, seed)
    out = np.cumsum(w)
    out -= np.mean(out)
    return out / (np.max(np.abs(out)) + 1e-9)


# ------------------------------------------------------------------ filters

def lowpass_one_pole(x: np.ndarray, cutoff: float) -> np.ndarray:
    a = math.exp(-2.0 * math.pi * cutoff / SR)
    return lfilter([1.0 - a], [1.0, -a], x)


def _biquad(x: np.ndarray, b0, b1, b2, a1, a2) -> np.ndarray:
    return lfilter([b0, b1, b2], [1.0, a1, a2], x)


def lowpass(x: np.ndarray, freq: float, q: float = 0.707) -> np.ndarray:
    freq = max(20.0, min(freq, SR * 0.45))
    w = 2 * math.pi * freq / SR
    alpha = math.sin(w) / (2 * q)
    cosw = math.cos(w)
    a0 = 1 + alpha
    return _biquad(x, (1 - cosw) / 2 / a0, (1 - cosw) / a0, (1 - cosw) / 2 / a0,
                   -2 * cosw / a0, (1 - alpha) / a0)


def highpass(x: np.ndarray, freq: float, q: float = 0.707) -> np.ndarray:
    freq = max(20.0, min(freq, SR * 0.45))
    w = 2 * math.pi * freq / SR
    alpha = math.sin(w) / (2 * q)
    cosw = math.cos(w)
    a0 = 1 + alpha
    return _biquad(x, (1 + cosw) / 2 / a0, -(1 + cosw) / a0, (1 + cosw) / 2 / a0,
                   -2 * cosw / a0, (1 - alpha) / a0)


def bandpass(x: np.ndarray, freq: float, q: float = 2.0) -> np.ndarray:
    freq = max(20.0, min(freq, SR * 0.45))
    w = 2 * math.pi * freq / SR
    alpha = math.sin(w) / (2 * q)
    cosw = math.cos(w)
    a0 = 1 + alpha
    return _biquad(x, alpha / a0, 0.0, -alpha / a0, -2 * cosw / a0, (1 - alpha) / a0)


def peak(x: np.ndarray, freq: float, gain_db: float, q: float = 1.0) -> np.ndarray:
    A = 10 ** (gain_db / 40)
    w = 2 * math.pi * max(20.0, min(freq, SR * 0.45)) / SR
    alpha = math.sin(w) / (2 * q)
    cosw = math.cos(w)
    a0 = 1 + alpha / A
    return _biquad(x, (1 + alpha * A) / a0, -2 * cosw / a0, (1 - alpha * A) / a0,
                   -2 * cosw / a0, (1 - alpha / A) / a0)


# ---------------------------------------------------------------- envelopes

def env_exp(dur: float, attack: float = 0.002, decay: float = None,
            power: float = 1.0) -> np.ndarray:
    """Fast attack, exponential fall. The workhorse for impacts."""
    n = int(SR * dur)
    decay = dur if decay is None else decay
    a = max(1, int(SR * attack))
    out = np.ones(n)
    out[:a] = np.linspace(0.0, 1.0, a) ** 0.6
    fall = np.exp(-np.arange(n - a) / max(1.0, SR * decay * 0.35))
    out[a:] = fall ** power
    return out


def env_adsr(dur: float, a: float, d: float, s: float, r: float) -> np.ndarray:
    n = int(SR * dur)
    na, nd, nr = int(SR * a), int(SR * d), int(SR * r)
    ns = max(0, n - na - nd - nr)
    parts = [
        np.linspace(0, 1, max(1, na)),
        np.linspace(1, s, max(1, nd)),
        np.full(ns, s),
        np.linspace(s, 0, max(1, nr)),
    ]
    return fit(np.concatenate(parts), n)


def fade(x: np.ndarray, in_s: float = 0.005, out_s: float = 0.02) -> np.ndarray:
    out = x.copy()
    ni, no = int(SR * in_s), int(SR * out_s)
    if ni > 0:
        out[:ni] *= np.linspace(0, 1, ni)
    if no > 0:
        out[-no:] *= np.linspace(1, 0, no)
    return out


# ------------------------------------------------------------------ effects

def saturate(x: np.ndarray, drive: float = 2.0) -> np.ndarray:
    return np.tanh(x * drive) / math.tanh(drive)


def reverb(x: np.ndarray, room: float = 0.6, wet: float = 0.3,
           tail: float = 1.2) -> np.ndarray:
    """Schroeder reverb: four combs into two allpasses. Cheap and good enough
    to put a sound in a place rather than in a vacuum."""
    n = len(x) + int(SR * tail)
    src = fit(x, n)
    out = np.zeros(n)
    # A comb is just an IIR with a long delay, so it goes through lfilter
    # rather than a Python loop -- the difference is minutes against seconds.
    for delay_ms, g in ((29.7, 0.805), (37.1, 0.827), (41.1, 0.783), (43.7, 0.764)):
        d = int(SR * delay_ms / 1000.0)
        a = np.zeros(d + 1)
        a[0] = 1.0
        a[d] = -g * room
        out += lfilter([1.0], a, src) * 0.25
    for delay_ms, g in ((5.0, 0.7), (1.7, 0.7)):
        d = int(SR * delay_ms / 1000.0)
        b = np.zeros(d + 1)
        b[0] = -g
        b[d] = 1.0
        a = np.zeros(d + 1)
        a[0] = 1.0
        a[d] = -g
        out = lfilter(b, a, out)
    return fit(src * (1 - wet) + out * wet, n)


def echo(x: np.ndarray, delay: float, feedback: float = 0.35,
         mix_amt: float = 0.3, taps: int = 4) -> np.ndarray:
    n = len(x) + int(SR * delay * taps)
    out = fit(x, n).copy()
    d = int(SR * delay)
    g = feedback
    for k in range(1, taps + 1):
        shifted = np.zeros(n)
        src = fit(x, n)
        shifted[d * k:] = src[: n - d * k]
        out += shifted * (g ** k) * mix_amt
    return out


def stereo(left: np.ndarray, right: np.ndarray) -> np.ndarray:
    n = max(len(left), len(right))
    return np.stack([fit(left, n), fit(right, n)], axis=1)


def widen(x: np.ndarray, spread: float = 0.012) -> np.ndarray:
    """Turns a mono signal into a stereo pair with a small delay on one side."""
    d = int(SR * spread)
    r = np.concatenate([np.zeros(d), x])[: len(x)]
    return stereo(x, r * 0.92)


def loopable(x: np.ndarray, cross: float = 0.35) -> np.ndarray:
    """Crossfades the tail into the head so a loop has no seam."""
    n = int(SR * cross)
    if n * 2 >= len(x):
        return x
    head = x[:n]
    tail = x[-n:]
    ramp = np.linspace(0, 1, n)
    blended = tail * (1 - ramp) + head * ramp
    body = x[n:-n]
    return np.concatenate([blended, body])


# ------------------------------------------------------------------- output

def normalise(x: np.ndarray, peak_level: float = 0.89) -> np.ndarray:
    m = np.max(np.abs(x))
    if m < 1e-9:
        return x
    return x * (peak_level / m)


def loudness(x: np.ndarray) -> float:
    """Crude RMS in dBFS, used to level-match the whole set."""
    mono = x if x.ndim == 1 else x.mean(axis=1)
    r = math.sqrt(float(np.mean(mono.astype(np.float64) ** 2)) + 1e-12)
    return 20 * math.log10(r + 1e-12)


def to_rms(x: np.ndarray, target_db: float, ceiling: float = 0.95) -> np.ndarray:
    """Scale to a target RMS and keep it there.

    Simply turning the gain down when the peak is too high is what made the
    first pass of these sounds sit up to eight decibels apart: a transient-heavy
    sound like a boot on stone has a huge crest factor, so the peak guard pulled
    its whole body down while a smooth one like water kept its level. Peaks are
    softly rounded off instead, which is what a limiter is for, and the loudness
    is then trimmed back onto target.
    """
    cur = loudness(x)
    x = x * (10 ** ((target_db - cur) / 20))
    m = float(np.max(np.abs(x)))
    if m > ceiling:
        # Round the tops over rather than scaling the whole signal down.
        knee = ceiling * 0.75
        over = np.abs(x) > knee
        sign = np.sign(x)
        excess = (np.abs(x) - knee) / max(m - knee, 1e-9)
        x = np.where(over, sign * (knee + (ceiling - knee) * np.tanh(excess * 1.6)), x)
        # The rounding costs a little loudness; put it back.
        x = x * (10 ** ((target_db - loudness(x)) / 20))
        m = float(np.max(np.abs(x)))
        if m > 0.995:
            x = x * (0.995 / m)
    return x


def write_wav(path: str, x: np.ndarray) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = np.clip(x, -1.0, 1.0)
    channels = 1 if data.ndim == 1 else data.shape[1]
    pcm = (data * 32767.0).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(channels)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def write_ogg(path: str, x: np.ndarray, ffmpeg: str, quality: int = 5) -> None:
    """Vorbis, for anything long enough that a WAV would bloat the download."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp.wav"
    write_wav(tmp, x)
    subprocess.run(
        [ffmpeg, "-y", "-loglevel", "error", "-i", tmp,
         "-c:a", "libvorbis", "-q:a", str(quality), path],
        check=True,
    )
    os.remove(tmp)

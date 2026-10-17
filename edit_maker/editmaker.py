#!/usr/bin/env python3
"""Auto edit maker: turns car clips + a song into a beat-synced edit.

Usage:
    python3 editmaker.py clips1.mp4 [clips2.mp4 ...] -o edit.mp4
        [--music song.mp3] [--duration 20] [--aspect 16:9|9:16|1:1] [--seed 7]

What it does:
  1. Finds the beats in the music (spectral-flux onsets + dynamic-programming beat tracker).
  2. Picks the most energetic part of the song for the edit.
  3. Splits the clips into shots (scene-cut detection), drops black/boring frames,
     and picks the part of each shot with the most motion.
  4. Cuts every shot on a beat. Calm parts get longer shots + slow-mo,
     loud parts get fast cuts with zoom punches, shake, flashes and motion blur.
  5. Color grades everything (contrast, teal shadows, vignette, grain) and adds the music.

Only needs ffmpeg + numpy.
"""
import argparse
import json
import os
import random
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor

import numpy as np

FPS = 30
SR = 22050
HOP = 512


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kw)


def probe(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height",
               "-of", "json", path]).stdout
    info = json.loads(out)
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    has_audio = any(s["codec_type"] == "audio" for s in info["streams"])
    return float(info["format"]["duration"]), (v["width"], v["height"]) if v else None, has_audio


# ---------------------------------------------------------------- music

def load_audio(path):
    raw = run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]).stdout
    return np.frombuffer(raw, dtype=np.float32)


def onset_envelope(y):
    n_fft = 2048
    win = np.hanning(n_fft).astype(np.float32)
    n = 1 + max(0, (len(y) - n_fft) // HOP)
    frames = np.lib.stride_tricks.as_strided(y, shape=(n, n_fft), strides=(y.strides[0] * HOP, y.strides[0]))
    mag = np.log1p(100 * np.abs(np.fft.rfft(frames * win, axis=1)))
    flux = np.maximum(0, np.diff(mag, axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    flux -= np.convolve(flux, np.ones(16) / 16, mode="same")  # remove slow trend
    flux = np.maximum(flux, 0)
    rms = np.sqrt((frames ** 2).mean(axis=1))
    return flux / (flux.std() + 1e-9), rms


def estimate_period(env):
    fr = SR / HOP
    ac = np.correlate(env - env.mean(), env - env.mean(), mode="full")[len(env) - 1:]
    lags = np.arange(len(ac))
    bpm = 60 * fr / np.maximum(lags, 1)
    weight = np.exp(-0.5 * (np.log2(bpm / 120) / 0.9) ** 2)
    ac = ac * weight
    ac[(bpm < 70) | (bpm > 180)] = 0
    return int(np.argmax(ac))


def track_beats(env, period, tightness=100):
    n = len(env)
    score = env.copy()
    back = -np.ones(n, dtype=int)
    for i in range(n):
        lo, hi = i - 2 * period, i - period // 2
        if hi <= 0:
            continue
        j = np.arange(max(0, lo), hi)
        cand = score[j] - tightness * np.log((i - j) / period) ** 2
        k = int(np.argmax(cand))
        score[i] = env[i] + cand[k]
        back[i] = j[k]
    i = int(np.argmax(score[-2 * period:])) + n - 2 * period
    beats = []
    while i >= 0:
        beats.append(i)
        i = back[i]
    return np.array(beats[::-1])


def analyze_music(path):
    y = load_audio(path)
    env, rms = onset_envelope(y)
    period = estimate_period(env)
    beats = track_beats(env, period)
    fr = SR / HOP
    times = beats / fr
    # energy of each beat: loudness + onset strength around it
    strength = np.array([rms[max(0, b - 2):b + period].mean() for b in beats])
    hits = np.array([env[max(0, b - 2):b + 3].max() for b in beats])
    return dict(times=times, strength=strength, hits=hits, bpm=60 * fr / period, length=len(y) / SR)


def pick_window(music, duration):
    t, s = music["times"], music["strength"]
    best, best_i = -1, 0
    for i in range(len(t)):
        j = np.searchsorted(t, t[i] + duration)
        if j >= len(t):
            break
        seg = s[i:j]
        # favour loud windows that also get louder (build -> drop)
        val = seg.mean() + 0.5 * (seg[len(seg) // 2:].mean() - seg[:len(seg) // 2].mean())
        if val > best:
            best, best_i = val, i
    return best_i


# ---------------------------------------------------------------- clips

def detect_content_crop(path, dur):
    out = run(["ffmpeg", "-ss", str(dur * 0.3), "-t", str(min(20, dur * 0.5)), "-i", path,
               "-vf", "cropdetect=24:2:0", "-an", "-f", "null", "-"]).stderr.decode()
    crops = [l.split("crop=")[-1].strip() for l in out.splitlines() if "crop=" in l]
    if not crops:
        return None
    w, h, x, y = map(int, max(set(crops), key=crops.count).split(":"))
    return w, h, x, y


def analyze_clip(path):
    dur, (W, H), _ = probe(path)
    crop = detect_content_crop(path, dur) or (W, H, 0, 0)
    cw, ch, cx, cy = crop
    s, afps = 48, 10
    raw = run(["ffmpeg", "-v", "error", "-i", path, "-vf",
               f"crop={cw}:{ch}:{cx}:{cy},fps={afps},scale={s}:{s}", "-an", "-f", "rawvideo",
               "-pix_fmt", "rgb24", "-"]).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, s, s, 3).astype(np.float32)
    luma = fr.mean(axis=(1, 2, 3))
    diff = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2, 3))
    diff = np.concatenate([[0], diff])
    # scene cuts: big spikes compared to the neighbourhood
    cuts = [0]
    for i in range(1, len(diff)):
        local = np.median(diff[max(0, i - 5):i + 6])
        if diff[i] > 25 and diff[i] > 2.5 * local and i - cuts[-1] >= 3:
            cuts.append(i)
    cuts.append(len(diff))
    shots = []
    for a, b in zip(cuts[:-1], cuts[1:]):
        a2, b2 = a + 2, b - 1  # stay away from the cut + transitions
        if (b2 - a2) / afps < 0.5:
            continue
        seg_l = luma[a2:b2]
        if seg_l.mean() < 30:  # black / too dark
            continue
        motion = diff[a2 + 1:b2]
        shots.append(dict(path=path, start=a2 / afps, end=b2 / afps, crop=crop,
                          motion=motion.copy(), afps=afps, score=float(np.median(motion)) if len(motion) else 0))
    return shots


def best_subclip(shot, need):
    """start time inside shot with the most motion for a window of `need` seconds."""
    span = shot["end"] - shot["start"]
    if need >= span:
        return shot["start"]
    m, af = shot["motion"], shot["afps"]
    k = max(1, int(need * af))
    if len(m) <= k:
        return shot["start"] + (span - need) / 2
    c = np.convolve(m, np.ones(k), mode="valid")
    c = c * (1 - 0.3 * np.array(shot.get("used_mask", np.zeros(len(c))))[:len(c)])
    i = int(np.argmax(c))
    return min(shot["start"] + i / af, shot["end"] - need)


# ---------------------------------------------------------------- edit plan

def make_plan(music, start_i, duration, shots, rng):
    t, st = music["times"], music["strength"]
    end_t = t[start_i] + duration
    j_end = int(np.searchsorted(t, end_t))
    # energy ranked inside the chosen window, so every edit gets calm + hype parts
    win = st[start_i:j_end + 1]
    rank = np.zeros(len(st))
    rank[start_i:j_end + 1] = np.argsort(np.argsort(win)) / max(1, len(win) - 1)
    beat = float(np.median(np.diff(t)))
    per_beat = max(1, round(0.6 / beat))  # beats per "pulse" (~0.5-0.7s, like the example edit)
    intro_end = t[start_i] + duration * 0.15
    outro_start = end_t - beat * per_beat * 4

    cuts = []
    i = start_i
    while i < len(t) - 1 and t[i] < end_t - 0.2:
        e = rank[i]
        bar_pos = (i - start_i) % (4 * per_beat)
        if t[i] < intro_end:
            step, mode = 4 * per_beat, "intro"
        elif t[i] >= outro_start:
            step, mode = 8 * per_beat, "outro"
        elif e > 0.85 and rng.random() < 0.3:
            # stutter: two quick cuts inside one pulse
            half = (t[min(i + per_beat, len(t) - 1)] - t[i]) / 2
            cuts += [(t[i], t[i] + half, e, "stutter", True), (t[i] + half, t[i] + 2 * half, e, "stutter", False)]
            i += per_beat
            continue
        elif e > 0.6:
            step, mode = per_beat, "hype"
        else:
            step, mode = 2 * per_beat, "mid"
        j = min(i + step, len(t) - 1)
        cuts.append((t[i], min(t[j], end_t), e, mode, bar_pos == 0))
        i = j

    pool = sorted(shots, key=lambda s: s["score"])
    calm, wild = pool[:len(pool) // 2], pool[len(pool) // 2:]
    rng.shuffle(calm)
    rng.shuffle(wild)
    plan, last = [], None
    for a, b, e, mode, downbeat in cuts:
        src = (calm if mode in ("intro", "outro", "mid") else wild) or calm or wild
        length = b - a
        fx = pick_effects(mode, downbeat, rng)
        # next shot in the queue that is long enough (falls back to the next one)
        k = next((k for k, c in enumerate(src) if c is not last and c["end"] - c["start"] >= length * fx["speed"]),
                 next((k for k, c in enumerate(src) if c is not last), 0))
        s = src.pop(k)
        src.append(s)
        last = s
        avail = s["end"] - s["start"]
        if length * fx["speed"] > avail:
            fx["speed"] = round(max(0.5, avail / length), 2)
        ss = best_subclip(s, length * fx["speed"])
        plan.append(dict(shot=s, src_start=ss, length=length, energy=e, fx=fx))
    return plan


def pick_effects(mode, downbeat, rng):
    fx = dict(speed=1.0, zoom="none", shake=0, flash=False, blur=False)
    if mode in ("intro", "outro"):
        fx.update(speed=0.5, zoom="push" if mode == "intro" else "pull")  # smooth slow-mo (60fps source)
    elif mode == "mid":
        fx.update(speed=rng.choice([0.6, 0.8, 1.0]), zoom=rng.choice(["push", "pull", "punch"]),
                  shake=rng.choice([0, 0, 5]), flash=downbeat and rng.random() < 0.5)
    elif mode == "hype":
        fx.update(speed=rng.choice([1.0, 1.0, 1.25]), zoom=rng.choice(["punch", "punch", "pull"]),
                  shake=rng.choice([6, 10, 14]), flash=downbeat, blur=True)
    else:  # stutter
        fx.update(zoom="punch", shake=12, flash=downbeat, blur=True)
    return fx


# ---------------------------------------------------------------- render

def out_size(aspect):
    return {"16:9": (1920, 1080), "9:16": (1080, 1920), "1:1": (1080, 1080)}[aspect]


def grade_filter():
    return ("eq=contrast=1.12:saturation=1.15:brightness=-0.01:gamma=0.97,"
            "colorbalance=rs=-0.04:bs=0.06:rh=0.05:bh=-0.03,"
            "vignette=PI/6,noise=alls=4:allf=t")


def segment_filter(seg, W, H, rng):
    s, fx = seg["shot"], seg["fx"]
    cw, ch, cx, cy = s["crop"]
    n = max(1, round(seg["length"] * FPS))
    f = [f"crop={cw}:{ch}:{cx}:{cy}"]
    # fill the output aspect from the content (centre crop)
    target = W / H
    if cw / ch > target:
        nw = int(ch * target) // 2 * 2
        f.append(f"crop={nw}:{ch}:(iw-{nw})/2:0")
    else:
        nh = int(cw / target) // 2 * 2
        f.append(f"crop={cw}:{nh}:0:(ih-{nh})/2")
    if fx["blur"]:
        f.append("tmix=frames=3:weights='1 2 1'")
    f.append(f"setpts=PTS/{fx['speed']}")
    f.append(f"fps={FPS}")
    # zoom / shake via zoompan on an upscaled frame (upscaling avoids zoompan jitter)
    UW, UH = W * 3 // 2 // 2 * 2, H * 3 // 2 // 2 * 2
    f.append(f"scale={UW}:{UH}:flags=bicubic")
    N = n
    if fx["zoom"] == "punch":
        z = "1.06+0.28*exp(-on/4)"
    elif fx["zoom"] == "pull":
        z = f"1.06+0.18*(on/{N})"
    elif fx["zoom"] == "push":
        z = f"1.12-0.08*(on/{N})"
    else:
        z = "1.06"
    a = fx["shake"] * 2
    ph = rng.uniform(0, 6)
    sx = f"+{a}*sin(on*2.3+{ph:.2f})*exp(-on/8)" if a else ""
    sy = f"+{a}*cos(on*3.1+{ph:.2f})*exp(-on/8)" if a else ""
    f.append(f"zoompan=z='{z}':x='iw/2-iw/zoom/2{sx}':y='ih/2-ih/zoom/2{sy}':d=1:s={W}x{H}:fps={FPS}")
    f.append(grade_filter())
    if fx["flash"]:
        f.append("fade=in:st=0:d=0.12:color=white")
    f.append("format=yuv420p")
    return ",".join(f), n


def render(plan, music_path, music_start, out, aspect, tmp, rng):
    W, H = out_size(aspect)
    jobs = []
    for k, seg in enumerate(plan):
        vf, n = segment_filter(seg, W, H, rng)
        p = os.path.join(tmp, f"seg{k:03d}.mp4")
        src_len = seg["length"] * seg["fx"]["speed"] + 0.3
        jobs.append((p, ["ffmpeg", "-y", "-v", "error", "-ss", f"{seg['src_start']:.3f}", "-t", f"{src_len:.3f}",
                         "-i", seg["shot"]["path"], "-vf", vf, "-frames:v", str(n), "-an",
                         "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", p]))
        fx = seg["fx"]
        print(f"  cut {k + 1:>2}  {seg['length']:.2f}s  zoom={fx['zoom']:<5} speed={fx['speed']:<4} "
              f"shake={fx['shake']:<2} flash={'yes' if fx['flash'] else 'no'}")
    print("rendering...", flush=True)
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 2) as ex:
        list(ex.map(lambda j: run(j[1]), jobs))
    parts = [p for p, _ in jobs]
    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as fh:
        fh.writelines(f"file '{p}'\n" for p in parts)
    total = sum(round(s["length"] * FPS) for s in plan) / FPS
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst,
         "-ss", f"{music_start:.3f}", "-t", f"{total:.3f}", "-i", music_path,
         "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
         "-af", f"afade=t=in:d=0.05,afade=t=out:st={max(0, total - 1.2):.3f}:d=1.2",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out])
    return total


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clips", nargs="+", help="video files (or folders of videos) with the car footage")
    ap.add_argument("-o", "--output", default="edit.mp4")
    ap.add_argument("--music", help="song to cut to (default: audio of the first clip)")
    ap.add_argument("--music-start", type=float, help="where in the song to start (default: auto-pick the hype part)")
    ap.add_argument("--duration", type=float, default=20, help="edit length in seconds")
    ap.add_argument("--aspect", default="16:9", choices=["16:9", "9:16", "1:1"])
    ap.add_argument("--seed", type=int, default=None, help="same seed = same edit; change it for a new variation")
    args = ap.parse_args()

    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            sys.exit(f"{tool} not found, install ffmpeg first")
    rng = random.Random(args.seed)

    files = []
    for c in args.clips:
        if os.path.isdir(c):
            files += sorted(os.path.join(c, f) for f in os.listdir(c)
                            if f.lower().endswith((".mp4", ".mov", ".mkv", ".webm", ".m4v")))
        else:
            files.append(c)
    music_path = args.music or files[0]

    print(f"analyzing music: {music_path}")
    music = analyze_music(music_path)
    print(f"  tempo ~{music['bpm']:.0f} BPM, {len(music['times'])} beats")
    if args.music_start is not None:
        start_i = int(np.searchsorted(music["times"], args.music_start))
    else:
        start_i = pick_window(music, args.duration)
    music_start = music["times"][start_i]
    print(f"  using music from {music_start:.2f}s")

    shots = []
    for f in files:
        print(f"analyzing clips: {f}")
        s = analyze_clip(f)
        print(f"  found {len(s)} usable shots")
        shots += s
    if not shots:
        sys.exit("no usable shots found")

    plan = make_plan(music, start_i, args.duration, shots, rng)
    print(f"edit plan: {len(plan)} cuts")
    with tempfile.TemporaryDirectory() as tmp:
        total = render(plan, music_path, music_start, args.output, args.aspect, tmp, rng)
    print(f"done: {args.output} ({total:.1f}s)")


if __name__ == "__main__":
    main()

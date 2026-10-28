"""Voice samples for choosing GAMERULE's narrator: episode 1's cold open read by free, locally run voices.

Run from the repo root:
    channel/voice/.venv/bin/python channel/voice/sample.py kokoro am_michael
    channel/voice/.venv/bin/python channel/voice/sample.py turbo
    channel/voice/.venv/bin/python channel/voice/sample.py turbo --ref channel/voice/out/kokoro-am_michael.wav

Each beat is generated on its own and the beats are joined with a fixed gap, the genre's quick rhythm.
Writes channel/voice/out/<engine>-<voice>.wav and .mp3.
"""
import argparse
import pathlib
import subprocess

import numpy as np
import soundfile as sf
import torch

OUT = pathlib.Path(__file__).resolve().parent / 'out'
SR = 24000
GAP = 0.42  # seconds of silence between beats

# The cold open, the title line, and one "That's real." science beat (episodes/01-mine-anything/script.md).
BEATS = [
    "Monday. Your alarm won't shut up. Hit it. Mine.",
    "Missed the bus? Don't go around the school. Go through it. Mine. Mine.",
    "Someone parked on your bike. Mine.",
    "What if you could mine anything?",
    "A stack of sixty-four? A hundred and seventy-three tonnes. As heavy as a blue whale. That's real.",
]


def kokoro_beats(voice, speed):
    from kokoro import KPipeline
    pipeline = KPipeline(lang_code='b' if voice.startswith('b') else 'a')
    for text in BEATS:
        parts = [np.asarray(r.audio, dtype=np.float32) for r in pipeline(text, voice=voice, speed=speed)]
        yield np.concatenate(parts)


def turbo_beats(ref):
    from chatterbox.tts_turbo import ChatterboxTurboTTS
    model = ChatterboxTurboTTS.from_pretrained(device='cpu')
    if ref:
        model.prepare_conditionals(ref)
    elif model.conds is None:
        raise SystemExit('Chatterbox Turbo has no built-in voice here: pass --ref <a clean 10-20 s voice clip>.')
    assert model.sr == SR, model.sr
    for text in BEATS:
        yield model.generate(text, temperature=0.7).squeeze(0).numpy().astype(np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('engine', choices=['kokoro', 'turbo'])
    ap.add_argument('voice', nargs='?', default='builtin', help='kokoro voice id, e.g. am_michael, af_heart')
    ap.add_argument('--ref', help='turbo: a voice clip to clone')
    ap.add_argument('--speed', type=float, default=1.0, help='kokoro: speaking rate')
    a = ap.parse_args()

    torch.set_num_threads(4)
    beats = kokoro_beats(a.voice, a.speed) if a.engine == 'kokoro' else turbo_beats(a.ref)
    name = a.voice if a.engine == 'kokoro' else ('clone-' + pathlib.Path(a.ref).stem if a.ref else 'builtin')

    gap = np.zeros(int(GAP * SR), dtype=np.float32)
    audio = []
    for i, beat in enumerate(beats):
        audio += [beat, gap] if i < len(BEATS) - 1 else [beat]
    audio = np.concatenate(audio)
    audio *= 0.89 / max(1e-6, float(np.abs(audio).max()))  # peaks at about -1 dBFS

    OUT.mkdir(exist_ok=True)
    wav = OUT / f'{a.engine}-{name}.wav'
    sf.write(wav, audio, SR)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(wav), '-b:a', '160k', str(wav.with_suffix('.mp3'))], check=True)
    print(f'{wav.with_suffix(".mp3")}  {len(audio) / SR:.1f} s')


if __name__ == '__main__':
    main()

"""Put the voice samples side by side for a quick listen: one MP3 that announces and plays each in turn, and an
HTML page with a player per sample.

Run from the repo root after sample.py:
    channel/voice/.venv/bin/python channel/voice/compare.py
Writes channel/voice/out/voices-ABCD.mp3 and channel/voice/out/voices.html.
"""
import base64
import html
import pathlib
import subprocess

import numpy as np
import soundfile as sf

OUT = pathlib.Path(__file__).resolve().parent / 'out'
SR = 24000
SAMPLES = [
    ('A', 'kokoro-am_michael', 'Kokoro, male'),
    ('B', 'kokoro-af_heart', 'Kokoro, female'),
    ('C', 'turbo-builtin', 'Chatterbox Turbo, built-in voice'),
    ('D', 'turbo-clone-kokoro-am_michael', 'Chatterbox Turbo, copying A with more energy'),
]


def announcer():
    from kokoro import KPipeline
    pipeline = KPipeline(lang_code='b')  # a British voice, so the announcer doesn't sound like any sample
    return lambda text: np.concatenate([np.asarray(r.audio, dtype=np.float32) for r in pipeline(text, voice='bm_george')])


def main():
    say = announcer()
    silence = lambda s: np.zeros(int(s * SR), dtype=np.float32)
    parts = []
    for letter, name, _ in SAMPLES:
        audio, sr = sf.read(OUT / f'{name}.wav', dtype='float32')
        assert sr == SR, sr
        label = say(f'Voice {letter}.')
        parts += [0.6 * label / max(1e-6, float(np.abs(label).max())), silence(0.5), audio, silence(1.3)]
    combined = OUT / 'voices-ABCD.wav'
    sf.write(combined, np.concatenate(parts), SR)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(combined), '-b:a', '128k', str(combined.with_suffix('.mp3'))], check=True)
    combined.unlink()

    rows = ''.join(
        f'<div class="row"><div class="letter">{letter}</div><div class="body"><div class="name">{html.escape(desc)}</div>'
        f'<audio controls preload="auto" src="data:audio/mpeg;base64,'
        f'{base64.b64encode((OUT / f"{name}.mp3").read_bytes()).decode()}"></audio></div></div>'
        for letter, name, desc in SAMPLES)
    page = f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>GAMERULE voices</title><style>
body{{margin:0;padding:24px 16px;background:#1E1530;color:#F4F1EA;font:16px/1.4 system-ui,sans-serif}}
h1{{font-size:22px;margin:0 0 4px}} p{{margin:0 0 20px;color:#CFC6DD}}
.row{{display:flex;gap:14px;align-items:center;background:#2B1F3F;border-radius:12px;padding:14px;margin-bottom:12px}}
.letter{{font-size:34px;font-weight:800;color:#8BE04E;width:40px;text-align:center}}
.body{{flex:1;min-width:0}} .name{{margin-bottom:8px}} audio{{width:100%}}
</style></head><body><h1>Pick GAMERULE's voice</h1><p>Episode 1's opening, read four ways. Reply with A, B, C or D.</p>
{rows}</body></html>'''
    (OUT / 'voices.html').write_text(page, encoding='utf-8')
    print(combined.with_suffix('.mp3'), OUT / 'voices.html')


if __name__ == '__main__':
    main()

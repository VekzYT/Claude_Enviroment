"""Transcribe an episode's voice track with Whisper and score it against the episode's script, so a mumbled number or
a dropped word is caught before the render. Prints what Whisper heard and every word it missed.

Run from the repo root:
    channel/voice/.venv/bin/python channel/voice/transcribe.py <slug>
"""
import json
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

from faster_whisper import WhisperModel

STUDIO = Path(__file__).resolve().parent.parent / 'studio'
NUMBERS = {'173': 'a hundred and seventy three', '2.7': 'two point seven', '64': 'sixty four'}


def words(text):
    for digits, spelled in NUMBERS.items():
        text = text.replace(digits, spelled)
    return re.findall(r"[a-z']+", text.lower().replace('-', ' '))


def main():
    slug = sys.argv[1]
    ep = json.loads((STUDIO / 'src' / 'episodes' / slug / 'episode.json').read_text(encoding='utf-8'))
    expected = words(' '.join(b['text'] for b in ep['script']))
    model = WhisperModel('base.en', device='cpu', compute_type='int8')
    segments, _ = model.transcribe(str(STUDIO / 'public' / slug / 'voice.wav'), beam_size=5)
    text = ' '.join(s.text.strip() for s in segments)
    heard = words(text)
    sm = SequenceMatcher(a=expected, b=heard, autojunk=False)
    print(text)
    print(f'\nword match: {sm.ratio() * 100:.0f}%')
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op != 'equal':
            print(f'  {op}: expected "{" ".join(expected[a0:a1])}", heard "{" ".join(heard[b0:b1])}"')


if __name__ == '__main__':
    main()

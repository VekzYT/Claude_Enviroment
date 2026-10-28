"""Transcribe voice files with Whisper and score them against the sample script, so a bad take is caught before
anyone listens to it. The same word timings will drive the edit when a free voice narrates an episode.

Run from the repo root:
    channel/voice/.venv/bin/python channel/voice/check.py channel/voice/out/*.mp3
"""
import re
import sys
from difflib import SequenceMatcher

from faster_whisper import WhisperModel

sys.path.insert(0, __import__('os').path.dirname(__file__))
from sample import BEATS  # noqa: E402

NUMBERS = {'173': 'a hundred and seventy-three', '64': 'sixty-four'}


def words(text):
    for digits, spelled in NUMBERS.items():
        text = text.replace(digits, spelled)
    return re.findall(r"[a-z']+", text.lower().replace('-', ' '))


def main():
    model = WhisperModel('base.en', device='cpu', compute_type='int8')
    expected = words(' '.join(BEATS))
    for path in sys.argv[1:]:
        segments, _ = model.transcribe(path, word_timestamps=True, beam_size=5)
        heard = ' '.join(s.text.strip() for s in segments)
        score = SequenceMatcher(None, expected, words(heard)).ratio()
        print(f'{score:5.0%}  {path}\n       "{heard}"')


if __name__ == '__main__':
    main()

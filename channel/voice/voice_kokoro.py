"""Step 2 with GAMERULE's free narrator: Kokoro (Apache 2.0) instead of ElevenLabs. Writes the same files as the
skill's voice.py, so plan.py and everything after it work unchanged.

Run from the repo root:
    channel/voice/.venv/bin/python channel/voice/voice_kokoro.py <slug>
Reads  channel/studio/src/episodes/<slug>/episode.json:
       "script"  beats, as voice.py; a beat may add "pause_after" (seconds of silence before the next beat, for a
                 silent reaction shot; default 0.45)
       "gaps"    {"sentence": 0.3, "question": 0.45, "pairs": {"it|Mine": 0.6}}: the pause between two sentences
                 of a beat, set exactly (longer or shorter than the voice would take), keyed like voice.py's pairs
       "kokoro"  {"voice": "am_michael", "speed": 1.0}; am_michael is the voice picked on 29 Oct 2026
Writes public/<slug>/voice.wav, src/episodes/<slug>/words.json and out/<slug>/words_raw.json (the per-sentence
       takes before joining). Each sentence is voiced on its own and the pauses are built, not cut, so a power beat
       ("Hit it. ... Mine.") gets exactly the room its animation needs. No API, no credits.
"""
import os
import pathlib
import re
import sys

import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
STUDIO = HERE.parent / 'studio'
os.chdir(STUDIO)  # wi.py works out every path from the studio folder
sys.path.insert(0, str(HERE.parent / '.claude' / 'skills' / 'what-if-animation' / 'scripts'))
from wi import SR, ep_dir, load_episode, out_dir, pub_dir, save_json, write_wav  # noqa: E402

KOKORO_SR = 24000
LEAD, TRAIL = 0.03, 0.08  # seconds kept before the first word and after the last word of each sentence


def sentences(text):
    return [s for s in re.split(r'(?<=[.?!])\s+', text.strip()) if s]


def bare(w):
    return re.sub(r'[^\w]', '', w)


class Voice:
    def __init__(self, voice, speed):
        from kokoro import KPipeline
        self.pipeline = KPipeline(lang_code='b' if voice.startswith('b') else 'a')
        self.voice, self.speed = voice, speed

    def say(self, text):
        """One sentence: audio at the studio's rate, trimmed to its words, plus the words in voice.py's shape
        ({"w", "s", "e", "p"}, times from the start of the trimmed audio, punctuation after each word in p).
        spaCy splits contractions ("wo" + "n't") and hyphens; contractions join back into one word, hyphens stay
        punctuation, as voice.py reads ElevenLabs' character timings."""
        chunks, words, offset = [], [], 0.0
        for r in self.pipeline(text, voice=self.voice, speed=self.speed):
            audio = np.asarray(r.audio, dtype=np.float32)
            prev_word, prev_space = False, ' '
            for t in r.tokens or []:
                is_word = bool(re.search(r'\w', t.text))
                if is_word and words and prev_word and prev_space == '':
                    words[-1]['w'] += t.text
                    if t.end_ts is not None:
                        words[-1]['e'] = offset + t.end_ts
                elif is_word:
                    s = offset + t.start_ts if t.start_ts is not None else (words[-1]['e'] if words else offset)
                    words.append({'w': t.text, 's': s, 'e': offset + t.end_ts if t.end_ts is not None else s, 'p': ''})
                elif words:
                    words[-1]['p'] += t.text
                prev_word, prev_space = is_word, t.whitespace
            chunks.append(audio)
            offset += len(audio) / KOKORO_SR
        audio = np.concatenate(chunks)
        a = max(0.0, words[0]['s'] - LEAD)
        b = min(len(audio) / KOKORO_SR, words[-1]['e'] + TRAIL)
        clip = audio[int(a * KOKORO_SR):int(b * KOKORO_SR)]
        # resample 24 kHz -> the studio's 44.1 kHz (linear is plenty for a voice track at this ratio)
        n = int(round(len(clip) * SR / KOKORO_SR))
        clip = np.interp(np.linspace(0, len(clip) - 1, n), np.arange(len(clip)), clip).astype(np.float64)
        for w in words:
            w['s'], w['e'] = w['s'] - a, w['e'] - a
        fade = int(0.004 * SR)
        clip[:fade] *= np.linspace(0, 1, fade)
        clip[-fade:] *= np.linspace(1, 0, fade)
        return clip, words


def main():
    slug = sys.argv[1]
    ep = load_episode(slug)
    K = {'voice': 'am_michael', 'speed': 1.0}
    K.update(ep.get('kokoro', {}))
    G = {'sentence': 0.3, 'question': 0.45, 'pairs': {}}
    G.update(ep.get('gaps', {}))
    voice = Voice(K['voice'], K['speed'])

    track, words, takes, t = [], [], [], 0.0
    beats = ep['script']
    for bi, beat in enumerate(beats):
        lines = sentences(beat['text'])
        for li, line in enumerate(lines):
            clip, ws = voice.say(line)
            takes.append({'beat': bi, 'line': line, 'words': ws})
            track.append(clip)
            words += [{**w, 's': round(t + w['s'], 3), 'e': round(t + w['e'], 3)} for w in ws]
            t += len(clip) / SR
            if li < len(lines) - 1:
                nxt = sentences(lines[li + 1])[0].split()[0]
                key = bare(ws[-1]['w']) + '|' + bare(nxt)
                pause = G['pairs'].get(key, G['question'] if line.rstrip().endswith(('?', '!')) else G['sentence'])
            elif bi < len(beats) - 1:
                pause = beat.get('pause_after', 0.45)
            else:
                pause = beat.get('pause_after', 0.0)
            track.append(np.zeros(int(pause * SR)))
            t += pause

    y = np.concatenate(track)
    write_wav(pub_dir(slug) / 'voice.wav', y, peak=0.89)
    save_json(ep_dir(slug) / 'words.json', words)
    save_json(out_dir(slug) / 'words_raw.json', takes)
    print(f'Kokoro {K["voice"]}: {len(words)} words in {len(takes)} lines, {len(y) / SR:.2f} s')
    print(' '.join(f"{w['w']}@{w['s']}" for w in words))


if __name__ == '__main__':
    main()

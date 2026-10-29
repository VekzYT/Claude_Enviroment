"""Step 8: the master. Renders the episode, then brings the mix to -14 LUFS with true peaks under -1 dBTP (glued with a
compressor and a limiter, then a plain gain; video copied untouched), measures the result and writes the report.

python <skill>/scripts/master.py <slug> [--skip-render] [--concurrency 6]
Writes out/<slug>/<slug>-raw.mp4, out/<slug>/<slug>-final.mp4 and out/<slug>/report.json
"""
import json, re, subprocess, sys, time

from wi import STUDIO, ep_dir, load_episode, load_json, loudness, out_dir, save_json

slug = sys.argv[1]
args = sys.argv[2:]
conc = args[args.index('--concurrency') + 1] if '--concurrency' in args else None
ep = load_episode(slug)
od = out_dir(slug)
raw = od / f'{slug}-raw.mp4'
final = od / f'{slug}-final.mp4'
npx = 'npx.cmd' if sys.platform == 'win32' else 'npx'

if '--skip-render' not in args:
    t0 = time.time()
    cmd = [npx, 'remotion', 'render', 'src/index.ts', ep['id'], str(raw), '--log', 'error']
    if conc:
        cmd += ['--concurrency', conc]
    print(' '.join(cmd))
    subprocess.run(cmd, cwd=STUDIO, check=True)
    print(f'rendered in {time.time() - t0:.0f} s')

I, TP, LRA = -14.0, -1.5, 11


def measure(pre=''):
    af = (pre + ',' if pre else '') + f'loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json'
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(raw), '-af', af, '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='ignore').stderr
    return json.loads(err[err.rfind('{'):err.rfind('}') + 1])


# GAMERULE: speech with hits on top has a crest (true peak about 20 dB over the loudness) that a linear pass can't fit
# under -1.5 dBTP at -14 LUFS: loudnorm fell back to its dynamic mode and landed at -14.9. So glue the mix first, a
# gentle compressor and then a limiter, with the makeup found by bisection to land near -14.4, and finish with a plain
# gain up to -14 as far as the true peak allows.
g = -13.0 - float(measure()['input_i'])
glue = lambda mk: f'volume={g:.2f}dB,acompressor=threshold=0.18:ratio=3:attack=6:release=140:knee=4:makeup={mk:.3f},alimiter=limit=0.57:attack=3:release=80:level=false'  # noqa: E731
lo, hi = 1.0, 3.0
for _ in range(7):
    mk = (lo + hi) / 2
    if float(measure(glue(mk))['input_i']) < I - 0.4:
        lo = mk
    else:
        hi = mk
m = measure(glue(mk))
gain = min(I - float(m['input_i']), TP - 0.2 - float(m['input_tp']))
filt = f'{glue(mk)},volume={gain:.2f}dB'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-c:v', 'copy', '-af', filt, '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', str(final)], check=True)
lufs, peak = loudness(final)
tp = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(final), '-af', f'loudnorm=I={I}:TP={TP}:print_format=json', '-f', 'null', '-'],
                    capture_output=True, text=True, encoding='utf-8', errors='ignore').stderr
true_peak = float(json.loads(tp[tp.rfind('{'):tp.rfind('}') + 1])['input_tp'])
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(final)], capture_output=True, text=True).stdout.strip())
tl = load_json(ep_dir(slug) / 'timeline.json')
costs = load_json(od / 'costs.json', [])
report = {
    'episode': ep['id'], 'file': str(final), 'seconds': round(dur, 2), 'lufs': lufs, 'true_peak_dbtp': true_peak,
    'segments': len(tl['segments']), 'cuts_per_min': round((len(tl['segments']) - 1) / (tl['total'] / tl['fps']) * 60, 1),
    'elevenlabs_credits': sum(c['credits'] for c in costs), 'cost_lines': costs,
}
save_json(od / 'report.json', report)
print(json.dumps({k: v for k, v in report.items() if k != 'cost_lines'}, indent=1))
ok = abs(lufs + 14) <= 0.5 and true_peak <= -1.0
print('loudness OK' if ok else '! loudness off target: check the report')

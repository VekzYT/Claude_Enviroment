"""Step 6: the motion check. Pulls frame grids from a render, one sheet per shot (or per frame range), each frame
labelled, so a walk, a fall, a catch or a reversal can be read at a glance without scrubbing.

python <skill>/scripts/motiongrid.py <slug> [S3 S5 ...] [--video out/<slug>/<slug>-raw.mp4] [--step 2]
python <skill>/scripts/motiongrid.py <slug> --range 120:180
Writes out/<slug>/motion/<shot>.jpg (every segment of that shot, in order) or out/<slug>/motion/range-<a>-<b>.jpg
"""
import json, subprocess, sys

from PIL import Image, ImageDraw, ImageFont

from wi import ep_dir, out_dir

slug = sys.argv[1]
args = sys.argv[2:]


def opt(name, default=None):
    return args[args.index(name) + 1] if name in args else default


video = opt('--video', str(out_dir(slug) / f'{slug}-raw.mp4'))
step = int(opt('--step', 2))
tl = json.loads((ep_dir(slug) / 'timeline.json').read_text(encoding='utf-8'))
out = out_dir(slug) / 'motion'
out.mkdir(exist_ok=True)
skip = {opt('--video'), opt('--step'), opt('--range')}
want = [a for a in args if not a.startswith('--') and a not in skip]
jobs = []
if opt('--range'):
    a, b = map(int, opt('--range').split(':'))
    jobs.append((f'range-{a}-{b}', list(range(a, b + 1, step))))
else:
    for s in tl['shots']:
        if want and s['id'] not in want:
            continue
        frames = []
        for g in tl['segments']:
            if g['shot'] == s['id']:
                frames += list(range(g['a'], g['b'], step))
        jobs.append((s['id'], frames))
try:
    font = ImageFont.truetype('arial.ttf', 22)
except OSError:
    font = ImageFont.load_default(22)
# GAMERULE: portrait tiles for a tall (Shorts) render, and every frame of a sheet pulled in one decoding pass
size = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', video], capture_output=True, text=True).stdout.strip().split(',')
tall = int(size[1]) > int(size[0])
W, H, cols = (216, 384, 10) if tall else (480, 270, 6)
for name, frames in jobs:
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * W, rows * H))
    for old_tile in out.glob('_f*.png'):
        old_tile.unlink()
    pick = '+'.join(f'eq(n\\,{f})' for f in frames)
    subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-vf', f'select={pick},scale={W}:{H}', '-vsync', '0', str(out / '_f%04d.png')], check=True)
    for i, f in enumerate(frames):
        tile = out / f'_f{i + 1:04d}.png'
        if not tile.exists():
            continue
        im = Image.open(tile).convert('RGB')
        dr = ImageDraw.Draw(im)
        dr.rectangle([0, 0, 64, 28], fill=(0, 0, 0))
        dr.text((5, 2), str(f), fill=(255, 255, 0), font=font)
        sheet.paste(im, ((i % cols) * W, (i // cols) * H))
    p = out / f'{name}.jpg'
    sheet.save(p, quality=85)
    print(p)
for old_tile in out.glob('_f*.png'):
    old_tile.unlink()

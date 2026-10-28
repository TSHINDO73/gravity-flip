# Pixel Adventure 1 の素材をゲーム用にコピー・加工し、日本語フォントをサブセット化する。
# 使い方: python tools/import-assets.py <Pixel Adventure の Free フォルダ> <DotGothic16-Regular.ttf>
import colorsys
import re
import shutil
import sys
from pathlib import Path

from PIL import Image
from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'pa'
FONT_OUT = ROOT / 'assets' / 'fonts'

COPY = {
    'Terrain/Terrain (16x16).png': 'terrain.png',
    'Main Characters/Pink Man/Idle (32x32).png': 'pink/idle.png',
    'Main Characters/Pink Man/Run (32x32).png': 'pink/run.png',
    'Main Characters/Pink Man/Jump (32x32).png': 'pink/jump.png',
    'Main Characters/Pink Man/Fall (32x32).png': 'pink/fall.png',
    'Main Characters/Pink Man/Hit (32x32).png': 'pink/hit.png',
    'Items/Fruits/Apple.png': 'apple.png',
    'Items/Fruits/Collected.png': 'collected.png',
    'Traps/Spikes/Idle.png': 'spike.png',
    'Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png': 'checkpoint-noflag.png',
    'Items/Checkpoints/Checkpoint/Checkpoint (Flag Out) (64x64).png': 'checkpoint-out.png',
    'Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle)(64x64).png': 'checkpoint-idle.png',
    'Items/Checkpoints/End/End (Idle).png': 'end.png',
    'Other/Dust Particle.png': 'dust.png',
    'Other/Confetti (16x16).png': 'confetti.png',
    'Menu/Text/Text (White) (8x10).png': 'font-white.png',
}

# 敵: Virtual Guy を赤茶に色替えする
ENEMY = {
    'Main Characters/Virtual Guy/Run (32x32).png': 'enemy/run.png',
    'Main Characters/Virtual Guy/Hit (32x32).png': 'enemy/hit.png',
}


def recolor(im):
    im = im.convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > 0.15:
                h = (h + 0.5) % 1
                s = min(1, s * 1.2)
            v = min(1, v * 0.8)
            r, g, b = colorsys.hsv_to_rgb(h, s, v)
            px[x, y] = (round(r * 255), round(g * 255), round(b * 255), a)
    return im


def subset_font(ttf):
    # src/ と index.html に出てくる ASCII 以外の文字（日本語・全角記号）に、英数字と記号を足す
    text = ''
    for p in list((ROOT / 'src').rglob('*.js')) + [ROOT / 'index.html']:
        text += p.read_text(encoding='utf-8-sig')
    chars = set(re.findall(r'[^\x00-\x7f]', text))
    chars |= set(chr(c) for c in range(0x20, 0x7f))
    FONT_OUT.mkdir(parents=True, exist_ok=True)
    out = FONT_OUT / 'dotgothic16-subset.woff'
    subset.main([str(ttf), f'--text={"".join(sorted(chars))}', '--flavor=woff', f'--output-file={out}'])
    shutil.copy(Path(ttf).parent / 'OFL.txt', FONT_OUT / 'OFL.txt')
    return out


def main(src, ttf):
    src = Path(src)
    for s, d in COPY.items():
        dst = OUT / d
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(src / s, dst)
    for s, d in ENEMY.items():
        dst = OUT / d
        dst.parent.mkdir(parents=True, exist_ok=True)
        recolor(Image.open(src / s)).save(dst)
    font = subset_font(ttf)
    print(f'copied {len(COPY) + len(ENEMY)} images, font {font.stat().st_size} bytes')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])

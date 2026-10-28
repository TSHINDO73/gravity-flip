// 素材のドット文字(8x10、1 行 10 文字)を使った文字と、白枠のパネル
const FONT = 'pixel-font';
// シートの並び順。空きマスは使わない文字で埋める(1 つ目の空きをスペースに使う)
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ \u0001\u0002\u00030123456789.,:?!()+-\u0004';
export const NAVY = 0x181830;
const OUTLINE = 0x1a1a2e;

function ensureFont(scene) {
  if (scene.cache.bitmapFont.exists(FONT)) return;
  const config = {
    image: 'font',
    width: 8,
    height: 10,
    chars: CHARS,
    charsPerRow: 10,
    spacing: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    lineSpacing: 0,
  };
  scene.cache.bitmapFont.add(FONT, Phaser.GameObjects.RetroFont.Parse(scene, config));
}

// 英大文字・数字・一部の記号だけ使える。shadow を付けると右下に濃い影を描く
export function pixelText(scene, x, y, text, scale = 3, { shadow = false, tint } = {}) {
  ensureFont(scene);
  if (shadow) {
    scene.add.bitmapText(x + scale, y + scale, FONT, text).setScale(scale).setTint(OUTLINE);
  }
  const t = scene.add.bitmapText(x, y, FONT, text).setScale(scale);
  if (tint !== undefined) t.setTint(tint);
  return t;
}

// 紺塗り・白枠(3px)のパネル。外側に濃い縁を付けて背景から浮かせる
export function panel(scene, x, y, w, h, { alpha = 1 } = {}) {
  const g = scene.add.graphics();
  g.fillStyle(OUTLINE, alpha).fillRect(x - 3, y - 3, w + 6, h + 6);
  g.fillStyle(NAVY, alpha).fillRect(x, y, w, h);
  g.lineStyle(3, 0xffffff, 1).strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  return g;
}

// 時計のアイコン(白い円と針)
export function clockIcon(scene, cx, cy, r = 11) {
  const g = scene.add.graphics();
  g.lineStyle(3, 0xffffff, 1).strokeCircle(cx, cy, r);
  g.lineBetween(cx, cy, cx, cy - r + 4).lineBetween(cx, cy, cx + r - 5, cy);
  return g;
}

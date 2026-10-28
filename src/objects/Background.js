// 空・雲・丘・星の背景。低い解像度(1/4)で描いて 4 倍に拡大し、ドット絵らしく見せる
const PX = 4;
const CLOUD_SPEED = 0.2; // カメラに対する追従の速さ(視差スクロール)
const HILL_SPEED = 0.4;
const DEPTH = -10;

const rgb = (r, g, b) => (r << 16) | (g << 8) | b;

// ステージごとの色の組。1 面は昼、2 面は夕焼け、3 面は夜
export const STAGE_SKIES = [
  { key: 'day', top: [40, 150, 255], bottom: [150, 230, 255], hills: [rgb(70, 200, 120), rgb(60, 185, 110)], cloud: rgb(255, 255, 255), stars: false },
  { key: 'sunset', top: [255, 140, 90], bottom: [255, 195, 205], hills: [rgb(150, 95, 165), rgb(125, 75, 145)], cloud: rgb(255, 215, 228), stars: false },
  { key: 'night', top: [14, 20, 60], bottom: [52, 62, 125], hills: [rgb(32, 82, 72), rgb(26, 66, 60)], cloud: rgb(112, 118, 155), stars: true },
];

// 雲の形(低解像度の座標)。[x, y, 半径] の楕円を重ねる
const CLOUDS = [[30, 22], [108, 37], [190, 20]];
const PUFFS = [[0, 0, 7], [8, -3, 8], [16, 0, 6], [8, 3, 7]];

// 再現性のある乱数(星の位置を毎回同じにする)
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

export class Background {
  // width, height: 背景を描く範囲(画面上の px)。x, y はその左上
  constructor(scene, palette, { width, height, x = 0, y = 0 }) {
    const lw = Math.ceil(width / PX);
    const lh = Math.ceil(height / PX);
    const keys = this.makeTextures(scene, palette, lw, lh);
    const add = (key) =>
      scene.add.tileSprite(x, y, width, height, key).setOrigin(0).setTileScale(PX).setScrollFactor(0).setDepth(DEPTH);
    this.sky = add(keys.sky);
    this.clouds = add(keys.clouds);
    this.hills = add(keys.hills);
  }

  // カメラの横位置に合わせて、雲と丘をゆっくりずらす(tilePosition は拡大前の単位)
  update(scrollX) {
    this.clouds.tilePositionX = (scrollX * CLOUD_SPEED) / PX;
    this.hills.tilePositionX = (scrollX * HILL_SPEED) / PX;
  }

  makeTextures(scene, p, lw, lh) {
    const base = `bg-${p.key}-${lw}x${lh}`;
    const keys = { sky: `${base}-sky`, clouds: `${base}-clouds`, hills: `${base}-hills` };
    if (scene.textures.exists(keys.sky)) return keys;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    // 空: 2px(拡大後 8px)刻みの段階グラデーション
    for (let yy = 0; yy < lh; yy += 2) {
      const t = yy / lh;
      const c = p.top.map((v, i) => Math.round(v + (p.bottom[i] - v) * t));
      g.fillStyle(rgb(c[0], c[1], c[2])).fillRect(0, yy, lw, 2);
    }
    if (p.stars) {
      const rand = seeded(7);
      g.fillStyle(0xffffff);
      for (let i = 0; i < 40; i++) g.fillRect(Math.floor(rand() * lw), Math.floor(rand() * lh * 0.6), 1, 1);
    }
    g.generateTexture(keys.sky, lw, lh);
    g.clear();

    // 雲
    g.fillStyle(p.cloud);
    for (const [cx, cy] of CLOUDS) {
      for (const [dx, dy, r] of PUFFS) g.fillEllipse(((cx + dx) / 240) * lw, cy + dy, r * 2, r * 1.4);
    }
    g.generateTexture(keys.clouds, lw, lh);
    g.clear();

    // 丘: 奥と手前の 2 色。繰り返して貼ったときに継ぎ目が出ないよう、横の端にかからない位置に置く
    const hills = [[0.2, 0.98, 45, p.hills[0]], [0.55, 1.03, 55, p.hills[1]], [0.85, 0.98, 30, p.hills[0]]];
    for (const [fx, fy, r, col] of hills) {
      g.fillStyle(col).fillEllipse(fx * lw, fy * lh, r * 2, r * 1.2);
    }
    g.generateTexture(keys.hills, lw, lh);
    g.destroy();
    return keys;
  }
}

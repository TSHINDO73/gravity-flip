import { TOUCH_BUTTONS, pressedSet } from '../logic/inputRules.js';

const FILL_IDLE = 0x181830;
const FILL_DOWN = 0x4a4a90;
const FILL_ALPHA = 0.8;

// ボタンの白いアイコン。(g, x, y, r) で中心と半径を受け取って描く
const tri = (pts) => (g, x, y, r) => {
  const k = r / 36;
  g.fillTriangle(...pts.flatMap(([a, b]) => [x + a * k, y + b * k]));
};
const ICONS = {
  left: tri([[10, -15], [10, 15], [-13, 0]]),
  right: tri([[-10, -15], [-10, 15], [13, 0]]),
  jump: tri([[-16, 11], [16, 11], [0, -15]]),
  flip: (g, x, y) => {
    g.fillTriangle(x - 8, y - 3, x + 8, y - 3, x, y - 18);
    g.fillRect(x - 3, y - 4, 6, 8);
    g.fillTriangle(x - 8, y + 3, x + 8, y + 3, x, y + 18);
  },
  restart: (g, x, y) => {
    g.lineStyle(4, 0xffffff, 1);
    g.beginPath();
    g.arc(x, y, 10, Phaser.Math.DegToRad(40), Phaser.Math.DegToRad(320));
    g.strokePath();
    g.fillTriangle(x + 4, y - 15, x + 15, y - 6, x + 3, y - 3);
  },
};

export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

// 画面の左右の列にボタンを描き、触れている指から押されているボタンの集合を返す
export class TouchPad {
  constructor(scene) {
    this.scene = scene;
    this.circles = new Map();
    for (const b of TOUCH_BUTTONS) {
      const circle = scene.add.circle(b.x, b.y, b.r, FILL_IDLE, FILL_ALPHA).setStrokeStyle(4, 0xffffff, 0.9);
      const icon = scene.add.graphics().fillStyle(0xffffff, 1);
      ICONS[b.id](icon, b.x, b.y, b.r);
      this.circles.set(b.id, circle);
    }

    // アプリ切り替えなどで指の情報が途切れたら、指が全部離れるまで入力を止める
    this.suppressed = false;
    const suppress = () => { this.suppressed = true; };
    const events = scene.game.events;
    events.on('blur', suppress);
    events.on('hidden', suppress);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      events.off('blur', suppress);
      events.off('hidden', suppress);
    });
  }

  update() {
    const points = this.scene.input.manager.pointers.filter((p) => p.isDown).map((p) => ({ x: p.x, y: p.y }));
    if (this.suppressed && points.length === 0) this.suppressed = false;
    const set = this.suppressed ? new Set() : pressedSet(TOUCH_BUTTONS, points);
    for (const [id, circle] of this.circles) circle.setFillStyle(set.has(id) ? FILL_DOWN : FILL_IDLE, FILL_ALPHA);
    return set;
  }
}

import { TOUCH_BUTTONS, pressedSet } from '../logic/inputRules.js';

const ALPHA_IDLE = 0.25;
const ALPHA_DOWN = 0.5;
const LABEL_SIZE = { left: 36, right: 36, flip: 24, jump: 20, restart: 28 };

export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

// 画面上のボタンを描き、触れている指から押されているボタンの集合を返す
export class TouchPad {
  constructor(scene) {
    this.scene = scene;
    this.circles = new Map();
    for (const b of TOUCH_BUTTONS) {
      const circle = scene.add.circle(b.x, b.y, b.r, 0xffffff, ALPHA_IDLE).setScrollFactor(0).setDepth(110);
      scene.add
        .text(b.x, b.y, b.label, { fontFamily: 'sans-serif', fontSize: `${LABEL_SIZE[b.id]}px`, color: '#ffffff', stroke: '#000000', strokeThickness: 3 })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(111);
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
    for (const [id, circle] of this.circles) circle.setFillStyle(0xffffff, set.has(id) ? ALPHA_DOWN : ALPHA_IDLE);
    return set;
  }
}

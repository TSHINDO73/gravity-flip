import { GAME_W, GAME_H } from '../config.js';
import { formatTime } from '../logic/format.js';
import { loadBest } from '../logic/records.js';

const STYLE = { fontFamily: 'sans-serif', color: '#ffffff', stroke: '#000000', strokeThickness: 4 };

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    this.add.text(GAME_W / 2, 120, 'GRAVITY FLIP', { ...STYLE, fontSize: '72px' }).setOrigin(0.5);
    const lines = ['←→　移動', 'Z・スペース　ジャンプ', 'X・↑　重力反転', 'R　やり直し'];
    lines.forEach((t, i) => {
      this.add.text(GAME_W / 2, 240 + i * 38, t, { ...STYLE, fontSize: '26px' }).setOrigin(0.5);
    });
    const best = loadBest();
    if (best) {
      this.add
        .text(GAME_W / 2, 400, `BEST　タイム ${formatTime(best.timeMs)}　コイン ${best.coins}`, { ...STYLE, fontSize: '24px', color: '#ffe066' })
        .setOrigin(0.5);
    }
    const start = this.add.text(GAME_W / 2, 450, 'Z・スペース・Enterでスタート', { ...STYLE, fontSize: '32px' }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    let done = false;
    const onStart = (e) => {
      if (e.repeat || done) return;
      done = true;
      this.scene.start('GameScene', { stage: 0, fullRun: true });
    };
    ['keydown-Z', 'keydown-SPACE', 'keydown-ENTER'].forEach((ev) => this.input.keyboard.on(ev, onStart));
  }
}

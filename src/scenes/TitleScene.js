import { GAME_W, GAME_H } from '../config.js';

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
    const start = this.add.text(GAME_W / 2, 450, 'Zキーでスタート', { ...STYLE, fontSize: '32px' }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    this.input.keyboard.once('keydown-Z', () => this.scene.start('GameScene', { stage: 0 }));
  }
}

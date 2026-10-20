import { GAME_W } from '../config.js';
import { formatTime } from '../logic/format.js';

const STYLE = { fontFamily: 'sans-serif', color: '#ffffff', stroke: '#000000', strokeThickness: 4 };

export class ClearScene extends Phaser.Scene {
  constructor() {
    super('ClearScene');
  }

  create(data) {
    const { coins = 0, elapsedMs = 0 } = data || {};
    this.add.text(GAME_W / 2, 130, 'クリア！', { ...STYLE, fontSize: '72px' }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 250, `コイン ${coins}`, { ...STYLE, fontSize: '34px' }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 310, `タイム ${formatTime(elapsedMs)}`, { ...STYLE, fontSize: '34px' }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 440, 'Zキーでタイトルへ', { ...STYLE, fontSize: '28px' }).setOrigin(0.5);
    this.input.keyboard.once('keydown-Z', () => this.scene.start('TitleScene'));
  }
}

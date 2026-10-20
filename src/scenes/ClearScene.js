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
    // 押しっぱなし(オートリピート)や直前のジャンプ入力で飛ばないよう、少し待ってから受け付ける
    let ready = false;
    let done = false;
    this.time.delayedCall(300, () => { ready = true; });
    this.input.keyboard.on('keydown-Z', (e) => {
      if (e.repeat || !ready || done) return;
      done = true;
      this.scene.start('TitleScene');
    });
  }
}

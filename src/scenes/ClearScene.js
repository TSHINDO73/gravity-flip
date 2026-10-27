import { GAME_W } from '../config.js';
import { formatTime } from '../logic/format.js';
import { loadBest, saveBest, mergeBest } from '../logic/records.js';
import { isTouchDevice } from '../objects/TouchPad.js';

const STYLE = { fontFamily: 'sans-serif', color: '#ffffff', stroke: '#000000', strokeThickness: 4 };

export class ClearScene extends Phaser.Scene {
  constructor() {
    super('ClearScene');
  }

  create(data) {
    const { coins = 0, elapsedMs = 0, fullRun = false } = data || {};
    this.add.text(GAME_W / 2, 130, 'クリア！', { ...STYLE, fontSize: '72px' }).setOrigin(0.5);
    let coinLine = `コイン ${coins}`;
    let timeLine = `タイム ${formatTime(elapsedMs)}`;
    if (fullRun) {
      const { best, newTime, newCoins } = mergeBest(loadBest(), { timeMs: elapsedMs, coins });
      saveBest(best);
      coinLine += newCoins ? '　NEW!' : `　(BEST ${best.coins})`;
      timeLine += newTime ? '　NEW!' : `　(BEST ${formatTime(best.timeMs)})`;
    }
    this.add.text(GAME_W / 2, 250, coinLine, { ...STYLE, fontSize: '34px' }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 310, timeLine, { ...STYLE, fontSize: '34px' }).setOrigin(0.5);
    const backLabel = isTouchDevice() ? 'タップでタイトルへ' : 'Z・スペース・Enterでタイトルへ';
    this.add.text(GAME_W / 2, 440, backLabel, { ...STYLE, fontSize: '28px' }).setOrigin(0.5);
    // 押しっぱなし(オートリピート)や直前のジャンプ入力で飛ばないよう、少し待ってから受け付ける
    let ready = false;
    let done = false;
    this.time.delayedCall(300, () => { ready = true; });
    const back = () => {
      if (!ready || done) return;
      done = true;
      this.scene.start('TitleScene');
    };
    ['keydown-Z', 'keydown-SPACE', 'keydown-ENTER'].forEach((ev) =>
      this.input.keyboard.on(ev, (e) => {
        if (!e.repeat) back();
      }),
    );
    this.input.on('pointerdown', back);
  }
}

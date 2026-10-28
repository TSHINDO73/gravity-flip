import { formatTime } from '../logic/format.js';
import { loadBest, saveBest, mergeBest } from '../logic/records.js';
import { isTouchDevice } from '../objects/TouchPad.js';
import { Background, STAGE_SKIES } from '../objects/Background.js';
import { pixelText, jpText, panel, clockIcon, groundStrip } from '../ui/pixelText.js';

const NEW_PINK = 0xff5078;
const BEST_GRAY = 0xb4b4d2;

export class ClearScene extends Phaser.Scene {
  constructor() {
    super('ClearScene');
  }

  create(data) {
    const { coins = 0, elapsedMs = 0, fullRun = false } = data || {};
    const { width, height } = this.scale;
    const cx = width / 2;
    new Background(this, STAGE_SKIES[0], { width, height });
    groundStrip(this, width, 476);

    panel(this, cx - 260, 60, 520, 370);
    pixelText(this, cx, 88, 'CLEAR!', 7, { shadow: true, originX: 0.5 });

    // 1 行目: リンゴの数、2 行目: タイム
    this.add.image(cx - 180, 225, 'apple', 0).setScale(2);
    pixelText(this, cx - 140, 205, `X${coins}`, 4);
    clockIcon(this, cx - 180, 295, 18);
    pixelText(this, cx - 140, 275, formatTime(elapsedMs), 4);

    // 通しプレイだけ記録を比べる。更新した項目に NEW!、しなかった項目に前回までの BEST
    if (fullRun) {
      const { best, newTime, newCoins } = mergeBest(loadBest(), { timeMs: elapsedMs, coins });
      saveBest(best);
      this.mark(cx + 90, 205, newCoins, `BEST X${best.coins}`);
      this.mark(cx + 90, 275, newTime, `BEST ${formatTime(best.timeMs)}`);
    }

    jpText(this, cx, 366, isTouchDevice() ? 'タップでタイトルへ' : 'Z・スペース・Enter でタイトルへ', 24);
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

  mark(x, y, isNew, bestLabel) {
    if (isNew) {
      this.add.rectangle(x, y, 130, 42, NEW_PINK).setOrigin(0).setStrokeStyle(3, 0xffffff);
      pixelText(this, x + 65, y + 6, 'NEW!', 3, { originX: 0.5 });
    } else {
      pixelText(this, x, y + 14, bestLabel, 2, { tint: BEST_GRAY });
    }
  }
}

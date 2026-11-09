import { formatTime } from '../logic/format.js';
import { scorePoints } from '../logic/records.js';
import { mergeTop } from '../logic/ranking.js';
import { loadTop3, saveTop3, loadName, saveName } from '../logic/localRanking.js';
import { submitRun } from '../net/rankingApi.js';
import { askName } from '../ui/nameInput.js';
import { isTouchDevice } from '../objects/TouchPad.js';
import { Background, STAGE_SKIES } from '../objects/Background.js';
import { pixelText, jpText, panel, clockIcon, groundStrip } from '../ui/pixelText.js';

const NEW_PINK = 0xff5078;
const BEST_GRAY = 0xb4b4d2;
const RANK_LABELS = { 1: 'NEW!', 2: '2ND', 3: '3RD' };
// みんなのランキングで「〇位！」と出すのはベスト10まで
const TOP_SIZE = 10;

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

    panel(this, cx - 260, 60, 520, 390);
    pixelText(this, cx, 88, 'CLEAR!', 7, { shadow: true, originX: 0.5 });

    // 1 行目: リンゴの数、2 行目: タイム、3 行目: 点数
    const run = { timeMs: elapsedMs, coins, at: new Date().toISOString() };
    this.add.image(cx - 180, 192, 'apple', 0).setScale(2);
    pixelText(this, cx - 140, 172, `X${coins}`, 4);
    clockIcon(this, cx - 180, 248, 18);
    pixelText(this, cx - 140, 228, formatTime(elapsedMs), 4);
    this.add.rectangle(cx, 284, 440, 3, 0xffffff).setAlpha(0.5);
    pixelText(this, cx - 232, 310, 'SCORE', 2);
    pixelText(this, cx - 140, 296, String(scorePoints(run)), 4);

    // 通しプレイだけ自分の上位3件と比べる。入った順位の札(NEW! 2ND 3RD)と、1 位でなければ今までのベストの組
    // そのあと、みんなのランキングに送る(名前の入力中と送信中はタイトルへ戻らない)
    let busy = false;
    if (fullRun) {
      const { list, rank } = mergeTop(loadTop3(), run, 3);
      saveTop3(list);
      const best = list[0];
      if (rank) {
        this.add.rectangle(cx + 100, 296, 130, 42, NEW_PINK).setOrigin(0).setStrokeStyle(3, 0xffffff);
        pixelText(this, cx + 165, 302, RANK_LABELS[rank], 3, { originX: 0.5 });
      }
      if (rank !== 1) {
        pixelText(this, cx, 342, `BEST ${scorePoints(best)} (${formatTime(best.timeMs)} X${best.coins})`, 2, { tint: BEST_GRAY, originX: 0.5 });
      }
      busy = true;
      this.sendToRanking(run, cx).finally(() => { busy = false; });
    }

    jpText(this, cx, 404, isTouchDevice() ? 'タップでタイトルへ' : 'Z・スペース・Enter でタイトルへ', 24);
    // 押しっぱなし(オートリピート)や直前のジャンプ入力で飛ばないよう、少し待ってから受け付ける
    let ready = false;
    let done = false;
    this.time.delayedCall(300, () => { ready = true; });
    const back = () => {
      if (!ready || done || busy) return;
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

  // 名前がなければ聞いてから記録を送り、結果を 1 行で出す。「おくらない」なら送らない
  async sendToRanking(run, cx) {
    let name = loadName();
    if (!name) {
      name = await askName(this);
      if (!name) return;
      saveName(name);
    }
    // 名前を聞いている間に画面が変わったときは askName が null を返すので、ここには来ない
    const status = jpText(this, cx, 368, 'おくっています…', 20);
    const result = await submitRun({ name, timeMs: run.timeMs, coins: run.coins });
    if (!status.active) return;
    if (!result) status.setText('つうしんできません');
    else status.setText(result.rank <= TOP_SIZE ? `みんなの中で ${result.rank} 位！` : 'ランキング外');
  }
}

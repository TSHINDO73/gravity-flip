import { formatTime } from '../logic/format.js';
import { scorePoints } from '../logic/records.js';
import { loadTop3 } from '../logic/localRanking.js';
import { freshRun } from '../logic/runRules.js';
import { isTouchDevice } from '../objects/TouchPad.js';
import { Background, STAGE_SKIES } from '../objects/Background.js';
import { pixelText, jpText, panel, groundStrip } from '../ui/pixelText.js';

const GROUND_Y = 476;
const BEST_GRAY = 0xb4b4d2;

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const touch = isTouchDevice();
    new Background(this, STAGE_SKIES[0], { width, height });
    groundStrip(this, width, GROUND_Y);

    pixelText(this, cx, 60, 'GRAVITY', 8, { shadow: true, originX: 0.5 });
    pixelText(this, cx, 150, 'FLIP', 8, { shadow: true, originX: 0.5 });

    // ベスト記録: 点数を大きく、その回のタイムとりんごの数を小さく並べる。記録がなければ出さない
    const [best] = loadTop3();
    if (best) {
      panel(this, cx - 250, 262, 500, 46);
      pixelText(this, cx - 232, 271, `BEST ${scorePoints(best)}`);
      pixelText(this, cx + 70, 279, formatTime(best.timeMs), 2, { tint: BEST_GRAY });
      this.add.image(cx + 180, 286, 'apple', 0);
      pixelText(this, cx + 192, 279, `X${best.coins}`, 2, { tint: BEST_GRAY });
    }

    const start = jpText(this, cx, 336, touch ? 'タップでスタート' : 'Z・スペース・Enter でスタート', 28);
    this.tweens.add({ targets: start, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    // スマホは画面のボタンで操作が分かるので、操作説明は PC だけ
    if (!touch) jpText(this, cx, 392, '←→ 移動　Z ジャンプ　X 反転　R やり直し', 18);

    this.add.sprite(cx + 240, GROUND_Y, 'pinkIdle', 0).setOrigin(0.5, 1).setScale(3).play('pinkIdle');
    let done = false;
    const startGame = () => {
      if (done) return;
      done = true;
      this.scene.start('GameScene', freshRun());
    };
    ['keydown-Z', 'keydown-SPACE', 'keydown-ENTER'].forEach((ev) =>
      this.input.keyboard.on(ev, (e) => {
        if (!e.repeat) startGame();
      }),
    );
    // 全画面はブラウザの規則で「指を離した瞬間」にしか要求できない。
    // クリア画面で離した指に反応しないよう、この画面で指を置いたときだけ受け付ける
    let touchStarted = false;
    this.input.on('pointerdown', (pointer) => {
      if (pointer.wasTouch) touchStarted = true;
      else startGame(); // マウスのクリックは全画面にしない
    });
    this.input.on('pointerup', (pointer) => {
      if (!pointer.wasTouch || !touchStarted || done) return;
      this.enterFullscreen();
      startGame();
    });
  }

  // 全画面と横向き固定を試みる。対応していないブラウザでは何もしない
  enterFullscreen() {
    if (this.scale.isFullscreen) return;
    this.scale.once('enterfullscreen', () => {
      screen.orientation?.lock?.('landscape')?.catch(() => {});
    });
    try {
      this.scale.startFullscreen();
    } catch {
      // 全画面にできなくてもそのまま始める
    }
  }
}

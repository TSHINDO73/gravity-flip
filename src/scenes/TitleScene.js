import { formatTime } from '../logic/format.js';
import { scorePoints } from '../logic/records.js';
import { loadTop3, loadName, saveName } from '../logic/localRanking.js';
import { askName } from '../ui/nameInput.js';
import { freshRun } from '../logic/runRules.js';
import { isTouchDevice } from '../objects/TouchPad.js';
import { Background, STAGE_SKIES } from '../objects/Background.js';
import { pixelText, jpText, panel, groundStrip, NAVY } from '../ui/pixelText.js';

const GROUND_Y = 476;
const BEST_GRAY = 0xb4b4d2;
const NAME_STYLE = { fontFamily: 'sans-serif', fontSize: '18px', color: '#ffffff', stroke: '#1a1a2e', strokeThickness: 4 };

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
    if (!touch) jpText(this, cx, 392, '←→ 移動　Z ジャンプ　X 反転　R やり直し　C ランキング', 18);

    // ランキングと名前の変更。ここを押した指やクリックではゲームを始めない
    const ui = [this.makeRankingButton(cx), ...this.makeNameLabel()];

    this.add.sprite(cx + 340, GROUND_Y, 'pinkIdle', 0).setOrigin(0.5, 1).setScale(3).play('pinkIdle');
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
    this.input.keyboard.on('keydown-C', () => {
      if (!done) this.scene.start('RankingScene');
    });
    const onUi = (pointer) => this.input.hitTestPointer(pointer).some((o) => ui.includes(o));
    // 全画面はブラウザの規則で「指を離した瞬間」にしか要求できない。
    // クリア画面で離した指に反応しないよう、この画面で指を置いたときだけ受け付ける
    let touchStarted = false;
    this.input.on('pointerdown', (pointer) => {
      if (onUi(pointer)) return;
      if (pointer.wasTouch) touchStarted = true;
      else startGame(); // マウスのクリックは全画面にしない
    });
    this.input.on('pointerup', (pointer) => {
      if (!pointer.wasTouch || !touchStarted || done || onUi(pointer)) return;
      this.enterFullscreen();
      startGame();
    });
  }

  makeRankingButton(cx) {
    const bg = this.add.rectangle(cx - 100, 424, 200, 40, NAVY).setOrigin(0).setStrokeStyle(3, 0xffffff);
    pixelText(this, cx, 433, 'RANKING', 3, { originX: 0.5 });
    bg.setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start('RankingScene'));
    return bg;
  }

  // 名前が登録済みなら左下に「なまえ：〇〇（かえる）」。押すと名前を変えられる
  makeNameLabel() {
    const name = loadName();
    if (!name) return [];
    const label = jpText(this, 0, 432, 'なまえ：', 18).setOrigin(0, 0).setX(24);
    const nameText = this.add.text(label.x + label.width, 432, name, NAME_STYLE);
    const change = jpText(this, 0, 432, '（かえる）', 18).setOrigin(0, 0);
    const layout = () => change.setX(nameText.x + nameText.width + 4);
    layout();
    const hit = this.add
      .rectangle(16, 424, change.x + change.width - 8, 40, 0x000000, 0)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerup', async () => {
      const next = await askName(this, { initial: nameText.text, cancelLabel: 'やめる' });
      if (!next || !nameText.active) return;
      saveName(next);
      nameText.setText(next);
      layout();
      hit.width = change.x + change.width - 8;
      hit.input.hitArea.width = hit.width;
    });
    return [hit];
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

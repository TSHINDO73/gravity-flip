import { HUD_H, PLAY_W, layoutFor } from '../config.js';
import { formatTime } from '../logic/format.js';
import { TouchPad } from '../objects/TouchPad.js';
import { pixelText, jpText, panel, clockIcon, NAVY } from '../ui/pixelText.js';

const COLUMN = 0x1e1e3c;
const COLUMN_EDGE = 0x5a5a8c;
const CHOICE_PINK = 0xff5078;

// HUD の帯とスマホのボタン。GameScene と同時に動き、プレイ画面の外側だけに描く
export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create({ touch }) {
    const L = layoutFor(touch);
    const x0 = L.hudX;

    if (touch) {
      for (const cx of [0, L.width - L.playX]) {
        this.add.rectangle(cx, 0, L.playX, L.height, COLUMN).setOrigin(0);
      }
      this.add.rectangle(L.playX - 2, 0, 3, L.height, COLUMN_EDGE).setOrigin(0);
      this.add.rectangle(L.width - L.playX - 1, 0, 3, L.height, COLUMN_EDGE).setOrigin(0);
    }
    this.add.rectangle(x0, 0, PLAY_W, HUD_H, NAVY).setOrigin(0);

    // 左: リンゴ×数、中央: ステージ、右: 時計＋タイム
    panel(this, x0 + 16, 10, 170, 40);
    this.add.image(x0 + 40, 30, 'apple', 0);
    this.coinText = pixelText(this, x0 + 62, 16, 'X0');
    panel(this, x0 + 360, 10, 240, 40);
    this.stageText = pixelText(this, x0 + 480, 16, 'STAGE 1').setOrigin(0.5, 0);
    panel(this, x0 + 744, 10, 200, 40);
    clockIcon(this, x0 + 770, 30);
    this.timeText = pixelText(this, x0 + 792, 16, '0:00.0');

    this.touchPad = touch ? new TouchPad(this) : null;

    const onHud = (hud) => this.setHud(hud);
    const onAskTitle = () => this.askTitle(x0);
    this.game.events.on('hud-update', onHud);
    this.game.events.on('ask-title', onAskTitle);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('hud-update', onHud);
      this.game.events.off('ask-title', onAskTitle);
    });
  }

  // プレイ中に「タイトルへ」を押したときの確認。GameScene は止まっている。
  // うっかり押したときのために、最初は「いいえ」を選んでおく
  askTitle(x0) {
    if (this.confirm) return;
    const cx = x0 + PLAY_W / 2;
    const parts = [
      this.add.rectangle(x0, HUD_H, PLAY_W, 480, 0x000000, 0.45).setOrigin(0).setInteractive(),
      panel(this, cx - 210, 200, 420, 170),
      jpText(this, cx, 226, 'タイトルにもどりますか？', 26),
    ];
    const choices = [
      { label: 'はい', x: cx - 170, yes: true },
      { label: 'いいえ', x: cx + 20, yes: false },
    ].map((c) => {
      const bg = this.add.rectangle(c.x, 290, 150, 52, NAVY).setOrigin(0).setStrokeStyle(3, 0xffffff);
      parts.push(bg, jpText(this, c.x + 75, 301, c.label, 24));
      bg.setInteractive({ useHandCursor: true }).on('pointerup', () => decide(c.yes));
      return { ...c, bg };
    });
    let selected = 1;
    const show = () => choices.forEach((c, i) => c.bg.setFillStyle(i === selected ? CHOICE_PINK : NAVY));
    show();

    const kb = this.input.keyboard;
    const keys = {
      'keydown-LEFT': () => { selected = 0; show(); },
      'keydown-RIGHT': () => { selected = 1; show(); },
      'keydown-Z': () => decide(choices[selected].yes),
      'keydown-SPACE': () => decide(choices[selected].yes),
      'keydown-ENTER': () => decide(choices[selected].yes),
      'keydown-ESC': () => decide(false),
    };
    Object.entries(keys).forEach(([ev, fn]) => kb.on(ev, fn));
    const close = () => {
      Object.entries(keys).forEach(([ev, fn]) => kb.off(ev, fn));
      parts.forEach((o) => o.destroy());
      this.confirm = null;
    };
    const decide = (yes) => {
      if (!this.confirm) return;
      close();
      if (yes) {
        // 遊んでいた記録は保存も送信もしない
        this.scene.stop('GameScene');
        this.scene.start('TitleScene');
      } else {
        this.scene.resume('GameScene');
      }
    };
    this.confirm = { close };
  }

  // ドット文字に「/」が無いので、ステージは番号だけ表示する
  setHud({ stage, coins, elapsedMs }) {
    this.coinText.setText(`X${coins}`);
    this.stageText.setText(`STAGE ${stage}`);
    this.timeText.setText(formatTime(elapsedMs));
  }
}

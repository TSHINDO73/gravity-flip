import { HUD_H, PLAY_W, layoutFor } from '../config.js';
import { formatTime } from '../logic/format.js';
import { TouchPad } from '../objects/TouchPad.js';
import { pixelText, panel, clockIcon, NAVY } from '../ui/pixelText.js';

const COLUMN = 0x1e1e3c;
const COLUMN_EDGE = 0x5a5a8c;

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
    this.game.events.on('hud-update', onHud);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off('hud-update', onHud));
  }

  // ドット文字に「/」が無いので、ステージは番号だけ表示する
  setHud({ stage, coins, elapsedMs }) {
    this.coinText.setText(`X${coins}`);
    this.stageText.setText(`STAGE ${stage}`);
    this.timeText.setText(formatTime(elapsedMs));
  }
}

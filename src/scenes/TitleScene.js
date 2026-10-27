import { GAME_W, GAME_H } from '../config.js';
import { formatTime } from '../logic/format.js';
import { loadBest } from '../logic/records.js';
import { isTouchDevice } from '../objects/TouchPad.js';

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
    const best = loadBest();
    if (best) {
      this.add
        .text(GAME_W / 2, 400, `BEST　タイム ${formatTime(best.timeMs)}　コイン ${best.coins}`, { ...STYLE, fontSize: '24px', color: '#ffe066' })
        .setOrigin(0.5);
    }
    const startLabel = isTouchDevice() ? 'タップでスタート' : 'Z・スペース・Enterでスタート';
    const start = this.add.text(GAME_W / 2, 450, startLabel, { ...STYLE, fontSize: '32px' }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    let done = false;
    const startGame = () => {
      if (done) return;
      done = true;
      this.scene.start('GameScene', { stage: 0, fullRun: true });
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

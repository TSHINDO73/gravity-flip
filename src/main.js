import { layoutFor } from './config.js';
import { isTouchDevice } from './objects/TouchPad.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ClearScene } from './scenes/ClearScene.js';
import { UIScene } from './scenes/UIScene.js';

const params = new URLSearchParams(window.location.search);

// タッチ端末は左右にボタンの列を足した横長の画面にする
const layout = layoutFor(isTouchDevice());

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: layout.width,
  height: layout.height,
  pixelArt: true,
  backgroundColor: '#181830',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // マウス以外に同時に4本の指を扱う
  input: { activePointers: 4 },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: params.get('debug') === '1',
    },
  },
  scene: [BootScene, TitleScene, GameScene, ClearScene, UIScene],
});

// 開発用: ?debug=1 のときだけ、ブラウザのコンソールや自動確認からゲームを触れるようにする
if (params.get('debug') === '1') window.game = game;

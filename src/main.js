import { GAME_W, GAME_H } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ClearScene } from './scenes/ClearScene.js';

const params = new URLSearchParams(window.location.search);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  pixelArt: true,
  backgroundColor: '#5c94fc',
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
  scene: [BootScene, TitleScene, GameScene, ClearScene],
});

// 開発用: ?debug=1 のときだけ、ブラウザのコンソールや自動確認からゲームを触れるようにする
if (params.get('debug') === '1') window.game = game;

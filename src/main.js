import { GAME_W, GAME_H } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ClearScene } from './scenes/ClearScene.js';

const params = new URLSearchParams(window.location.search);

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  pixelArt: true,
  backgroundColor: '#5c94fc',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: params.get('debug') === '1',
    },
  },
  scene: [BootScene, TitleScene, GameScene, ClearScene],
});


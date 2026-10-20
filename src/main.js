import { GAME_W, GAME_H } from './config.js';
import { TitleScene } from './scenes/TitleScene.js';

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
  scene: [TitleScene],
});

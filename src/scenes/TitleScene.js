import { GAME_W, GAME_H } from '../config.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    this.add
      .text(GAME_W / 2, GAME_H / 2, 'GRAVITY FLIP', {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}

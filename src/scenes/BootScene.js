import { SHEETS, ANIMS, ANIM_FPS, SFX } from '../assetKeys.js';
import { LEVELS } from '../levels/levels.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.on('loaderror', (file) => {
      console.error('素材の読み込みに失敗しました: ' + (file.src || file.key));
    });
    for (const [key, { path, size }] of Object.entries(SHEETS)) {
      this.load.spritesheet(key, path, { frameWidth: size, frameHeight: size });
    }
    this.load.image('font', 'assets/pa/font-white.png');
    for (const name of Object.keys(SFX)) this.load.audio(SFX[name], 'assets/sfx/' + name + '.ogg');
  }

  create() {
    for (const [key, { sheet, repeat }] of Object.entries(ANIMS)) {
      this.anims.create({ key, frames: this.anims.generateFrameNumbers(sheet), frameRate: ANIM_FPS, repeat });
    }
    const n = Number(new URLSearchParams(window.location.search).get('stage'));
    if (Number.isInteger(n) && n >= 1 && n <= LEVELS.length) {
      this.scene.start('GameScene', { stage: n - 1 });
    } else {
      this.scene.start('TitleScene');
    }
  }
}

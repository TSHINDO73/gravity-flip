import { IMG, TILE_SRC, CHAR_SRC, SFX } from '../assetKeys.js';
import { LEVELS } from '../levels/levels.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.on('loaderror', (file) => {
      console.error('素材の読み込みに失敗しました: ' + (file.src || file.key));
    });
    this.load.spritesheet(IMG.tiles, 'assets/tiles.png', { frameWidth: TILE_SRC, frameHeight: TILE_SRC });
    this.load.spritesheet(IMG.chars, 'assets/characters.png', { frameWidth: CHAR_SRC, frameHeight: CHAR_SRC });
    for (const name of Object.keys(SFX)) this.load.audio(SFX[name], 'assets/sfx/' + name + '.ogg');
  }

  create() {
    const n = Number(new URLSearchParams(window.location.search).get('stage'));
    if (Number.isInteger(n) && n >= 1 && n <= LEVELS.length) {
      this.scene.start('GameScene', { stage: n - 1 });
    } else {
      this.scene.start('TitleScene');
    }
  }
}

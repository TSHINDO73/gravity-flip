import { GAME_W, GAME_H, TILE, SCALE } from '../config.js';
import { IMG, FRAMES } from '../assetKeys.js';
import { LEVELS } from '../levels/levels.js';
import { parseLevel } from '../levels/parseLevel.js';
import { Player } from '../objects/Player.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    const { stage = 0, coins = 0, elapsedMs = 0 } = data || {};
    this.stage = stage;
    this.coins = coins;
    this.elapsedMs = elapsedMs;
  }

  tileCenter(cell) {
    return { x: cell.col * TILE + TILE / 2, y: cell.row * TILE + TILE / 2 };
  }

  create() {
    try {
      this.level = parseLevel(LEVELS[this.stage], this.stage + 1);
    } catch (e) {
      this.add
        .text(GAME_W / 2, GAME_H / 2, e.message, {
          fontFamily: 'sans-serif',
          fontSize: '24px',
          color: '#ff3030',
          wordWrap: { width: GAME_W - 80 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      this.scene.pause();
      return;
    }

    const w = this.level.width * TILE;
    const h = this.level.height * TILE;

    this.physics.world.setBounds(0, -TILE * 3, w, h + TILE * 6);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this.solidLayer = this.physics.add.staticGroup();
    for (const cell of this.level.blocks) {
      const p = this.tileCenter(cell);
      this.solidLayer.create(p.x, p.y, IMG.tiles, FRAMES.block).setScale(SCALE).refreshBody();
    }

    // 足元がブロックの下端/上端に合うよう、スタートマスの下端にキャラの足を置く
    const s = this.tileCenter(this.level.start);
    this.player = new Player(this, s.x, s.y);
    this.player.respawn(s.x, s.y + TILE / 2);
    this.physics.add.collider(this.player, this.solidLayer);

    const cam = this.cameras.main;
    if (h < GAME_H) {
      cam.setBounds(0, -(GAME_H - h) / 2, w, GAME_H);
    } else {
      cam.setBounds(0, 0, w, h);
    }
    cam.startFollow(this.player, true, 1, 1);
  }

  update(time, delta) {
    if (this.player) this.player.update(time, delta);
  }
}

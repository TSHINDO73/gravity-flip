import { GRAVITY, ENEMY_SPEED, MAX_FALL_SPEED, SCALE, TILE } from '../config.js';
import { CHAR_SRC } from '../assetKeys.js';
import { aheadGroundCell } from '../logic/enemyRules.js';
import { shiftBodyToFeet } from './gravityBody.js';

// 当たり判定（元画像ピクセル）。絵（幅 24・高さ 28 ほど）に合わせて、足元側に寄せる
const BODY_W = 14;
const BODY_H = 22;
const BODY_OFF_X = (CHAR_SRC - BODY_W) / 2;
const OFF_Y_DOWN = CHAR_SRC - BODY_H;
const OFF_Y_UP = 0;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  // x: 中心x, y: 足元の位置（重力下前提でのブロック上面）
  constructor(scene, x, y) {
    super(scene, x, y - (CHAR_SRC * SCALE) / 2, 'enemyRun', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(SCALE);
    this.body.setSize(BODY_W, BODY_H);
    this.body.setOffset(BODY_OFF_X, OFF_Y_DOWN);
    this.setMaxVelocity(ENEMY_SPEED, MAX_FALL_SPEED);
    this.gravityDir = 1;
    this.walkDir = -1;
    this.dying = false;
    this.body.setGravityY(GRAVITY);

    this.anims.play('enemyRun');
    this.setFlipX(true);
  }

  setGravityDir(dir) {
    if (this.dying || dir === this.gravityDir) return;
    this.gravityDir = dir;
    shiftBodyToFeet(this, dir, BODY_OFF_X, OFF_Y_DOWN, OFF_Y_UP);
    this.body.setGravityY(GRAVITY * dir);
    this.setFlipY(dir === -1);
    this.setVelocityY(0);
  }

  update(isSolidAt) {
    if (this.dying || !this.body.enable) return;
    const { body } = this;
    const dir = this.gravityDir;
    const onGround = dir === 1 ? body.blocked.down : body.blocked.up;

    let turn = (this.walkDir < 0 && body.blocked.left) || (this.walkDir > 0 && body.blocked.right);
    if (!turn && onGround) {
      const feetY = dir === 1 ? body.bottom : body.top;
      const { col, row } = aheadGroundCell(body.center.x, feetY, this.walkDir, body.halfWidth, dir, TILE);
      if (!isSolidAt(col, row)) turn = true;
    }
    if (turn) this.walkDir = -this.walkDir;
    this.setVelocityX(this.walkDir * ENEMY_SPEED);
    this.setFlipX(this.walkDir < 0);
  }

  stomp() {
    if (this.dying) return;
    this.dying = true;
    this.body.enable = false;
    this.anims.play('enemyHit');
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2 * SCALE,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}

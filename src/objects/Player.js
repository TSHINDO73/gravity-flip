import { GRAVITY, RUN_SPEED, MAX_FALL_SPEED, JUMP_CUT, SCALE } from '../config.js';
import { IMG, FRAMES, CHAR_SRC } from '../assetKeys.js';
import { shiftBodyToFeet } from './gravityBody.js';
import { createFlipState, canFlip, applyFlip, onLand } from '../logic/flipRules.js';
import { createJumpState, markGrounded, markPressed, shouldJump, consumeJump, jumpVelocityY } from '../logic/jumpRules.js';

// 当たり判定（元画像ピクセル）。足元側に寄せる。
const BODY_W = 12;
const BODY_H = 16;
const BODY_OFF_X = (CHAR_SRC - BODY_W) / 2;
const OFF_Y_DOWN = CHAR_SRC - BODY_H; // 重力が下: 体は画像の下側
const OFF_Y_UP = 0; // 重力が上: 体は画像の上側

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, IMG.chars, FRAMES.player);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(SCALE);
    this.setCollideWorldBounds(true);
    this.body.setSize(BODY_W, BODY_H);
    this.body.setOffset(BODY_OFF_X, OFF_Y_DOWN);
    this.setMaxVelocity(RUN_SPEED, MAX_FALL_SPEED);

    if (!scene.anims.exists('player-walk')) {
      scene.anims.create({
        key: 'player-walk',
        frames: FRAMES.playerWalk.map((f) => ({ key: IMG.chars, frame: f })),
        frameRate: 8,
        repeat: -1,
      });
    }

    const kb = scene.input.keyboard;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      jumpZ: kb.addKey(K.Z),
      jumpSpace: kb.addKey(K.SPACE),
      flipX: kb.addKey(K.X),
      flipUp: kb.addKey(K.UP),
    };

    this.respawn(x, y);
  }

  get gravityDir() {
    return this.flipState.gravity;
  }

  get feetY() {
    return this.gravityDir === 1 ? this.body.bottom : this.body.top;
  }

  // x: 中心x, y: 足元の位置（重力下前提でのブロック上面）
  respawn(x, y) {
    this.flipState = createFlipState();
    this.jumpState = createJumpState();
    this.grounded = false;
    this.clearTint();
    this.setFlipY(false);
    this.body.setOffset(BODY_OFF_X, OFF_Y_DOWN);
    // 体の下端 = 画像の下端なので、画像中心は足元より画像の半分だけ上
    this.body.reset(x, y - (CHAR_SRC * SCALE) / 2);
    this.setVelocity(0, 0);
    this.body.setGravityY(GRAVITY);
  }

  update(time, delta) {
    const { keys, body } = this;
    const dir = this.gravityDir;

    // 接地判定（足元側がブロックに触れている）
    const onGround = dir === 1 ? body.blocked.down : body.blocked.up;
    if (onGround) {
      if (!this.grounded) this.flipState = onLand(this.flipState);
      this.jumpState = markGrounded(this.jumpState, time);
    }
    this.grounded = onGround;

    // 左右移動
    let vx = 0;
    if (keys.left.isDown) vx -= RUN_SPEED;
    if (keys.right.isDown) vx += RUN_SPEED;
    this.setVelocityX(vx);
    if (vx !== 0) this.setFlipX(vx < 0);

    // ジャンプ（先行入力・コヨーテ付き）
    const jumpPressed = Phaser.Input.Keyboard.JustDown(keys.jumpZ) || Phaser.Input.Keyboard.JustDown(keys.jumpSpace);
    if (jumpPressed) this.jumpState = markPressed(this.jumpState, time);
    if (shouldJump(this.jumpState, time, onGround)) {
      this.setVelocityY(jumpVelocityY(dir));
      this.jumpState = consumeJump(this.jumpState);
    }
    // 可変ジャンプ: 離したとき、足元から離れる向きに動いていれば縮める
    const jumpReleased = Phaser.Input.Keyboard.JustUp(keys.jumpZ) || Phaser.Input.Keyboard.JustUp(keys.jumpSpace);
    if (jumpReleased && body.velocity.y * dir < 0) {
      this.setVelocityY(body.velocity.y * JUMP_CUT);
    }

    // 重力反転（押した瞬間のみ）
    const flipPressed = Phaser.Input.Keyboard.JustDown(keys.flipX) || Phaser.Input.Keyboard.JustDown(keys.flipUp);
    if (flipPressed && canFlip(this.flipState, onGround)) {
      this.flipState = applyFlip(this.flipState, onGround);
      this.setVelocityY(0);
      this.applyGravityVisuals();
      this.scene.events.emit('gravity-flipped', this.gravityDir);
    }

    body.setGravityY(GRAVITY * this.gravityDir);
    this.setFlipY(this.gravityDir === -1);

    if (this.flipState.airFlipAvailable) this.clearTint();
    else this.setTint(0x888888);

    // 歩きアニメ
    if (onGround && vx !== 0) this.anims.play('player-walk', true);
    else {
      this.anims.stop();
      this.setFrame(FRAMES.player);
    }
  }

  // 体のオフセットを足元側へ移し替える。
  applyGravityVisuals() {
    shiftBodyToFeet(this, this.gravityDir, BODY_OFF_X, OFF_Y_DOWN, OFF_Y_UP);
  }
}

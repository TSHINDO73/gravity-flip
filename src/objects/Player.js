import { GRAVITY, RUN_SPEED, MAX_FALL_SPEED, JUMP_CUT, SCALE, BUFFER_MS } from '../config.js';
import { CHAR_SRC, SFX } from '../assetKeys.js';
import { shiftBodyToFeet } from './gravityBody.js';
import { playSfx } from './sfx.js';
import { createFlipState, canFlip, applyFlip, onLand } from '../logic/flipRules.js';
import { landingImpact } from '../logic/fxRules.js';
import { createJumpState, markGrounded, markPressed, shouldJump, consumeJump, onFlip, jumpVelocityY } from '../logic/jumpRules.js';

// 当たり判定（元画像ピクセル）。絵（幅 22・高さ 29 ほど）に合わせて、足元側に寄せる。
const BODY_W = 10;
const BODY_H = 26;
const BODY_OFF_X = (CHAR_SRC - BODY_W) / 2;
const OFF_Y_DOWN = CHAR_SRC - BODY_H; // 重力が下: 体は画像の下側
const OFF_Y_UP = 0; // 重力が上: 体は画像の上側

export class Player extends Phaser.Physics.Arcade.Sprite {
  // bufferMs: ジャンプの先行入力の猶予(スマホは長め)
  constructor(scene, x, y, { bufferMs = BUFFER_MS } = {}) {
    super(scene, x, y, 'pinkIdle', 0);
    this.bufferMs = bufferMs;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(SCALE);
    this.setCollideWorldBounds(true);
    this.body.setSize(BODY_W, BODY_H);
    this.body.setOffset(BODY_OFF_X, OFF_Y_DOWN);
    this.setMaxVelocity(RUN_SPEED, MAX_FALL_SPEED);

    // 見た目は別のスプライトに写す。体の拡大率を変えると当たり判定まで変わるため、
    // 伸び縮みの演出は view にだけかける(squash は Effects がトゥイーンする)
    this.setVisible(false);
    // 旗やゴールの絵より手前に描く(演出は 50 なのでさらにその奥)
    this.view = scene.add.sprite(x, y, 'pinkIdle', 0).setScale(SCALE).setDepth(10);
    this.view.play('pinkIdle');
    this.squash = { x: 1, y: 1 };
    // 物理の計算が終わった後に写す。死亡中など update が呼ばれないフレームも含む
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncView, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncView, this);
    });

    this.respawn(x, y);
  }

  syncView() {
    const { view } = this;
    view.setPosition(this.x, this.y);
    view.setFlip(this.flipX, this.flipY);
    view.setAlpha(this.alpha);
    if (this.isTinted) view.setTint(this.tintTopLeft);
    else view.clearTint();
    view.setScale(SCALE * this.squash.x, SCALE * this.squash.y);
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
    this.lastVy = 0;
    this.body.setGravityY(GRAVITY);
  }

  // input: Controls.update() の戻り値
  update(time, delta, input) {
    const { body } = this;
    const dir = this.gravityDir;

    // 接地判定（足元側がブロックに触れている）
    const onGround = dir === 1 ? body.blocked.down : body.blocked.up;
    if (onGround) {
      if (!this.grounded) {
        this.flipState = onLand(this.flipState);
        // 衝突でこのフレームの速度は 0 になっているので、前フレームの速度で勢いを測る
        this.scene.events.emit('player-landed', landingImpact(this.lastVy, dir));
      }
      this.jumpState = markGrounded(this.jumpState, time);
    }
    this.grounded = onGround;

    // 左右移動
    let vx = 0;
    if (input.left) vx -= RUN_SPEED;
    if (input.right) vx += RUN_SPEED;
    this.setVelocityX(vx);
    if (vx !== 0) this.setFlipX(vx < 0);

    // ジャンプ（先行入力・コヨーテ付き）
    if (input.jumpPressed) this.jumpState = markPressed(this.jumpState, time);
    if (shouldJump(this.jumpState, time, onGround, this.bufferMs)) {
      this.setVelocityY(jumpVelocityY(dir));
      this.jumpState = consumeJump(this.jumpState);
      playSfx(this.scene, SFX.jump);
      this.scene.events.emit('player-jumped');
    }
    // 可変ジャンプ: 離したとき、足元から離れる向きに動いていれば縮める
    if (input.jumpReleased && body.velocity.y * dir < 0) {
      this.setVelocityY(body.velocity.y * JUMP_CUT);
    }

    // 重力反転（押した瞬間のみ）
    if (input.flipPressed && canFlip(this.flipState, onGround)) {
      this.flipState = applyFlip(this.flipState, onGround);
      this.jumpState = onFlip(this.jumpState);
      this.setVelocityY(0);
      this.applyGravityVisuals();
      this.scene.events.emit('gravity-flipped', this.gravityDir);
      // gravity-flipped はリスポーン時にも出るので、演出用に自分で反転したときだけ出す
      this.scene.events.emit('player-flipped');
      playSfx(this.scene, SFX.flip);
    }

    body.setGravityY(GRAVITY * this.gravityDir);
    this.setFlipY(this.gravityDir === -1);

    if (this.flipState.airFlipAvailable) this.clearTint();
    else this.setTint(0x888888);

    // アニメ: 接地中は走り/待機、空中は足元から離れる向きならジャンプ、足元へ向かうなら落下
    let anim = 'pinkIdle';
    if (onGround) anim = vx !== 0 ? 'pinkRun' : 'pinkIdle';
    else anim = body.velocity.y * dir < 0 ? 'pinkJump' : 'pinkFall';
    this.view.play(anim, true);
    this.lastVy = body.velocity.y;
  }

  // ミスしたときのアニメ。死亡中は update が呼ばれないので GameScene から呼ぶ
  playHit() {
    this.view.play('pinkHit', true);
  }

  // 体のオフセットを足元側へ移し替える。
  applyGravityVisuals() {
    shiftBodyToFeet(this, this.gravityDir, BODY_OFF_X, OFF_Y_DOWN, OFF_Y_UP);
  }
}

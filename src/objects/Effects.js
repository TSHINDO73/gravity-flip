import { shouldDust, squashScale, shakeIntensity } from '../logic/fxRules.js';
import { LENGTH_SCALE, SCALE } from '../config.js';

// 演出の値はここにまとめる（控えめ・短めが方針）
const DEPTH = 50;
const DOT = 'fx-dot';
const SQUASH_MS = 120;
// 長さ(px)の値は 1 マス 36px 時代の値に LENGTH_SCALE を掛けて、マス単位の大きさを保つ
const L = (v) => v * LENGTH_SCALE;
const range = (min, max) => ({ min: L(min), max: L(max) });
const DUST = { count: 4, lifespan: 300, speed: range(40, 90), gravity: L(300) };
const RING = { from: L(10), to: L(40), alpha: 0.6, ms: 250, width: 2 };
const COIN = { count: 6, lifespan: 300, speed: range(60, 120), tint: 0xffe066 };
const STOMP = { shakeMs: 80, shake: 0.004, count: 6, lifespan: 300, speed: range(60, 140) };
const DEATH = { shakeMs: 150, shake: 0.006, count: 10, lifespan: 400, speed: range(80, 180), tint: 0xff8080 };
const GOAL = { count: 20, lifespan: 600, speed: range(120, 260), gravity: L(300) };

// 演出係。シーンごとに作る
export class Effects {
  constructor(scene, { player }) {
    this.scene = scene;
    this.player = player;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!scene.textures.exists(DOT)) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1).fillCircle(2, 2, 2).generateTexture(DOT, 4, 4);
      g.destroy();
    }
  }

  jump() {
    this.squash('jump');
  }

  // 小さな段差やリスポーン直後(勢い 0 以下)では潰さない
  land(impact) {
    if (impact <= 0) return;
    this.squash('land');
    if (!shouldDust(impact)) return;
    const { player } = this;
    const dir = player.gravityDir;
    // 足元の左右へ、床から離れる向きに跳ねて、重力の向きに落ちる。角度は 0=右、90=下
    const up = dir === 1 ? -1 : 1;
    const left = up < 0 ? { min: 200, max: 230 } : { min: 130, max: 160 };
    const right = up < 0 ? { min: 310, max: 340 } : { min: 20, max: 50 };
    for (const angle of [left, right]) {
      this.burst(player.x, player.feetY, {
        count: DUST.count / 2,
        lifespan: DUST.lifespan,
        speed: DUST.speed,
        angle,
        gravityY: DUST.gravity * dir,
        texture: 'dust',
        scale: { start: SCALE, end: SCALE * 0.4 },
      });
    }
  }

  flip() {
    const { scene, player } = this;
    const ring = scene.add.circle(player.x, player.y, RING.from).setStrokeStyle(RING.width, 0xffffff, 1).setDepth(DEPTH);
    ring.isFilled = false;
    ring.setAlpha(RING.alpha);
    scene.tweens.add({
      targets: ring,
      radius: RING.to,
      alpha: 0,
      duration: RING.ms,
      onComplete: () => ring.destroy(),
    });
  }

  coin(x, y) {
    this.burst(x, y, { count: COIN.count, lifespan: COIN.lifespan, speed: COIN.speed, tint: COIN.tint });
  }

  stomp(x, y) {
    this.shake(STOMP.shakeMs, STOMP.shake);
    this.burst(x, y, { count: STOMP.count, lifespan: STOMP.lifespan, speed: STOMP.speed });
  }

  death(x, y) {
    this.shake(DEATH.shakeMs, DEATH.shake);
    this.burst(x, y, { count: DEATH.count, lifespan: DEATH.lifespan, speed: DEATH.speed, tint: DEATH.tint });
  }

  // 上向きに舞って、ゆっくり落ちる
  goal(x, y) {
    // 紙吹雪は素材の 6 色のコマから選ぶ。1 コマが 16px の正方形なので小さく縮めて紙片にする
    this.burst(x, y, {
      count: GOAL.count, lifespan: GOAL.lifespan, speed: GOAL.speed, angle: { min: 240, max: 300 }, gravityY: GOAL.gravity,
      texture: 'confetti', frame: [0, 1, 2, 3, 4, 5], scale: { start: 0.4, end: 0.25 },
    });
  }

  shake(ms, base) {
    const intensity = shakeIntensity(base, this.reducedMotion);
    if (intensity > 0) this.scene.cameras.main.shake(ms, intensity);
  }

  // 伸び縮み。重なったときに固まらないよう、前のトゥイーンを止めてから必ず 1 に戻す
  squash(kind) {
    const { scene, player } = this;
    scene.tweens.killTweensOf(player.squash);
    Object.assign(player.squash, squashScale(kind));
    scene.tweens.add({ targets: player.squash, x: 1, y: 1, duration: SQUASH_MS, ease: 'Quad.easeOut' });
  }

  // 粒を一度だけ出して、寿命が来たら片付ける
  burst(x, y, { count, lifespan, speed, angle = { min: 0, max: 360 }, gravityY = 0, tint = 0xffffff, texture = DOT, frame, scale = { start: 1, end: 0.3 } }) {
    const emitter = this.scene.add.particles(x, y, texture, {
      ...(frame ? { frame } : {}),
      speed,
      angle,
      lifespan,
      gravityY,
      tint,
      scale,
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    emitter.setDepth(DEPTH);
    emitter.explode(count);
    this.scene.time.delayedCall(lifespan + 50, () => emitter.destroy());
  }
}

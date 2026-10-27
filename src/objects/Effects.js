import { shouldDust, squashScale, shakeIntensity } from '../logic/fxRules.js';

// 演出の値はここにまとめる（控えめ・短めが方針）
const DEPTH = 50;
const DOT = 'fx-dot';
const SQUASH_MS = 120;
const DUST = { count: 4, lifespan: 300, speed: { min: 40, max: 90 }, gravity: 300, tint: 0xdddddd };
const RING = { from: 10, to: 40, alpha: 0.6, ms: 250, width: 2 };
const COIN = { count: 6, lifespan: 300, speed: { min: 60, max: 120 }, tint: 0xffe066 };
const HUD_PULSE = { scale: 1.1, ms: 50 }; // 行きと戻りで計 0.1 秒
const STOMP = { shakeMs: 80, shake: 0.004, count: 6, lifespan: 300, speed: { min: 60, max: 140 } };
const DEATH = { shakeMs: 150, shake: 0.006, count: 10, lifespan: 400, speed: { min: 80, max: 180 }, tint: 0xff8080 };
const GOAL = { count: 20, lifespan: 600, speed: { min: 120, max: 260 }, colors: [0xff6b6b, 0xffe066, 0x6bff9e, 0x6bc8ff, 0xd06bff] };

// 演出係。シーンごとに作る
export class Effects {
  constructor(scene, { player, hud }) {
    this.scene = scene;
    this.player = player;
    this.hud = hud;
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
        tint: DUST.tint,
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
    const { scene, hud } = this;
    scene.tweens.killTweensOf(hud);
    hud.setScale(1);
    scene.tweens.add({ targets: hud, scale: HUD_PULSE.scale, duration: HUD_PULSE.ms, yoyo: true });
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
    this.burst(x, y, { count: GOAL.count, lifespan: GOAL.lifespan, speed: GOAL.speed, angle: { min: 240, max: 300 }, gravityY: 300, tint: GOAL.colors });
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
  burst(x, y, { count, lifespan, speed, angle = { min: 0, max: 360 }, gravityY = 0, tint = 0xffffff }) {
    const emitter = this.scene.add.particles(x, y, DOT, {
      speed,
      angle,
      lifespan,
      gravityY,
      tint,
      scale: { start: 1, end: 0.3 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    emitter.setDepth(DEPTH);
    emitter.explode(count);
    this.scene.time.delayedCall(lifespan + 50, () => emitter.destroy());
  }
}

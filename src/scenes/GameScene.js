import { GAME_W, GAME_H, TILE, SCALE } from '../config.js';
import { IMG, FRAMES } from '../assetKeys.js';
import { LEVELS } from '../levels/levels.js';
import { parseLevel } from '../levels/parseLevel.js';
import { Player } from '../objects/Player.js';
import { Enemy } from '../objects/Enemy.js';
import { jumpVelocityY } from '../logic/jumpRules.js';
import { isOutOfBounds, isStomp } from '../logic/combatRules.js';

const SPIKE_HIT = TILE * 0.6;
const DEATH_BLINK_MS = 500;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    const { stage = 0, coins = 0, elapsedMs = 0 } = data || {};
    this.stage = stage;
    this.coins = coins;
    this.elapsedMs = elapsedMs;
    this.coinsAtStageStart = coins;
    this.elapsedAtStageStart = elapsedMs;
    this.isDead = false;
  }

  tileCenter(cell) {
    return { x: cell.col * TILE + TILE / 2, y: cell.row * TILE + TILE / 2 };
  }

  create() {
    try {
      if (!LEVELS[this.stage]) throw new Error(`ステージ${this.stage + 1}は存在しません`);
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

    this.respawnPoint = this.level.start;
    this.player = new Player(this, 0, 0);
    this.placePlayerAt(this.respawnPoint);
    this.physics.add.collider(this.player, this.solidLayer);

    // トゲ: 当たり判定は見た目より小さく(タイルの60%)。絵はマスの根元側半分に描かれているので根元側に寄せる
    this.spikeGroup = this.physics.add.staticGroup();
    for (const sp of this.level.spikes) {
      const p = this.tileCenter(sp);
      this.add.image(p.x, p.y, IMG.tiles, FRAMES.spike).setScale(SCALE).setFlipY(sp.dir === 'down');
      const tipShift = (TILE - SPIKE_HIT) / 2;
      const zone = this.add.zone(p.x, p.y + (sp.dir === 'up' ? tipShift : -tipShift), SPIKE_HIT, SPIKE_HIT);
      this.physics.add.existing(zone, true);
      this.spikeGroup.add(zone);
    }
    this.physics.add.overlap(this.player, this.spikeGroup, () => this.killPlayer());

    // 中間旗
    this.flags = this.physics.add.staticGroup();
    for (const cell of this.level.checkpoints) {
      const p = this.tileCenter(cell);
      const flag = this.flags.create(p.x, p.y, IMG.tiles, FRAMES.checkpoint).setScale(SCALE).refreshBody();
      flag.cell = cell;
      flag.setAlpha(0.6);
    }
    this.physics.add.overlap(this.player, this.flags, (pl, flag) => {
      if (this.isDead) return;
      this.respawnPoint = flag.cell;
      this.flags.getChildren().forEach((f) => { f.clearTint(); f.setAlpha(0.6); });
      flag.setAlpha(1);
      flag.setTint(0xffe040);
    });

    // 歩く敵
    this.enemies = this.add.group();
    for (const cell of this.level.enemies) {
      const p = this.tileCenter(cell);
      this.enemies.add(new Enemy(this, p.x, p.y + TILE / 2));
    }
    this.physics.add.collider(this.enemies, this.solidLayer);
    this.physics.add.overlap(this.player, this.enemies, (pl, enemy) => this.onTouchEnemy(enemy));
    const onFlip = (dir) => {
      this.enemies.getChildren().forEach((e) => e.setGravityDir(dir));
    };
    this.events.on('gravity-flipped', onFlip);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off('gravity-flipped', onFlip));

    this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    const cam = this.cameras.main;
    if (h < GAME_H) {
      cam.setBounds(0, -(GAME_H - h) / 2, w, GAME_H);
    } else {
      cam.setBounds(0, 0, w, h);
    }
    cam.startFollow(this.player, true, 1, 1);
  }

  // セルの下端に足を置く(スタート・再開共通)
  placePlayerAt(cell) {
    const c = this.tileCenter(cell);
    this.player.body.enable = true;
    this.player.setAlpha(1);
    this.player.respawn(c.x, c.y + TILE / 2);
  }

  isSolidAt(col, row) {
    if (col < 0 || row < 0 || row >= this.level.height || col >= this.level.width) return false;
    return this.level.solid[row][col];
  }

  onTouchEnemy(enemy) {
    if (this.isDead || enemy.dying) return;
    const pl = this.player;
    const stomp = isStomp({
      playerVy: pl.body.velocity.y,
      gravity: pl.gravityDir,
      playerFeetY: pl.feetY,
      enemyCenterY: enemy.body.center.y,
    });
    if (stomp) {
      enemy.stomp();
      pl.setVelocityY(jumpVelocityY(pl.gravityDir) * 0.6);
    } else {
      this.killPlayer();
    }
  }

  killPlayer() {
    if (this.isDead) return;
    this.isDead = true;
    const pl = this.player;
    pl.setVelocity(0, 0);
    pl.body.setGravityY(0);
    pl.body.enable = false;
    this.tweens.add({ targets: pl, alpha: 0.2, duration: DEATH_BLINK_MS / 8, yoyo: true, repeat: 3 });
    this.time.delayedCall(DEATH_BLINK_MS, () => this.respawnPlayer());
  }

  respawnPlayer() {
    this.tweens.killTweensOf(this.player);
    this.placePlayerAt(this.respawnPoint);
    this.events.emit('gravity-flipped', 1);
    this.isDead = false;
  }

  restartStage() {
    this.scene.restart({ stage: this.stage, coins: this.coinsAtStageStart, elapsedMs: this.elapsedAtStageStart });
  }

  update(time, delta) {
    if (!this.player) return;
    if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
      this.restartStage();
      return;
    }
    const levelH = this.level.height * TILE;
    for (const e of this.enemies.getChildren().slice()) {
      e.update((c, r) => this.isSolidAt(c, r));
      if (!e.dying && isOutOfBounds(e.y, levelH, TILE)) e.destroy();
    }
    if (this.isDead) return;
    this.player.update(time, delta);
    if (isOutOfBounds(this.player.y, this.level.height * TILE, TILE)) this.killPlayer();
  }
}

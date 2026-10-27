import { GAME_W, GAME_H, TILE, SCALE } from '../config.js';
import { IMG, FRAMES, SFX } from '../assetKeys.js';
import { LEVELS } from '../levels/levels.js';
import { parseLevel } from '../levels/parseLevel.js';
import { Player } from '../objects/Player.js';
import { Enemy } from '../objects/Enemy.js';
import { Controls } from '../objects/Controls.js';
import { Effects } from '../objects/Effects.js';
import { TouchPad, isTouchDevice } from '../objects/TouchPad.js';
import { jumpVelocityY } from '../logic/jumpRules.js';
import { formatTime } from '../logic/format.js';
import { playSfx } from '../objects/sfx.js';
import { isOutOfBounds, isStomp } from '../logic/combatRules.js';

const SPIKE_HIT = TILE * 0.6;
const DEATH_BLINK_MS = 500;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    const { stage = 0, coins = 0, elapsedMs = 0, fullRun = false } = data || {};
    this.stage = stage;
    // タイトルから1面を始めた通しプレイだけをベスト記録の対象にする
    this.fullRun = fullRun;
    this.coins = coins;
    this.elapsedMs = elapsedMs;
    this.coinsAtStageStart = coins;
    this.isDead = false;
    this.reachedGoal = false;
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
      const block = this.solidLayer.create(p.x, p.y, IMG.tiles, FRAMES.block).setScale(SCALE).refreshBody();
      // 隣もブロックの面(壁の内側の継ぎ目)は当たり判定を切る。壁の途中に「着地」して引っかかるのを防ぐ
      const { col, row } = cell;
      const cc = block.body.checkCollision;
      cc.up = !this.isSolidAt(col, row - 1);
      cc.down = !this.isSolidAt(col, row + 1);
      cc.left = !this.isSolidAt(col - 1, row);
      cc.right = !this.isSolidAt(col + 1, row);
      cc.none = !(cc.up || cc.down || cc.left || cc.right);
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

    // コイン
    this.coinGroup = this.physics.add.staticGroup();
    for (const cell of this.level.coins) {
      const p = this.tileCenter(cell);
      this.coinGroup.create(p.x, p.y, IMG.tiles, FRAMES.coin).setScale(SCALE).refreshBody();
    }
    this.physics.add.overlap(this.player, this.coinGroup, (pl, coin) => {
      if (this.isDead || !coin.active) return;
      coin.destroy();
      this.coins++;
      playSfx(this, SFX.coin);
    });

    // ゴール
    const gp = this.tileCenter(this.level.goal);
    this.goal = this.physics.add.staticImage(gp.x, gp.y, IMG.tiles, FRAMES.goal).setScale(SCALE).refreshBody();
    this.physics.add.overlap(this.player, this.goal, () => this.onGoal());

    // HUD
    this.hud = this.add
      .text(12, 10, '', { fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 })
      .setScrollFactor(0)
      .setDepth(100);
    this.updateHud();

    // 演出
    this.effects = new Effects(this, { player: this.player, hud: this.hud });
    const fxHandlers = {
      'player-jumped': () => this.effects.jump(),
      'player-landed': (impact) => this.effects.land(impact),
      'player-flipped': () => this.effects.flip(),
    };
    for (const [ev, fn] of Object.entries(fxHandlers)) this.events.on(ev, fn);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const [ev, fn] of Object.entries(fxHandlers)) this.events.off(ev, fn);
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

    this.controls = new Controls(this, isTouchDevice() ? new TouchPad(this) : null);

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
    if (this.isDead || this.reachedGoal) return;
    this.isDead = true;
    const pl = this.player;
    pl.setVelocity(0, 0);
    pl.body.setGravityY(0);
    pl.body.enable = false;
    this.tweens.add({ targets: pl, alpha: 0.2, duration: DEATH_BLINK_MS / 8, yoyo: true, repeat: 3 });
    this.time.delayedCall(DEATH_BLINK_MS, () => this.respawnPlayer());
    playSfx(this, SFX.die);
  }

  respawnPlayer() {
    this.tweens.killTweensOf(this.player);
    this.placePlayerAt(this.respawnPoint);
    this.events.emit('gravity-flipped', 1);
    this.isDead = false;
  }

  onGoal() {
    if (this.isDead || this.reachedGoal) return;
    this.reachedGoal = true;
    this.player.setVelocity(0, 0);
    this.player.body.enable = false;
    const { stage, coins, elapsedMs, fullRun } = this;
    this.time.delayedCall(400, () => {
      if (stage < LEVELS.length - 1) this.scene.restart({ stage: stage + 1, coins, elapsedMs, fullRun });
      else this.scene.start('ClearScene', { coins, elapsedMs, fullRun });
    });
    playSfx(this, SFX.clear);
  }

  updateHud() {
    this.hud.setText(`ステージ ${this.stage + 1}/${LEVELS.length}　コイン ${this.coins}　タイム ${formatTime(this.elapsedMs)}`);
  }

  // やり直し: コインはステージ開始時に戻すが、タイムは戻さない(経過時間をそのまま引き継ぐ)
  restartStage() {
    this.scene.restart({ stage: this.stage, coins: this.coinsAtStageStart, elapsedMs: this.elapsedMs, fullRun: this.fullRun });
  }

  update(time, delta) {
    if (!this.player) return;
    const input = this.controls.update();
    // ゴール後の画面切り替え待ちの間はやり直しを受け付けない(クリアが消えるため)
    if (!this.reachedGoal && input.restartPressed) {
      this.restartStage();
      return;
    }
    const levelH = this.level.height * TILE;
    for (const e of this.enemies.getChildren().slice()) {
      e.update((c, r) => this.isSolidAt(c, r));
      if (!e.dying && isOutOfBounds(e.y, levelH, TILE)) e.destroy();
    }
    if (!this.isDead && !this.reachedGoal) this.elapsedMs += delta;
    this.updateHud();
    if (this.isDead || this.reachedGoal) return;
    this.player.update(time, delta, input);
    if (isOutOfBounds(this.player.y, this.level.height * TILE, TILE)) this.killPlayer();
  }
}

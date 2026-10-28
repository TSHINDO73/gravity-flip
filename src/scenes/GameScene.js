import { TILE, SCALE, HUD_H, PLAY_W, PLAY_H, BUFFER_MS, TOUCH_BUFFER_MS } from '../config.js';
import { SFX } from '../assetKeys.js';
import { autotile } from '../logic/autotile.js';
import { LEVELS } from '../levels/levels.js';
import { parseLevel } from '../levels/parseLevel.js';
import { Player } from '../objects/Player.js';
import { Enemy } from '../objects/Enemy.js';
import { Controls } from '../objects/Controls.js';
import { Effects } from '../objects/Effects.js';
import { Background, STAGE_SKIES } from '../objects/Background.js';
import { isTouchDevice } from '../objects/TouchPad.js';
import { jumpVelocityY } from '../logic/jumpRules.js';
import { playSfx } from '../objects/sfx.js';
import { isOutOfBounds, isStomp, spikeHitbox } from '../logic/combatRules.js';

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
        .text(this.scale.width / 2, this.scale.height / 2, e.message, {
          fontFamily: 'sans-serif',
          fontSize: '24px',
          color: '#ff3030',
          wordWrap: { width: this.scale.width - 80 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      this.scene.pause();
      return;
    }

    this.background = new Background(this, STAGE_SKIES[this.stage % STAGE_SKIES.length], { width: PLAY_W, height: PLAY_H });

    const w = this.level.width * TILE;
    const h = this.level.height * TILE;

    this.physics.world.setBounds(0, -TILE * 3, w, h + TILE * 6);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this.solidLayer = this.physics.add.staticGroup();
    for (const cell of this.level.blocks) {
      const p = this.tileCenter(cell);
      const tile = autotile((c, r) => this.isSolidOrOutside(c, r), cell.col, cell.row);
      const block = this.solidLayer.create(p.x, p.y, 'terrain', tile.frame).setScale(SCALE).setFlipY(tile.flipY).refreshBody();
      // 隣もブロックの面(壁の内側の継ぎ目)は当たり判定を切る。壁の途中に「着地」して引っかかるのを防ぐ
      const { col, row } = cell;
      const cc = block.body.checkCollision;
      cc.up = !this.isSolidAt(col, row - 1);
      cc.down = !this.isSolidAt(col, row + 1);
      cc.left = !this.isSolidAt(col - 1, row);
      cc.right = !this.isSolidAt(col + 1, row);
      cc.none = !(cc.up || cc.down || cc.left || cc.right);
    }

    this.fillOutside();

    this.respawnPoint = this.level.start;
    this.player = new Player(this, 0, 0, { bufferMs: isTouchDevice() ? TOUCH_BUFFER_MS : BUFFER_MS });
    this.placePlayerAt(this.respawnPoint);
    this.physics.add.collider(this.player, this.solidLayer);

    // トゲ: 当たり判定は絵(マスの根元側 7/16)より少し小さく、根元側に寄せる(spikeHitbox)
    this.spikeGroup = this.physics.add.staticGroup();
    for (const sp of this.level.spikes) {
      const p = this.tileCenter(sp);
      this.add.image(p.x, p.y, 'spike').setScale(SCALE).setFlipY(sp.dir === 'down');
      const hit = spikeHitbox(p.x, p.y, sp.dir, TILE);
      const zone = this.add.zone(hit.x, hit.y, hit.w, hit.h);
      this.physics.add.existing(zone, true);
      this.spikeGroup.add(zone);
    }
    this.physics.add.overlap(this.player, this.spikeGroup, () => this.killPlayer());

    // 中間旗: 絵は大きい(4 マス)が、当たり判定は 1 マスのゾーン。通過した旗だけ旗を立てる
    this.flags = this.physics.add.staticGroup();
    for (const cell of this.level.checkpoints) {
      const p = this.tileCenter(cell);
      const zone = this.add.zone(p.x, p.y, TILE, TILE);
      this.physics.add.existing(zone, true);
      zone.cell = cell;
      zone.image = this.add.sprite(p.x, p.y + TILE / 2, 'cpNoFlag').setOrigin(0.5, 1).setScale(SCALE);
      this.flags.add(zone);
    }
    this.physics.add.overlap(this.player, this.flags, (pl, flag) => {
      if (this.isDead || this.respawnPoint === flag.cell) return;
      this.respawnPoint = flag.cell;
      for (const f of this.flags.getChildren()) {
        if (f !== flag) f.image.stop().setTexture('cpNoFlag');
      }
      flag.image.play('cpOut').chain('cpIdle');
    });

    // コイン
    this.coinGroup = this.physics.add.staticGroup();
    for (const cell of this.level.coins) {
      const p = this.tileCenter(cell);
      // 絵は 2 マス分の大きさ。当たり判定は 1 マスに縮める
      const coin = this.coinGroup.create(p.x, p.y, 'apple').setScale(SCALE).refreshBody();
      coin.body.setSize(TILE, TILE);
      coin.play('apple');
    }
    this.physics.add.overlap(this.player, this.coinGroup, (pl, coin) => {
      if (this.isDead || !coin.active) return;
      this.effects.coin(coin.x, coin.y);
      const got = this.add.sprite(coin.x, coin.y, 'collected').setScale(SCALE).play('collected');
      got.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => got.destroy());
      coin.destroy();
      this.coins++;
      playSfx(this, SFX.coin);
    });

    // ゴール
    const gp = this.tileCenter(this.level.goal);
    this.add.image(gp.x, gp.y + TILE / 2, 'end').setOrigin(0.5, 1).setScale(SCALE);
    this.goal = this.add.zone(gp.x, gp.y, TILE, TILE);
    this.physics.add.existing(this.goal, true);
    this.physics.add.overlap(this.player, this.goal, () => this.onGoal());

    // HUD とスマホのボタンは UIScene(プレイ画面の外側)に描く。やり直しやステージ移動では起動し直さない
    const touch = isTouchDevice();
    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene', { touch });
    this.scene.bringToTop('UIScene');

    // 演出
    this.effects = new Effects(this, { player: this.player });
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

    // UIScene の作成はこのフレームの後になるので、TouchPad は使う時点で取りに行く
    const ui = this.scene.get('UIScene');
    const touchPad = { update: () => (ui.touchPad ? ui.touchPad.update() : new Set()) };
    this.controls = new Controls(this, touch ? touchPad : null);

    // カメラはプレイ画面(960x480)だけを映す。HUD とボタンはその外側
    const cam = this.cameras.main;
    cam.setViewport((this.scale.width - PLAY_W) / 2, HUD_H, PLAY_W, PLAY_H);
    if (h < PLAY_H) {
      cam.setBounds(0, -(PLAY_H - h) / 2, w, PLAY_H);
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

  // ステージがプレイ画面より低いとき、上下の余白を土で埋めて、地面と天井が画面の端まで続いて見えるようにする(見た目だけ)
  fillOutside() {
    const { width, height } = this.level;
    const extra = Math.ceil(Math.max(0, PLAY_H - height * TILE) / 2 / TILE);
    if (extra === 0) return;
    for (let c = 0; c < width; c++) {
      for (let i = 1; i <= extra; i++) {
        if (this.level.solid[0][c]) this.add.image(c * TILE + TILE / 2, -i * TILE + TILE / 2, 'terrain', 29).setScale(SCALE);
        if (this.level.solid[height - 1][c]) this.add.image(c * TILE + TILE / 2, (height - 1 + i) * TILE + TILE / 2, 'terrain', 29).setScale(SCALE);
      }
    }
  }

  // オートタイル用: ステージの外はブロックがあるものとして扱う(端のブロックに余計な縁を付けない)
  isSolidOrOutside(col, row) {
    if (col < 0 || row < 0 || row >= this.level.height || col >= this.level.width) return true;
    return this.level.solid[row][col];
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
      this.effects.stomp(enemy.x, enemy.y);
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
    pl.playHit();
    this.effects.death(pl.x, pl.y);
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
      else {
        this.scene.stop('UIScene');
        this.scene.start('ClearScene', { coins, elapsedMs, fullRun });
      }
    });
    this.effects.goal(this.goal.x, this.goal.y);
    playSfx(this, SFX.clear);
  }

  updateHud() {
    this.game.events.emit('hud-update', { stage: this.stage + 1, coins: this.coins, elapsedMs: this.elapsedMs });
  }

  // やり直し: コインはステージ開始時に戻すが、タイムは戻さない(経過時間をそのまま引き継ぐ)
  restartStage() {
    this.scene.restart({ stage: this.stage, coins: this.coinsAtStageStart, elapsedMs: this.elapsedMs, fullRun: this.fullRun });
  }

  update(time, delta) {
    if (!this.player) return;
    this.background.update(this.cameras.main.scrollX);
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

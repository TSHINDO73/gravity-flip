import { test, assertEqual, assertTrue } from './runner.js';
import { TILE, GRAVITY, JUMP_VELOCITY, RUN_SPEED, MAX_FALL_SPEED, ENEMY_SPEED, layoutFor } from '../src/config.js';

// リメイク前は 1 マス 36px。長さの定数を 8/9 倍して、マス単位の動きを同じに保つ
const OLD = { tile: 36, gravity: 1400, jump: 560, run: 220, fall: 900, enemy: 60 };
const near = (a, b) => Math.abs(a - b) < 1e-9;

test('scale: ジャンプで届く高さ（マス数）が今と同じ', () => {
  const oldTiles = (OLD.jump * OLD.jump) / (2 * OLD.gravity) / OLD.tile;
  const newTiles = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY) / TILE;
  assertTrue(near(oldTiles, newTiles), `${oldTiles} vs ${newTiles}`);
});

test('scale: 走る速さ・落ちる速さ・敵の速さ（マス/秒）が今と同じ', () => {
  assertTrue(near(OLD.run / OLD.tile, RUN_SPEED / TILE));
  assertTrue(near(OLD.fall / OLD.tile, MAX_FALL_SPEED / TILE));
  assertTrue(near(OLD.enemy / OLD.tile, ENEMY_SPEED / TILE));
});

test('scale: ジャンプの滞空時間が今と同じ', () => {
  assertTrue(near(OLD.jump / OLD.gravity, JUMP_VELOCITY / GRAVITY));
});

test('layoutFor: PC とタッチ', () => {
  assertEqual(layoutFor(false), { width: 960, height: 540, playX: 0, playY: 60, hudX: 0 });
  assertEqual(layoutFor(true), { width: 1280, height: 540, playX: 160, playY: 60, hudX: 160 });
});

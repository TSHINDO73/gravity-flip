import { test, assertTrue } from './runner.js';
import { isStomp, isOutOfBounds, spikeHitbox } from '../src/logic/combatRules.js';

test('stomp: 重力下・上から落ちてくる', () =>
  assertTrue(isStomp({ playerVy: 200, gravity: 1, playerFeetY: 100, enemyCenterY: 110 })));
test('stomp: 重力下・横から（足元が中心より下）', () =>
  assertTrue(!isStomp({ playerVy: 200, gravity: 1, playerFeetY: 120, enemyCenterY: 110 })));
test('stomp: 重力下・上昇中は踏めない', () =>
  assertTrue(!isStomp({ playerVy: -200, gravity: 1, playerFeetY: 100, enemyCenterY: 110 })));
test('stomp: 重力上・下から上へ落ちてくる', () =>
  assertTrue(isStomp({ playerVy: -200, gravity: -1, playerFeetY: 120, enemyCenterY: 110 })));
test('stomp: 重力上・横から', () =>
  assertTrue(!isStomp({ playerVy: -200, gravity: -1, playerFeetY: 100, enemyCenterY: 110 })));
test('outOfBounds', () => {
  assertTrue(isOutOfBounds(-37, 540, 36)); assertTrue(isOutOfBounds(577, 540, 36));
  assertTrue(!isOutOfBounds(0, 540, 36)); assertTrue(!isOutOfBounds(576, 540, 36));
});

// トゲの絵はマスの根元側 7/16 しかない。判定は幅 0.6・高さ 0.4 マスで根元に寄せ、絵より少し小さくする
test('spikeHitbox: 床トゲは根元(下)に寄せる', () => {
  const h = spikeHitbox(16, 16, 'up', 32);
  assertTrue(Math.abs(h.w - 19.2) < 1e-9 && Math.abs(h.h - 12.8) < 1e-9, JSON.stringify(h));
  assertTrue(Math.abs(h.x - 16) < 1e-9 && Math.abs(h.y - 25.6) < 1e-9, JSON.stringify(h));
});

test('spikeHitbox: 天井トゲは根元(上)に寄せる', () => {
  const h = spikeHitbox(16, 16, 'down', 32);
  assertTrue(Math.abs(h.y - 6.4) < 1e-9, JSON.stringify(h));
});

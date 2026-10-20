import { test, assertTrue } from './runner.js';
import { isStomp, isOutOfBounds } from '../src/logic/combatRules.js';

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

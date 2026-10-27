import { test, assertEqual } from './runner.js';
import { LAND_DUST_MIN_SPEED, landingImpact, shouldDust, squashScale, shakeIntensity } from '../src/logic/fxRules.js';

test('landingImpact: 重力の向きに合わせて足元へ向かう速さ', () => {
  assertEqual(landingImpact(500, 1), 500);
  assertEqual(landingImpact(-500, -1), 500);
});

test('landingImpact: 足元から離れる向きは負', () => {
  assertEqual(landingImpact(-500, 1), -500);
});

test('shouldDust: 境界は 350', () => {
  assertEqual(LAND_DUST_MIN_SPEED, 350);
  assertEqual(shouldDust(349), false);
  assertEqual(shouldDust(350), true);
  assertEqual(shouldDust(landingImpact(-400, -1)), true);
  assertEqual(shouldDust(landingImpact(-400, 1)), false);
});

test('squashScale: ジャンプと着地', () => {
  assertEqual(squashScale('jump'), { x: 0.85, y: 1.15 });
  assertEqual(squashScale('land'), { x: 1.2, y: 0.8 });
});

test('shakeIntensity: 視差効果を減らす設定なら 0', () => {
  assertEqual(shakeIntensity(0.006, true), 0);
  assertEqual(shakeIntensity(0.006, false), 0.006);
});

import { test, assertEqual, assertTrue } from './runner.js';
import { createFlipState, canFlip, applyFlip, onLand } from '../src/logic/flipRules.js';

test('flip: 接地中は何度でも反転', () => {
  let s = createFlipState();
  s = applyFlip(s, true); s = applyFlip(s, true); s = applyFlip(s, true);
  assertEqual(s, { gravity: -1, airFlipAvailable: true });
});
test('flip: 空中は1回だけ', () => {
  let s = applyFlip(createFlipState(), false);
  assertEqual(s, { gravity: -1, airFlipAvailable: false });
  assertTrue(!canFlip(s, false));
  assertEqual(applyFlip(s, false), s);
});
test('flip: 接地反転の後でも空中で1回反転できる', () => {
  const s = applyFlip(createFlipState(), true);
  assertTrue(canFlip(s, false));
});
test('flip: 着地で回復', () => {
  const s = onLand(applyFlip(createFlipState(), false));
  assertEqual(s, { gravity: -1, airFlipAvailable: true });
});
test('flip: 元の状態を書き換えない', () => {
  const s = createFlipState(); applyFlip(s, false);
  assertEqual(s, { gravity: 1, airFlipAvailable: true });
});

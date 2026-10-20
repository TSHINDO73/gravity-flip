import { test, assertEqual, assertTrue } from './runner.js';
import { createJumpState, markGrounded, markPressed, shouldJump, consumeJump, jumpVelocityY } from '../src/logic/jumpRules.js';

test('jump: 接地中に押せば跳ぶ', () => {
  const js = markPressed(createJumpState(), 1000);
  assertTrue(shouldJump(js, 1000, true));
});
test('jump: コヨーテタイム100ms以内', () => {
  const js = markPressed(markGrounded(createJumpState(), 1000), 1100);
  assertTrue(shouldJump(js, 1100, false));
  assertTrue(!shouldJump(markPressed(js, 1101), 1101, false));
});
test('jump: 先行入力100ms以内', () => {
  const js = markPressed(createJumpState(), 1000);
  assertTrue(shouldJump(js, 1100, true));
  assertTrue(!shouldJump(js, 1101, true));
});
test('jump: consume後は跳ばない', () => {
  const js = consumeJump(markPressed(createJumpState(), 1000));
  assertTrue(!shouldJump(js, 1000, true));
});
test('jump: 初速は足元から離れる向き', () => {
  assertEqual(jumpVelocityY(1), -560);
  assertEqual(jumpVelocityY(-1), 560);
});

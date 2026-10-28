import { test, assertEqual, assertTrue } from './runner.js';
import { JUMP_VELOCITY, TOUCH_BUFFER_MS } from '../src/config.js';
import { createJumpState, markGrounded, markPressed, shouldJump, consumeJump, onFlip, jumpVelocityY } from '../src/logic/jumpRules.js';

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
  assertEqual(jumpVelocityY(1), -JUMP_VELOCITY);
  assertEqual(jumpVelocityY(-1), JUMP_VELOCITY);
});
test('jump: 反転直後はコヨーテ無効(古い床へのジャンプを防ぐ)', () => {
  const js = onFlip(markGrounded(createJumpState(), 1000));
  assertTrue(!shouldJump(markPressed(js, 1050), 1050, false));
});
test('jump: 反転しても先行入力は残る', () => {
  const js = onFlip(markPressed(createJumpState(), 1000));
  assertEqual(js.lastPressedAt, 1000);
  assertTrue(shouldJump(js, 1050, true));
});

// スマホは着地直前のタップを取りこぼしやすいので、先行入力の猶予を長くできる
test('jump: 先行入力の猶予を指定できる(スマホは 150ms)', () => {
  const js = markPressed(createJumpState(), 1000);
  assertTrue(!shouldJump(js, 1150, true));
  assertTrue(shouldJump(js, 1150, true, TOUCH_BUFFER_MS));
  assertTrue(!shouldJump(js, 1151, true, TOUCH_BUFFER_MS));
});

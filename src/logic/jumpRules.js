import { COYOTE_MS, BUFFER_MS, JUMP_VELOCITY } from '../config.js';

export function createJumpState() {
  return { lastGroundedAt: -Infinity, lastPressedAt: -Infinity };
}

export function markGrounded(js, now) {
  return { ...js, lastGroundedAt: now };
}

export function markPressed(js, now) {
  return { ...js, lastPressedAt: now };
}

// bufferMs: 先行入力の猶予(押してから着地するまで、何 ms 以内なら跳ぶか)
export function shouldJump(js, now, onGround, bufferMs = BUFFER_MS) {
  return (onGround || now - js.lastGroundedAt <= COYOTE_MS) &&
    now - js.lastPressedAt <= bufferMs;
}

export function consumeJump(js) {
  return { ...js, lastGroundedAt: -Infinity, lastPressedAt: -Infinity };
}

// 重力反転時: 古い床でのコヨーテ猶予だけ消す(先行入力は残す)
export function onFlip(js) {
  return { ...js, lastGroundedAt: -Infinity };
}

export function jumpVelocityY(gravity) {
  return -JUMP_VELOCITY * gravity;
}

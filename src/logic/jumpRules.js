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

export function shouldJump(js, now, onGround) {
  return (onGround || now - js.lastGroundedAt <= COYOTE_MS) &&
    now - js.lastPressedAt <= BUFFER_MS;
}

export function consumeJump(js) {
  return { ...js, lastGroundedAt: -Infinity, lastPressedAt: -Infinity };
}

export function jumpVelocityY(gravity) {
  return -JUMP_VELOCITY * gravity;
}

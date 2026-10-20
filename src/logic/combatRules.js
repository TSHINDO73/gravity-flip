export function isStomp({ playerVy, gravity, playerFeetY, enemyCenterY }) {
  return playerVy * gravity > 0 && (enemyCenterY - playerFeetY) * gravity > 0;
}

export function isOutOfBounds(y, levelHeightPx, margin) {
  return y < -margin || y > levelHeightPx + margin;
}

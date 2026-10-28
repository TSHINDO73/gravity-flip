export function isStomp({ playerVy, gravity, playerFeetY, enemyCenterY }) {
  return playerVy * gravity > 0 && (enemyCenterY - playerFeetY) * gravity > 0;
}

export function isOutOfBounds(y, levelHeightPx, margin) {
  return y < -margin || y > levelHeightPx + margin;
}

// トゲの当たり判定(中心 x, y と幅・高さ)。絵はマスの根元側 7/16 にしかないので、
// 幅 0.6・高さ 0.4 マスの箱を根元側に寄せて、絵より少し小さくする(見た目で触れていないのにミスにならないように)
export function spikeHitbox(cx, cy, dir, tile) {
  const w = tile * 0.6;
  const h = tile * 0.4;
  const shift = (tile - h) / 2;
  return { x: cx, y: cy + (dir === 'up' ? shift : -shift), w, h };
}

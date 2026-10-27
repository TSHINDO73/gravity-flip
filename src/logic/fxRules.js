// この勢い(px/秒)未満の着地では砂ぼこりを出さない。1マス程度の段差では出ない値
export const LAND_DUST_MIN_SPEED = 350;

const SQUASH = {
  jump: { x: 0.85, y: 1.15 },
  land: { x: 1.2, y: 0.8 },
};

// 足元へ向かう速さ。足元から離れる向きなら負になる
export function landingImpact(lastVy, gravityDir) {
  return lastVy * gravityDir;
}

export function shouldDust(impact) {
  return impact >= LAND_DUST_MIN_SPEED;
}

export function squashScale(kind) {
  return { ...SQUASH[kind] };
}

// 視差効果を減らす設定の端末では画面を揺らさない
export function shakeIntensity(base, reducedMotion) {
  return reducedMotion ? 0 : base;
}

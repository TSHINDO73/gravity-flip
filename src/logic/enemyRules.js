// 敵が歩く先の、足元の 1 マス先（重力の向き側）のマス。ここにブロックが無ければ崖なので引き返す。
// 体の中心ではなく足元の位置で決める（体が 1 マスより高いと、中心の行は足元の行とずれるため）
export function aheadGroundCell(feetX, feetY, walkDir, halfWidth, gravityDir, tile) {
  const col = Math.floor((feetX + walkDir * (halfWidth + 1)) / tile);
  const row = Math.floor((feetY - gravityDir) / tile) + gravityDir;
  return { col, row };
}

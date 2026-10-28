// キャラの背が約 1.6 マスあるので、高さ 1 マス分しか空いていない場所は通れない。そうしたマスを探す。
// ・上下ともブロックにはさまれたマス
// ・真下(天井歩きなら真上)は穴でも、隣の床から歩いて入ると頭の上がブロックのマス
export function findLowGaps(rows) {
  const solid = (r, c) => rows[r][c] === '#';
  const open = (r, c) => c >= 0 && c < rows[r].length && !solid(r, c);
  // 隣(d 側)の床に立ったキャラが、そのまま横へ歩いて (r, c) に入ろうとしている
  const walkInFromFloor = (r, c, d) => open(r, c + d) && open(r - 1, c + d) && !open(r + 1, c + d) && c + d >= 0 && c + d < rows[r].length;
  const walkInFromCeiling = (r, c, d) => open(r, c + d) && open(r + 1, c + d) && !open(r - 1, c + d) && c + d >= 0 && c + d < rows[r].length;
  const gaps = [];
  for (let r = 1; r < rows.length - 1; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (solid(r, c)) continue;
      const above = solid(r - 1, c);
      const below = solid(r + 1, c);
      const low =
        (above && below) ||
        (above && !below && (walkInFromFloor(r, c, -1) || walkInFromFloor(r, c, 1))) ||
        (below && !above && (walkInFromCeiling(r, c, -1) || walkInFromCeiling(r, c, 1)));
      if (low) gaps.push({ col: c, row: r });
    }
  }
  return gaps;
}

// 敵を踏むのに十分な高さ(敵のマスを含めて 4 マス)が無い敵を探す。
// 主人公(約 1.6 マス)と敵(約 1.4 マス)を縦に重ねると約 3 マス。踏むための跳び出しの余裕に 1 マス足す
const ENEMY_HEADROOM = 4;
export function findCrampedEnemies(rows) {
  const cramped = [];
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== 'E') continue;
      let h = 0;
      while (r - h >= 0 && rows[r - h][c] !== '#') h++;
      if (h < ENEMY_HEADROOM) cramped.push({ col: c, row: r });
    }
  });
  return cramped;
}

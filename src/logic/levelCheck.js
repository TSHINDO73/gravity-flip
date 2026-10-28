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

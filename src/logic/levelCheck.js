// 上下ともブロックにはさまれた、ブロックでないマス（高さ 1 マスの空間）を探す。
// キャラの背が約 1.6 マスあるので、こうしたマスは通れない
export function findLowGaps(rows) {
  const gaps = [];
  for (let r = 1; r < rows.length - 1; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c] !== '#' && rows[r - 1][c] === '#' && rows[r + 1][c] === '#') gaps.push({ col: c, row: r });
    }
  }
  return gaps;
}

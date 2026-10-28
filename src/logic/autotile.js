// 地形シート（16px、1 行 22 枚）の草と土の 3x3 は列 6〜8・行 0〜2 にある
const SHEET_COLS = 22;
const COL_LEFT = 6;
const COL_MID = 7;
const COL_RIGHT = 8;
const ROW_GRASS = 0;
const ROW_DIRT = 1;

// 周りのブロックの有無から、そのブロックに使うタイルを選ぶ。
// 天井も歩く場所なので、下が空いている面には草を上下反転して付ける
export function autotile(isSolid, col, row) {
  const up = !isSolid(col, row - 1);
  const down = !isSolid(col, row + 1);
  const left = !isSolid(col - 1, row);
  const right = !isSolid(col + 1, row);
  const r = up || down ? ROW_GRASS : ROW_DIRT;
  let c = COL_MID;
  if (left && !right) c = COL_LEFT;
  else if (right && !left) c = COL_RIGHT;
  return { frame: r * SHEET_COLS + c, flipY: !up && down };
}

// 点数 = 持ち点 30000 - タイムの秒数 × 100 + りんご × 50(1 個 = 0.5 秒ぶん)。多いほど良い。
// タイムは画面と同じ 0.1 秒単位で数え、0 点より下にはしない
export const BASE_POINTS = 30000;
const POINTS_PER_TENTH = 10;
const POINTS_PER_APPLE = 50;

export function scorePoints({ timeMs, coins }) {
  const tenths = Math.floor(timeMs / 100);
  return Math.max(0, BASE_POINTS - tenths * POINTS_PER_TENTH + coins * POINTS_PER_APPLE);
}

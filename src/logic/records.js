// 前の版('gravity-flip-best')はタイムとりんごを別々の回から取っていたので、別の名前で保存し直す
const KEY = 'gravity-flip-best-v2';

const isCount = (n) => Number.isInteger(n) && n >= 0;
// タイムはフレーム時間の合計なので小数になる
const isTime = (n) => Number.isFinite(n) && n >= 0;

// 点数 = 持ち点 30000 - タイムの秒数 × 100 + りんご × 50(1 個 = 0.5 秒ぶん)。多いほど良い。
// タイムは画面と同じ 0.1 秒単位で数え、0 点より下にはしない
export const BASE_POINTS = 30000;
const POINTS_PER_TENTH = 10;
const POINTS_PER_APPLE = 50;

export function scorePoints({ timeMs, coins }) {
  const tenths = Math.floor(timeMs / 100);
  return Math.max(0, BASE_POINTS - tenths * POINTS_PER_TENTH + coins * POINTS_PER_APPLE);
}

// 記録は 1 回のプレイのタイムとりんごの組。点数が良いときだけ組ごと入れ替える(同点は前の記録)
export function mergeBest(prev, run) {
  const isNew = !prev || scorePoints(run) > scorePoints(prev);
  return { best: isNew ? { timeMs: run.timeMs, coins: run.coins } : prev, isNew };
}

export function parseBest(raw) {
  if (raw == null) return null;
  try {
    const { timeMs, coins } = JSON.parse(raw);
    return isTime(timeMs) && isCount(coins) ? { timeMs, coins } : null;
  } catch {
    return null;
  }
}

// プライベートブラウズなどで保存できなくてもゲームは止めない
export function loadBest(storage = browserStorage()) {
  try {
    return parseBest(storage.getItem(KEY));
  } catch {
    return null;
  }
}

export function saveBest(best, storage = browserStorage()) {
  try {
    storage.setItem(KEY, JSON.stringify(best));
  } catch {
    // 保存できない環境では記録を諦める
  }
}

export function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}



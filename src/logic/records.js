// 前の版('gravity-flip-best')はタイムとりんごを別々の回から取っていたので、別の名前で保存し直す
const KEY = 'gravity-flip-best-v2';

const isCount = (n) => Number.isInteger(n) && n >= 0;
// タイムはフレーム時間の合計なので小数になる
const isTime = (n) => Number.isFinite(n) && n >= 0;

// 点数 = タイム - りんご 1 個につき 1 秒。少ないほど良い
export const APPLE_BONUS_MS = 1000;

export function scoreMs({ timeMs, coins }) {
  return timeMs - coins * APPLE_BONUS_MS;
}

// 記録は 1 回のプレイのタイムとりんごの組。点数が良いときだけ組ごと入れ替える(同点は前の記録)
export function mergeBest(prev, run) {
  const isNew = !prev || scoreMs(run) < scoreMs(prev);
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


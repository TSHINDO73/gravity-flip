const KEY = 'gravity-flip-best';

const isCount = (n) => Number.isInteger(n) && n >= 0;
// タイムはフレーム時間の合計なので小数になる
const isTime = (n) => Number.isFinite(n) && n >= 0;

// タイムは短いほど、コインは多いほど良い。2つは別々に比べる
export function mergeBest(prev, run) {
  if (!prev) return { best: { ...run }, newTime: true, newCoins: run.coins > 0 };
  const newTime = run.timeMs < prev.timeMs;
  const newCoins = run.coins > prev.coins;
  return {
    best: { timeMs: newTime ? run.timeMs : prev.timeMs, coins: newCoins ? run.coins : prev.coins },
    newTime,
    newCoins,
  };
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

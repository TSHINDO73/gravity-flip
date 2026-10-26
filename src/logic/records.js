const KEY = 'gravity-flip-best';

const isCount = (n) => Number.isInteger(n) && n >= 0;

// タイムは短いほど、コインは多いほど良い。2つは別々に比べる
export function mergeBest(prev, run) {
  if (!prev) return { best: { ...run }, newTime: true, newCoins: true };
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
    return isCount(timeMs) && isCount(coins) ? { timeMs, coins } : null;
  } catch {
    return null;
  }
}

// プライベートブラウズなどで保存できなくてもゲームは止めない
export function loadBest(storage) {
  try {
    return parseBest(storage.getItem(KEY));
  } catch {
    return null;
  }
}

export function saveBest(storage, best) {
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

import { normalizeName, compareRuns } from './ranking.js';

// 自分の上位3件と名前をブラウザに保存する。プライベートブラウズなどで保存できなくてもゲームは止めない
const TOP3_KEY = 'gravity-flip-top3';
const NAME_KEY = 'gravity-flip-name';
// 1 件だけのベスト記録を持っていた前の版の保存先。上位3件がまだなければ 1 件目として引き継ぐ
const OLD_BEST_KEY = 'gravity-flip-best-v2';

const isCount = (n) => Number.isInteger(n) && n >= 0;
// タイムはフレーム時間の合計なので小数になる
const isTime = (n) => Number.isFinite(n) && n >= 0;
const isEntry = (e) => e && isTime(e.timeMs) && isCount(e.coins) && typeof e.at === 'string';

function read(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // 保存できない環境では諦める
  }
}

export function loadTop3(storage = browserStorage()) {
  const list = read(storage, TOP3_KEY);
  if (list !== null) {
    if (!Array.isArray(list) || !list.every(isEntry)) return [];
    return list.map(({ timeMs, coins, at }) => ({ timeMs, coins, at })).sort(compareRuns).slice(0, 3);
  }
  const old = read(storage, OLD_BEST_KEY);
  return old && isTime(old.timeMs) && isCount(old.coins) ? [{ timeMs: old.timeMs, coins: old.coins, at: '' }] : [];
}

export function saveTop3(list, storage = browserStorage()) {
  write(storage, TOP3_KEY, list);
}

export function loadName(storage = browserStorage()) {
  return normalizeName(read(storage, NAME_KEY));
}

export function saveName(name, storage = browserStorage()) {
  write(storage, NAME_KEY, name);
}

export function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

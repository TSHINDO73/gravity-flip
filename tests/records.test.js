import { test, assertEqual } from './runner.js';
import { mergeBest, parseBest, loadBest, saveBest } from '../src/logic/records.js';

test('mergeBest: 初回は両方とも新記録', () => {
  assertEqual(mergeBest(null, { timeMs: 90000, coins: 10 }), {
    best: { timeMs: 90000, coins: 10 },
    newTime: true,
    newCoins: true,
  });
});

test('mergeBest: タイムだけ更新', () => {
  assertEqual(mergeBest({ timeMs: 90000, coins: 10 }, { timeMs: 80000, coins: 5 }), {
    best: { timeMs: 80000, coins: 10 },
    newTime: true,
    newCoins: false,
  });
});

test('mergeBest: コインだけ更新', () => {
  assertEqual(mergeBest({ timeMs: 90000, coins: 10 }, { timeMs: 95000, coins: 12 }), {
    best: { timeMs: 90000, coins: 12 },
    newTime: false,
    newCoins: true,
  });
});

test('mergeBest: 同じ記録は更新扱いにしない', () => {
  assertEqual(mergeBest({ timeMs: 90000, coins: 10 }, { timeMs: 90000, coins: 10 }), {
    best: { timeMs: 90000, coins: 10 },
    newTime: false,
    newCoins: false,
  });
});

test('parseBest: 正しいデータを読む', () => {
  assertEqual(parseBest('{"timeMs":90000,"coins":10}'), { timeMs: 90000, coins: 10 });
});

test('parseBest: 壊れたデータや無いデータは null', () => {
  assertEqual(parseBest(null), null);
  assertEqual(parseBest('not json'), null);
  assertEqual(parseBest('{"timeMs":"abc","coins":10}'), null);
  assertEqual(parseBest('{"timeMs":-1,"coins":10}'), null);
  assertEqual(parseBest('{"timeMs":90000}'), null);
});

function fakeStorage() {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
  };
}

const brokenStorage = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('blocked'); },
};

test('saveBest / loadBest: 保存したものを読み戻せる', () => {
  const s = fakeStorage();
  assertEqual(loadBest(s), null);
  saveBest(s, { timeMs: 90000, coins: 10 });
  assertEqual(loadBest(s), { timeMs: 90000, coins: 10 });
});

// 実際のタイムはフレーム時間の合計なので小数になる
test('saveBest / loadBest: 小数のタイムも読み戻せる', () => {
  const s = fakeStorage();
  saveBest(s, { timeMs: 83456.78, coins: 10 });
  assertEqual(loadBest(s), { timeMs: 83456.78, coins: 10 });
});

test('saveBest / loadBest: 保存できない環境でも止まらない', () => {
  assertEqual(loadBest(brokenStorage), null);
  saveBest(brokenStorage, { timeMs: 90000, coins: 10 });
  assertEqual(loadBest(null), null);
  saveBest(null, { timeMs: 90000, coins: 10 });
});

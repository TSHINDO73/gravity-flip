import { test, assertEqual } from './runner.js';
import { mergeBest, parseBest, loadBest, saveBest, scoreMs, APPLE_BONUS_MS } from '../src/logic/records.js';

test('scoreMs: タイムからりんご1個につき1秒引く', () => {
  assertEqual(APPLE_BONUS_MS, 1000);
  assertEqual(scoreMs({ timeMs: 80000, coins: 15 }), 65000);
  assertEqual(scoreMs({ timeMs: 30000, coins: 35 }), -5000);
});

test('mergeBest: 初回は新記録', () => {
  assertEqual(mergeBest(null, { timeMs: 90000, coins: 0 }), { best: { timeMs: 90000, coins: 0 }, isNew: true });
});

test('mergeBest: 点数が良ければその回のタイムとりんごを組で残す', () => {
  // 前回 90.0 秒・10 個 = 80.0、今回 95.0 秒・20 個 = 75.0
  assertEqual(mergeBest({ timeMs: 90000, coins: 10 }, { timeMs: 95000, coins: 20 }), {
    best: { timeMs: 95000, coins: 20 },
    isNew: true,
  });
});

test('mergeBest: タイムが速くても点数が悪ければ前の組のまま（混ぜない）', () => {
  // 今回 85.0 秒・2 個 = 83.0 は 80.0 より悪い
  assertEqual(mergeBest({ timeMs: 90000, coins: 10 }, { timeMs: 85000, coins: 2 }), {
    best: { timeMs: 90000, coins: 10 },
    isNew: false,
  });
});

test('mergeBest: 同じ点数は前の記録を残す', () => {
  assertEqual(mergeBest({ timeMs: 90000, coins: 10 }, { timeMs: 91000, coins: 11 }), {
    best: { timeMs: 90000, coins: 10 },
    isNew: false,
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
  saveBest({ timeMs: 90000, coins: 10 }, s);
  assertEqual(loadBest(s), { timeMs: 90000, coins: 10 });
});

// 実際のタイムはフレーム時間の合計なので小数になる
test('saveBest / loadBest: 小数のタイムも読み戻せる', () => {
  const s = fakeStorage();
  saveBest({ timeMs: 83456.78, coins: 10 }, s);
  assertEqual(loadBest(s), { timeMs: 83456.78, coins: 10 });
});

// 前の版はタイムとりんごを別々の回から取っていたので、その記録は読まない
test('loadBest: 前の版の記録は読まない', () => {
  const s = fakeStorage();
  s.setItem('gravity-flip-best', '{"timeMs":90000,"coins":10}');
  assertEqual(loadBest(s), null);
});

test('saveBest / loadBest: 保存できない環境でも止まらない', () => {
  assertEqual(loadBest(brokenStorage), null);
  saveBest({ timeMs: 90000, coins: 10 }, brokenStorage);
  assertEqual(loadBest(null), null);
  saveBest({ timeMs: 90000, coins: 10 }, null);
});

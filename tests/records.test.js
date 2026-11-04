import { test, assertEqual } from './runner.js';
import { mergeBest, parseBest, loadBest, saveBest, scorePoints } from '../src/logic/records.js';

// 点数 = 30000 - タイム(0.1 秒単位)の秒数 × 100 + りんご × 50。多いほど良い
test('scorePoints: 持ち点からタイムで減り、りんごで増える', () => {
  assertEqual(scorePoints({ timeMs: 80000, coins: 15 }), 22750);
  assertEqual(scorePoints({ timeMs: 0, coins: 0 }), 30000);
});

test('scorePoints: 画面のタイムと同じ 0.1 秒単位で数える', () => {
  // 80.099 秒は画面では 1:20.0
  assertEqual(scorePoints({ timeMs: 80099, coins: 15 }), 22750);
});

test('scorePoints: 0 点より下にはならない', () => {
  assertEqual(scorePoints({ timeMs: 400000, coins: 0 }), 0);
});

test('mergeBest: 初回は新記録', () => {
  assertEqual(mergeBest(null, { timeMs: 90000, coins: 0 }), { best: { timeMs: 90000, coins: 0 }, isNew: true });
});

test('mergeBest: 点数が良ければその回のタイムとりんごを組で残す', () => {
  // 前回 90.0 秒・10 個 = 21500 点、今回 85.0 秒・4 個 = 21700 点(りんごは前回より少ないが混ぜない)
  assertEqual(mergeBest({ timeMs: 90000, coins: 10 }, { timeMs: 85000, coins: 4 }), {
    best: { timeMs: 85000, coins: 4 },
    isNew: true,
  });
});

test('mergeBest: りんごが多くても点数が悪ければ前の組のまま', () => {
  // 今回 95.0 秒・15 個 = 21250 点は 21500 点より悪い
  assertEqual(mergeBest({ timeMs: 90000, coins: 10 }, { timeMs: 95000, coins: 15 }), {
    best: { timeMs: 90000, coins: 10 },
    isNew: false,
  });
});

test('mergeBest: 同じ点数は前の記録を残す', () => {
  // 91.0 秒・12 個 = 21500 点
  assertEqual(mergeBest({ timeMs: 90000, coins: 10 }, { timeMs: 91000, coins: 12 }), {
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

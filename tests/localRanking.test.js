import { test, assertEqual } from './runner.js';
import { loadTop3, saveTop3, loadName, saveName } from '../src/logic/localRanking.js';

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

test('loadTop3: 保存したものを読み戻せる', () => {
  const s = fakeStorage();
  assertEqual(loadTop3(s), []);
  const list = [{ timeMs: 70000, coins: 5, at: '2026-11-09T01:00:00.000Z' }, { timeMs: 83456.78, coins: 15, at: '2026-11-09T02:00:00.000Z' }];
  saveTop3(list, s);
  assertEqual(loadTop3(s), list);
});

test('loadTop3: 前の BEST を 1 件目として引き継ぐ', () => {
  const s = fakeStorage();
  s.setItem('gravity-flip-best-v2', '{"timeMs":80000,"coins":15}');
  assertEqual(loadTop3(s), [{ timeMs: 80000, coins: 15, at: '' }]);
});

test('loadTop3: 上位3件があれば前の BEST は見ない', () => {
  const s = fakeStorage();
  s.setItem('gravity-flip-best-v2', '{"timeMs":80000,"coins":15}');
  saveTop3([{ timeMs: 70000, coins: 5, at: 'x' }], s);
  assertEqual(loadTop3(s), [{ timeMs: 70000, coins: 5, at: 'x' }]);
});

test('loadTop3: 壊れたデータは空、4 件以上は 3 件まで、並びを直す', () => {
  const s = fakeStorage();
  s.setItem('gravity-flip-top3', 'not json');
  assertEqual(loadTop3(s), []);
  s.setItem('gravity-flip-top3', '[{"timeMs":-1,"coins":0,"at":""}]');
  assertEqual(loadTop3(s), []);
  const r = (t, c, at) => ({ timeMs: t, coins: c, at });
  s.setItem('gravity-flip-top3', JSON.stringify([r(90000, 0, 'a'), r(70000, 5, 'b'), r(80000, 15, 'c'), r(60000, 0, 'd')]));
  assertEqual(loadTop3(s), [r(60000, 0, 'd'), r(70000, 5, 'b'), r(80000, 15, 'c')]);
});

test('loadName / saveName: ルールに合う名前だけ', () => {
  const s = fakeStorage();
  assertEqual(loadName(s), null);
  saveName('しんどう', s);
  assertEqual(loadName(s), 'しんどう');
  s.setItem('gravity-flip-name', '<b>bad</b>');
  assertEqual(loadName(s), null);
});

test('保存できない環境でも止まらない', () => {
  assertEqual(loadTop3(brokenStorage), []);
  saveTop3([], brokenStorage);
  assertEqual(loadName(brokenStorage), null);
  saveName('たろう', brokenStorage);
  assertEqual(loadTop3(null), []);
  assertEqual(loadName(null), null);
});

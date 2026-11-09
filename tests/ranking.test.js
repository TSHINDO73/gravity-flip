import { test, assertEqual } from './runner.js';
import { normalizeName, isValidRun, compareRuns, mergeTop, MAX_COINS, MIN_TIME_MS, MAX_TIME_MS } from '../src/logic/ranking.js';

test('normalizeName: 使える文字', () => {
  assertEqual(normalizeName('しんどう'), 'しんどう');
  assertEqual(normalizeName('シンドー'), 'シンドー');
  assertEqual(normalizeName('進藤'), '進藤');
  assertEqual(normalizeName('Taro2'), 'Taro2');
  assertEqual(normalizeName('ＴＡＲＯ１'), 'ＴＡＲＯ１');
  assertEqual(normalizeName('ｼﾝﾄﾞｳ'), 'ｼﾝﾄﾞｳ');
  assertEqual(normalizeName('  たろう '), 'たろう');
  assertEqual(normalizeName('𠮷田'), '𠮷田'); // サロゲートペアも 1 文字
});

test('normalizeName: 使えない名前は null', () => {
  for (const bad of ['', '   ', 'たろう じろう', 'abcdefg', 'あいうえおかき', '<script>', "a';DROP", 'ab😀', 'a​b', 'a‮b', 'た!', '　']) {
    assertEqual(normalizeName(bad), null, JSON.stringify(bad));
  }
});

test('isValidRun: タイムとりんごの範囲', () => {
  assertEqual(MAX_COINS, 77);
  assertEqual(isValidRun({ timeMs: MIN_TIME_MS, coins: 0 }), true);
  assertEqual(isValidRun({ timeMs: 44900, coins: 0 }), false);
  assertEqual(isValidRun({ timeMs: MAX_TIME_MS, coins: 77 }), true);
  assertEqual(isValidRun({ timeMs: MAX_TIME_MS + 1, coins: 0 }), false);
  assertEqual(isValidRun({ timeMs: 80000, coins: 78 }), false);
  assertEqual(isValidRun({ timeMs: 80000, coins: 1.5 }), false);
  assertEqual(isValidRun({ timeMs: '80000', coins: 1 }), false);
  assertEqual(isValidRun({ timeMs: 80000.5, coins: 1 }), true); // タイムはフレーム時間の合計で小数
});

test('compareRuns: 点数の高い順、同点は先に出したほうが上', () => {
  const a = { timeMs: 80000, coins: 15, at: '2026-11-01T00:00:00.000Z' }; // 22750
  const b = { timeMs: 70000, coins: 5, at: '2026-11-02T00:00:00.000Z' };  // 23250
  const c = { timeMs: 81000, coins: 17, at: '2026-11-03T00:00:00.000Z' }; // 22750
  assertEqual([a, b, c].sort(compareRuns), [b, a, c]);
});

test('mergeTop: 入った順位と入れ替えた一覧', () => {
  const r = (timeMs, coins, at) => ({ timeMs, coins, at });
  const list = [r(70000, 5, '1'), r(80000, 15, '2'), r(90000, 10, '3')]; // 23250, 22750, 21500
  assertEqual(mergeTop(list, r(75000, 10, '4'), 3), { list: [list[0], r(75000, 10, '4'), list[1]], rank: 2 });
  assertEqual(mergeTop(list, r(95000, 0, '4'), 3), { list, rank: null });
  assertEqual(mergeTop(list, r(81000, 17, '4'), 3), { list: [list[0], list[1], r(81000, 17, '4')], rank: 3 }); // 同点は後
  assertEqual(mergeTop([], r(90000, 0, '1'), 3), { list: [r(90000, 0, '1')], rank: 1 });
});

import { test, assertEqual } from './runner.js';
import { scorePoints } from '../src/logic/records.js';

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

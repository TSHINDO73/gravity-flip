import { test, assertEqual } from './runner.js';
import { aheadGroundCell } from '../src/logic/enemyRules.js';

test('aheadGroundCell: 重力下向き、右へ歩く', () => {
  // 足元 y=64（2 行目のブロックの上面）、x=40、半幅 14 → 先の x=55 → 列 1、足元の下の行 2
  assertEqual(aheadGroundCell(40, 64, 1, 14, 1, 32), { col: 1, row: 2 });
});

test('aheadGroundCell: 重力上向き、左へ歩く', () => {
  // 足元 y=64（1 行目のブロックの下面）、x=40 → 先の x=25 → 列 0、足元の上の行 1
  assertEqual(aheadGroundCell(40, 64, -1, 14, -1, 32), { col: 0, row: 1 });
});

test('aheadGroundCell: 背が高くても足元の位置で決まる', () => {
  // 体の中心が 1 つ上の行にあっても、足元 y=96 なら下の行 3 を見る
  assertEqual(aheadGroundCell(100, 96, 1, 14, 1, 32), { col: 3, row: 3 });
});

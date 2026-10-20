import { test, assertEqual, assertTrue, assertThrows } from './runner.js';
import { parseLevel } from '../src/levels/parseLevel.js';

const sample = [
  '##########',
  '#..v.....#',
  '#P.E.C^FG#',
  '##########',
];
test('parseLevel: サイズとsolid', () => {
  const lv = parseLevel(sample, 1);
  assertEqual([lv.width, lv.height], [10, 4]);
  assertTrue(lv.solid[0][0]); assertTrue(!lv.solid[2][1]);
  assertEqual(lv.blocks.length, 24);
});
test('parseLevel: 各オブジェクトの座標', () => {
  const lv = parseLevel(sample, 1);
  assertEqual(lv.start, { col: 1, row: 2 });
  assertEqual(lv.goal, { col: 8, row: 2 });
  assertEqual(lv.enemies, [{ col: 3, row: 2 }]);
  assertEqual(lv.coins, [{ col: 5, row: 2 }]);
  assertEqual(lv.checkpoints, [{ col: 7, row: 2 }]);
  assertEqual(lv.spikes, [{ col: 3, row: 1, dir: 'down' }, { col: 6, row: 2, dir: 'up' }]);
});
test('parseLevel: 不明な文字', () =>
  assertThrows(() => parseLevel(['#P#', '#x#', '#G#'], 2), 'ステージ2 2行2列: 不明な文字 "x"'));
test('parseLevel: 行の長さ不一致', () =>
  assertThrows(() => parseLevel(['#PG#', '#..#', '#.. #'], 1), 'ステージ1 3行'));
test('parseLevel: Pが無い', () => assertThrows(() => parseLevel(['#G#'], 1), 'ステージ1: スタート位置(P)'));
test('parseLevel: Pが2つ', () => assertThrows(() => parseLevel(['PPG'], 1), 'ステージ1 1行2列: スタート位置(P)が複数'));
test('parseLevel: Gが無い', () => assertThrows(() => parseLevel(['#P#'], 1), 'ステージ1: ゴール(G)'));
test('parseLevel: 16行はエラー', () =>
  assertThrows(() => parseLevel([...Array(15).fill('...'), 'PG.'], 3), 'ステージ3: 行数が15を超えています'));
test('parseLevel: 空配列', () => assertThrows(() => parseLevel([], 1), 'ステージ1:'));

import { test, assertEqual } from './runner.js';
import { findLowGaps } from '../src/logic/levelCheck.js';
import { LEVELS } from '../src/levels/levels.js';

test('findLowGaps: 上下にはさまれた空きマスを見つける', () => {
  assertEqual(findLowGaps(['###', '#.#', '###']), [{ col: 1, row: 1 }]);
  assertEqual(findLowGaps(['###', '#.#', '#.#', '###']), []);
});

// 真下は穴でも、隣の床から歩いて入ると高さ 1 マスしかない(ステージ 2 の序盤で実際に通れなかった形)。
// 両隣も、垂れ下がったブロックに逆さに立って横へ動くと床にぶつかるので、通れないマスになる
test('findLowGaps: 隣の床から入ると頭がぶつかるマス', () => {
  assertEqual(
    findLowGaps([
      '#####',
      '..#..',
      '.....',
      '##.##',
      '#####',
    ]),
    [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }],
  );
});

test('findLowGaps: 天井を歩くときも同じ(上下反転)', () => {
  assertEqual(
    findLowGaps([
      '#####',
      '##.##',
      '.....',
      '..#..',
      '#####',
    ]),
    [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }],
  );
});

test('findLowGaps: 一番上と一番下の行は対象外', () => {
  assertEqual(findLowGaps(['.', '#']), []);
});

// キャラの背が約 1.6 マスなので、高さ 1 マスの空間は通れない
test('findLowGaps: 全ステージに高さ1マスの空間が無い', () => {
  LEVELS.forEach((rows, i) => assertEqual(findLowGaps(rows), [], `stage ${i + 1}`));
});

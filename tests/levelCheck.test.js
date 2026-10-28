import { test, assertEqual } from './runner.js';
import { findLowGaps } from '../src/logic/levelCheck.js';
import { LEVELS } from '../src/levels/levels.js';

test('findLowGaps: 上下にはさまれた空きマスを見つける', () => {
  assertEqual(findLowGaps(['###', '#.#', '###']), [{ col: 1, row: 1 }]);
  assertEqual(findLowGaps(['###', '#.#', '#.#', '###']), []);
});

test('findLowGaps: 一番上と一番下の行は対象外', () => {
  assertEqual(findLowGaps(['.', '#']), []);
});

// キャラの背が約 1.6 マスなので、高さ 1 マスの空間は通れない
test('findLowGaps: 全ステージに高さ1マスの空間が無い', () => {
  LEVELS.forEach((rows, i) => assertEqual(findLowGaps(rows), [], `stage ${i + 1}`));
});

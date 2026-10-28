import { test, assertEqual } from './runner.js';
import { findLowGaps, findCrampedEnemies } from '../src/logic/levelCheck.js';
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

// 主人公(約 1.6 マス)が敵(約 1.4 マス)を無理なく踏むには、敵の列に高さ 4 マス以上の空間が要る。
// 3 マスだと踏める跳び出しの幅が約 20px しかなく、実測でもほぼ踏めなかった
test('findCrampedEnemies: 高さ 3 マス以下の通路にいる敵を見つける', () => {
  assertEqual(findCrampedEnemies(['#####', '#...#', '#...#', '#.E.#', '#####']), [{ col: 2, row: 3 }]);
  assertEqual(findCrampedEnemies(['#####', '#...#', '#...#', '#...#', '#.E.#', '#####']), []);
});

test('findCrampedEnemies: 全ステージの敵に踏める高さがある', () => {
  LEVELS.forEach((rows, i) => assertEqual(findCrampedEnemies(rows), [], `stage ${i + 1}`));
});

// キャラの背が約 1.6 マスなので、高さ 1 マスの空間は通れない
test('findLowGaps: 全ステージに高さ1マスの空間が無い', () => {
  LEVELS.forEach((rows, i) => assertEqual(findLowGaps(rows), [], `stage ${i + 1}`));
});

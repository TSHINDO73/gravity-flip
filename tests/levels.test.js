import { test, assertEqual, assertTrue } from './runner.js';
import { LEVELS } from '../src/levels/levels.js';
import { parseLevel } from '../src/levels/parseLevel.js';

test('levels: 3ステージある', () => assertEqual(LEVELS.length, 3));
test('levels: 全ステージが正しく読める', () => LEVELS.forEach((rows, i) => parseLevel(rows, i + 1)));
test('levels: 各ステージに敵がいる(2,3)', () => {
  assertTrue(parseLevel(LEVELS[1], 2).enemies.length > 0);
  assertTrue(parseLevel(LEVELS[2], 3).enemies.length > 0);
});
test('levels: 横60〜120マス・高さ11〜15行・中間旗1つ以上', () => {
  LEVELS.forEach((rows, i) => {
    const lv = parseLevel(rows, i + 1);
    assertTrue(lv.width >= 60 && lv.width <= 120, `ステージ${i + 1} 横${lv.width}`);
    assertTrue(lv.height >= 11 && lv.height <= 15, `ステージ${i + 1} 高さ${lv.height}`);
    assertTrue(lv.checkpoints.length >= 1, `ステージ${i + 1} 中間旗なし`);
  });
});

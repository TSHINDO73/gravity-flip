import { test, assertEqual } from './runner.js';
import { autotile } from '../src/logic/autotile.js';

// ステージの外はブロック扱い
const grid = (rows) => (c, r) => (r < 0 || r >= rows.length || c < 0 || c >= rows[0].length ? true : rows[r][c] === '#');

test('autotile: 上が空き → 草（反転なし）、左が空き → 左端', () => {
  assertEqual(autotile(grid(['...', '.##', '.##']), 1, 1), { frame: 6, flipY: false });
});

test('autotile: 上ふさがり・下が空き → 草を上下反転、右が空き → 右端', () => {
  assertEqual(autotile(grid(['##.', '##.', '...']), 1, 1), { frame: 8, flipY: true });
});

test('autotile: 四方ふさがり → 土の中央', () => {
  assertEqual(autotile(grid(['###', '###', '###']), 1, 1), { frame: 29, flipY: false });
});

test('autotile: ステージの外はブロック扱い', () => {
  assertEqual(autotile(grid(['#']), 0, 0), { frame: 29, flipY: false });
});

test('autotile: 左右とも空きは中央の列', () => {
  assertEqual(autotile(grid(['...', '.#.', '###']), 1, 1), { frame: 7, flipY: false });
});

test('autotile: 上下ふさがり・左が空き → 土の左端', () => {
  assertEqual(autotile(grid(['.##', '.##', '.##']), 1, 1), { frame: 28, flipY: false });
});

import { test, assertEqual } from './runner.js';
import { TILE, MAX_ROWS } from '../src/config.js';
test('config: タイルと行数', () => {
  assertEqual(TILE, 32);
  assertEqual(MAX_ROWS, 15);
});

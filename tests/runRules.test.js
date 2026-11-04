import { test, assertEqual } from './runner.js';
import { freshRun } from '../src/logic/runRules.js';

test('freshRun: 1-1 の最初から、タイムとりんごは 0 で、記録の対象にする', () => {
  assertEqual(freshRun(), { stage: 0, coins: 0, elapsedMs: 0, fullRun: true });
});

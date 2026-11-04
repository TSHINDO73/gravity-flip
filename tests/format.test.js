import { test, assertEqual } from './runner.js';
import { formatTime } from '../src/logic/format.js';

test('formatTime', () => {
  assertEqual(formatTime(0), '0:00.0');
  assertEqual(formatTime(65430), '1:05.4');
  assertEqual(formatTime(599999), '9:59.9');
});

// 点数はりんごを引くのでマイナスになることがある
test('formatTime: マイナス', () => {
  assertEqual(formatTime(-5000), '-0:05.0');
  assertEqual(formatTime(-65430), '-1:05.4');
});

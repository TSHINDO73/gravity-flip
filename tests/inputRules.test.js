import { test, assertEqual } from './runner.js';
import { TOUCH_BUTTONS, hitButton, pressedSet, diffPressed } from '../src/logic/inputRules.js';

const ids = (set) => [...set].sort();

test('hitButton: 中心・境界・外', () => {
  assertEqual(hitButton(TOUCH_BUTTONS, 80, 460), 'left');
  assertEqual(hitButton(TOUCH_BUTTONS, 80 + 45, 460), 'left');
  assertEqual(hitButton(TOUCH_BUTTONS, 80 + 46, 460), null);
  assertEqual(hitButton(TOUCH_BUTTONS, 910, 50), 'restart');
  assertEqual(hitButton(TOUCH_BUTTONS, 480, 270), null);
});

test('pressedSet: 指なし・1本・別々の2本', () => {
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [])), []);
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [{ x: 200, y: 460 }])), ['right']);
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [{ x: 200, y: 460 }, { x: 880, y: 460 }])), ['jump', 'right']);
});

test('pressedSet: 同じボタンに2本', () => {
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [{ x: 80, y: 460 }, { x: 90, y: 470 }])), ['left']);
});

test('pressedSet: ボタン外の指は無視', () => {
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [{ x: 480, y: 270 }, { x: 760, y: 460 }])), ['flip']);
});

test('diffPressed: 押した瞬間と離した瞬間', () => {
  const d = diffPressed(new Set(['left']), new Set(['left', 'jump']));
  assertEqual(ids(d.pressed), ['jump']);
  assertEqual(ids(d.released), []);
  const d2 = diffPressed(new Set(['left', 'jump']), new Set(['left']));
  assertEqual(ids(d2.pressed), []);
  assertEqual(ids(d2.released), ['jump']);
});

test('diffPressed: 指を←から→へ滑らせる', () => {
  const d = diffPressed(new Set(['left']), new Set(['right']));
  assertEqual(ids(d.pressed), ['right']);
  assertEqual(ids(d.released), ['left']);
});

test('diffPressed: 前フレームなしは差分なし', () => {
  const d = diffPressed(null, new Set(['restart', 'jump']));
  assertEqual(ids(d.pressed), []);
  assertEqual(ids(d.released), []);
});

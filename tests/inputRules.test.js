import { test, assertEqual } from './runner.js';
import { TOUCH_BUTTONS, hitButton, pressedSet, diffPressed } from '../src/logic/inputRules.js';

const ids = (set) => [...set].sort();

test('hitButton: 中心・境界・外', () => {
  // 座標はタッチ端末のゲーム全体(1280x540)基準。ボタンは左右の列にある
  assertEqual(hitButton(TOUCH_BUTTONS, 42, 430), 'left');
  assertEqual(hitButton(TOUCH_BUTTONS, 42 - 36, 430), 'left');
  assertEqual(hitButton(TOUCH_BUTTONS, 42 - 37, 430), null);
  assertEqual(hitButton(TOUCH_BUTTONS, 118, 430), 'right');
  assertEqual(hitButton(TOUCH_BUTTONS, 1200, 330), 'flip');
  assertEqual(hitButton(TOUCH_BUTTONS, 1200, 440), 'jump');
  assertEqual(hitButton(TOUCH_BUTTONS, 1200, 30), 'restart');
  // プレイ画面(160〜1120)の中はどのボタンにも当たらない
  assertEqual(hitButton(TOUCH_BUTTONS, 640, 300), null);
  assertEqual(hitButton(TOUCH_BUTTONS, 161, 430), null);
  assertEqual(hitButton(TOUCH_BUTTONS, 1119, 440), null);
});

test('pressedSet: 指なし・1本・別々の2本', () => {
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [])), []);
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [{ x: 118, y: 430 }])), ['right']);
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [{ x: 118, y: 430 }, { x: 1200, y: 440 }])), ['jump', 'right']);
});

test('pressedSet: 同じボタンに2本', () => {
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [{ x: 42, y: 430 }, { x: 50, y: 440 }])), ['left']);
});

test('pressedSet: ボタン外の指は無視', () => {
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [{ x: 640, y: 270 }, { x: 1200, y: 330 }])), ['flip']);
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

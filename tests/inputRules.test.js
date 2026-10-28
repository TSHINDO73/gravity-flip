import { test, assertEqual } from './runner.js';
import { TOUCH_BUTTONS, hitButton, pressedSet, diffPressed, jumpReleased } from '../src/logic/inputRules.js';

const ids = (set) => [...set].sort();

test('hitButton: 中心・境界・外', () => {
  // 座標はタッチ端末のゲーム全体(1280x540)基準。ボタンは左右の列にある
  assertEqual(hitButton(TOUCH_BUTTONS, 42, 430), 'left');
  assertEqual(hitButton(TOUCH_BUTTONS, 42 - 48, 430), 'left');
  assertEqual(hitButton(TOUCH_BUTTONS, 42, 430 + 49), null);
  assertEqual(hitButton(TOUCH_BUTTONS, 118, 430), 'right');
  assertEqual(hitButton(TOUCH_BUTTONS, 1200, 330), 'flip');
  assertEqual(hitButton(TOUCH_BUTTONS, 1200, 440), 'jump');
  assertEqual(hitButton(TOUCH_BUTTONS, 1200, 30), 'restart');
  // プレイ画面(160〜1120)の中はどのボタンにも当たらない
  assertEqual(hitButton(TOUCH_BUTTONS, 640, 300), null);
  assertEqual(hitButton(TOUCH_BUTTONS, 170, 430), null);
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

// 可変ジャンプ(離すと低くなる)はキーボードだけ。スマホは軽くタップしても最大の高さで跳ぶ
test('jumpReleased: キーを離したら可変ジャンプの「離した」になる', () => {
  assertEqual(jumpReleased(true, false), true);
  assertEqual(jumpReleased(true, true), false);
  assertEqual(jumpReleased(false, false), false);
});

// 見た目より広い反応範囲(hit)。重なった所では指に一番近いボタンが反応する
test('hitButton: 見た目より広い反応範囲', () => {
  assertEqual(hitButton(TOUCH_BUTTONS, 1200 + 70, 440), 'jump');
  assertEqual(hitButton(TOUCH_BUTTONS, 1200, 440 + 71), null);
  assertEqual(hitButton(TOUCH_BUTTONS, 42 - 48, 430), 'left');
  assertEqual(hitButton(TOUCH_BUTTONS, 118 + 48, 430), 'right');
  assertEqual(hitButton(TOUCH_BUTTONS, 1200, 330 - 56), 'flip');
  assertEqual(hitButton(TOUCH_BUTTONS, 1200 + 34, 30), 'restart');
  assertEqual(hitButton(TOUCH_BUTTONS, 1200, 30 + 35), null);
});

test('hitButton: 反応範囲が重なった所では一番近いボタン', () => {
  assertEqual(hitButton(TOUCH_BUTTONS, 78, 430), 'left'); // ← から 36、→ から 40
  assertEqual(hitButton(TOUCH_BUTTONS, 82, 430), 'right'); // ← から 40、→ から 36
  assertEqual(hitButton(TOUCH_BUTTONS, 1200, 380), 'flip'); // 反転から 50、ジャンプから 60
  assertEqual(hitButton(TOUCH_BUTTONS, 1200, 390), 'jump'); // 反転から 60、ジャンプから 50
});

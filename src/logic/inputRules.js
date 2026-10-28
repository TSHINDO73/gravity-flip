// タッチボタンの配置（タッチ端末のゲーム全体 1280x540 基準）。プレイ画面の外、左右の列に置く
export const TOUCH_BUTTONS = [
  { id: 'left', x: 42, y: 430, r: 36 },
  { id: 'right', x: 118, y: 430, r: 36 },
  { id: 'flip', x: 1200, y: 330, r: 40 },
  { id: 'jump', x: 1200, y: 440, r: 46 },
  { id: 'restart', x: 1200, y: 30, r: 26 },
];

export function hitButton(buttons, x, y) {
  for (const b of buttons) {
    const dx = x - b.x;
    const dy = y - b.y;
    if (dx * dx + dy * dy <= b.r * b.r) return b.id;
  }
  return null;
}

// 指ごとに乗っているボタンを集める。同じボタンに複数の指が乗っても1つ
export function pressedSet(buttons, points) {
  const set = new Set();
  for (const p of points) {
    const id = hitButton(buttons, p.x, p.y);
    if (id) set.add(id);
  }
  return set;
}

// prev が null（シーン開始直後）は基準を作るだけで、押した瞬間を出さない。
// 押しっぱなしの指でやり直しやジャンプが勝手に起きるのを防ぐ
export function diffPressed(prev, curr) {
  const pressed = new Set();
  const released = new Set();
  if (prev) {
    for (const id of curr) if (!prev.has(id)) pressed.add(id);
    for (const id of prev) if (!curr.has(id)) released.add(id);
  }
  return { pressed, released };
}

// 可変ジャンプの「離した」。キーボードの状態だけで決める(スマホのボタンは軽いタップでも最大の高さで跳ぶように、
// タッチの指を離しても跳び上がりを縮めない)
export function jumpReleased(prevKeyDown, keyDown) {
  return prevKeyDown && !keyDown;
}

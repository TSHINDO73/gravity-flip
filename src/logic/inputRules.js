// タッチボタンの配置（ゲーム画面 960x540 基準）
export const TOUCH_BUTTONS = [
  { id: 'left', x: 80, y: 460, r: 45, label: '←' },
  { id: 'right', x: 200, y: 460, r: 45, label: '→' },
  { id: 'flip', x: 760, y: 460, r: 45, label: '反転' },
  { id: 'jump', x: 880, y: 460, r: 45, label: 'ジャンプ' },
  { id: 'restart', x: 910, y: 50, r: 30, label: '↻' },
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

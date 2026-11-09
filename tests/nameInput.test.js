import { test, assertEqual } from './runner.js';
import { dialogParent } from '../src/ui/nameInput.js';

// 全画面のときは全画面になっている要素の外は描かれないので、名前入力はその中に置く
test('dialogParent: 全画面なら全画面の要素、そうでなければ body', () => {
  const body = { id: 'body' };
  const full = { id: 'game' };
  assertEqual(dialogParent({ body, fullscreenElement: full }), full);
  assertEqual(dialogParent({ body, fullscreenElement: null }), body);
});

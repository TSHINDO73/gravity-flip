import { test, assertTrue } from './runner.js';
import { GAME_PARENT } from '../src/config.js';

// iOS の Safari では、Phaser は親が body のとき高さを 100vh(バーを隠したときの高さ)で測る。
// タブやアドレスバーが出ているとその分だけ画面からはみ出すので、画面に固定した専用の箱を親にする
test('page: ゲームの親は画面に固定した専用の箱', async () => {
  const html = await (await fetch('../index.html', { cache: 'no-store' })).text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  assertTrue(GAME_PARENT !== 'body' && doc.getElementById(GAME_PARENT), `#${GAME_PARENT} がない`);
  const css = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  const rule = css.match(new RegExp(String.raw`#${GAME_PARENT}\s*\{([^}]*)\}`));
  assertTrue(rule && /position:\s*fixed/.test(rule[1]) && /inset:\s*0/.test(rule[1]), '画面に固定されていない');
});

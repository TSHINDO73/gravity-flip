import { test, assertEqual } from './runner.js';
import worker from '../server/src/index.js';

// IP_SALT が無いと送り元のハッシュが IP アドレスから逆算できてしまうので、記録を受け付けない
test('server: IP_SALT が無ければ記録を保存せず 500', async () => {
  let touched = false;
  const DB = { prepare: () => { touched = true; throw new Error('DB を使ってはいけない'); } };
  const req = new Request('http://x/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://tshindo73.github.io' },
    body: JSON.stringify({ name: 'たろう', timeMs: 80000, coins: 15 }),
  });
  const res = await worker.fetch(req, { DB });
  assertEqual(res.status, 500);
  assertEqual(touched, false);
});

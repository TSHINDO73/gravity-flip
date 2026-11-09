import { test, assertEqual } from './runner.js';
import { rankingApiBase, submitRun, fetchTop } from '../src/net/rankingApi.js';
import { RANKING_API_PROD } from '../src/config.js';

const ok = (body) => async () => ({ ok: true, json: async () => body });

test('rankingApiBase: 本番と手元', () => {
  assertEqual(rankingApiBase({ hostname: 'localhost' }), 'http://localhost:8787');
  assertEqual(rankingApiBase({ hostname: '192.168.40.243' }), 'http://192.168.40.243:8787');
  assertEqual(rankingApiBase({ hostname: 'tshindo73.github.io' }), RANKING_API_PROD);
});

test('submitRun: 送った内容と返事', async () => {
  let sent;
  const fetchFn = async (url, init) => { sent = { url, init }; return { ok: true, json: async () => ({ rank: 4, top: [] }) }; };
  assertEqual(await submitRun({ name: 'たろう', timeMs: 80000, coins: 15 }, { fetchFn, base: 'http://x' }), { rank: 4, top: [] });
  assertEqual(sent.url, 'http://x/scores');
  assertEqual(sent.init.method, 'POST');
  assertEqual(JSON.parse(sent.init.body), { name: 'たろう', timeMs: 80000, coins: 15 });
});

test('submitRun / fetchTop: 失敗はすべて null', async () => {
  const run = { name: 'たろう', timeMs: 80000, coins: 15 };
  assertEqual(await submitRun(run, { fetchFn: async () => ({ ok: false, json: async () => ({}) }), base: 'http://x' }), null);
  assertEqual(await submitRun(run, { fetchFn: async () => { throw new TypeError('offline'); }, base: 'http://x' }), null);
  assertEqual(await submitRun(run, { fetchFn: ok({ rank: 'x' }), base: 'http://x' }), null);
  assertEqual(await fetchTop({ fetchFn: ok({ nope: 1 }), base: 'http://x' }), null);
  assertEqual(await submitRun(run, { fetchFn: ok({}), base: '' }), null); // 本番の URL が未設定
});

test('fetchTop: 返事が来なければ打ち切って null', async () => {
  const hang = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
  assertEqual(await fetchTop({ fetchFn: hang, base: 'http://x', timeoutMs: 50 }), null);
});

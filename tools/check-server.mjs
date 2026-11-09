// ランキングの受付(server/)が設計どおりに動くかを確かめる。
// 使い方: node tools/check-server.mjs http://localhost:8787
//   手元(localhost)のときは、最初に手元の D1 を空にして同点の記録を 2 件入れてから確かめる。
//   本番の URL を渡したときは記録を空にしない。名前「てすと」の記録が 1 件残るので、確かめたあとで消すこと
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scorePoints } from '../src/logic/records.js';

const base = process.argv[2];
if (!base) {
  console.error('usage: node tools/check-server.mjs <受付の URL>');
  process.exit(2);
}
const local = new URL(base).hostname === 'localhost';
const serverDir = fileURLToPath(new URL('../server/', import.meta.url));
const GOOD_ORIGIN = 'https://tshindo73.github.io';

let failures = 0;
function check(label, ok, detail = '') {
  console.log(`${ok ? 'ok  ' : 'NG  '} ${label}${ok ? '' : ` ${detail}`}`);
  if (!ok) failures++;
}

// 手元の D1 に決まった SQL を流す(外から受け取った値は混ぜない)。--json の結果を返す
function d1(command) {
  const out = execSync(`npx wrangler d1 execute gravity-flip-scores --local --json --command "${command}"`, { cwd: serverDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return JSON.parse(out)[0]?.results ?? [];
}

async function post(body, headers = {}) {
  const res = await fetch(`${base}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: GOOD_ORIGIN, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

if (local) {
  d1('DELETE FROM scores');
  // 同じ 22750 点を 2 件。先に出した「さき」が上に来るはず
  d1(
    "INSERT INTO scores (name, time_ms, coins, score, created_at, ip_hash) VALUES " +
      "('さき', 80000, 15, 22750, '2026-01-01T00:00:00.000Z', 'seed'), " +
      "('あと', 81000, 17, 22750, '2026-01-02T00:00:00.000Z', 'seed'), " +
      // 1 日より前の記録。次に記録を受け付けたとき ip_hash が空になるはず
      "('ふるい', 300000, 0, 0, '2026-01-03T00:00:00.000Z', 'old-hash')",
  );
}

// ベスト10を見る
const got = await fetch(`${base}/scores`, { headers: { Origin: GOOD_ORIGIN } });
const top = (await got.json().catch(() => ({}))).top;
check('GET /scores は 200 で top が配列', got.status === 200 && Array.isArray(top), `status=${got.status}`);
if (local) check('同点は先に出したほうが上', top?.[0]?.name === 'さき' && top?.[1]?.name === 'あと', JSON.stringify(top));
check(
  '1 件のキーは name score timeMs coins at だけ',
  (top ?? []).every((e) => Object.keys(e).sort().join() === 'at,coins,name,score,timeMs'),
  JSON.stringify(top?.[0]),
);
check('at は日付だけ', (top ?? []).every((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.at)), JSON.stringify(top?.[0]));

// ありえない記録は断る
const name = 'てすと';
for (const [label, body] of [
  ['SQL を混ぜた名前', { name: "a';DROP", timeMs: 80000, coins: 15 }],
  ['タグの名前', { name: '<script>', timeMs: 80000, coins: 15 }],
  ['7 文字の名前', { name: 'あいうえおかき', timeMs: 80000, coins: 15 }],
  ['りんご 78 個', { name, timeMs: 80000, coins: 78 }],
  ['タイム 44.9 秒', { name, timeMs: 44900, coins: 0 }],
  ['JSON でない本文', 'not json'],
]) {
  const r = await post(body);
  check(`${label} → 400`, r.status === 400, `status=${r.status}`);
}
const big = await post({ name, timeMs: 80000, coins: 15, pad: 'x'.repeat(1100) });
check('1KB を超える本文 → 413', big.status === 413, `status=${big.status}`);

// 正しい記録は受け付けて順位を返す。点数は受付が計算する
const run = { name, timeMs: 80000, coins: 15 };
const first = await post(run);
check('正しい記録 → 200', first.status === 200, `status=${first.status} ${JSON.stringify(first.body)}`);
check('rank は正の整数', Number.isInteger(first.body?.rank) && first.body.rank > 0, JSON.stringify(first.body));
check('top は 10 件以下', Array.isArray(first.body?.top) && first.body.top.length <= 10);
check('top の点数は scorePoints と同じ', (first.body?.top ?? []).every((e) => e.score === scorePoints(e)));
if (local) check('同点 3 件目の新しい記録は 3 位', first.body?.rank === 3, JSON.stringify(first.body));

if (local) {
  const old = d1("SELECT ip_hash FROM scores WHERE name = 'ふるい'");
  check('1 日たった記録の ip_hash は空になる', old[0]?.ip_hash === '', JSON.stringify(old));
}

const again = await post(run);
check('20 秒以内にもう一度 → 429', again.status === 429, `status=${again.status}`);

// CORS: 公開中のゲームには許可を返し、ほかのサイトには返さない
for (const [origin, allowed] of [[GOOD_ORIGIN, true], ['https://evil.example', false]]) {
  const res = await fetch(`${base}/scores`, {
    method: 'OPTIONS',
    headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
  });
  const header = res.headers.get('Access-Control-Allow-Origin');
  check(`CORS ${origin} ${allowed ? '許可' : '不許可'}`, allowed ? header === origin : header === null, `header=${header}`);
}

console.log(failures ? `${failures} NG` : 'ALL OK');
process.exit(failures ? 1 : 0);

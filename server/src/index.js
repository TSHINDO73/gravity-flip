import { normalizeName, isValidRun } from '../../src/logic/ranking.js';
import { scorePoints } from '../../src/logic/records.js';

// ランキングの受付。POST /scores で記録を受け付けて順位を返し、GET /scores でベスト10を返す。
// 送り元の IP アドレスや送られた内容はログに出さない

const MAX_BODY_BYTES = 1024;
const RATE_LIMIT_MS = 20 * 1000;
const IP_HASH_KEEP_MS = 24 * 60 * 60 * 1000;
const TOP_SIZE = 10;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 公開中のゲームと、手元・LAN での確認だけ
const ALLOWED_ORIGIN = /^(https:\/\/tshindo73\.github\.io|http:\/\/localhost(:\d+)?|http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?)$/;

function corsHeaders(origin) {
  if (!origin || !ALLOWED_ORIGIN.test(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors } });
}

// 送り元の IP アドレスは保存せず、秘密の文字列を足したハッシュだけを連続送信の確認に使う
async function ipHash(request, salt) {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}${ip}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// 外に見せるのは名前・点数・タイム・りんご・日付(日本時間)だけ
function publicEntry(row) {
  const at = new Date(Date.parse(row.created_at) + JST_OFFSET_MS).toISOString().slice(0, 10);
  return { name: row.name, score: row.score, timeMs: row.time_ms, coins: row.coins, at };
}

async function topTen(db) {
  const { results } = await db
    .prepare('SELECT name, score, time_ms, coins, created_at FROM scores ORDER BY score DESC, id ASC LIMIT ?')
    .bind(TOP_SIZE)
    .all();
  return results.map(publicEntry);
}

async function readRun(request) {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return { status: 413 };
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return { status: 400 };
  }
  const name = normalizeName(body?.name);
  const run = { timeMs: body?.timeMs, coins: body?.coins };
  if (!name || !isValidRun(run)) return { status: 400 };
  // タイムは整数(ミリ秒)で保存する。切り捨てても 0.1 秒単位の点数は変わらない
  return { run: { name, timeMs: Math.floor(run.timeMs), coins: run.coins } };
}

async function postScore(request, env, cors) {
  const { status, run } = await readRun(request);
  if (status) return json({ error: status === 413 ? 'too_large' : 'bad_request' }, status, cors);

  const db = env.DB;
  const now = Date.now();
  const hash = await ipHash(request, env.IP_SALT ?? '');
  const recent = await db
    .prepare('SELECT 1 FROM scores WHERE ip_hash = ? AND created_at > ? LIMIT 1')
    .bind(hash, new Date(now - RATE_LIMIT_MS).toISOString())
    .first();
  if (recent) return json({ error: 'too_many' }, 429, cors);

  // 連続送信の確認が終わった古い記録からは、送り元のハッシュを消す
  await db
    .prepare("UPDATE scores SET ip_hash = '' WHERE ip_hash != '' AND created_at < ?")
    .bind(new Date(now - IP_HASH_KEEP_MS).toISOString())
    .run();

  const score = scorePoints(run);
  const inserted = await db
    .prepare('INSERT INTO scores (name, time_ms, coins, score, created_at, ip_hash) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(run.name, run.timeMs, run.coins, score, new Date(now).toISOString(), hash)
    .first();
  // 点数が高い記録と、同じ点数で先に出した記録の数 + 1
  const { ahead } = await db
    .prepare('SELECT COUNT(*) AS ahead FROM scores WHERE score > ? OR (score = ? AND id < ?)')
    .bind(score, score, inserted.id)
    .first();
  return json({ rank: ahead + 1, top: await topTen(db) }, 200, cors);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request.headers.get('Origin'));
    const { pathname } = new URL(request.url);
    try {
      if (pathname !== '/scores') return json({ error: 'not_found' }, 404, cors);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      if (request.method === 'GET') return json({ top: await topTen(env.DB) }, 200, cors);
      if (request.method === 'POST') return await postScore(request, env, cors);
      return json({ error: 'method' }, 405, cors);
    } catch {
      return json({ error: 'server' }, 500, cors);
    }
  },
};

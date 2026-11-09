import { RANKING_API_PROD } from '../config.js';

// ランキングの受付(server/)と話す。通信の失敗・時間切れ・形の違う返事はすべて null にして、
// 呼ぶ側は「つうしんできません」を出すだけで済むようにする

const TIMEOUT_MS = 5000;

// 公開中のゲームは本番の受付、それ以外(手元・LAN での確認)は同じホストの wrangler dev
export function rankingApiBase(location) {
  return location.hostname === 'tshindo73.github.io' ? RANKING_API_PROD : `http://${location.hostname}:8787`;
}

async function request(path, init, { fetchFn = fetch, base = rankingApiBase(window.location), timeoutMs = TIMEOUT_MS } = {}) {
  if (!base) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(`${base}${path}`, { ...init, signal: controller.signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const isRank = (n) => Number.isInteger(n) && n > 0;

export async function submitRun({ name, timeMs, coins }, options) {
  const body = await request(
    '/scores',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, timeMs, coins }) },
    options,
  );
  return body && isRank(body.rank) && Array.isArray(body.top) ? { rank: body.rank, top: body.top } : null;
}

export async function fetchTop(options) {
  const body = await request('/scores', { method: 'GET' }, options);
  return body && Array.isArray(body.top) ? body.top : null;
}

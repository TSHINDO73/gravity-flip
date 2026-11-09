import { scorePoints } from './records.js';
import { LEVELS } from '../levels/levels.js';

// ランキングの名前と記録の判定、並べ方。ゲームと受付(server/)の両方で使う

export const NAME_MAX = 6;
// りんごの上限はステージの C の数
export const MAX_COINS = LEVELS.reduce((n, rows) => n + rows.join('').split('C').length - 1, 0);
// 全ステージを走り抜けるだけで約 48.8 秒かかるので、それより少し短い 45 秒未満はありえない記録
export const MIN_TIME_MS = 45000;
export const MAX_TIME_MS = 3600000;

// ひらがな・カタカナ・漢字・英数字(全角・半角)と長音だけ。
// 長音(ー・ｰ)と半角の濁点・半濁点(ﾞﾟ)は文字の種類が Common なので明示する
const NAME_CHARS = /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}A-Za-z0-9Ａ-Ｚａ-ｚ０-９ーｰﾞﾟ]+$/u;

// 前後の空白を除いてルールに合えば名前、合わなければ null
export function normalizeName(text) {
  if (typeof text !== 'string') return null;
  const name = text.trim();
  const length = [...name].length;
  if (length < 1 || length > NAME_MAX || !NAME_CHARS.test(name)) return null;
  return name;
}

export function isValidRun({ timeMs, coins }) {
  return (
    Number.isFinite(timeMs) && timeMs >= MIN_TIME_MS && timeMs <= MAX_TIME_MS &&
    Number.isInteger(coins) && coins >= 0 && coins <= MAX_COINS
  );
}

// 点数の高い順。同点は at(出した日時)が古いほうが上
export function compareRuns(a, b) {
  return scorePoints(b) - scorePoints(a) || (a.at < b.at ? -1 : a.at > b.at ? 1 : 0);
}

// run を入れて size 件に切った一覧と、run が入った順位(入らなければ null)
export function mergeTop(list, run, size) {
  const merged = [...list, run].sort(compareRuns).slice(0, size);
  const i = merged.indexOf(run);
  return { list: merged, rank: i < 0 ? null : i + 1 };
}

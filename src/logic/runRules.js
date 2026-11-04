// 通しプレイを 1-1 の最初から始めるときのデータ。タイトルとやり直しで使う
export function freshRun() {
  return { stage: 0, coins: 0, elapsedMs: 0, fullRun: true };
}

import { MAX_ROWS } from '../config.js';

export function parseLevel(rows, stageNo) {
  const fail = (msg) => { throw new Error(`ステージ${stageNo}: ${msg}`); };
  const failAt = (r, c, msg) => { throw new Error(`ステージ${stageNo} ${r + 1}行${c + 1}列: ${msg}`); };

  if (rows.length === 0) fail('マップが空です');
  if (rows.length > MAX_ROWS) fail(`行数が${MAX_ROWS}を超えています`);
  const width = rows[0].length;
  rows.forEach((row, r) => {
    if (row.length !== width) {
      throw new Error(`ステージ${stageNo} ${r + 1}行: 長さが${row.length}です（1行目は${width}）`);
    }
  });

  const lv = {
    width, height: rows.length, solid: [], blocks: [], spikes: [],
    enemies: [], coins: [], checkpoints: [], start: null, goal: null,
  };
  rows.forEach((row, r) => {
    lv.solid.push([]);
    for (let c = 0; c < width; c++) {
      const ch = row[c];
      const cell = { col: c, row: r };
      lv.solid[r].push(ch === '#');
      switch (ch) {
        case '#': lv.blocks.push(cell); break;
        case '^': lv.spikes.push({ col: c, row: r, dir: 'up' }); break;
        case 'v': lv.spikes.push({ col: c, row: r, dir: 'down' }); break;
        case 'E': lv.enemies.push(cell); break;
        case 'C': lv.coins.push(cell); break;
        case 'F': lv.checkpoints.push(cell); break;
        case 'P':
          if (lv.start) failAt(r, c, 'スタート位置(P)が複数あります');
          lv.start = cell; break;
        case 'G':
          if (lv.goal) failAt(r, c, 'ゴール(G)が複数あります');
          lv.goal = cell; break;
        case '.': break;
        default: failAt(r, c, `不明な文字 "${ch}"`);
      }
    }
  });
  if (!lv.start) fail('スタート位置(P)がありません');
  if (!lv.goal) fail('ゴール(G)がありません');
  return lv;
}

// 素材は Pixel Adventure 1（assets/pa/）。フレームサイズは元画像のピクセル
export const TILE_SRC = 16;
export const CHAR_SRC = 32;
export const BIG_SRC = 64; // 旗とゴール

// key: 読み込みキー, path: ファイル, size: 1 コマの大きさ
export const SHEETS = {
  terrain: { path: 'assets/pa/terrain.png', size: TILE_SRC },
  spike: { path: 'assets/pa/spike.png', size: TILE_SRC },
  dust: { path: 'assets/pa/dust.png', size: TILE_SRC },
  confetti: { path: 'assets/pa/confetti.png', size: TILE_SRC },
  pinkIdle: { path: 'assets/pa/pink/idle.png', size: CHAR_SRC },
  pinkRun: { path: 'assets/pa/pink/run.png', size: CHAR_SRC },
  pinkJump: { path: 'assets/pa/pink/jump.png', size: CHAR_SRC },
  pinkFall: { path: 'assets/pa/pink/fall.png', size: CHAR_SRC },
  pinkHit: { path: 'assets/pa/pink/hit.png', size: CHAR_SRC },
  enemyRun: { path: 'assets/pa/enemy/run.png', size: CHAR_SRC },
  enemyHit: { path: 'assets/pa/enemy/hit.png', size: CHAR_SRC },
  apple: { path: 'assets/pa/apple.png', size: CHAR_SRC },
  collected: { path: 'assets/pa/collected.png', size: CHAR_SRC },
  cpNoFlag: { path: 'assets/pa/checkpoint-noflag.png', size: BIG_SRC },
  cpOut: { path: 'assets/pa/checkpoint-out.png', size: BIG_SRC },
  cpIdle: { path: 'assets/pa/checkpoint-idle.png', size: BIG_SRC },
  end: { path: 'assets/pa/end.png', size: BIG_SRC },
};

// アニメ。素材はどれも 20 コマ/秒
export const ANIMS = {
  pinkIdle: { sheet: 'pinkIdle', repeat: -1 },
  pinkRun: { sheet: 'pinkRun', repeat: -1 },
  pinkJump: { sheet: 'pinkJump', repeat: -1 },
  pinkFall: { sheet: 'pinkFall', repeat: -1 },
  pinkHit: { sheet: 'pinkHit', repeat: 0 },
  enemyRun: { sheet: 'enemyRun', repeat: -1 },
  enemyHit: { sheet: 'enemyHit', repeat: 0 },
  apple: { sheet: 'apple', repeat: -1 },
  collected: { sheet: 'collected', repeat: 0 },
  cpOut: { sheet: 'cpOut', repeat: 0 },
  cpIdle: { sheet: 'cpIdle', repeat: -1 },
};
export const ANIM_FPS = 20;

export const SFX = {
  jump: 'sfx-jump',
  flip: 'sfx-flip',
  coin: 'sfx-coin',
  die: 'sfx-die',
  clear: 'sfx-clear',
};

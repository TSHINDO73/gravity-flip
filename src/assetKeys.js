export const IMG = { tiles: 'tiles', chars: 'chars' };

// 素材のフレームサイズ（元画像のピクセル）
export const TILE_SRC = 18;
export const CHAR_SRC = 24;

// tiles.png は 20列(18px)、characters.png は 9列(24px)。番号は左上から行方向に数える。
export const FRAMES = {
  block: 22, // 草つきの地面（中央タイル）
  spike: 68, // 銀色のトゲ
  coin: 151, // 金貨
  checkpoint: 111, // 赤い旗
  goal: 130, // ドア
  player: 0, // 緑の宇宙服キャラ
  playerWalk: [0, 1],
  enemy: 18, // 青いスライム風
  enemyWalk: [18, 19],
};

export const SFX = {
  jump: 'sfx-jump',
  flip: 'sfx-flip',
  coin: 'sfx-coin',
  die: 'sfx-die',
  clear: 'sfx-clear',
};

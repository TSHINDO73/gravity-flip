// 画面の構成。HUD の帯（高さ 60）とプレイ画面（960x480）。タッチ端末は左右に 160px のボタンの列
export const HUD_H = 60;
export const PLAY_W = 960;
export const PLAY_H = 480;
export const SIDE_W = 160;

export function layoutFor(touch) {
  const side = touch ? SIDE_W : 0;
  return { width: PLAY_W + side * 2, height: HUD_H + PLAY_H, playX: side, playY: HUD_H, hudX: side };
}

// 1 マス = 素材の 16px タイルの 2 倍
export const TILE = 32;
export const SCALE = 2;
export const MAX_ROWS = 15;

// リメイク前（1 マス 36px）の値を 8/9 倍して、マス単位の動きを同じに保つ。時間と比率は変えない
export const LENGTH_SCALE = 8 / 9;
export const GRAVITY = 1400 * LENGTH_SCALE;
export const RUN_SPEED = 220 * LENGTH_SCALE;
export const JUMP_VELOCITY = 560 * LENGTH_SCALE;
export const JUMP_CUT = 0.45;
export const MAX_FALL_SPEED = 900 * LENGTH_SCALE;
export const COYOTE_MS = 100;
export const BUFFER_MS = 100;
// スマホは着地直前のタップを取りこぼしやすいので、先行入力の猶予を長くする
export const TOUCH_BUFFER_MS = 150;
export const ENEMY_SPEED = 60 * LENGTH_SCALE;

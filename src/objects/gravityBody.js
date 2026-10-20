import { SCALE } from '../config.js';

// 重力の向きに合わせて当たり判定を足元側へ移し替える。
// 体の位置が動かないよう、画像側(sprite.y)を補正する。
export function shiftBodyToFeet(sprite, dir, offX, offDown, offUp) {
  const oldOff = sprite.body.offset.y;
  const newOff = dir === 1 ? offDown : offUp;
  sprite.body.setOffset(offX, newOff);
  sprite.y -= (newOff - oldOff) * SCALE;
}

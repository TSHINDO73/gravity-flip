import { diffPressed } from '../logic/inputRules.js';

// キーボードとタッチの入力を合成して、フレームごとの状態として渡す。
// JustDown は読むと消えるので、update() は1フレームに1回だけ呼ぶこと
export class Controls {
  constructor(scene, touchPad = null) {
    const kb = scene.input.keyboard;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      jumpZ: kb.addKey(K.Z),
      jumpSpace: kb.addKey(K.SPACE),
      flipX: kb.addKey(K.X),
      flipUp: kb.addKey(K.UP),
      restart: kb.addKey(K.R),
    };
    this.touchPad = touchPad;
    // null の間は最初のフレーム。押しっぱなしの指を「押した瞬間」と数えない
    this.prevTouch = null;
    this.prevJumpDown = false;
  }

  update() {
    const { keys } = this;
    const justDown = Phaser.Input.Keyboard.JustDown;
    const touch = this.touchPad ? this.touchPad.update() : new Set();
    const { pressed } = diffPressed(this.prevTouch, touch);
    this.prevTouch = touch;

    const jumpDown = keys.jumpZ.isDown || keys.jumpSpace.isDown || touch.has('jump');
    const state = {
      left: keys.left.isDown || touch.has('left'),
      right: keys.right.isDown || touch.has('right'),
      jumpDown,
      jumpPressed: justDown(keys.jumpZ) || justDown(keys.jumpSpace) || pressed.has('jump'),
      jumpReleased: this.prevJumpDown && !jumpDown,
      flipPressed: justDown(keys.flipX) || justDown(keys.flipUp) || pressed.has('flip'),
      restartPressed: justDown(keys.restart) || pressed.has('restart'),
    };
    this.prevJumpDown = jumpDown;
    return state;
  }
}

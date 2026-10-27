// キーボード（とタッチ）の入力を合成して、フレームごとの状態として渡す。
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
    this.prevJumpDown = false;
  }

  update() {
    const { keys } = this;
    const justDown = Phaser.Input.Keyboard.JustDown;
    const jumpDown = keys.jumpZ.isDown || keys.jumpSpace.isDown;
    const state = {
      left: keys.left.isDown,
      right: keys.right.isDown,
      jumpDown,
      jumpPressed: justDown(keys.jumpZ) || justDown(keys.jumpSpace),
      jumpReleased: this.prevJumpDown && !jumpDown,
      flipPressed: justDown(keys.flipX) || justDown(keys.flipUp),
      restartPressed: justDown(keys.restart),
    };
    this.prevJumpDown = jumpDown;
    return state;
  }
}

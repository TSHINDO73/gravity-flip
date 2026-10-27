# スマホ対応（タッチ操作）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Android の Chrome で、横持ち・画面上のボタンで Gravity Flip を遊べるようにする。PC の遊び方と見た目は変えない。

**Architecture:** キーボードとタッチを `Controls` が合成して、フレームごとの入力状態として Player と GameScene に渡す。タッチボタンは Phaser の画面内に `TouchPad` として描き、当たり判定と押下の差分は画面に依存しない `inputRules.js` に置いてテストする。画面の拡大縮小は Phaser の Scale Manager、縦持ちの案内は CSS だけで行う。

**Tech Stack:** Phaser 3（`lib/phaser.min.js`、ビルドなし ES modules）、自作テストランナー（`tests/runner.js`、Edge ヘッドレスで実行）

**Spec:** `docs/superpowers/specs/2026-10-27-mobile-touch-design.md`

## Global Constraints

- PC（`(pointer: coarse)` が偽）では、ボタンを描かず、案内文も今の文言のまま
- タッチ端末の判定は `window.matchMedia('(pointer: coarse)').matches`
- ボタンの座標はゲーム画面（960×540）基準。← (80,460)、→ (200,460)、反転 (760,460)、ジャンプ (880,460) は半径45、↻ (910,50) は半径30
- 不透明度は通常 0.25、押している間 0.5
- 同時タッチ数は4つ（Phaser の `input.activePointers: 4`）
- ジャンプ・コヨーテ・先行入力・反転・可変ジャンプの挙動は変えない
- ゴール後の待ち時間中は、やり直しを無視する（既存の挙動）
- 新規の外部ライブラリは使わない
- テスト実行：`powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`（最後に `failed=0`）

## Review Focus

1. ↻ を押したままやり直した直後：新しいシーンの最初のフレームで、押しっぱなしの指を「押した瞬間」と数えると、やり直しが無限に繰り返される。最初のフレームは基準にするだけで、押した瞬間を出さないこと（Task 1 のテスト `diffPressed: 前フレームなしは差分なし`、Task 3 の Controls で使う）
2. ジャンプを押したままステージが切り替わる：次のステージ開始時に勝手にジャンプしないこと（1と同じ仕組みで防ぐ）
3. ボタン以外の場所に触れている指：何の入力にもならないこと（Task 1 のテスト `pressedSet: ボタン外の指は無視`）
4. ボタンを押したままアプリを切り替える：戻ったときに押しっぱなしになっていないこと（Task 3 の blur/hidden 処理。実機確認項目3）
5. 全画面表示や横向き固定に対応していないブラウザ：エラーで止まらずにそのまま始まること（Task 4 の try/catch と Promise の catch）

---

## ファイル構成

| ファイル | 種別 | 責務 |
|---|---|---|
| `src/logic/inputRules.js` | 新規 | ボタン配置の定数、当たり判定、押されているボタンの集計、前後の差分 |
| `tests/inputRules.test.js` | 新規 | 上のテスト |
| `src/objects/Controls.js` | 新規 | キーボードとタッチの合成。フレームごとの入力状態を返す |
| `src/objects/TouchPad.js` | 新規 | ボタンの描画、指の追跡、blur 時の解除、`isTouchDevice()` |
| `src/objects/Player.js` | 変更 | キーを読まず、`update(time, delta, input)` の `input` を使う |
| `src/scenes/GameScene.js` | 変更 | Controls / TouchPad を作り、R を Controls 経由にする |
| `src/scenes/TitleScene.js` / `ClearScene.js` | 変更 | タップで進む、案内文、全画面 |
| `src/main.js` / `index.html` | 変更 | 拡大縮小、同時タッチ数、viewport、縦持ちの案内 |

---

### Task 1: 入力の計算部分（inputRules.js）

**Files:**
- Create: `src/logic/inputRules.js`
- Test: `tests/inputRules.test.js`
- Modify: `tests/index.html`（`import './inputRules.test.js';` を `records.test.js` の次に追加）

**Interfaces:**
- Produces:
  - `TOUCH_BUTTONS: Array<{ id: 'left'|'right'|'flip'|'jump'|'restart', x: number, y: number, r: number, label: string }>`
    - 値：`left` (80,460,45,'←')、`right` (200,460,45,'→')、`flip` (760,460,45,'反転')、`jump` (880,460,45,'ジャンプ')、`restart` (910,50,30,'↻')
  - `hitButton(buttons, x, y) -> string | null`：中心からの距離が `r` 以下なら、そのボタンの `id`（境界上も含む）
  - `pressedSet(buttons, points: Array<{x, y}>) -> Set<string>`
  - `diffPressed(prev: Set<string> | null, curr: Set<string>) -> { pressed: Set<string>, released: Set<string> }`：`prev` が `null` のときは両方空

- [ ] **Step 1: 失敗するテストを書く**

`Set` は `assertEqual`（JSON 比較）で比べられないので、`[...set].sort()` を比べる。

```js
import { test, assertEqual } from './runner.js';
import { TOUCH_BUTTONS, hitButton, pressedSet, diffPressed } from '../src/logic/inputRules.js';

const ids = (set) => [...set].sort();

test('hitButton: 中心・境界・外', () => {
  assertEqual(hitButton(TOUCH_BUTTONS, 80, 460), 'left');
  assertEqual(hitButton(TOUCH_BUTTONS, 80 + 45, 460), 'left');
  assertEqual(hitButton(TOUCH_BUTTONS, 80 + 46, 460), null);
  assertEqual(hitButton(TOUCH_BUTTONS, 910, 50), 'restart');
  assertEqual(hitButton(TOUCH_BUTTONS, 480, 270), null);
});

test('pressedSet: 指なし・1本・別々の2本', () => {
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [])), []);
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [{ x: 200, y: 460 }])), ['right']);
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [{ x: 200, y: 460 }, { x: 880, y: 460 }])), ['jump', 'right']);
});

test('pressedSet: 同じボタンに2本', () => {
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [{ x: 80, y: 460 }, { x: 90, y: 470 }])), ['left']);
});

test('pressedSet: ボタン外の指は無視', () => {
  assertEqual(ids(pressedSet(TOUCH_BUTTONS, [{ x: 480, y: 270 }, { x: 760, y: 460 }])), ['flip']);
});

test('diffPressed: 押した瞬間と離した瞬間', () => {
  const d = diffPressed(new Set(['left']), new Set(['left', 'jump']));
  assertEqual(ids(d.pressed), ['jump']);
  assertEqual(ids(d.released), []);
  const d2 = diffPressed(new Set(['left', 'jump']), new Set(['left']));
  assertEqual(ids(d2.pressed), []);
  assertEqual(ids(d2.released), ['jump']);
});

test('diffPressed: 指を←から→へ滑らせる', () => {
  const d = diffPressed(new Set(['left']), new Set(['right']));
  assertEqual(ids(d.pressed), ['right']);
  assertEqual(ids(d.released), ['left']);
});

test('diffPressed: 前フレームなしは差分なし', () => {
  const d = diffPressed(null, new Set(['restart', 'jump']));
  assertEqual(ids(d.pressed), []);
  assertEqual(ids(d.released), []);
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `SUMMARY line not found`（モジュールがまだ無いため）

- [ ] **Step 3: `src/logic/inputRules.js` を実装**

`TOUCH_BUTTONS` と3つの関数を上の Interfaces どおりに書く。距離は2乗で比べてよい。

- [ ] **Step 4: テストを実行して成功を確認**

Expected: `SUMMARY passed=50 failed=0`（既存43件＋新規7件）

- [ ] **Step 5: コミット**

```bash
git add src/logic/inputRules.js tests/inputRules.test.js tests/index.html
git commit -m "feat: touch input rules (hit test, pressed set, diff)"
```

---

### Task 2: キーボード入力を Controls 経由にする（挙動は変えない）

**Files:**
- Create: `src/objects/Controls.js`
- Modify: `src/objects/Player.js`（`this.keys` の作成と、`update` 内のキー読み取り）
- Modify: `src/scenes/GameScene.js`（`this.rKey` の作成と `update` の R 判定）

**Interfaces:**
- Consumes: なし（この時点ではタッチなし）
- Produces:
  - `class Controls { constructor(scene, touchPad = null); update(): InputState }`
  - `InputState = { left: boolean, right: boolean, jumpDown: boolean, jumpPressed: boolean, jumpReleased: boolean, flipPressed: boolean, restartPressed: boolean }`
  - `Player.update(time, delta, input: InputState)`

- [ ] **Step 1: `src/objects/Controls.js` を実装（キーボードのみ）**

キーは今の Player と同じ（← → Z SPACE X ↑）に R を加えて、`scene.input.keyboard.addKey` で作る。
- `left` / `right` / `jumpDown`：`isDown`
- `jumpPressed` / `flipPressed` / `restartPressed`：`Phaser.Input.Keyboard.JustDown`
- `jumpReleased`：前フレームの `jumpDown` が真で、今フレームが偽

`update()` は1フレームに1回だけ呼ぶこと（`JustDown` は読むと消えるため）。`touchPad` 引数は Task 3 で使う。

- [ ] **Step 2: Player と GameScene を Controls に切り替える**

- Player：`this.keys` を削除。`update(time, delta, input)` で `input.left` / `input.right` / `input.jumpPressed` / `input.jumpReleased` / `input.flipPressed` を使う。
- GameScene：`create` で `this.controls = new Controls(this)` を作り、`this.rKey` を削除。`update` の最初（`if (!this.player) return;` の直後）で `const input = this.controls.update();` を呼ぶ。R は `!this.reachedGoal && input.restartPressed`、プレイヤーは `this.player.update(time, delta, input)`。

- [ ] **Step 3: テストを実行**

Expected: `SUMMARY passed=50 failed=0`

- [ ] **Step 4: PC で手動確認**

`python -m http.server 8123` で起動し、← → 移動、Z の長押し・短押し（ジャンプの高さが変わる）、X と ↑ の反転、R のやり直し、ゴール後の R 無視、3ステージクリアと BEST 表示が、以前と同じであることを確認する。

- [ ] **Step 5: コミット**

```bash
git add src/objects/Controls.js src/objects/Player.js src/scenes/GameScene.js
git commit -m "refactor: read player and restart input through Controls"
```

---

### Task 3: タッチボタンと画面の拡大縮小

**Files:**
- Create: `src/objects/TouchPad.js`
- Modify: `src/objects/Controls.js`（タッチの合成）
- Modify: `src/scenes/GameScene.js`（タッチ端末なら TouchPad を作る）
- Modify: `src/main.js`（`scale` と `input` の設定）
- Modify: `index.html`（viewport、CSS、縦持ちの案内）

**Interfaces:**
- Consumes: `TOUCH_BUTTONS`、`pressedSet`、`diffPressed`（Task 1）、`Controls`（Task 2）
- Produces:
  - `isTouchDevice(): boolean`（`TouchPad.js` から export）
  - `class TouchPad { constructor(scene); update(): Set<string> }`

- [ ] **Step 1: `src/objects/TouchPad.js` を実装**

- `TOUCH_BUTTONS` ごとに白い円（`fillAlpha` 0.25）とラベルの文字を描く。`setScrollFactor(0)`、depth は HUD（100）より上の 110。
- `update()`：`scene.input.manager.pointers` のうち `isDown` のものの `{x, y}` から `pressedSet` を作り、押されているボタンの円を 0.5、それ以外を 0.25 にして、集合を返す。
- blur 対策：`scene.game.events` の `'blur'` と `'hidden'` で `this.suppressed = true`。`update()` は `suppressed` の間は空集合を返し、`isDown` の指が1本も無くなったら `suppressed = false` に戻す。リスナーはシーンの `SHUTDOWN` で外す。
- `pointercancel` は Phaser が指を離した扱いにするので、追加の処理は要らない。

- [ ] **Step 2: Controls にタッチを合成**

- `touchPad` があれば、毎フレーム `touchPad.update()` で集合を得る。前フレームの集合を保持し、`diffPressed(prev, curr)` で差分を出す。前フレームの初期値は `null`（Review Focus 1・2：最初のフレームは押した瞬間を出さない）。
- `left = キー || curr.has('left')`、`right`、`jumpDown` も同様。
- `jumpPressed = JustDown(Z) || JustDown(SPACE) || pressed.has('jump')`。`flipPressed`（`'flip'`）、`restartPressed`（`'restart'`）も同様。
- `jumpReleased` は Task 2 と同じく、合成後の `jumpDown` の変化で出す。

- [ ] **Step 3: GameScene で TouchPad を作る**

`new Controls(this, isTouchDevice() ? new TouchPad(this) : null)`。TouchPad はプレイヤーや HUD より後に作る。

- [ ] **Step 4: `main.js` と `index.html`**

- `main.js` の設定に `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }` と `input: { activePointers: 4 }` を加える。
- `index.html`：
  - `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`
  - `html, body` に `overflow: hidden; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;`
  - `<div id="rotate">📱 スマホを横向きにしてください</div>`。普段は `display: none`。`@media (orientation: portrait) and (pointer: coarse)` のときだけ、`position: fixed; inset: 0; z-index: 10;` で背景 `#111`、白文字、中央寄せで表示する。

- [ ] **Step 5: テストを実行**

Expected: `SUMMARY passed=50 failed=0`

- [ ] **Step 6: Playwright で表示を確認**

`browser_run_code_unsafe` で、タッチありの新しいコンテキストを作って撮影する（`page.context().browser().newContext({ viewport, hasTouch: true, isMobile: true })`）。
- 横 915×412：`?stage=1` で5つのボタンが見え、HUD と ↻ が重ならず、ゲーム画面が比率を保って中央にある。
- 縦 412×915：「スマホを横向きにしてください」が全面に出ている。
- タッチなしの 1280×720：ボタンが無く、以前と同じ見た目。
- 横 915×412 で `page.touchscreen.tap` を → の位置に打ち、コンソールにエラーが無いこと。

- [ ] **Step 7: コミット**

```bash
git add src/objects/TouchPad.js src/objects/Controls.js src/scenes/GameScene.js src/main.js index.html
git commit -m "feat: on-screen touch buttons and fit-to-screen scaling"
```

---

### Task 4: タイトル画面・クリア画面のタップと全画面表示

**Files:**
- Modify: `src/scenes/TitleScene.js`
- Modify: `src/scenes/ClearScene.js`

**Interfaces:**
- Consumes: `isTouchDevice()`（Task 3）

- [ ] **Step 1: TitleScene**

- 既存の `onStart` を `this.input.on('pointerdown', ...)` にも登録する。キーのイベントは `e.repeat` を見ているので、ポインターからはその判定を通さない形にする（例：開始処理を `start()` にまとめ、キーは `e.repeat` を確認してから `start()`、タップは直接 `start()`）。
- タップで開始するときは、先に全画面表示を試みる。`this.scale.isFullscreen` が偽なら `this.scale.once('enterfullscreen', ...)` で `screen.orientation?.lock?.('landscape')` を呼び、Promise を `.catch(() => {})` する。続けて `try { this.scale.startFullscreen(); } catch {}`。キーで開始したときは全画面にしない。
- 案内文はタッチ端末なら `'タップでスタート'`、PCなら今の `'Z・スペース・Enterでスタート'`。

- [ ] **Step 2: ClearScene**

- 既存の `onBack` と同じ条件（`ready` と `done`）で、`pointerdown` でも戻るようにする。
- 案内文はタッチ端末なら `'タップでタイトルへ'`、PCなら今の `'Z・スペース・Enterでタイトルへ'`。

- [ ] **Step 3: テストを実行**

Expected: `SUMMARY passed=50 failed=0`

- [ ] **Step 4: Playwright で確認**

Task 3 Step 6 と同じタッチありの横画面で、タイトル画面に「タップでスタート」が出ていること、`page.touchscreen.tap(457, 206)` でゲームが始まること、コンソールにエラーが無いことを確認する（ヘッドレスでは全画面にならなくてよい）。タッチなしでは今の案内文のままであることも確認する。

- [ ] **Step 5: コミット**

```bash
git add src/scenes/TitleScene.js src/scenes/ClearScene.js
git commit -m "feat: tap to start and return, fullscreen on mobile start"
```

---

### Task 5: 実機確認・調整・README

**Files:**
- Modify: `README.md`（操作表にタッチ操作を、起動方法にスマホからの確認方法を追記）
- Modify（調整が必要な場合のみ）：`src/logic/inputRules.js` の `TOUCH_BUTTONS`

- [ ] **Step 1: スマホから開けるようにする**

`ipconfig` で PC の IPv4 アドレスを調べ、`python -m http.server 8123 --bind 0.0.0.0` で起動する。ユーザーに、同じ Wi-Fi の Android の Chrome で `http://<IP>:8123/` を開いてもらう（Windows のファイアウォールの許可が出たら「プライベートネットワーク」を許可）。

- [ ] **Step 2: ユーザーに実機確認を依頼**

spec の6項目（→ を押しながらジャンプ、← から → へ滑らせる、押しっぱなしにならない（アプリを切り替えて戻る）、タップでスタートして全画面になる、縦で案内が出る、3ステージ通しクリア）と、押しやすさ・手の疲れの感想を聞く。

- [ ] **Step 3: 感想に応じて調整**

ボタンの位置や大きさを変える場合は、`TOUCH_BUTTONS` と Task 1 の `hitButton` テストの値を一緒に直し、テストを実行して `failed=0` を確認する。

- [ ] **Step 4: README を更新**

操作表に「スマホ：画面下のボタン（← → 反転 ジャンプ）と右上の ↻、横持ち専用」を追加する。起動方法に Step 1 の手順を追加する。

- [ ] **Step 5: PC での最終確認**

Task 2 Step 4 と同じ項目を PC で確認する。

- [ ] **Step 6: コミット**

```bash
git add README.md src/logic/inputRules.js tests/inputRules.test.js
git commit -m "docs: mobile play instructions"
```

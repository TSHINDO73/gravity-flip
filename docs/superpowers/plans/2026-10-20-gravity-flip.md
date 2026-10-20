# Gravity Flip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** マリオ風2D横スクロールに「重力の上下反転（空中1回）」を加えた、3ステージのブラウザゲームを作る。

**Architecture:** ビルドなしの静的サイト。Phaser 3 を同梱し、ES Modules を `index.html` から直接読む。ゲームルール（文字マップ変換・反転可否・ジャンプ猶予・踏みつけ判定・時間表示）は Phaser 非依存の純粋関数として `src/logic/` と `src/levels/` に置き、自作の簡易テストランナーで検証する。Phaser 側（scenes/objects）はそれらを呼んで画面を組み立てるだけにする。

**Tech Stack:** Phaser 3.90.0（Arcade Physics）、素の JavaScript（ES Modules）、Python `http.server`（ローカル配信）、Microsoft Edge ヘッドレス（テスト実行・スクリーンショット）、Kenney CC0 素材。

**Spec:** `docs/superpowers/specs/2026-10-20-gravity-flip-design.md`

## Global Constraints

- 画面 960×540。1マス36ピクセル（18px素材を2倍、`pixelArt: true`）。ステージ高さ最大15行。
- Node.js は使わない。外部 npm パッケージなし。CDN 参照なし（Phaser は `lib/phaser.min.js` に同梱）。
- 操作: ←→ 移動 / Z・スペース ジャンプ / X・↑ 重力反転 / R ステージやり直し。PCキーボードのみ。
- 重力反転: 接地中は無制限、空中は1回、「足元」側への着地で回復。反転時は縦速度を0にする。
- 可変ジャンプ・コヨーテタイム0.1秒・先行入力0.1秒。
- 死亡で最後の中間旗（なければスタート）から再開。残機なし。再開時は重力「下」・空中反転回復。取得済みコインは保持。
- 敵はプレイヤーの反転に合わせて全員同時に反転する。踏みつけは「足元」側からのみ。
- 文字マップ記法: `# ^ v E C F P G .`（意味は spec 5章）。P と G は各ステージにちょうど1つ。
- 素材は Kenney の CC0 のみ。出典を `CREDITS.md` に記載。
- 公開（GitHub へのpush・Pages設定）はこの計画に含めない。ユーザー確認後に別途行う。
- コード中の画面表示テキストは日本語。

## Review Focus

1. **反転キーの押しっぱなし** — 押した瞬間に1回だけ反転し、押し続けても毎フレーム反転しない（Task 5 で `JustDown` を使い、手動確認項目に入れる）。
2. **同時に複数の死亡条件に当たる**（トゲと敵に同時接触、死亡演出中に画面外へ出るなど） — 死亡処理は1回だけ走り、再開位置が壊れない（Task 6 の `isDead` ガードと手動確認）。
3. **重力が上のときの踏みつけ** — 天井側を歩く敵に「下向きの足元」から当たれば倒せ、横から当たれば死亡（Task 4 の `isStomp` テストで重力上の両ケースを固定）。
4. **高速落下でのすり抜け** — 長い縦落下でもブロックを貫通しない（Task 5 で最大縦速度 `MAX_FALL_SPEED` を設定、Task 9 で最も長い縦落下を手動確認）。
5. **タブ切り替え・ウィンドウ非アクティブ中のタイム** — 非表示中はタイムが進まない（Task 8 で経過時間を `update(time, delta)` の delta 合計で数える。`Date.now()` を使わない）。

---

## File Structure

| ファイル | 責務 |
|---|---|
| `index.html` | Phaser と `src/main.js` を読み込む入口 |
| `lib/phaser.min.js` | Phaser 3.90.0 本体 |
| `src/config.js` | 画面・タイル・物理の定数（全タスク共通の数値はここだけ） |
| `src/main.js` | Phaser.Game 生成、シーン登録 |
| `src/assetKeys.js` | 画像・音のキー名とスプライトのフレーム番号 |
| `src/levels/parseLevel.js` | 文字マップ → 配置データ（純粋関数） |
| `src/levels/levels.js` | 3ステージの文字マップ |
| `src/logic/flipRules.js` | 重力反転の状態と可否（純粋関数） |
| `src/logic/jumpRules.js` | コヨーテタイム・先行入力・ジャンプ初速（純粋関数） |
| `src/logic/combatRules.js` | 踏みつけ判定・画面外判定（純粋関数） |
| `src/logic/format.js` | タイム表示の整形（純粋関数） |
| `src/scenes/BootScene.js` | 素材読み込み |
| `src/scenes/TitleScene.js` | タイトル画面 |
| `src/scenes/GameScene.js` | ステージ本編 |
| `src/scenes/ClearScene.js` | 全クリア画面 |
| `src/objects/Player.js` | プレイヤー（操作・反転・ジャンプ） |
| `src/objects/Enemy.js` | 歩く敵 |
| `tests/index.html`, `tests/runner.js`, `tests/*.test.js` | ブラウザで動く簡易テスト |
| `tools/run-tests.ps1` | サーバー起動 → Edge でテスト実行 → 結果表示 |
| `tools/screenshot.ps1` | サーバー起動 → Edge でゲーム画面をPNG保存 |
| `CREDITS.md`, `README.md` | 素材出典、遊び方とローカル起動方法 |

---

### Task 1: 土台（Phaser同梱・テストランナー・確認用スクリプト）

**Files:**
- Create: `index.html`, `lib/phaser.min.js`, `src/config.js`, `src/main.js`, `src/scenes/TitleScene.js`
- Create: `tests/index.html`, `tests/runner.js`, `tests/smoke.test.js`
- Create: `tools/run-tests.ps1`, `tools/screenshot.ps1`, `.gitignore`

**Interfaces:**
- Produces:
  - `tests/runner.js`: `test(name: string, fn: () => void)`, `assertEqual(actual, expected, msg?)`（`JSON.stringify` で比較）, `assertTrue(value, msg?)`, `assertThrows(fn, messagePart: string)`（投げられたエラーの message に `messagePart` が含まれることを確認）, `run()`。`run()` は全テスト実行後、`<pre id="summary">` に `SUMMARY passed=<n> failed=<m>` を書き、失敗したテスト名とメッセージを `<pre id="details">` に1行ずつ書く。
  - `tests/index.html`: 全 `*.test.js` を `<script type="module">` で import してから `run()` を呼ぶ。新しいテストファイルはここに import 行を追加する。
  - `tools/run-tests.ps1`: ポート8123で `python -m http.server` をプロジェクト直下で起動 → `msedge --headless --disable-gpu --dump-dom --virtual-time-budget=5000 http://localhost:8123/tests/` の出力から `SUMMARY` 行と details を表示 → サーバー停止。failed>0 または SUMMARY 行が無ければ exit 1。Edge のパスは `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`。
  - `tools/screenshot.ps1 -Query <string> -Out <path> [-WaitMs 3000]`: 同様にサーバーを起動し `msedge --headless --screenshot=<Out> --window-size=960,540 --virtual-time-budget=<WaitMs> "http://localhost:8123/?<Query>"`。
  - `src/config.js` の定数: `GAME_W=960, GAME_H=540, TILE=36, SCALE=2, MAX_ROWS=15, GRAVITY=1400, RUN_SPEED=220, JUMP_VELOCITY=560, JUMP_CUT=0.45, MAX_FALL_SPEED=900, COYOTE_MS=100, BUFFER_MS=100, ENEMY_SPEED=60`
  - `src/main.js`: `new Phaser.Game({ type: Phaser.AUTO, width: GAME_W, height: GAME_H, pixelArt: true, backgroundColor: '#5c94fc', physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: <URLに debug=1 があれば true> } }, scene: [...] })`。重力は物体ごとに設定するのでワールド重力は0。

- [ ] **Step 1: Phaser をダウンロード**

Run: `curl.exe -sSfL -o lib/phaser.min.js https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js`
Expected: `lib/phaser.min.js` が1MB前後で作成される。

- [ ] **Step 2: テストランナーと失敗するスモークテストを書く**

`tests/smoke.test.js`:
```js
import { test, assertEqual } from './runner.js';
import { TILE, MAX_ROWS } from '../src/config.js';
test('config: タイルと行数', () => {
  assertEqual(TILE, 36);
  assertEqual(MAX_ROWS, 15);
});
```

- [ ] **Step 3: `tools/run-tests.ps1` を書いて実行し、失敗を確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `src/config.js` が無いので SUMMARY 行が出ず exit 1（または failed=1）。

- [ ] **Step 4: `src/config.js`、`index.html`、`src/main.js`、仮の `TitleScene`（中央に「GRAVITY FLIP」と表示するだけ）を作る**

- [ ] **Step 5: テストが通ることを確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `SUMMARY passed=1 failed=0`、exit 0。

- [ ] **Step 6: 画面が出ることを確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/screenshot.ps1 -Query "" -Out $env:TEMP\gf-title.png` → 画像を Read で開く。
Expected: 青背景に「GRAVITY FLIP」の文字。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Phaser project with browser test runner"
```

---

### Task 2: 文字マップ変換 `parseLevel`

**Files:**
- Create: `src/levels/parseLevel.js`
- Test: `tests/parseLevel.test.js`（`tests/index.html` に import 追加）

**Interfaces:**
- Consumes: `MAX_ROWS` from `src/config.js`
- Produces:
  - `parseLevel(rows: string[], stageNo: number) -> Level`
  - `Level = { width: number, height: number, solid: boolean[][] /* [row][col] */, blocks: Cell[], spikes: {col, row, dir: 'up'|'down'}[], enemies: Cell[], coins: Cell[], checkpoints: Cell[], start: Cell, goal: Cell }`、`Cell = { col: number, row: number }`
  - `width` は列数、`height` は行数（いずれもマス単位）。`solid[row][col]` は `#` のとき true。
  - エラーは `Error` を投げ、message は `ステージ{stageNo} {行}行{列}列: {内容}`（行・列は1始まり）。位置を持たないエラーは `ステージ{stageNo}: {内容}`。

- [ ] **Step 1: 失敗するテストを書く**

```js
const sample = [
  '##########',
  '#..v.....#',
  '#P.E.C^FG#',
  '##########',
];
test('parseLevel: サイズとsolid', () => {
  const lv = parseLevel(sample, 1);
  assertEqual([lv.width, lv.height], [10, 4]);
  assertTrue(lv.solid[0][0]); assertTrue(!lv.solid[2][1]);
  assertEqual(lv.blocks.length, 24);
});
test('parseLevel: 各オブジェクトの座標', () => {
  const lv = parseLevel(sample, 1);
  assertEqual(lv.start, { col: 1, row: 2 });
  assertEqual(lv.goal, { col: 8, row: 2 });
  assertEqual(lv.enemies, [{ col: 3, row: 2 }]);
  assertEqual(lv.coins, [{ col: 5, row: 2 }]);
  assertEqual(lv.checkpoints, [{ col: 7, row: 2 }]);
  assertEqual(lv.spikes, [{ col: 3, row: 1, dir: 'down' }, { col: 6, row: 2, dir: 'up' }]);
});
test('parseLevel: 不明な文字', () =>
  assertThrows(() => parseLevel(['#P#', '#x#', '#G#'], 2), 'ステージ2 2行2列: 不明な文字 "x"'));
test('parseLevel: 行の長さ不一致', () =>
  assertThrows(() => parseLevel(['#PG#', '#..#', '#.. #'], 1), 'ステージ1 3行'));
test('parseLevel: Pが無い', () => assertThrows(() => parseLevel(['#G#'], 1), 'ステージ1: スタート位置(P)'));
test('parseLevel: Pが2つ', () => assertThrows(() => parseLevel(['PPG'], 1), 'ステージ1 1行2列: スタート位置(P)が複数'));
test('parseLevel: Gが無い', () => assertThrows(() => parseLevel(['#P#'], 1), 'ステージ1: ゴール(G)'));
test('parseLevel: 16行はエラー', () =>
  assertThrows(() => parseLevel([...Array(15).fill('...'), 'PG.'], 3), 'ステージ3: 行数が15を超えています'));
test('parseLevel: 空配列', () => assertThrows(() => parseLevel([], 1), 'ステージ1:'));
```
（spikes の順序は行優先・左から右。）

- [ ] **Step 2: 実行して失敗を確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: parseLevel の import 失敗で FAIL。

- [ ] **Step 3: `parseLevel(rows, stageNo)` を実装**

行優先で1文字ずつ走査。長さ不一致は「{行}行: 長さが{n}です（1行目は{m}）」。P/G の重複は2つ目の位置を報告し、内容は「スタート位置(P)が複数あります」「ゴール(G)が複数あります」。無い場合は「スタート位置(P)がありません」「ゴール(G)がありません」。

- [ ] **Step 4: テストが通ることを確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `failed=0`。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: parse character-based level maps"
```

---

### Task 3: 反転ルールとジャンプルール

**Files:**
- Create: `src/logic/flipRules.js`, `src/logic/jumpRules.js`
- Test: `tests/flipRules.test.js`, `tests/jumpRules.test.js`

**Interfaces:**
- Consumes: `COYOTE_MS, BUFFER_MS, JUMP_VELOCITY` from `src/config.js`
- Produces（すべて新しいオブジェクトを返す。引数は書き換えない）:
  - `createFlipState() -> { gravity: 1, airFlipAvailable: true }`（`gravity`: 1=下、-1=上）
  - `canFlip(state, onGround: boolean) -> boolean`
  - `applyFlip(state, onGround: boolean) -> FlipState`（反転できないときは同じ内容を返す。空中で反転したら `airFlipAvailable=false`）
  - `onLand(state) -> FlipState`（`airFlipAvailable=true`）
  - `createJumpState() -> { lastGroundedAt: -Infinity, lastPressedAt: -Infinity }`
  - `markGrounded(js, now: number) -> JumpState` / `markPressed(js, now: number) -> JumpState`
  - `shouldJump(js, now: number, onGround: boolean) -> boolean` — `(onGround || now - lastGroundedAt <= COYOTE_MS) && now - lastPressedAt <= BUFFER_MS`
  - `consumeJump(js) -> JumpState`（両方を `-Infinity` に戻す）
  - `jumpVelocityY(gravity: 1|-1) -> number` — `-JUMP_VELOCITY * gravity`

- [ ] **Step 1: 失敗するテストを書く**

```js
// flipRules
test('flip: 接地中は何度でも反転', () => {
  let s = createFlipState();
  s = applyFlip(s, true); s = applyFlip(s, true); s = applyFlip(s, true);
  assertEqual(s, { gravity: -1, airFlipAvailable: true });
});
test('flip: 空中は1回だけ', () => {
  let s = applyFlip(createFlipState(), false);
  assertEqual(s, { gravity: -1, airFlipAvailable: false });
  assertTrue(!canFlip(s, false));
  assertEqual(applyFlip(s, false), s);
});
test('flip: 接地反転の後でも空中で1回反転できる', () => {
  const s = applyFlip(createFlipState(), true);
  assertTrue(canFlip(s, false));
});
test('flip: 着地で回復', () => {
  const s = onLand(applyFlip(createFlipState(), false));
  assertEqual(s, { gravity: -1, airFlipAvailable: true });
});
test('flip: 元の状態を書き換えない', () => {
  const s = createFlipState(); applyFlip(s, false);
  assertEqual(s, { gravity: 1, airFlipAvailable: true });
});
// jumpRules
test('jump: 接地中に押せば跳ぶ', () => {
  const js = markPressed(createJumpState(), 1000);
  assertTrue(shouldJump(js, 1000, true));
});
test('jump: コヨーテタイム100ms以内', () => {
  const js = markPressed(markGrounded(createJumpState(), 1000), 1100);
  assertTrue(shouldJump(js, 1100, false));
  assertTrue(!shouldJump(markPressed(js, 1101), 1101, false));
});
test('jump: 先行入力100ms以内', () => {
  const js = markPressed(createJumpState(), 1000);
  assertTrue(shouldJump(js, 1100, true));
  assertTrue(!shouldJump(js, 1101, true));
});
test('jump: consume後は跳ばない', () => {
  const js = consumeJump(markPressed(createJumpState(), 1000));
  assertTrue(!shouldJump(js, 1000, true));
});
test('jump: 初速は足元から離れる向き', () => {
  assertEqual(jumpVelocityY(1), -560);
  assertEqual(jumpVelocityY(-1), 560);
});
```

- [ ] **Step 2: 実行して失敗を確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: FAIL（モジュール未作成）。

- [ ] **Step 3: 上記 Interfaces どおりに `flipRules.js` と `jumpRules.js` を実装**

- [ ] **Step 4: テストが通ることを確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `failed=0`。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add gravity flip and jump timing rules"
```

---

### Task 4: 踏みつけ・画面外判定・タイム整形

**Files:**
- Create: `src/logic/combatRules.js`, `src/logic/format.js`
- Test: `tests/combatRules.test.js`, `tests/format.test.js`

**Interfaces:**
- Produces:
  - `isStomp({ playerVy: number, gravity: 1|-1, playerFeetY: number, enemyCenterY: number }) -> boolean` — 足元方向へ動いていて（`playerVy * gravity > 0`）、足元が敵の中心より手前（`(enemyCenterY - playerFeetY) * gravity > 0`）なら true。`playerFeetY` は重力下なら体の下端、重力上なら上端。
  - `isOutOfBounds(y: number, levelHeightPx: number, margin: number) -> boolean` — `y < -margin || y > levelHeightPx + margin`
  - `formatTime(ms: number) -> string` — `m:ss.d`（例 `65430 → "1:05.4"`、小数第1位は切り捨て）

- [ ] **Step 1: 失敗するテストを書く**

```js
test('stomp: 重力下・上から落ちてくる', () =>
  assertTrue(isStomp({ playerVy: 200, gravity: 1, playerFeetY: 100, enemyCenterY: 110 })));
test('stomp: 重力下・横から（足元が中心より下）', () =>
  assertTrue(!isStomp({ playerVy: 200, gravity: 1, playerFeetY: 120, enemyCenterY: 110 })));
test('stomp: 重力下・上昇中は踏めない', () =>
  assertTrue(!isStomp({ playerVy: -200, gravity: 1, playerFeetY: 100, enemyCenterY: 110 })));
test('stomp: 重力上・下から上へ落ちてくる', () =>
  assertTrue(isStomp({ playerVy: -200, gravity: -1, playerFeetY: 120, enemyCenterY: 110 })));
test('stomp: 重力上・横から', () =>
  assertTrue(!isStomp({ playerVy: -200, gravity: -1, playerFeetY: 100, enemyCenterY: 110 })));
test('outOfBounds', () => {
  assertTrue(isOutOfBounds(-37, 540, 36)); assertTrue(isOutOfBounds(577, 540, 36));
  assertTrue(!isOutOfBounds(0, 540, 36)); assertTrue(!isOutOfBounds(576, 540, 36));
});
test('formatTime', () => {
  assertEqual(formatTime(0), '0:00.0');
  assertEqual(formatTime(65430), '1:05.4');
  assertEqual(formatTime(599999), '9:59.9');
});
```

- [ ] **Step 2: 実行して失敗を確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: FAIL。

- [ ] **Step 3: 上記どおり実装**

- [ ] **Step 4: テストが通ることを確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `failed=0`。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add stomp, bounds and time formatting rules"
```

---

### Task 5: 素材読み込みとプレイヤー（歩く・跳ぶ・反転する）

**Files:**
- Create: `assets/tiles.png`, `assets/characters.png`, `src/assetKeys.js`, `src/scenes/BootScene.js`, `src/scenes/GameScene.js`, `src/objects/Player.js`, `src/levels/levels.js`, `CREDITS.md`
- Modify: `src/main.js`（シーン一覧に Boot と Game を追加）

**Interfaces:**
- Consumes: `parseLevel`（Task 2）、`flipRules`・`jumpRules`（Task 3）、`config.js` の定数
- Produces:
  - `src/assetKeys.js`: `IMG = { tiles: 'tiles', chars: 'chars' }`、`FRAMES = { block, spike, coin, checkpoint, goal, player, playerWalk: number[], enemy, enemyWalk: number[] }`（フレーム番号は素材を開いて決める）、`SFX = { jump: 'sfx-jump', flip: 'sfx-flip', coin: 'sfx-coin', die: 'sfx-die', clear: 'sfx-clear' }`（音は Task 8 で読み込む）
  - `src/levels/levels.js`: `export const LEVELS: string[][]`（この Task ではステージ1の仮マップ1つ。床・天井・段差・トゲ無し）
  - `GameScene` は `init({ stage = 0, coins = 0, elapsedMs = 0 })` を受け取る。URL に `stage=N`（1始まり）があれば Boot 後に直接そのステージを開始する。
  - `GameScene` が持つ: `this.level: Level`、`this.solidLayer`（ブロックの StaticGroup）、`this.player: Player`、`tileCenter(cell: Cell) -> {x, y}`（`col*TILE + TILE/2`）
  - `Player extends Phaser.Physics.Arcade.Sprite`: `constructor(scene, x, y)`、`update(time: number, delta: number)`、`get gravityDir(): 1|-1`、`get feetY(): number`、`respawn(x, y)`（重力・反転状態・ジャンプ状態を初期化）、`flipped` イベントを `scene.events.emit('gravity-flipped', gravityDir)` で通知

- [ ] **Step 1: Kenney 素材を取得**

https://kenney.nl/assets/pixel-platformer から zip を取得し、`$env:TEMP\kenney-pp\` に展開（プロジェクト外）。直接ダウンロードできない場合はユーザーに zip の手動ダウンロードを依頼する。`Tilemap/tilemap_packed.png`（18×18）を `assets/tiles.png`、`Tilemap/tilemap-characters_packed.png`（24×24）を `assets/characters.png` にコピー。サイズが違えば `assetKeys.js` にフレームサイズを定数で持つ。`CREDITS.md` に「Pixel Platformer by Kenney (kenney.nl), CC0」を記載。

- [ ] **Step 2: 2枚の画像を Read で開き、`FRAMES` の番号を決めて `assetKeys.js` を書く**

- [ ] **Step 3: `BootScene`（spritesheet 読み込み、読み込み失敗時 `console.error` にファイル名）と `GameScene`（parseLevel → ブロック配置 → Player生成 → 当たり判定、カメラ設定）を実装**

ブロック・オブジェクトは `setScale(SCALE)`。カメラ: 横は `startFollow(player)`、ステージ高さ `h = level.height*TILE` が `GAME_H` 未満なら `setBounds(0, -(GAME_H - h)/2, level.width*TILE, GAME_H)`。`physics.world.setBounds(0, -TILE*3, level.width*TILE, h + TILE*6)` で左右だけ壁として効かせる（`setBoundsCollision(true, true, false, false)`）。parseLevel のエラーは画面中央に赤字で表示して `scene.pause()`。

- [ ] **Step 4: `Player` を実装**

- 毎フレーム `body.setGravityY(GRAVITY * gravityDir)`、`setMaxVelocity(RUN_SPEED, MAX_FALL_SPEED)`、`setFlipY(gravityDir === -1)`。
- 接地判定は「足元側がブロックに触れている」: 重力下なら `body.blocked.down`、上なら `body.blocked.up`。接地した瞬間に `onLand` と `markGrounded`。
- ジャンプキーは `JustDown` で `markPressed`、`shouldJump` が true なら `setVelocityY(jumpVelocityY(gravityDir))` して `consumeJump`。ジャンプキーを離したとき、足元から離れる向きに動いていれば縦速度に `JUMP_CUT` を掛ける。
- 反転キーは `JustDown` のみ。`canFlip` なら `applyFlip`、縦速度0、`gravity-flipped` を emit。
- 空中反転が使用済みの間は `setTint(0x888888)`、回復で `clearTint()`。

- [ ] **Step 5: テストが壊れていないことを確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `failed=0`。

- [ ] **Step 6: 画面確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/screenshot.ps1 -Query "stage=1" -Out $env:TEMP\gf-stage1.png` → Read で開く。
Expected: ブロックの床と天井、立っているプレイヤーが表示される。

- [ ] **Step 7: 手動確認（ユーザーに依頼）**

`python -m http.server 8123` で起動し `http://localhost:8123/?stage=1` を開いてもらい確認:
左右移動／長押しで高いジャンプ・短押しで低いジャンプ／足場から落ちた直後もジャンプできる／接地中に X で天井へ落ち、天井を歩ける／空中で X は1回だけ効き、キャラが暗くなる／着地で色が戻る／X を押しっぱなしでも1回しか反転しない。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: player movement, variable jump and gravity flip"
```

---

### Task 6: トゲ・画面外・中間旗・死亡と再開

**Files:**
- Modify: `src/scenes/GameScene.js`, `src/levels/levels.js`（ステージ1仮マップにトゲ・穴・中間旗を追加）

**Interfaces:**
- Consumes: `isOutOfBounds`（Task 4）、`Player.respawn`（Task 5）
- Produces（GameScene のメソッド）:
  - `killPlayer()` — `this.isDead` が true なら何もしない。true にして、プレイヤーを止めて0.5秒点滅 → `respawnPlayer()`
  - `respawnPlayer()` — `this.respawnPoint`（初期値 `level.start`、中間旗通過で更新）の中心へ `player.respawn`、`scene.events.emit('gravity-flipped', 1)`、`isDead=false`
  - `restartStage()` — `scene.restart({ stage, coins: this.coinsAtStageStart, elapsedMs: this.elapsedAtStageStart })`（R キー）

- [ ] **Step 1: トゲを配置**（`dir: 'down'` は `setFlipY(true)`）。当たり判定は見た目より小さく（幅・高さともタイルの60%、トゲ先端側寄せ）。overlap で `killPlayer()`。

- [ ] **Step 2: 毎フレーム `isOutOfBounds(player.y, level.height*TILE, TILE)` なら `killPlayer()`。R キー `JustDown` で `restartStage()`。**

- [ ] **Step 3: 中間旗を配置**。overlap で `respawnPoint` を更新し、旗の見た目を変える（tint など）。

- [ ] **Step 4: テストが壊れていないことを確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `failed=0`。

- [ ] **Step 5: 手動確認（ユーザーに依頼）**

床トゲ・天井トゲで死ぬ／穴に落ちて死ぬ・天井側の穴から上へ抜けても死ぬ／中間旗を取った後はそこから再開／再開時に重力が下・色が戻る／トゲの密集地帯に飛び込んでも再開が1回だけ起きる／R でステージ最初から。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: spikes, pits, checkpoints and respawn"
```

---

### Task 7: 歩く敵（一緒に反転・踏みつけ）

**Files:**
- Create: `src/objects/Enemy.js`
- Modify: `src/scenes/GameScene.js`, `src/levels/levels.js`（仮マップに敵を追加）

**Interfaces:**
- Consumes: `isStomp`（Task 4）、`gravity-flipped` イベント（Task 5）、`level.solid`（Task 2）
- Produces:
  - `Enemy extends Phaser.Physics.Arcade.Sprite`: `constructor(scene, x, y)`、`setGravityDir(dir: 1|-1)`、`update(isSolidAt: (col, row) => boolean)`、`stomp()`（倒れる演出の後 destroy）
  - GameScene: `isSolidAt(col, row)` — 範囲外は false、それ以外は `level.solid[row][col]`

- [ ] **Step 1: `Enemy` を実装**

速度 `ENEMY_SPEED` で左右に歩く。向きを変える条件: 進行方向が `body.blocked.left/right`、または接地中に「進行方向の1マス先の足元側マス」（`row + gravityDir`）が `isSolidAt` で false。重力の扱いは Player と同じ（`setGravityY(GRAVITY*dir)`、`setFlipY`）。

- [ ] **Step 2: GameScene に敵を配置し、`gravity-flipped` を受けて全敵に `setGravityDir`。敵とブロックを collider、敵とプレイヤーを overlap。**

overlap 時: `isStomp({ playerVy: player.body.velocity.y, gravity: player.gravityDir, playerFeetY: player.feetY, enemyCenterY: enemy.y })` なら `enemy.stomp()` してプレイヤーを `jumpVelocityY(gravityDir) * 0.6` で跳ね返す。それ以外は `killPlayer()`。

- [ ] **Step 3: テストが壊れていないことを確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `failed=0`。

- [ ] **Step 4: 手動確認（ユーザーに依頼）**

敵が段差の端・壁で折り返す／反転すると敵も天井へ落ちる／重力下で上から踏むと倒せる／重力上で天井側の敵を「下から」踏むと倒せる／横から当たると死ぬ／倒した敵は再開後も復活しない。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: walking enemies that flip with the player"
```

---

### Task 8: コイン・ゴール・画面遷移・効果音・HUD

**Files:**
- Create: `src/scenes/ClearScene.js`, `assets/sfx/*.ogg`
- Modify: `src/scenes/TitleScene.js`, `src/scenes/GameScene.js`, `src/scenes/BootScene.js`, `src/main.js`, `CREDITS.md`

**Interfaces:**
- Consumes: `formatTime`（Task 4）、`SFX`（Task 5）、`LEVELS`
- Produces:
  - GameScene: `this.coins`、`this.elapsedMs`（`update(time, delta)` で `isDead` でない間 delta を加算）。画面左上に固定表示（`setScrollFactor(0)`）で「ステージ {n}/3　コイン {coins}　タイム {formatTime}」。
  - ゴール overlap: `stage < LEVELS.length - 1` なら `scene.restart({ stage: stage+1, coins, elapsedMs })`、最後なら `scene.start('ClearScene', { coins, elapsedMs })`
  - ClearScene: 「クリア！」「コイン {coins}」「タイム {formatTime(elapsedMs)}」「Zキーでタイトルへ」
  - TitleScene: タイトル「GRAVITY FLIP」、操作説明4行（spec の操作表どおり）、「Zキーでスタート」→ `GameScene({ stage: 0 })`

- [ ] **Step 1: 効果音を取得**

https://kenney.nl/assets/digital-audio （CC0）から zip を `$env:TEMP\kenney-audio\` に展開し、ジャンプ・反転・コイン・死亡・クリアに合う5つを選んで `assets/sfx/jump.ogg, flip.ogg, coin.ogg, die.ogg, clear.ogg` にコピー。`CREDITS.md` に追記。取得できなければユーザーに手動ダウンロードを依頼。

- [ ] **Step 2: BootScene で音を読み込み、Player（jump/flip）・GameScene（coin/die/clear）で鳴らす**

- [ ] **Step 3: コイン配置（overlap で消して `coins++`）、ゴール、HUD、Title・Clear シーンを実装し main.js に登録**

- [ ] **Step 4: テストが壊れていないことを確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `failed=0`。

- [ ] **Step 5: 画面確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/screenshot.ps1 -Query "" -Out $env:TEMP\gf-title.png` と `-Query "stage=1" -Out $env:TEMP\gf-hud.png` → Read で開く。
Expected: タイトルに操作説明、ステージ画面左上に HUD。

- [ ] **Step 6: 手動確認（ユーザーに依頼）**

タイトル → ゲーム → ゴール → クリア画面 → タイトルの一周（仮マップ1つなのでステージ1クリアでクリア画面）／コインが増える・死んでも減らない／別タブに切り替えて10秒待って戻ってもタイムが10秒進んでいない／効果音5種が鳴る。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: coins, goal, scene flow, HUD and sound effects"
```

---

### Task 9: 3ステージの作成とテストプレイ

**Files:**
- Modify: `src/levels/levels.js`
- Test: `tests/levels.test.js`

**Interfaces:**
- Consumes: `parseLevel`、`LEVELS`

- [ ] **Step 1: 失敗するテストを書く**

```js
test('levels: 3ステージある', () => assertEqual(LEVELS.length, 3));
test('levels: 全ステージが正しく読める', () => LEVELS.forEach((rows, i) => parseLevel(rows, i + 1)));
test('levels: 各ステージに敵がいる(2,3)', () => {
  assertTrue(parseLevel(LEVELS[1], 2).enemies.length > 0);
  assertTrue(parseLevel(LEVELS[2], 3).enemies.length > 0);
});
```

- [ ] **Step 2: 実行して失敗を確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `LEVELS.length` が1なので FAIL。

- [ ] **Step 3: 3ステージを書く**（spec 5章「3ステージの狙い」どおり。各ステージ横60〜120マス、高さ11〜15行、中間旗1つ以上）

1. チュートリアル: 平地 → 天井通路を反転で進む → 床トゲ列を天井へ反転して回避 → 最後に**空中1回反転が必須の穴**（床側にも天井側にも足場がなく、ジャンプ→空中反転で天井の足場に届く配置）
2. 応用: 長い穴（空中反転必須）、通路を塞ぐ敵を反転で天井へ落として下を通る場面
3. 難しめ: ジャンプ・接地反転・空中反転・敵の踏みつけを連続で要求する区間を3つ

- [ ] **Step 4: テストが通ることを確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `failed=0`。

- [ ] **Step 5: 各ステージのスクリーンショット確認**

Run: `tools/screenshot.ps1` を `stage=1`〜`stage=3` で実行し Read で開く。
Expected: 3つとも配置が表示される。

- [ ] **Step 6: 通しプレイ（ユーザーに依頼）**

タイトルからクリアまで通しプレイ。確認項目: 各ステージで空中1回反転を使わないと越えられない場面がある／最も長い縦落下でブロックをすり抜けない／理不尽に感じた箇所。指摘があればマップを直して Step 4 から繰り返す。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: three stages"
```

---

### Task 10: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: `README.md` を書く** — ゲーム概要（1〜2行）、操作表、ローカルでの起動方法（`python -m http.server 8123` → `http://localhost:8123/`）、テスト方法（`tools/run-tests.ps1`）、ステージの書き方（記法表と `src/levels/levels.js` の場所）、素材出典は `CREDITS.md` 参照。

- [ ] **Step 2: 最終確認**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1`
Expected: `failed=0`。

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add README"
```

公開（GitHub リポジトリ作成・Pages 設定）はこの後、ユーザーに確認してから行う。

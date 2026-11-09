# Gravity Flip

重力を上下に反転させながら進む、マリオ風の2Dアクションゲームです（Phaser 3、全3ステージ、ビルド不要）。

## 操作

遊ぶ人向けの図解つき説明書は [manual.html](https://tshindo73.github.io/gravity-flip/manual.html) です（スマホ向け）。

| キー | 動作 |
| --- | --- |
| ← → | 移動 |
| Z / スペース | ジャンプ |
| X / ↑ | 重力反転 |
| R | やり直し（1-1 の最初から。タイムとりんごも 0 に戻る） |
| Esc | タイトルへ戻る（HUD の TITLE ボタンでも。はい・いいえを確認。遊んでいた記録は残らない） |
| C | タイトル画面でランキングを見る |

スマホ（横持ち専用）では、画面の左の列の ← →、右の列の 反転・ジャンプ・↻（やり直し）、左上の家のボタン（タイトルへ）で遊べます。ジャンプは軽くタップしても最大の高さで跳びます。タイトルとクリア画面はタップで進みます。

クリアすると SCORE（30000 − タイムの秒数 × 100 ＋ りんごの数 × 50、多いほど良い。0 点より下にはならない）が出ます。自分の上位3件はブラウザに保存されます。通しプレイをクリアすると名前（6 文字まで）を入れて、みんなのベスト10（下の「ランキングの受付」）に送れます。

## 起動方法

プロジェクトのフォルダで簡易サーバーを立てて、ブラウザで開きます。

```
python -m http.server 8123
```

http://localhost:8123/ を開いてください。

スマホで確認するときは、PCと同じWi-Fiにつないで `http://<PCのIPアドレス>:8123/` を開きます（IPアドレスは `ipconfig` の IPv4 アドレス）。初回に Windows のファイアウォールの確認が出たら「プライベートネットワーク」を許可してください。

開発用のURLパラメータ:

- `?stage=N` ... Nステージ(1〜3)から開始
- `?debug=1` ... 当たり判定の表示。ブラウザのコンソールから `window.game` でゲームを触れます

## ランキングの受付

みんなのベスト10は Cloudflare Workers（`server/`）と D1 に保存します。公開中のゲーム（tshindo73.github.io）は本番の受付（`src/config.js` の `RANKING_API_PROD`）を、それ以外（localhost・LAN）は同じホストの 8787 番を使います。

手元で動かす（初回だけ `npm install` と表の作成）:

```
cd server
npm install
npm run db:local
echo IP_SALT=local-dev-salt > .dev.vars
npm run dev
```

動作の確認（手元の記録は消えます）:

```
node tools/check-server.mjs http://localhost:8787
```

本番に置く（初回だけ。`wrangler login` でブラウザから Cloudflare に許可を出す）:

```
cd server
npx wrangler login
npx wrangler d1 create gravity-flip-scores        # 出た database_id を wrangler.toml に書く
npx wrangler d1 execute gravity-flip-scores --remote --file=schema.sql
npx wrangler secret put IP_SALT                    # ランダムな長い文字列を入れる（どこにも保存しない）
npx wrangler deploy                                # 出た URL を src/config.js の RANKING_API_PROD に書く
```

困った名前の消し方: Cloudflare の管理画面 → Storage & databases → D1 → `gravity-flip-scores` → Console で

```
SELECT id, name, score, created_at FROM scores ORDER BY id DESC LIMIT 20;
DELETE FROM scores WHERE id = 消したい番号;
```

## テスト

```
powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-tests.ps1
```

最後に `failed=0` と出れば成功です。

## スクリーンショット

Edge のヘッドレスで画面を撮ります（サーバーは自動で起動・終了）。

```
powershell -NoProfile -ExecutionPolicy Bypass -File tools/screenshot.ps1 -Query "stage=2" -Out shot.png [-WaitMs 3000]
```

`-Query` は URL パラメータ、`-Out` は保存先、`-WaitMs` は待ち時間(ミリ秒)です。

## ステージの書き方

`src/levels/levels.js` に文字マップ（文字列の配列）として書きます。

| 文字 | 意味 |
| --- | --- |
| `#` | ブロック |
| `^` | 床トゲ（上向き） |
| `v` | 天井トゲ（下向き） |
| `E` | 敵 |
| `C` | コイン |
| `F` | 中間旗 |
| `P` | スタート位置（必ず1つ） |
| `G` | ゴール（必ず1つ） |
| `.` | 空気 |

ルール:

- 最大15行まで
- 全ての行を同じ長さにそろえる
- `P` と `G` はちょうど1つずつ
- 上の文字以外を使うとエラーになります
- キャラは高さ約 1.6 マス、敵は約 1.4 マスあります。高さ 1 マス分しか空いていない場所(隣の床から歩いて入ると頭がぶつかる場所を含む)は通れません
- 敵のいる場所は、上に 4 マス以上の空間を空けてください(敵を踏むのに必要)
- 上の 2 つはテスト(`tests/levelCheck.test.js`)が全ステージを自動で確かめます

## 素材の取り込み

`assets/pa/`(Pixel Adventure 1)と `assets/fonts/`(DotGothic16 のサブセット)は、次のスクリプトで作ります。日本語の文字を新しく画面に出したときは、フォントに文字を足すため再実行してください。

```
python tools/import-assets.py <Pixel Adventure 1 の Free フォルダ> <DotGothic16-Regular.ttf>
```

リメイク前の見た目は Git のタグ `v1-classic` に残っています。

## 素材出典

`CREDITS.md` を見てください。

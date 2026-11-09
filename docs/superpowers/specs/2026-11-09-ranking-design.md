# ランキング（自分の上位3件・みんなのベスト10）設計

日付: 2026-11-09

## 目的

遊んだ記録を残して見比べられるようにする。

1. 自分の記録の上位3件を、そのブラウザに保存して見られるようにする
2. 遊んだ人全員の記録から、点数の高い10件を見られるようにする

みんなの記録は、無料で使える Cloudflare の Workers（受付のプログラム）と D1（データベース）に保存する。ゲーム本体は今の GitHub Pages のままにする。

## 決めたこと

- プレイヤーはブラウザごとに見分ける。ログインはしない
- 名前は1〜6文字。ひらがな・カタカナ・漢字・英数字（全角・半角とも）と長音「ー」だけ使える。空白・記号・絵文字は使えない
- 名前はタイトルから始めた通しプレイを初めてクリアしたときに入力する。2回目からは同じ名前を使い、タイトル画面から変えられる
- 名前はふつうの文字（sans-serif）で表示する。点数・タイム・順位などはドット文字のまま
- 自分の上位3件はブラウザに保存する。別の端末には引き継がない
- みんなのベスト10は同じ人の記録が何件並んでもよい
- 順位は点数の高い順。同じ点数なら先に出した記録が上
- ベスト10に送るのはタイトルから始めた通しプレイ（`fullRun`）のクリアだけ。「おくらない」を選ぶと送らない
- 通信できなくてもゲームは普通に遊べる。送れなかった記録は送り直さない
- 点数の計算は今と同じ（`scorePoints`: 30000 − タイムの秒数 × 100 ＋ りんご × 50、0.1 秒単位、0 点止め）

## 画面

### クリア画面（通しプレイのとき）

1. 名前が未登録なら名前入力を出す。「OK」で登録、「おくらない」で送らない（自分の上位3件には残す）
2. 記録を送り、結果を出す
   - ベスト10に入った: 「みんなの中で 4 位！」
   - 入らなかった: 「ランキング外」
   - 通信できない: 「つうしんできません」
3. 自分の上位3件の何位に入ったかは、今の NEW! と同じ場所に出す（1位なら NEW!、2・3位なら「2ND」「3RD」）。入らなければ今と同じく BEST の組を出す

### タイトル画面

- 「RANKING」ボタンを足す。タップ・クリック、またはキーボードの C で開く
- 名前が登録済みなら「なまえ：〇〇（かえる）」を小さく出し、押すと名前入力を開く
- 「BEST」の表示は残す。中身は自分の上位3件の1位

### ランキング画面（RankingScene、新規）

- 上のタブで「じぶん TOP3」「みんな TOP10」を切り替える（タップ・クリック、キーボードは ← →）
- 1行に 順位・名前・SCORE・タイム・りんごの数。名前だけふつうの文字
- 「みんな TOP10」は開いたときに受付から読み込む。読み込み中は「よみこみ中…」、失敗したら「つうしんできません」
- 「もどる」でタイトルへ（キーボードは Esc か Z）

### 名前入力

- Phaser には文字入力がないので、HTML の `<input>` を `#game` の上に重ねる。スマホでは日本語キーボードが使える
- 入力中はゲームのキー操作を受け付けない
- ルールに合わない名前は「1〜6文字の ひらがな・カタカナ・漢字・英数字 にしてね」と出して登録しない

## 部品の構成

```
ゲーム（GitHub Pages）                         Cloudflare
  ClearScene ─┐                               Workers: gravity-flip-scores
  TitleScene ─┼─ rankingApi ──HTTPS(JSON)──→   POST /scores  記録を受け付けて順位を返す
  RankingScene┘                               GET  /scores  ベスト10を返す
        │                                          │
  localRanking（ブラウザの保存）                    D1: scores 表
        │                                          │
        └──── src/logic/ranking.js（名前・記録の判定、並べ方）を両方で使う
```

### 新規

| ファイル | 役割 |
|---|---|
| `src/logic/ranking.js` | 画面にも通信にも依存しない判定。`normalizeName(text)`（前後の空白を除いてルールに合えば名前、合わなければ null）、`isValidRun({ timeMs, coins })`、`compareRuns(a, b)`（点数の高い順、同点は `at` の古い順）、`mergeTop(list, run, size)`（入れ替えた一覧と入った順位）、`MAX_COINS`（ステージの C の数から数える。今は 77）、`MIN_TIME_MS = 45000`、`MAX_TIME_MS = 3600000` |
| `src/logic/localRanking.js` | 自分の上位3件と名前のブラウザ保存。`loadTop3` `saveTop3` `loadName` `saveName`。今の BEST（`gravity-flip-best-v2`）があれば1件目として引き継ぐ。保存できない環境でも止まらない |
| `src/net/rankingApi.js` | 受付との通信。`submitRun({ name, timeMs, coins })` → `{ rank, top }`、`fetchTop()` → `top`。5 秒で打ち切り、失敗は例外ではなく `null` を返す |
| `src/ui/nameInput.js` | 名前入力の `<input>` を出して、OK・おくらない を Promise で返す |
| `src/scenes/RankingScene.js` | ランキング画面 |
| `server/wrangler.toml` | Workers の設定（名前 `gravity-flip-scores`、D1 の結び付け） |
| `server/schema.sql` | `scores` 表と点数順の索引 |
| `server/src/index.js` | 受付のプログラム。`src/logic/ranking.js` と `src/logic/records.js` の `scorePoints` を読み込んで使う |
| `tools/check-server.mjs` | 手元で動かした受付に正しい記録・ありえない記録・連続送信を送って結果を確かめるスクリプト |

### 変更

| ファイル | 内容 |
|---|---|
| `src/config.js` | 受付の URL `RANKING_API` |
| `src/logic/records.js` | `mergeBest` `loadBest` `saveBest` を `localRanking` に置き換える。`scorePoints` は残す |
| `src/scenes/ClearScene.js` | 名前入力・送信・順位の表示。自分の上位3件の反映 |
| `src/scenes/TitleScene.js` | RANKING ボタン、名前の表示と変更、BEST を上位3件の1位から出す |
| `src/main.js` | RankingScene を登録 |
| `tools/import-assets.py` | 変更なし。新しい日本語の案内文が増えるので、実行してフォントを作り直す |
| `README.md` `manual.html` | ランキングの説明、受付の置き方、困った名前の消し方 |

## 受付（Workers）

### 窓口

- `POST /scores` 本文 `{ "name": "しんどう", "timeMs": 80000, "coins": 15 }`
  - 名前は `normalizeName`、記録は `isValidRun` で確かめる。合わなければ 400
  - 点数は受付で `scorePoints` から計算して保存する（ゲームから点数は送らない）
  - 同じ送り元から 20 秒以内の送信は 429
  - 返事 `{ "rank": 4, "top": [ … 10 件 … ] }`。`rank` はベスト10の外なら 11 以上の実際の順位
- `GET /scores` 返事 `{ "top": [ … 10 件 … ] }`
- `top` の1件は `{ "name", "score", "timeMs", "coins", "at" }`

### 順位

`rank = (点数が高い記録の数) + (同じ点数で先に出した記録の数) + 1`

### データベース（D1）

```sql
CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  time_ms INTEGER NOT NULL,
  coins INTEGER NOT NULL,
  score INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  ip_hash TEXT NOT NULL
);
CREATE INDEX scores_rank ON scores (score DESC, id ASC);
CREATE INDEX scores_ip ON scores (ip_hash, created_at);
```

- `ip_hash` は送り元の IP アドレスに秘密の文字列（Workers のシークレット `IP_SALT`）を足して SHA-256 にしたもの。IP アドレスそのものは保存しない。連続送信の確認にだけ使う

### ありえない記録の基準

- りんご: 0 〜 `MAX_COINS`（77）の整数
- タイム: `MIN_TIME_MS`（45 秒）〜 `MAX_TIME_MS`（1 時間）。走る速さ（毎秒約 6.1 マス）で全ステージのスタートからゴールまで横に走るだけでも 48.8 秒かかるので、45 秒未満は普通には出せない
- 名前: `normalizeName` が null を返すもの

### 送り先の制限（CORS）

`https://tshindo73.github.io` と、手元確認用の `http://localhost:*`・`http://192.168.*.*:*` からの通信だけ受け付ける。

### 運用

- 困った名前は Cloudflare の管理画面の D1 のコンソールで `DELETE FROM scores WHERE id = …;` を実行して消す（README に手順を書く）
- 記録はすべて残す
- 無料枠（1日に書き込み 10 万行・読み取り 500 万行、容量 5GB）を超えた日は受付が止まる。料金はかからない

## エラー時のふるまい

- 受付に届かない・5 秒で返事がない・400/429/500 のとき、ゲームは「つうしんできません」を出して先へ進める
- 送れなかった記録は送り直さない。自分の上位3件には残る
- ブラウザに保存できない環境（プライベートブラウズなど）では、自分の上位3件と名前を保存しない。毎回名前入力が出る

## テスト

- `tests/ranking.test.js`: 名前のルール（ひらがな・カタカナ・漢字・英数字・全角・長音は OK、空白・記号・絵文字・7文字は NG、前後の空白は除く）、`isValidRun` の境界（44.9 秒 NG・45 秒 OK、りんご 78 個 NG）、`compareRuns`（同点は古い順）、`mergeTop`（入る・入らない・同点は後から来たほうが下）、`MAX_COINS` が 77
- `tests/localRanking.test.js`: 上位3件の保存と読み戻し、今の BEST の引き継ぎ、壊れたデータ、保存できない環境
- `tools/check-server.mjs`: `wrangler dev`（手元の D1）に対して、正しい記録→保存と順位、ありえない記録→400、20 秒以内の連続→429、ベスト10の並び
- 画面の確認（Playwright）: PC とスマホの大きさで、クリア→名前入力→順位、ランキング画面のタブ、受付が止まっているときの表示
- 実機: LAN の URL でスマホから遊ぶ

## 公開の手順

1. ユーザー: `npx wrangler login` を一度だけ実行し、ブラウザで Cloudflare に許可を出す
2. D1 の作成、表の作成、`IP_SALT` の設定、受付の公開。公開した受付に `tools/check-server.mjs` を当てて確かめ、確認用の記録は消す
3. ゲーム側をブランチ → テスト → LAN 確認 → PR → マージで公開
4. 説明書（manual.html と Artifact 版）と README を更新

## やらないこと

- ログイン、端末をまたいだ自分の記録の引き継ぎ
- 送れなかった記録の送り直し
- 不適切な名前の自動判定（見つけたら手で消す）
- 記録の改ざんを完全に防ぐこと（ブラウザのゲームでは不可能。ありえない記録を弾くところまで）

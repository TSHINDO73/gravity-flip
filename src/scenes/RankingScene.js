import { formatTime } from '../logic/format.js';
import { scorePoints } from '../logic/records.js';
import { loadTop3, loadName } from '../logic/localRanking.js';
import { fetchTop } from '../net/rankingApi.js';
import { Background, STAGE_SKIES } from '../objects/Background.js';
import { pixelText, jpText, panel, groundStrip, NAVY } from '../ui/pixelText.js';

const TAB_PINK = 0xff5078;
const ROW_TOP = 96;
const ROW_H = 36;
// 名前はフォントにない文字(漢字など)も入るので、ドット文字ではなくふつうの文字で描く
const NAME_STYLE = { fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff', stroke: '#1a1a2e', strokeThickness: 4 };

// ランキング画面。「じぶん TOP3」(ブラウザの保存)と「みんな TOP10」(受付から読む)を切り替える
export class RankingScene extends Phaser.Scene {
  constructor() {
    super('RankingScene');
  }

  init(data) {
    this.tab = data?.tab === 'all' ? 'all' : 'mine';
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    this.cx = cx;
    new Background(this, STAGE_SKIES[0], { width, height });
    groundStrip(this, width, 476);
    panel(this, cx - 400, 76, 800, 386);

    this.tabs = {
      mine: this.makeButton(cx - 210, 18, 200, 44, 'じぶん TOP3', () => this.showTab('mine')),
      all: this.makeButton(cx + 10, 18, 200, 44, 'みんな TOP10', () => this.showTab('all')),
    };
    this.makeButton(cx - 400, 18, 120, 44, 'もどる', () => this.back());

    this.rows = [];
    // 読み込みが終わる前にタブを切り替えたら、古い返事は使わない
    this.request = 0;
    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.showTab('mine'));
    kb.on('keydown-RIGHT', () => this.showTab('all'));
    ['keydown-ESC', 'keydown-Z'].forEach((ev) => kb.on(ev, () => this.back()));
    this.showTab(this.tab);
  }

  makeButton(x, y, w, h, label, onTap) {
    const bg = this.add.rectangle(x, y, w, h, NAVY).setOrigin(0).setStrokeStyle(3, 0xffffff);
    jpText(this, x + w / 2, y + 9, label, 20);
    bg.setInteractive({ useHandCursor: true }).on('pointerup', onTap);
    return bg;
  }

  back() {
    this.scene.start('TitleScene');
  }

  async showTab(tab) {
    this.tab = tab;
    this.tabs.mine.setFillStyle(tab === 'mine' ? TAB_PINK : NAVY);
    this.tabs.all.setFillStyle(tab === 'all' ? TAB_PINK : NAVY);
    const request = ++this.request;
    if (tab === 'mine') {
      const name = loadName() ?? '';
      this.render(loadTop3().map((run) => ({ ...run, name, score: scorePoints(run) })), 'まだ記録がありません');
      return;
    }
    this.message('よみこみ中…');
    const top = await fetchTop();
    if (request !== this.request || !this.sys.isActive()) return;
    if (top) this.render(top, 'まだ記録がありません');
    else this.message('つうしんできません');
  }

  clearRows() {
    this.rows.forEach((o) => o.destroy());
    this.rows = [];
  }

  message(text) {
    this.clearRows();
    this.rows.push(jpText(this, this.cx, 250, text, 24));
  }

  // 1 行: 順位・名前・SCORE・タイム・りんご
  render(entries, emptyText) {
    if (!entries.length) {
      this.message(emptyText);
      return;
    }
    this.clearRows();
    const { cx } = this;
    entries.forEach((e, i) => {
      const y = ROW_TOP + i * ROW_H;
      this.rows.push(
        pixelText(this, cx - 340, y + 4, String(i + 1), 3, { originX: 1 }),
        this.add.text(cx - 310, y + 4, e.name, NAME_STYLE),
        pixelText(this, cx - 40, y + 4, String(e.score), 3),
        pixelText(this, cx + 120, y + 9, formatTime(e.timeMs), 2),
        this.add.image(cx + 262, y + 16, 'apple', 0),
        pixelText(this, cx + 276, y + 9, `X${e.coins}`, 2),
      );
    });
  }
}

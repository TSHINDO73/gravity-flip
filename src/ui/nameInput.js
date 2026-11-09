import { normalizeName, NAME_MAX } from '../logic/ranking.js';

// 名前の入力欄。Phaser には文字入力がないので、HTML の input をゲームの上に重ねる。
// 名前はほかの人にも見えるので、HTML として解釈させない(textContent だけを使う)。
// OK で正しい名前、取り消しで null を返す

function el(tag, className, text = '') {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

export function askName(scene, { initial = '', cancelLabel = 'おくらない' } = {}) {
  return new Promise((resolve) => {
    // 入力中はゲームのキー操作を止める(Z やスペースを打っても画面が進まないように)
    const keyboards = [scene.input.keyboard, scene.game.input.keyboard].filter(Boolean);
    const wasEnabled = keyboards.map((k) => k.enabled);
    keyboards.forEach((k) => { k.enabled = false; });

    const root = el('div', 'name-dialog');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'なまえ');
    const box = el('div', 'name-box');
    const input = document.createElement('input');
    input.className = 'name-field';
    input.type = 'text';
    input.value = initial;
    // 文字数は normalizeName で数える。サロゲートペアの漢字もあるので、ここは少し多めにしておく
    input.maxLength = NAME_MAX * 2;
    input.autocomplete = 'off';
    input.setAttribute('enterkeyhint', 'done');
    input.setAttribute('aria-label', 'なまえ');
    const error = el('p', 'name-error', '1〜6文字の ひらがな・カタカナ・漢字・英数字 にしてね');
    error.hidden = true;
    const buttons = el('div', 'name-buttons');
    const ok = el('button', 'name-ok', 'OK');
    const cancel = el('button', 'name-cancel', cancelLabel);
    ok.type = 'button';
    cancel.type = 'button';
    buttons.append(cancel, ok);
    box.append(
      el('p', 'name-title', `なまえ（${NAME_MAX}文字まで）`),
      input,
      el('p', 'name-note', 'みんなに公開されます。本名や連絡先は入れないでね'),
      error,
      buttons,
    );
    root.append(box);

    let closed = false;
    const close = (value) => {
      if (closed) return;
      closed = true;
      root.remove();
      keyboards.forEach((k, i) => { k.enabled = wasEnabled[i]; });
      resolve(value);
    };
    const submit = () => {
      const name = normalizeName(input.value);
      if (name) close(name);
      else error.hidden = false;
    };
    ok.addEventListener('click', submit);
    cancel.addEventListener('click', () => close(null));
    input.addEventListener('keydown', (e) => {
      // ゲーム側(window)のキー処理に届かせない
      e.stopPropagation();
      // 日本語の変換を確定する Enter では送らない
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      } else if (e.key === 'Escape') {
        close(null);
      }
    });
    input.addEventListener('keyup', (e) => e.stopPropagation());
    // 画面が切り替わったら取り消し扱いで片付ける
    scene.events.once('shutdown', () => close(null));

    document.body.append(root);
    input.focus();
  });
}

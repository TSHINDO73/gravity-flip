// 効果音を鳴らす。キャッシュに無い(読み込み失敗・Ogg非対応ブラウザ)ときは何もしない。
// Phaser 3.90 の sound.play は未ロードのキーで例外を投げるため、必ずこれを通す。
export function playSfx(scene, key) {
  if (scene.cache.audio.exists(key)) scene.sound.play(key);
}

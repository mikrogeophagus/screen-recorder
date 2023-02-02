'use strict';

// 画面共有設定フォーム
const settingsForm = document.getElementById('settings-form');

// プレビュー
const preview = document.getElementById('preview');

// モーダル
const modal = document.getElementById('controller');
const bootstrapModalInstance = new bootstrap.Modal(modal);

// キャプチャボタンを押したとき
settingsForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const [ width, height ] = formData.get('resolution').split('x');
  const frameRate = formData.get('frame-rate');

  const sampleRate = formData.get('sample-rate');

  const options = {
    video: {
      // アスペクト比
      aspectRatio: { ideal: 16 / 9 },

      // 解像度
      width: { ideal: parseInt(width) },
      height: { ideal: parseInt(height) },

      // フレームレート
      frameRate: { ideal: parseInt(frameRate) },

      // 共有画面選択時にタブを優先的に表示する
      displaySurface: 'browser'
    },
    audio: {
      // サンプリング周波数
      sampleRate: { ideal: parseInt(sampleRate) },

      // 量子化ビット数
      sampleSize: { ideal: 24 }
    },
    // 共有画面の切り替えを可能にする
    surfaceSwitching: 'include',

    // 共有画面選択時に現在のタブを除外する
    selfBrowserSurface: 'exclude'
  };

  startCapture(options);
});

// モーダルを閉じたとき
modal.addEventListener('hide.bs.modal', () => {
  stopCapture();
});

/**
 * キャプチャを開始する
 * @param {DisplayMediaStreamOptions} [options]
 * @return {Promise}
 */
async function startCapture(options = { audio: true, video: true }) {
  let stream;

  try {
    // 画面収録が許可されていない場合は NotAllowedError になる
    stream = await navigator.mediaDevices.getDisplayMedia(options);
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      alert('画面収録を許可してください。');
    }

    console.error('[ERROR]', error);
    return;
  }

  const [ track ] = stream.getTracks();

  // 画面共有を停止された場合などに実行される
  track.addEventListener('ended', () => {
    bootstrapModalInstance.hide();
  });

  // キャプチャしている画面を表示する
  preview.srcObject = stream;

  // モーダルを開く
  bootstrapModalInstance.show();

  console.info('[INFO] キャプチャを開始しました。');
}

/** キャプチャを終了する */
function stopCapture() {
  const stream = preview.srcObject;

  if (stream) {
    // トラックを停止する
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
  }

  // プレビューをリセットする
  preview.srcObject = null;

  // フォームをリセットする
  settingsForm.reset();

  console.info('[INFO] キャプチャを終了しました。');
}
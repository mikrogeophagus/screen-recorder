'use strict';

// ダウンロードボタン
const downloadButton = document.getElementById('download-button');

// 収録開始、一時停止、収録停止ボタン
const recordButton = document.getElementById('record-button');
const pauseButton = document.getElementById('pause-button');
const pauseLabel = document.getElementById('pause-label');
const stopButton = document.getElementById('stop-button');

// ダウンロードボタンをクリックしたとき
downloadButton.addEventListener('click', () => {
  if (recorder && chunks) download();
});

// 収録開始ボタンをクリックしたとき
recordButton.addEventListener('click', () => {
  const stream = preview.srcObject;
  if (stream) startRecording(stream);
});

// 収録一時停止・再開ボタンをクリックしたとき
pauseButton.addEventListener('change', (event) => {
  event.currentTarget.checked ? resumeRecording() : pauseRecording();
});

// 収録停止ボタンをクリックしたとき
stopButton.addEventListener('click', () => {
  stopRecording();
});

let recorder;
let chunks;

/**
 * 画面収録を開始する
 * @param {MediaStream} stream
 * @param {MediaRecorderOptions} [options]
 */
function startRecording(stream, options = { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: 2500000, audioBitsPerSecond: 128000 }) {
  // 収録された細切れのデータを入れる
  chunks = [];

  try {
    // 指定した MIME タイプに対応していない場合は NotSupportedError になる
    recorder = new MediaRecorder(stream, options);
  } catch (error) {
    if (error.name === 'NotSupportedError') {
      alert('指定された MIME タイプに対応していません。');
    }

    console.error('[ERROR]', error);
    return;
  }

  // 1 秒ごとに Blob に収録する
  recorder.start(1000);

  // 収録された細切れのデータを配列に追加する
  recorder.addEventListener('dataavailable', (event) => {
    chunks.push(event.data);
  });

  // エラーイベント
  recorder.addEventListener('error', (event) => {
    console.error('[ERROR] 収録に失敗しました。', event.error);
  });

  // 収録開始イベント
  recorder.addEventListener('start', () => {
    console.info('[INFO] 収録を開始しました。');

    //ボタンの状態を切り替える
    downloadButton.disabled = true;
    recordButton.disabled = true;
    pauseButton.disabled = false;
    stopButton.disabled = false;
  });

  // 収録一時停止イベント
  recorder.addEventListener('pause', () => {
    console.info('[INFO] 収録を一時停止しました。');

    // 一時停止・再開ボタンの表示を切り替える
    pauseLabel.innerHTML = '<i class="bi bi-play-circle"></i> 収録再開';
  });

  // 収録再開イベント
  recorder.addEventListener('resume', () => {
    console.info('[INFO] 収録を再開しました。');

    // 一時停止・再開ボタンの表示を切り替える
    pauseLabel.innerHTML = '<i class="bi bi-pause-circle"></i> 一時停止';
  });

  // 収録停止イベント
  recorder.addEventListener('stop', () => {
    console.info('[INFO] 収録を停止しました。');

    // ボタンをリセットする
    pauseLabel.innerHTML = '<i class="bi bi-pause-circle"></i> 一時停止';
    downloadButton.disabled = false;
    recordButton.disabled = false;
    pauseButton.disabled = true;
    stopButton.disabled = true;
  });
}

/** 収録を停止する */
function stopRecording() {
  if (recorder?.state === 'recording' || recorder?.state === 'paused') {
    recorder.stop();
  }
}

/** 収録を一時停止する */
function pauseRecording() {
  if (recorder?.state === 'recording') {
    recorder.pause();
  }
}

/** 収録を再開する */
function resumeRecording() {
  if (recorder?.state === 'paused') {
    recorder.resume();
  }
}

/** 収録した動画をダウンロードする */
function download() {
  // ファイル名の文字列を作る
  const extension = getExtensionFromMimeType(recorder.mimeType);
  const fileName = `ScreenRecording_${crypto.randomUUID()}.${extension}`;

  // Blob の配列から 1 つの File を作る（まとめる）
  const file = new File(chunks, fileName, { type: recorder.mimeType });
  const url = URL.createObjectURL(file);

  // ファイルをダウンロードする
  const anchor = document.createElement('a');
  anchor.download = file.name;
  anchor.href = url;
  anchor.click();

  URL.revokeObjectURL(url);
  anchor.remove();

  console.info('[INFO] ダウンロードしました。', file);
}

const extensions = new Map([
  [ 'video/x-matroska', 'mkv' ],
  [ 'video/webm', 'webm' ],
  [ 'video/mp4', 'mp4' ]
]);

function getExtensionFromMimeType(mimeType) {
  return extensions.get(mimeType.split(';').shift());
}

const mimeTypes = [
  'video/x-matroska;codecs=avc1,opus',
  'video/webm;codecs=h264,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9,opus',
  'video/mp4;codecs=h264,aac'
];
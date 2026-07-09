/* Shared FFmpeg.wasm loader — used by all video/audio tools */
(function() {
  if ('serviceWorker' in navigator) {
    const swPath = location.hostname === 'localhost'
      ? '/coi-serviceworker.js'
      : '/toolverse-web/coi-serviceworker.js';
    navigator.serviceWorker.register(swPath)
      .then(reg => {
        if (!crossOriginIsolated) {
          reg.addEventListener('updatefound', () => location.reload());
          location.reload();
        }
      }).catch(() => {});
  }
})();

let _ff = null, _loading = false, _cbs = [];
async function loadFFmpeg(onProgress) {
  if (_ff) return _ff;
  if (_loading) return new Promise(r => _cbs.push(r));
  _loading = true;
  const s1 = document.createElement('script');
  s1.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js';
  document.head.appendChild(s1);
  await new Promise(r => s1.onload = r);
  const s2 = document.createElement('script');
  s2.src = 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js';
  document.head.appendChild(s2);
  await new Promise(r => s2.onload = r);
  const { FFmpeg } = FFmpegWASM;
  const { fetchFile, toBlobURL } = FFmpegUtil;
  window._fetchFile = fetchFile;
  const ff = new FFmpeg();
  if (onProgress) ff.on('progress', onProgress);
  const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ff.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  _ff = ff;
  _cbs.forEach(c => c(ff));
  _cbs = []; _loading = false;
  return ff;
}
window.loadFFmpeg = loadFFmpeg;

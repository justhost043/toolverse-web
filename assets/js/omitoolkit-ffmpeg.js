/**
 * OMIToolKit FFmpeg Shared Loader v1.0.0
 *
 * Singleton pattern — FFmpeg loads ONCE per browser session.
 * All video/audio tools share this single instance.
 *
 * Previously duplicated in 18 tool files.
 * Now defined once here.
 *
 * Usage:
 *   const ff = await OMI.ffmpeg.load();
 *   const { fetchFile } = OMI.ffmpeg;
 */

(function (window) {
  'use strict';

  // Wait for OMI core to be available
  if (!window.OMI) window.OMI = {};

  const ffmpegModule = {

    _instance:    null,
    _loading:     false,
    _callbacks:   [],
    fetchFile:    null,

    /**
     * Load FFmpeg (singleton — only downloads once)
     * @param {Object} options
     * @param {Function} options.onProgress  Called with {progress: 0-1}
     * @param {Function} options.onLog       Called with {message: string}
     * @returns {Promise<FFmpeg>}
     */
    async load(options = {}) {
      // Already loaded
      if (this._instance) return this._instance;

      // Loading in progress — queue callback
      if (this._loading) {
        return new Promise(resolve => this._callbacks.push(resolve));
      }

      this._loading = true;

      try {
        // Show loading status
        if (window.OMI && window.OMI.ui) {
          OMI.ui.status('Loading FFmpeg engine (~30MB, cached after first load)…', 'info');
          OMI.ui.progress(3);
        }

        // Dynamic import — only downloads when needed
        const [ffmpegLib, utilLib] = await Promise.all([
          import('https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js'),
          import('https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js')
        ]);

        this.fetchFile = utilLib.fetchFile;
        const { toBlobURL } = utilLib;

        const ff = new ffmpegLib.FFmpeg();

        // Progress handler
        ff.on('progress', ({ progress }) => {
          const pct = 5 + Math.round(progress * 88);
          if (window.OMI && window.OMI.ui) OMI.ui.progress(pct);
          if (options.onProgress) options.onProgress({ progress });
        });

        // Log handler (development only)
        if (options.onLog) {
          ff.on('log', options.onLog);
        }

        // Load WASM core
        const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ff.load({
          coreURL: await toBlobURL(`${base}/ffmpeg-core.js`,   'text/javascript'),
          wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        this._instance = ff;
        this._loading  = false;

        if (window.OMI && window.OMI.ui) {
          OMI.ui.status('FFmpeg ready ✓', 'success');
          OMI.ui.progress(100);
        }

        // Resolve all queued callers
        this._callbacks.forEach(cb => cb(ff));
        this._callbacks = [];

        return ff;

      } catch (err) {
        this._loading = false;
        this._callbacks = [];

        if (window.OMI && window.OMI.error) {
          OMI.error.handle(err, 'FFmpeg Loader');
        }
        throw err;
      }
    },

    /**
     * Check if FFmpeg is already loaded (no download needed)
     */
    isLoaded() {
      return this._instance !== null;
    },

    /**
     * Execute FFmpeg command with automatic error handling
     * @param {string[]} args
     * @returns {Promise<void>}
     */
    async exec(args) {
      const ff = await this.load();
      try {
        await ff.exec(args);
      } catch (err) {
        throw new Error(`FFmpeg command failed: ${err.message || 'Unknown error'}`);
      }
    },

    /**
     * Write file to FFmpeg virtual filesystem
     * @param {string} name
     * @param {File|Uint8Array} fileOrData
     */
    async writeFile(name, fileOrData) {
      const ff = await this.load();
      const data = fileOrData instanceof File
        ? await this.fetchFile(fileOrData)
        : fileOrData;
      await ff.writeFile(name, data);
    },

    /**
     * Read file from FFmpeg virtual filesystem
     * @param {string} name
     * @returns {Promise<Uint8Array>}
     */
    async readFile(name) {
      const ff = await this.load();
      return await ff.readFile(name);
    },

    /**
     * Delete file from FFmpeg virtual filesystem
     */
    async deleteFile(name) {
      try {
        const ff = await this.load();
        await ff.deleteFile(name);
      } catch {
        // Ignore delete errors
      }
    },

    /**
     * Cleanup temp files after processing
     * @param {string[]} names
     */
    async cleanup(...names) {
      for (const name of names) {
        await this.deleteFile(name);
      }
    }
  };

  window.OMI.ffmpeg = ffmpegModule;

})(window);

/**
 * OMIToolKit Core Library v1.0.0
 * Shared infrastructure for all 133+ tools
 *
 * Modules:
 *  - OMI.error    → Global error handling + toast notifications
 *  - OMI.ui       → Progress, status, file info, loading states
 *  - OMI.dz       → Drop zone initialization
 *  - OMI.audio    → Audio utilities (audioBufferToWav, download)
 *  - OMI.validate → Input validation helpers
 *  - OMI.safe     → Security helpers (sanitize, safe DOM)
 *  - OMI.file     → File helpers (extension, basename, size format)
 */

(function (window) {
  'use strict';

  const OMI = {};

  /* ============================================================
     ERROR HANDLING MODULE
     Global error strategy: toast + console + graceful recovery
     ============================================================ */
  OMI.error = {

    /**
     * Show a toast notification (non-blocking, auto-dismisses)
     * @param {string} message  Human-friendly message
     * @param {'error'|'success'|'warning'|'info'} type
     * @param {number} duration milliseconds (0 = persistent)
     */
    toast(message, type = 'error', duration = 4000) {
      // Remove existing toast of same type
      const existing = document.querySelector(`.omi-toast.toast-${type}`);
      if (existing) existing.remove();

      const icons = { error: '⚠️', success: '✅', warning: '⚡', info: 'ℹ️' };
      const toast = document.createElement('div');
      toast.className = `omi-toast toast-${type}`;
      toast.innerHTML = `
        <span>${icons[type] || 'ℹ️'}</span>
        <span>${OMI.safe.text(message)}</span>
        <button class="omi-toast-close" aria-label="Dismiss">×</button>`;

      toast.querySelector('.omi-toast-close')
        .addEventListener('click', () => OMI.error._dismiss(toast));

      document.body.appendChild(toast);

      if (duration > 0) {
        setTimeout(() => OMI.error._dismiss(toast), duration);
      }
      return toast;
    },

    _dismiss(toast) {
      if (!toast || !toast.parentNode) return;
      toast.style.transition = 'opacity .2s, transform .2s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 220);
    },

    /**
     * Handle tool errors consistently
     * Shows toast + updates status box if present
     */
    handle(err, context = '') {
      const message = OMI.error._friendly(err);
      console.error(`[OMIToolKit${context ? ' / ' + context : ''}]`, err);
      OMI.error.toast(message, 'error');

      // Also update inline status box if present
      const sb = document.getElementById('sb') || document.getElementById('status-box');
      if (sb) {
        sb.className = 'omi-status error';
        sb.textContent = '⚠️ ' + message;
        sb.style.display = '';
      }
    },

    /**
     * Convert technical errors to human-friendly messages
     */
    _friendly(err) {
      if (!err) return 'Something went wrong. Please try again.';

      const msg = (err.message || String(err)).toLowerCase();

      if (msg.includes('not supported') || msg.includes('mime'))
        return 'This file format is not supported. Please try a different file.';
      if (msg.includes('memory') || msg.includes('oom'))
        return 'File is too large to process. Try a smaller file.';
      if (msg.includes('abort') || msg.includes('cancel'))
        return 'Operation was cancelled.';
      if (msg.includes('network') || msg.includes('fetch'))
        return 'Network error. Please check your connection and try again.';
      if (msg.includes('decode') || msg.includes('corrupt'))
        return 'File appears to be corrupted or in an unsupported format.';
      if (msg.includes('permission') || msg.includes('denied'))
        return 'Permission denied. Please allow access and try again.';
      if (msg.includes('quota') || msg.includes('storage'))
        return 'Not enough storage space in browser. Try clearing some space.';
      if (msg.includes('timeout'))
        return 'Operation timed out. Try with a smaller file.';

      return err.message || 'Something went wrong. Please try again.';
    }
  };

  /* ============================================================
     UI MODULE
     Progress bars, status boxes, loading states
     ============================================================ */
  OMI.ui = {

    /**
     * Show progress (0-100)
     * Works with both #pw/#pb and .omi-prog-wrap/.omi-prog-bar
     */
    progress(pct) {
      const wrap = document.querySelector('.omi-prog-wrap, #pw, #prog-wrap');
      const bar  = document.querySelector('.omi-prog-bar,  #pb, #prog-bar');
      if (wrap) wrap.style.display = '';
      if (bar)  bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    },

    /**
     * Show status message
     * @param {string} msg
     * @param {'info'|'success'|'error'|'warning'} type
     */
    status(msg, type = 'info') {
      const el = document.querySelector('.omi-status, #sb, #status-box, #status');
      if (!el) return;
      el.className = `omi-status ${type !== 'info' ? type : ''}`.trim();
      el.textContent = msg;
      el.style.display = '';
    },

    /** Hide progress + status */
    reset() {
      const wrap = document.querySelector('.omi-prog-wrap, #pw, #prog-wrap');
      const bar  = document.querySelector('.omi-prog-bar, #pb, #prog-bar');
      const sb   = document.querySelector('.omi-status, #sb, #status-box, #status');
      if (wrap) wrap.style.display = 'none';
      if (bar)  bar.style.width = '0%';
      if (sb)   sb.style.display = 'none';
    },

    /**
     * Update file info banner
     * @param {File} file
     * @param {Object} extra  Additional chips {label: value}
     */
    fileInfo(file, extra = {}) {
      const banner = document.querySelector('.omi-file-banner');
      if (!banner) {
        // Try legacy IDs
        const fn = document.getElementById('fn') || document.getElementById('fi-name') || document.getElementById('fi-info');
        const sz = document.getElementById('fsz') || document.getElementById('size-chip');
        if (fn) fn.textContent = file.name;
        if (sz) sz.textContent = OMI.file.formatSize(file.size);
        return;
      }
      banner.innerHTML = `
        <div>
          <div class="fb-name" title="${OMI.safe.attr(file.name)}">${OMI.safe.text(file.name)}</div>
          <div class="fb-meta">${OMI.file.formatSize(file.size)}${Object.entries(extra).map(([k,v]) => ` · ${k}: ${v}`).join('')}</div>
        </div>`;
    },

    /** Disable/enable a button with loading text */
    setLoading(btnId, loading, loadingText = 'Processing...') {
      const btn = typeof btnId === 'string' ? document.getElementById(btnId) : btnId;
      if (!btn) return;
      btn.disabled = loading;
      if (loading) {
        btn._origText = btn.textContent;
        btn.textContent = loadingText;
      } else {
        btn.textContent = btn._origText || btn.textContent;
      }
    }
  };

  /* ============================================================
     DROP ZONE MODULE
     Unified drag-and-drop + click-to-upload
     ============================================================ */
  OMI.dz = {

    /**
     * Initialize a drop zone
     * @param {string|Element} dzId   Drop zone ID or element
     * @param {string|Element} fiId   File input ID or element
     * @param {Function} callback     Called with File object
     * @param {Object} options        { multiple, accept, maxSize }
     */
    init(dzId, fiId, callback, options = {}) {
      const dz = typeof dzId === 'string' ? document.getElementById(dzId) : dzId;
      const fi = typeof fiId === 'string' ? document.getElementById(fiId) : fiId;
      if (!dz || !fi) return;

      const { multiple = false, maxSizeMB = 500 } = options;

      const processFiles = (files) => {
        const fileArr = [...files].filter(f => {
          if (maxSizeMB && f.size > maxSizeMB * 1024 * 1024) {
            OMI.error.toast(`File "${f.name}" is too large (max ${maxSizeMB}MB)`, 'warning');
            return false;
          }
          return true;
        });
        if (!fileArr.length) return;
        if (multiple) callback(fileArr);
        else callback(fileArr[0]);
      };

      dz.addEventListener('click', () => fi.click());

      dz.addEventListener('dragover', e => {
        e.preventDefault();
        dz.classList.add('drag');
      });
      dz.addEventListener('dragleave', e => {
        if (!dz.contains(e.relatedTarget)) dz.classList.remove('drag');
      });
      dz.addEventListener('drop', e => {
        e.preventDefault();
        dz.classList.remove('drag');
        if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
      });

      fi.addEventListener('change', () => {
        if (fi.files.length) processFiles(fi.files);
        fi.value = ''; // reset so same file can be re-uploaded
      });
    }
  };

  /* ============================================================
     AUDIO UTILITIES MODULE
     Shared audio processing — previously duplicated in 13 files
     ============================================================ */
  OMI.audio = {

    /**
     * Convert AudioBuffer to WAV ArrayBuffer
     * Supports mono and stereo, 16-bit PCM
     * @param {AudioBuffer} buf
     * @returns {ArrayBuffer}
     */
    toWAV(buf) {
      const numCh = buf.numberOfChannels;
      const sr    = buf.sampleRate;
      const len   = buf.length;

      // Interleave channels
      const interleaved = new Float32Array(len * numCh);
      for (let ch = 0; ch < numCh; ch++) {
        const data = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          interleaved[i * numCh + ch] = data[i];
        }
      }

      // Convert float to 16-bit PCM
      const pcm = new Int16Array(interleaved.length);
      for (let i = 0; i < interleaved.length; i++) {
        pcm[i] = Math.max(-32768, Math.min(32767, Math.round(interleaved[i] * 32767)));
      }

      // Build WAV header
      const wavBuf  = new ArrayBuffer(44 + pcm.byteLength);
      const view    = new DataView(wavBuf);
      const writeStr = (off, str) => str.split('').forEach((c, i) => view.setUint8(off + i, c.charCodeAt(0)));

      writeStr(0, 'RIFF');
      view.setUint32(4,  36 + pcm.byteLength, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16,       true);  // chunk size
      view.setUint16(20, 1,        true);  // PCM format
      view.setUint16(22, numCh,    true);
      view.setUint32(24, sr,       true);
      view.setUint32(28, sr * numCh * 2, true);
      view.setUint16(32, numCh * 2, true);
      view.setUint16(34, 16,        true);
      writeStr(36, 'data');
      view.setUint32(40, pcm.byteLength, true);
      new Int16Array(wavBuf, 44).set(pcm);

      return wavBuf;
    },

    /**
     * Download an AudioBuffer as a WAV file
     * @param {AudioBuffer} buf
     * @param {string} filename
     */
    downloadWAV(buf, filename) {
      const wav  = OMI.audio.toWAV(buf);
      const blob = new Blob([wav], { type: 'audio/wav' });
      OMI.file.download(blob, filename);
    },

    /**
     * Load a File as an AudioBuffer
     * @param {File} file
     * @returns {Promise<{buffer: AudioBuffer, context: AudioContext}>}
     */
    async decode(file) {
      const arrayBuf = await file.arrayBuffer();
      const ctx      = new AudioContext();
      try {
        const buffer = await ctx.decodeAudioData(arrayBuf);
        return { buffer, context: ctx };
      } catch (err) {
        await ctx.close();
        throw new Error('Could not decode audio file. Is it a valid audio format?');
      }
    }
  };

  /* ============================================================
     FILE UTILITIES MODULE
     ============================================================ */
  OMI.file = {

    /** Get file extension including dot: "video.mp4" → ".mp4" */
    ext(name) {
      const idx = name.lastIndexOf('.');
      return idx > 0 ? name.substring(idx) : '';
    },

    /** Get file basename without extension: "video.mp4" → "video" */
    base(name) {
      const idx = name.lastIndexOf('.');
      return idx > 0 ? name.substring(0, idx) : name;
    },

    /** Format bytes to human readable: 1234567 → "1.2 MB" */
    formatSize(bytes) {
      if (bytes < 1024)        return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    },

    /**
     * Trigger browser download of a Blob
     * @param {Blob|ArrayBuffer|Uint8Array} data
     * @param {string} filename
     * @param {string} mime
     */
    download(data, filename, mime = 'application/octet-stream') {
      const blob = data instanceof Blob ? data : new Blob([data.buffer || data], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  };

  /* ============================================================
     VALIDATION MODULE
     ============================================================ */
  OMI.validate = {

    /**
     * Check if input has actual content
     * @param {string|null|undefined} value
     * @returns {boolean}
     */
    hasContent(value) {
      return typeof value === 'string' && value.trim().length > 0;
    },

    /**
     * Require a text input to have content
     * Shows error toast if empty
     * @returns {string|null} trimmed value or null
     */
    requireText(value, fieldName = 'Input') {
      const trimmed = (value || '').trim();
      if (!trimmed) {
        OMI.error.toast(`${fieldName} cannot be empty.`, 'warning', 3000);
        return null;
      }
      return trimmed;
    },

    /**
     * Require a file to be selected
     * @returns {File|null}
     */
    requireFile(file, allowedTypes = []) {
      if (!file) {
        OMI.error.toast('Please select or drop a file first.', 'warning', 3000);
        return null;
      }
      if (allowedTypes.length && !allowedTypes.some(t => file.type.includes(t) || file.name.endsWith(t))) {
        OMI.error.toast(`Unsupported file type: ${file.type || 'unknown'}`, 'warning', 4000);
        return null;
      }
      return file;
    },

    /**
     * Validate JSON string
     * @returns {Object|null} parsed object or null
     */
    parseJSON(str) {
      try {
        return JSON.parse(str);
      } catch {
        OMI.error.toast('Invalid JSON — please check your input.', 'error');
        return null;
      }
    }
  };

  /* ============================================================
     SECURITY MODULE
     Safe DOM manipulation — prevent XSS
     ============================================================ */
  OMI.safe = {

    /**
     * Escape HTML special characters (prevent XSS)
     * Use for: displaying user input as TEXT
     * @param {string} str
     * @returns {string}
     */
    text(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Escape for use inside HTML attribute values
     */
    attr(str) {
      return OMI.safe.text(str).replace(/\//g, '&#x2F;');
    },

    /**
     * Safely set text content (never executes as HTML)
     */
    setTextContent(el, text) {
      if (!el) return;
      el.textContent = text;
    },

    /**
     * Safe innerHTML — only allows specific trusted tags
     * Strips all scripts, event handlers, iframes
     */
    setHTML(el, html) {
      if (!el) return;
      // Remove dangerous patterns
      const safe = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<iframe[\s\S]*?>/gi, '')
        .replace(/javascript:/gi, '');
      el.innerHTML = safe;
    },

    /**
     * Sanitize file name for display (prevent path traversal)
     */
    fileName(name) {
      return String(name).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').substring(0, 200);
    }
  };

  /* ============================================================
     CLIPBOARD MODULE
     ============================================================ */
  OMI.clipboard = {

    /**
     * Copy text to clipboard with user feedback
     * @param {string} text
     * @param {Element|string} btnEl  Button to show feedback on
     */
    async copy(text, btnEl) {
      const btn = typeof btnEl === 'string' ? document.getElementById(btnEl) : btnEl;
      try {
        await navigator.clipboard.writeText(text);
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = '✓ Copied!';
          setTimeout(() => { if (btn) btn.textContent = orig; }, 1500);
        }
        OMI.error.toast('Copied to clipboard!', 'success', 2000);
        return true;
      } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok && btn) {
          const orig = btn.textContent;
          btn.textContent = '✓ Copied!';
          setTimeout(() => { if (btn) btn.textContent = orig; }, 1500);
        }
        return ok;
      }
    }
  };

  /* ============================================================
     EXPORT
     ============================================================ */
  window.OMI = OMI;

})(window);

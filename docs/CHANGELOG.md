
## [Batch 1] — Professional Tool Enhancement
### image-compressor
- Full rewrite: batch multi-file support
- JPEG + PNG + WebP output with auto-detect
- Before/after preview per image with savings bar
- Summary bar with total stats + Download All
- Per-card loading state, keyboard accessible
- White background for JPEG transparency handling
- OMI.safe.text/attr for XSS prevention
- OMI.error.toast for feedback

### pdf-merger
- Full rewrite: drag-and-drop file reordering
- Page count loaded async per file
- Move up/down buttons + drag handles
- Graceful handling of encrypted PDFs
- Progress bar per-file during merge
- Clear all button
- OMI.dz.init integration

### qr-code-generator
- Full rewrite: 6 content types (URL, Text, Email, Phone, WiFi, vCard)
- Real-time generation on every input change
- PNG + SVG download
- Custom foreground/background colors
- Size options (200px to 800px)
- vCard builder with name/phone/email/org/url
- WiFi QR with security type selection
- Character count info

### password-generator
- Full rewrite: 3 modes (Password, Passphrase, PIN)
- crypto.getRandomValues() — true cryptographic randomness
- Entropy calculator (bits display)
- Strength meter with 5 levels
- Bulk generation (5/10/20/50 passwords)
- Copy-all for bulk
- Ambiguous character exclusion option
- Passphrase with word separator + capitalize + number options

### word-counter
- Full rewrite: 8 real-time statistics
- Flesch Reading Ease score with description
- Top 10 keyword density table with visual bars
- Word limit / target with progress bar
- Toolbar: clear, copy, paste, UPPER, lower, Title Case
- Debounced input (80ms) for performance
- Stop words filtered from keyword analysis
- Syllable counting for readability

# OMIToolKit — Changelog

## [Sprint 1] — Foundation Architecture
### Added
- assets/js/omitoolkit-core.js — 8-module shared library
- assets/js/omitoolkit-ffmpeg.js — FFmpeg singleton loader
- Shared CSS components in style.css (.dz, .omi-prog-wrap, .omi-status, .omi-toast, etc.)

### Removed
- 13x duplicate audioBufferToWav() functions
- 15x duplicate getFFmpeg() functions  
- 42x duplicate .dz{} CSS blocks
- 34x duplicate .stat-chip CSS
- 20x duplicate progress bar CSS

### Security
- eval() replaced with restricted Function constructor
- crossorigin="anonymous" added to 18 CDN scripts
- marked.js pinned to v9.1.6
- 3 innerHTML XSS risks fixed → textContent

### Performance
- display=swap confirmed on all 133 Google Font loads
- lazy loading added to 8 image tools
- Service Worker registered on homepage

### Error Handling
- Global window.onerror + unhandledrejection on 74 tools
- Human-friendly error messages via OMI.error._friendly()
- Toast notification system

## [Batch Build] — 133 Tools
- 20 Video tools with FFmpeg.wasm
- 14 Audio tools with Web Audio API
- 16 Image tools
- 10 PDF tools with PDF-lib
- 31 Developer tools
- 15 Text tools
- 16 Calculator tools
- 11 Productivity tools

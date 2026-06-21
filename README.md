# OMIToolKit Website

Free, browser-based utility tools. Static site — no backend, no database, no login. Hosted free on GitHub Pages.

## Structure

```
/
├── index.html              ← Homepage (tool directory + search/filter)
├── assets/
│   ├── css/style.css       ← Shared theme (indigo/purple, Plus Jakarta Sans)
│   └── js/                 ← Shared scripts (reserved for future use)
├── tools/
│   ├── qr-code-generator/index.html
│   └── password-generator/index.html
├── robots.txt
└── sitemap.xml
```

## Adding a new tool

1. Create a new folder under `/tools/your-tool-name/`
2. Add an `index.html` inside it — copy an existing tool page as a starting template to keep the same header/footer/theme
3. Add a `<script type="application/ld+json">` SoftwareApplication schema block (see existing tools for the format)
4. Add the tool card to the grid in the homepage `index.html`
5. Add the new URL to `sitemap.xml`

## Hosting

This site is served by **GitHub Pages** directly from the `main` branch. Any push to `main` updates the live site automatically within 1–2 minutes. No build step, no server — pure static HTML/CSS/JS.

## Design system

- Font: Plus Jakarta Sans (Google Fonts)
- Primary color: `#4F46E5` (indigo) · Accent: `#8B5CF6` (purple)
- All shared styling lives in `/assets/css/style.css` — edit there to change the look site-wide

## Notes

- Heavy libraries (e.g. FFmpeg.wasm, pdf-lib) should be loaded from a CDN inside each tool's own page, not bundled into this repo, to keep repository size small.
- Every tool must work 100% client-side — no server calls, no user accounts.

# PDF Merge & Split

Combine PDFs into one, or pull out the pages you need: extract a page range, split every page, or split every N pages. Runs fully in your browser.

**Live:** https://tools.shaikhismail.com/pdf-merge-split/ · part of the [free tools](https://tools.shaikhismail.com/) by [Mohammed Ismail Shaikh](https://shaikhismail.com)

- 100% client-side: files and numbers never leave your browser
- Nothing is uploaded or saved; anything held while processing is temporary and deleted afterwards
- No analytics or ads; Cloudflare Turnstile keeps bots out
- No build step, works on phones, light and dark theme

## Run locally

Open `public/index.html` in a browser (the bot check is skipped when opened from disk), or serve the folder:

```
cd public
python -m http.server 8080
```

## Project layout

```
public/                 Everything that gets published to /pdf-merge-split/
├── index.html          The page
├── privacy.html        Privacy policy for this tool
└── assets/
    ├── fonts/          JetBrains Mono, self-hosted (OFL)
    ├── css/tool.css    Shared look (same tokens as shaikhismail.com)
    ├── js/common.js    Theme toggle, drop zone, download helpers, Turnstile gate
    ├── js/app.js       The tool's logic
    └── vendor/         Third-party libraries, saved locally (no CDN)
scripts/bump_version.py Release helper
.github/workflows/pages.yml  Publishes public/ to tools.shaikhismail.com/pdf-merge-split/
```

Third-party libraries: [pdf-lib](https://pdf-lib.js.org) 1.17.1 (MIT) for reading and writing PDFs, [fflate](https://github.com/101arrowz/fflate) 0.8.2 (MIT) for zip downloads

## How it is hosted

GitHub Pages, for free. Every push to `main` publishes `public/` (see `.github/workflows/pages.yml`).
Because the user site [mdism.github.io](https://github.com/mdism/mdism.github.io) has the custom domain tools.shaikhismail.com,
this repo appears at https://tools.shaikhismail.com/pdf-merge-split/ automatically.

One-time, in this repo on GitHub:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **About (gear icon on the repo page) → Topics:** add `shaikhismail-tool`. That is what puts the tool on the landing page.

The repo name is the URL path, so keep it as `pdf-merge-split`.

## Privacy and security

Nothing is uploaded, saved or tracked: see [PRIVACY.md](PRIVACY.md) (also published as `privacy.html`) and [SECURITY.md](SECURITY.md).

## Releasing

The version shows in the footer and links to CHANGELOG.md. Before each release:

```
python scripts/bump_version.py 1.4.0 "What changed"
```

## License

MIT, see [LICENSE](LICENSE).

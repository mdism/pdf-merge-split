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
.cpanel.yml             Copies public/ to tools.shaikhismail.com/pdf-merge-split/
```

Third-party libraries: [pdf-lib](https://pdf-lib.js.org) 1.17.1 (MIT) for reading and writing PDFs, [fflate](https://github.com/101arrowz/fflate) 0.8.2 (MIT) for zip downloads

## How it is hosted

All the free tools share one subdomain, **tools.shaikhismail.com**. Each tool is its own repo and deploys into its own folder:

| Repo | Address |
|---|---|
| [tools-hub](https://github.com/mdism/tools-hub) | https://tools.shaikhismail.com/ (landing page, security rules, bot check) |
| this repo | https://tools.shaikhismail.com/pdf-merge-split/ |

Set up the subdomain and the tools-hub repo first (see its README). Then, once for this repo:

cPanel → **Git Version Control** → Create → Clone a Repository:
- Clone URL: `https://github.com/mdism/tool-pdf-merge-split.git`
- Repository path: `repositories/tool-pdf-merge-split`

Each update: push to GitHub, then cPanel → Git Version Control → Manage → **Pull or Deploy** → *Update from Remote*, then *Deploy HEAD Commit*.

## Privacy and security

Nothing is uploaded, saved or tracked: see [PRIVACY.md](PRIVACY.md) (also published as `privacy.html`) and [SECURITY.md](SECURITY.md).

## Releasing

The version shows in the footer and links to CHANGELOG.md. Before each release:

```
python scripts/bump_version.py 1.4.0 "What changed"
```

## License

MIT, see [LICENSE](LICENSE).

# Interview Prep Study Hub — Site

A self-contained, single-file study tool for browsing and reviewing the
question bank produced by the hub's content pipeline. No frameworks, no
build tools, no external requests — just HTML/CSS/JS.

## Files

- `template.html` — the actual site (markup, CSS, JS). Contains a
  placeholder marker (`/*__SITE_DATA__*/`) inside a
  `<script id="site-data" type="application/json">` tag where real track
  data gets injected at build time. **Not directly usable on its own** —
  the placeholder isn't valid JSON until the build script fills it in.
- `sample-data.json` — a hand-written fixture (5–10 items covering every
  `type` and `level` from `data/schema.md`) for the `react-native` track.
  Used to sanity-check the UI independent of real content. Never delete
  this file.
- `build.js` — dependency-free Node build script.
- `serve.js` — dependency-free Node static file server, used by `npm start`
  to preview the build output locally.
- `env.js` — dependency-free `.env` file loader, required by `serve.js` so
  the dev server port is configurable without a `dotenv` package.
- `dist.html` — **the build output**. This is the file that actually gets
  opened in a browser or published as a Claude Artifact. Generated, not
  hand-edited — every rebuild overwrites it.
- `study-guides/` — **generated build output**, one `<track-id>.md` per
  track that has at least one approved item (via
  `scripts/generate-study-guide.js`). Served alongside the site — locally
  by `serve.js` (it serves any file under `site/`, not just `dist.html`)
  and on GitHub Pages by the deploy workflow, which copies this folder
  into the published output. Each track card on the landing screen links
  to its guide when one exists. Regenerated (fully, stale entries removed)
  on every build — never hand-edited.

## Preview it: `npm start`

From the project root:

```bash
npm start
```

This is the one command to build and preview the site. It runs
`node site/build.js` (regenerating `site/dist.html` from the current
`tracks/tracks-manifest.json` + each track's data) and then
`node site/serve.js`, a minimal static file server (Node's built-in `http`
module only — no dependencies, nothing installed). It prints the URL to
open, e.g.:

```
Study site: http://localhost:4173/  (serves site/dist.html)
```

Visiting `http://localhost:4173/` serves `site/dist.html`. Stop the server
with Ctrl+C.

**To change the port**, copy `.env.example` to `.env` at the project root
and edit `PORT`:

```bash
cp .env.example .env
# edit .env, e.g. PORT=5000
npm start
```

`.env` is gitignored (local config, not source). Alternatively, skip `.env`
entirely and pass the port inline: `PORT=5000 npm start` — a real shell env
var always wins over `.env`, and `.env` wins over the hardcoded default
(4173). This is handled by the small loader in `site/env.js` (no `dotenv`
package).

No devDependencies were added — Node's built-in `http` module is enough for
serving static local files, so `package.json` has no `dependencies` or
`devDependencies` at all.

## Build only (no server)

```bash
node site/build.js
```

(equivalently: `npm run build`)

This reads `tracks/tracks-manifest.json`, loads each track's `dataFile`
(falling back to an empty array if that file is missing, unreadable, or not
valid JSON — the build never breaks mid-pipeline because a track isn't
finished yet), injects the manifest + all track data into
`site/template.html` at the `/*__SITE_DATA__*/` marker, and writes the
result to `site/dist.html`. It also regenerates every track's
`study-guide.md` (skipping tracks with zero approved items) and copies each
one into `site/study-guides/<track-id>.md`.

Re-run the build (or just use `npm start`, which always rebuilds first) any
time track content changes (new items approved, a new track added to the
manifest, etc.) — the site itself never needs to be edited for content
updates, only for actual UI changes.

## Output

`site/dist.html` — open it directly in a browser, or publish it via the
Artifact tool. It is fully self-contained: all CSS/JS inline, no external
requests, works offline.

`site/dist.html` is generated and gitignored (see root `.gitignore`) —
run `npm start` or `npm run build` to (re)produce it locally.

## Deploying to GitHub Pages

`.github/workflows/deploy-pages.yml` builds and publishes the site
automatically on every push to `main` (and on-demand via the workflow's
"Run workflow" button). It runs `node site/build.js` against whatever is
currently in `tracks/*/data/questions.json` (so Pages always reflects the
latest approved content), copies the output to `index.html` (the entry
point GitHub Pages expects) plus `site/study-guides/` to a `study-guides/`
folder alongside it, and publishes it with the official
`actions/upload-pages-artifact` + `actions/deploy-pages` actions. Pages
serves the files directly — no server process, so the `.env`/`PORT` setup
above doesn't apply there. Each track's guide ends up at
`https://<user>.github.io/<repo>/study-guides/<track-id>.md`, and is linked
from that track's card on the landing screen.

**One manual step the user still has to do** (can't be automated — it's a
one-time click in the GitHub UI): after pushing this repo to GitHub, go to
**Settings → Pages → Build and deployment → Source**, and set it to
**"GitHub Actions"**. After the next push to `main`, the site is live at:

```
https://<user>.github.io/<repo>/
```

## Trying it against the sample fixture

`build.js` always reads real track data from the manifest. To preview the
UI against `sample-data.json` instead (e.g. before any track has real
content), temporarily point the `react-native` entry's `dataFile` in
`tracks/tracks-manifest.json` at `site/sample-data.json`, run the build,
then revert the manifest change. Do **not** commit that temporary manifest
edit.

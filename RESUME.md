# Resume — paused state

Paused on 2026-08-04 at the user's request. Two in-flight background agents
were stopped cleanly (verified: neither had written any partial/inconsistent
state — see below). Nothing here is broken; this file exists so picking
the work back up doesn't require re-deriving where things stood.

## What's fully done

- **Hub structure**: `PROJECT.md`, `WORKFLOW.md`, `README.md`,
  `CONTRIBUTING.md`, `data/schema.md` (incl. the Translations section),
  `tracks/tracks-manifest.json`, `tracks/_template/`,
  `tracks/react-native/track.md`
- **Agents**: `.claude/agents/content-researcher.md`,
  `content-answerer.md`, `content-reviewer.md`, `site-developer.md`,
  `content-translator.md` (defined, never executed — no translations exist yet)
- **Site (base functionality)**: `site/template.html`, `build.js`,
  `serve.js`, `env.js`, `sample-data.json`, `site/README.md`,
  root `package.json`, `.gitignore`, `.env.example`,
  `.github/workflows/deploy-pages.yml`, `.github/PULL_REQUEST_TEMPLATE.md`.
  `npm start` works, `.env`-based port config verified, GitHub Pages
  workflow in place (needs the one manual "Source: GitHub Actions" click
  once this is pushed to a real GitHub repo — see `site/README.md`).
- Project is **not yet a git repo** — nothing has been committed anywhere.

## Content pipeline — react-native track

`tracks/react-native/data/questions-queue.json`: **105 items total**,
`tracks/react-native/data/questions.json`: **51 approved**. Both files
valid JSON, confirmed consistent as of the pause.

| Area | State |
|---|---|
| JS/TS Fundamentals | ✅ done — 9/9 approved |
| Components & Hooks | ✅ done — 9/9 approved |
| Styling & Layout | ✅ done — 9/9 approved |
| Navigation | ⏳ 8/9 approved, 1 (`navigation-09`) fixed and sitting at `pending-review`, not yet re-reviewed |
| State Management | ⏳ 7/9 approved, 2 (`state-management-03`, `state-management-06`) fixed and sitting at `pending-review`, not yet re-reviewed |
| Performance | ✅ done — 9/9 approved |
| Native Modules & New Architecture | ⏳ 8/8 answered, sitting at `pending-review` — **review never ran** (killed on launch, zero partial writes, confirmed clean) |
| Networking & Persistence | ⏳ 9/9 answered, sitting at `pending-review` — **review never ran** (same as above) |
| Testing | ⏳ 9/9 answered, sitting at `pending-review` — **review never ran** (same as above) |
| Build, Deploy & CI/CD | ⬜ not started — 8 `pending-answer` |
| Animations | ⬜ not started — 9 `pending-answer` |
| Debugging, Security & Best Practices | ⬜ not started — 8 `pending-answer` |

### Exact next steps

1. **Run `content-reviewer`** scoped to: Native Modules & New Architecture,
   Networking & Persistence, Testing — **plus** these 3 carry-over items
   regardless of area (already fixed, just need (re-)review):
   `navigation-09`, `state-management-03`, `state-management-06`.
   Nothing needs to be redone here — this batch's answers already exist and
   are untouched; the previous review attempt was killed before writing
   anything (verified: approved count is still exactly 51).
2. **Run `content-answerer`** scoped to: Build, Deploy & CI/CD; Animations;
   Debugging, Security & Best Practices (25 `pending-answer` items) — fold
   in any `needs-revision` items step 1 produces, same pattern as prior batches.
3. **Run `content-reviewer`** on that batch.
4. Once the queue has no `pending-answer`/`pending-review` left (or only
   genuinely-stuck items flagged for a human), generate
   `tracks/react-native/study-guide.md` (not created yet).

This was being run as **4 sequential batches** (grouped by area, not
parallel, to avoid concurrent writes to the shared queue file) — see
`WORKFLOW.md`. Batches 1–2 are fully closed; batch 3 is answered but
unreviewed; batch 4 hasn't started.

## Multi-language site support — schema done, site implementation NOT started

The data contract, docs, and the (unexecuted) `content-translator` agent
are fully written — see `data/schema.md`'s Translations section,
`WORKFLOW.md`, `CONTRIBUTING.md` section E. **No translated content exists
yet** (no `questions.<lang>.json` file anywhere).

The site-side implementation (glob-based language discovery in
`site/build.js`, plus the global language selector / fallback badge /
per-item language toggle in `site/template.html`) was requested from the
site-developer agent but **that agent was stopped before making any
changes** — `site/build.js` and `site/template.html` are byte-identical to
before the request. This still needs to be (re)dispatched to a
`site-developer` agent when resuming; the full spec was sent as a detailed
prompt (track/lang resolution logic, selector UX, fallback behavior,
verification steps) — reconstruct it from `data/schema.md`'s Translations
section plus `WORKFLOW.md`/`CONTRIBUTING.md` section E, which fully capture
the intended behavior even without the original prompt text.

## To resume

Pick up at "Exact next steps" above for content, and separately dispatch
the multi-language site work described above — they're independent of each
other and can happen in either order or in parallel.

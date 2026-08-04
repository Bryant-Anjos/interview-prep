# Contributing

This is a personal study project, but it's structured so anyone (including
future-you) can extend it predictably. This guide covers **every type of
thing you might want to add**, how to do it, how to validate it before
opening a PR, and the PR itself.

Skip to the section that matches what you want to do:

- [A. Add or fix questions in an existing track](#a-add-or-fix-questions-in-an-existing-track)
- [B. Add a brand-new track](#b-add-a-brand-new-track)
- [C. Improve the site](#c-improve-the-site)
- [D. Improve an agent definition / the workflow itself](#d-improve-an-agent-definition--the-workflow-itself)
- [E. Add a translation / new language](#e-add-a-translation--new-language)
- [Opening a PR](#opening-a-pr) (shared by all of the above)

---

## A. Add or fix questions in an existing track

Where things live: `tracks/<track-id>/data/questions-queue.json` (working
file, any status) and `tracks/<track-id>/data/questions.json` (final,
`approved`-only bank the site reads). Full field-by-field contract:
[`data/schema.md`](data/schema.md).

**Two ways to do this:**

1. **Run the agent pipeline** (preferred for anything non-trivial — it's
   what keeps quality consistent). See [`WORKFLOW.md`](WORKFLOW.md) for the
   full state machine. In short:
   - New questions → have the **content-researcher** agent add them to
     `questions-queue.json` with `status: "pending-answer"` (question only,
     no answer).
   - Answering the queue → the **content-answerer** agent researches and
     fills in `answer` / `explanation` / `code` / `references`, sets
     `status: "pending-review"`.
   - Correctness gate → the **content-reviewer** agent verifies each item
     and either promotes it into `questions.json` (`status: "approved"`) or
     bounces it back with a note (`status: "needs-revision"`).
   - Each agent's full instructions live in `.claude/agents/*.md` — they're
     written to be read and followed literally by an AI coding assistant,
     but a human can follow the same steps by hand too.

2. **Edit by hand** (fine for a small fix — a typo, a broken link, a
   sharper explanation): edit the item directly in `questions.json` (if
   already approved) or `questions-queue.json` (if still mid-pipeline).
   Follow the schema exactly — every field, type, and enum value is
   documented in [`data/schema.md`](data/schema.md). Re-run the validation
   checklist at the bottom of that file before committing.

**Before opening a PR for content changes:**

- [ ] File is still valid JSON — quick check: `python3 -m json.tool tracks/<track-id>/data/questions.json > /dev/null` (or the queue file)
- [ ] Every `id` is unique within the file
- [ ] `track` / `area` / `level` / `type` match the enums in `data/schema.md` / that track's `track.md` exactly (case-sensitive)
- [ ] Every reference URL is real and actually supports the claim it's attached to (open it — don't assume)
- [ ] `multiple-choice` items have exactly 4 `options` and `answer` matches one verbatim
- [ ] If you edited an `approved` item, it's still accurate after your edit (re-read it as if you were the reviewer)
- [ ] `node site/build.js` still runs cleanly (confirms the site can consume the updated data)

## B. Add a brand-new track

This is the main payoff of the tracks structure — a new interview subject
reuses everything (agents, schema, site) with zero code changes.

1. Copy the template: `cp -r tracks/_template tracks/<new-track-id>` (use a
   short kebab-case id, e.g. `springboot`, `system-design`)
2. Fill in `tracks/<new-track-id>/track.md` completely — areas, levels,
   target volume, trusted reference domains, and any subject-specific notes
   (legacy-vs-current APIs, contested terminology, etc.). See
   `tracks/react-native/track.md` for a filled-in example. Don't skip the
   trusted-domains list — that's what keeps the answerer/reviewer agents
   citing real, relevant sources instead of guessing.
3. Register it in [`tracks/tracks-manifest.json`](tracks/tracks-manifest.json):
   add `{ "id": "...", "name": "...", "description": "...", "trackFile": "tracks/<new-track-id>/track.md", "dataFile": "tracks/<new-track-id>/data/questions.json", "status": "in-progress" }`
4. Create empty data files: `tracks/<new-track-id>/data/questions-queue.json`
   and `tracks/<new-track-id>/data/questions.json`, both containing `[]`
5. Run the same pipeline described in section A, pointed at your new track
   id, until the queue is empty
6. `node site/build.js` — the site picks up the new track automatically from
   the manifest, no template/build changes needed

## C. Improve the site

Everything lives in `site/` — see [`site/README.md`](site/README.md) for
what each file does and how to build/preview. Ground rules (also spelled
out in `.claude/agents/site-developer.md`):

- **No frameworks, no build tools, no dependencies.** Plain HTML/CSS/JS and
  Node's built-ins only. The published output has to be one self-contained
  file (Claude Artifacts and GitHub Pages both need this — no outbound
  requests, everything inlined).
- The site must **never need to know what's inside a track's data** ahead of
  time — a track with 0 items, 5 items, or 500 items should all render
  correctly. If you add a UI feature, test it against `site/sample-data.json`
  (the fixture) as well as a real track.
- Edit `site/template.html` (+ `site/build.js` / `site/serve.js` / `site/env.js`
  as needed) — never hand-edit `site/dist.html`, it's generated and
  gitignored, every build overwrites it.

**Before opening a PR for site changes:**

- [ ] `node site/build.js` runs cleanly against the real track data
- [ ] `npm start` serves the result correctly (open it, click around)
- [ ] Still works with a track that has zero approved items (empty state)
- [ ] Still self-contained — no new external script/font/image/API references
- [ ] Light and dark viewing both look reasonable (`prefers-color-scheme`)

## D. Improve an agent definition / the workflow itself

`.claude/agents/*.md` and `WORKFLOW.md` define the pipeline. If you find an
agent producing weak questions, missing obvious fact-checks, or approving
things it shouldn't:

- Tighten the specific instruction in that agent's `.md` file rather than
  special-casing it in a one-off prompt — the fix should apply to every
  future run, and to every track, not just the one that surfaced the issue.
- Keep every agent **track-agnostic**: no subject-specific content belongs
  in `.claude/agents/*.md` — that always belongs in a track's `track.md`.
- If you change the schema in `data/schema.md`, update every agent
  definition that reads/writes it in the same PR — a schema change is a
  breaking change for the whole pipeline, across every track.

## E. Add a translation / new language

Translations are a separate, optional overlay — you never edit a track's
base `questions.json` to add one. Full contract:
[Translations in `data/schema.md`](data/schema.md#translations-multi-language-support).

1. Pick a track and a language code (lowercase, e.g. `pt-br`, `es`, `fr`)
2. Create `tracks/<track-id>/data/questions.<lang>.json` — a JSON array of
   translated items, one per base item's `id`. You don't have to translate
   the whole track at once; a partial file is fine and the site just shows
   the base language for anything not yet translated.
3. Only translate items that are `status: "approved"` in the base file —
   anything still mid-pipeline can still change.
4. Only include the language-dependent fields (`question`, `answer`,
   `explanation`, `options` for multiple-choice, `code` if you're
   translating comments, `references[].label`). Never include a `url`,
   or `area`/`level`/`type`/`track`/`status` — those always come from the
   base item with the matching `id`.
5. Either write translations by hand, or have the **content-translator**
   agent do it (`.claude/agents/content-translator.md`) — give it the track
   and target language explicitly; it only runs when asked, never on its
   own.
6. `tracks/tracks-manifest.json`, the site, and the build script need **no
   changes** — languages are picked up automatically from which
   `questions.<lang>.json` files exist. If this is the *first* translation
   added to a track, double-check that track's manifest entry has a
   `defaultLang` set (should already be there, but confirm) so the site
   knows what the un-suffixed `questions.json` actually is.

**Before opening a PR for a translation:**

- [ ] Valid JSON array, no duplicate `id`s
- [ ] Every `id` exists in the base `questions.json` and is `status: "approved"` there
- [ ] No `url`, `area`, `level`, `type`, `track`, `status`, or `reviewer_notes` fields present
- [ ] `references`, if included, is the same length and order as the base item's
- [ ] `options`, if included, has exactly 4 entries and only appears on `multiple-choice` items
- [ ] Code identifiers/syntax untouched — only comments (if anything) were translated
- [ ] `node site/build.js` still runs cleanly

---

## Opening a PR

1. Branch off `main` with a descriptive name (e.g. `content/rn-testing-area`, `track/springboot`, `site/dark-mode-fix`)
2. Make your change following the relevant section above, and run that
   section's validation checklist
3. Commit using `<type>: <description>` — `feat`, `fix`, `docs`, `test`,
   `chore`, `perf`, or `ci` (e.g. `feat: add springboot track scaffold`,
   `fix: correct flexbox default in styling-layout-01`, `docs: add contributing guide`)
4. Push and open the PR. In the description, say **what type of contribution
   it is** (matches section A/B/C/D above) and confirm you ran that
   section's checklist — the [PR template](.github/PULL_REQUEST_TEMPLATE.md)
   walks through this
5. `.github/workflows/deploy-pages.yml` doesn't gate PRs (it only deploys on
   push to `main`) — there's no CI check to wait on, but do run the relevant
   validation commands yourself before requesting review, since nothing
   automated is checking them for you yet

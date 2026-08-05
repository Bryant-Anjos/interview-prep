# Interview Prep Study Hub

A personal, tech-agnostic interview prep tool: a multi-track question bank
(correct answers, explanations, code examples, real references) produced by
a small agent pipeline, studied through a self-contained local site.

Today's track is **React Native**. The whole structure is designed so a new
subject (Spring Boot, System Design, whatever's next) reuses the exact same
pipeline and site with zero code changes — see [`PROJECT.md`](PROJECT.md).

## Quick start

```bash
npm start
```

Builds the site from the current content and serves it locally (default
`http://localhost:4173/`, configurable — see [`site/README.md`](site/README.md#preview-it-npm-start)).
Open that URL in a browser: pick a track, then filter/search/flashcard your
way through it. The normal "known" / "needs review" progress and the
optional confidence-based spaced-repetition schedule are saved locally in
your browser; export a JSON backup to move or safeguard that progress.

No install step, no dependencies — it's plain Node/HTML/CSS/JS.

## What's here

```
interview-prep/
├── PROJECT.md              # what this is, the "track" concept, deliverables
├── WORKFLOW.md             # the 4-agent content pipeline, in detail
├── CONTRIBUTING.md         # how to add content, a new track, or site changes — and open a PR
├── data/schema.md          # the JSON contract every track's question bank follows
├── tracks/
│   ├── tracks-manifest.json
│   ├── react-native/       # first track — track.md (scope) + data/ (question bank)
│   └── _template/          # copy this to start a new track
├── site/                   # the self-contained study site (see site/README.md)
└── .claude/agents/         # the 4 agents: researcher, answerer, reviewer, site-developer
```

## Status

The React Native track's content pipeline is in progress — questions get
researched, answered, and reviewed in batches. The live, approved bank for
any track is always `tracks/<track-id>/data/questions.json`; the site only
ever shows `approved` items, so it's safe to study from at any point even
mid-pipeline.

## Learn more

- [`PROJECT.md`](PROJECT.md) — full scope, the track concept, deliverables, definition of done
- [`WORKFLOW.md`](WORKFLOW.md) — how the 4 agents (researcher → answerer → reviewer, plus an independent site developer) work together
- [`tracks/react-native/track.md`](tracks/react-native/track.md) — this track's specific areas, levels, and trusted reference sources
- [`data/schema.md`](data/schema.md) — the exact data shape every track's questions follow
- [`site/README.md`](site/README.md) — running, building, and deploying the site (incl. GitHub Pages)
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — want to add questions, a new track, or improve the site? Start here.

# Interview Prep — Study Hub

## Objective

A personal, tech-agnostic question bank and study site for interview
preparation. The structure, workflow, agents and site are all generic — the
actual subject matter (React Native, Spring Boot, whatever's next) lives in
independent **tracks**.

This is a **personal-use project**. No production concerns, no public
audience, no design polish beyond "clear and easy to use."

## The "track" concept

A **track** is one interview subject (e.g. `react-native`, `springboot`,
`system-design`). Every track is a self-contained folder under `tracks/`
with the same internal shape:

```
tracks/<track-id>/
├── track.md              # scope: areas, levels, item types, volume target — the track's own PROJECT.md
├── data/
│   ├── questions-queue.json   # working queue (all statuses)
│   └── questions.json         # final approved bank (source of truth for the site)
└── study-guide.md             # Markdown export, generated once the bank is complete
```

All tracks share:
- **One item schema** — `data/schema.md` (hub-level, not per-track)
- **One workflow** — `WORKFLOW.md` (hub-level) — the same 4-agent
  research → answer → review → (independent) site pipeline, just pointed at
  a different track directory each time
- **One site** — `site/` — a track selector on the landing screen, then the
  familiar filter/search/flashcard study view scoped to the chosen track

## Adding a new track

1. Copy `tracks/_template/` to `tracks/<new-track-id>/`
2. Fill in `track.md` for the new subject (areas, levels, target volume —
   see `tracks/react-native/track.md` for a filled-in example)
3. Add an entry for it in `tracks/tracks-manifest.json`
4. Run the same 4-agent pipeline described in `WORKFLOW.md`, telling each
   agent which track directory to work in
5. Re-run the site build — no site code changes needed, it reads the manifest

That's the whole mechanism for "study for a Spring Boot interview using the
exact same setup" — new track folder, same agents, same site.

## Deliverables (per track, and for the hub overall)

1. `tracks/<track-id>/data/questions.json` — final approved question bank for that track
2. `tracks/<track-id>/study-guide.md` — readable Markdown export
3. `site/` — one self-contained HTML study site covering every track in the
   manifest (track picker + filter + search + flashcard mode + localStorage
   progress), published as a Claude Artifact

## Definition of Done — per item

- [ ] Realistic, clearly-worded interview question
- [ ] Correct, concise "what I'd say in the interview" answer
- [ ] Technical explanation of *why*
- [ ] Code example when it adds value
- [ ] At least one real, verifiable reference (official docs / reputable source)
- [ ] Approved by the reviewer agent

## Definition of Done — per track

- [ ] Every item in that track's queue has reached status `approved`
- [ ] `study-guide.md` generated from the track's final bank
- [ ] Track registered in `tracks/tracks-manifest.json`
- [ ] Site rebuilt to include the track and it's selectable/studyable end to end

See `WORKFLOW.md` for the production process and agent responsibilities,
`data/schema.md` for the data contract every agent must follow, and
`tracks/react-native/track.md` for the first track's concrete scope.

# Production Workflow — Agents

This hub is split across independent agents so that researching questions,
answering them, verifying correctness, and building the site never bottleneck
on each other — and so the same setup works for *any* track (React Native
today, Spring Boot or anything else tomorrow) without changing the agents
themselves. Each agent has a narrow job, operates on **one track at a time**
(named in its task prompt when it's invoked), and owns a specific file or
set of files within that track.

## Roles

| Agent | Definition file | Responsible for | Does NOT do |
|---|---|---|---|
| Content researcher | `.claude/agents/content-researcher.md` | Catalog interview questions for the given track into `tracks/<track>/data/questions-queue.json`, status `pending-answer` | Never writes answers |
| Content answerer | `.claude/agents/content-answerer.md` | Pick up `pending-answer` items in the given track, research and write answer + explanation + code + references, set status `pending-review` | Never approves its own work |
| Content reviewer | `.claude/agents/content-reviewer.md` | Audit `pending-review` items in the given track for technical correctness, valid references, working code. Approve (`approved`, move to `questions.json`) or reject (`needs-revision` + notes) | Never writes answers from scratch, only validates/requests fixes |
| Site developer | `.claude/agents/site-developer.md` | Build `site/` per `data/schema.md` and `tracks/tracks-manifest.json`, using sample/placeholder data, plus a build step that merges every track's `questions.json` when ready | Never waits on final content; never decides question content; never picks a track's subject matter |

Every agent is **track-agnostic by design** — its `.md` definition contains
no subject-specific content. The track (`tracks/<track-id>/`) is always
supplied in the prompt that invokes it, and the agent reads that track's
`track.md` for scope, areas, and trusted reference domains before doing
anything.

## Item state machine (per item, within a track's queue)

```
pending-answer  --(answerer)-->            pending-review
pending-review  --(reviewer, OK)-->         approved
pending-review  --(reviewer, problem)-->    needs-revision
needs-revision  --(answerer, fixes it)-->   pending-review
```

`pending-review ⇄ needs-revision` loops until the reviewer marks `approved`.
Every `needs-revision` cycle must leave a note in the item's `reviewer_notes`
array explaining exactly what was wrong (wrong fact, broken/misleading code,
dead or irrelevant reference link, unclear explanation, etc.) so the answerer
doesn't have to guess.

## Independence between agents

- **Researcher** can run first (or anytime) for a given track — it only
  writes questions, no dependency on anyone else's output.
- **Site developer** runs in parallel with / independent of the content
  pipeline, for the hub as a whole — its only dependency is `data/schema.md`
  and `tracks/tracks-manifest.json`, both fixed up front. It never needs a
  track's content to be finished to build/improve the site.
- **Answerer** and **Reviewer** work in a loop, item by item or in batches
  per area, until a track's queue is empty (`pending-answer` and
  `pending-review` both reach zero for that track).
- Tracks themselves are independent of each other — finishing React Native
  doesn't block starting Spring Boot, and the site build step just merges
  whatever tracks currently have a `questions.json`.

## Suggested execution order (per track)

1. **Researcher** (told which track) → populates `tracks/<track>/data/questions-queue.json` with all questions (no answers yet)
2. In parallel, hub-wide: **Site developer** → builds/maintains `site/` with placeholder data conforming to the schema + manifest
3. **Answerer** (told which track) → processes that track's queue, batch by batch (suggest: one area at a time)
4. **Reviewer** (told which track) → audits each answered batch, bounces anything incorrect back
5. Repeat 3–4 until that track's queue is empty
6. Regenerate that track's `study-guide.md`
7. Site build step merges the track's `questions.json` into the site
8. To add another track: copy `tracks/_template/`, fill in `track.md`, add it to `tracks-manifest.json`, repeat steps 1–7 for it — no agent or site code changes needed

## Optional extension: translations

A fifth role, **content translator** (`.claude/agents/content-translator.md`),
sits outside the core loop above — it's invoked explicitly, per track and
per language, only when someone actually wants to add a language, never as
part of the default pipeline. It reads a track's `approved` items and
writes a partial `questions.<lang>.json` overlay; it never touches the base
`questions.json` or the `pending-*`/`needs-revision` states above. See the
**Translations** section of `data/schema.md` for the file format and
`CONTRIBUTING.md` for the how-to. Because it only ever reads `approved`
content and writes a separate file, it can run at any time without
coordinating with an in-flight research → answer → review cycle on that
same track.

## Why this split

Mixing "figure out what to ask," "figure out the right answer," and "make it
look nice in a browser" in one pass is exactly how technical inaccuracies
sneak in — the same agent that wrote an answer is bad at spotting its own
mistake, and content work getting blocked on UI work (or vice versa) wastes
time. Separating research → answer → review → (independent) site keeps each
step checkable on its own, lets the reviewer act as a real gate instead of a
rubber stamp, and — because no agent hardcodes a subject — the whole pipeline
is reusable for the next track with zero code changes.

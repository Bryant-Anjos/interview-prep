# Data Contract — `questions-queue.json` / `questions.json`

This schema is shared by **every track** in `tracks/`. Both files (per
track) hold a JSON array of item objects using the same shape. The queue
file additionally carries workflow state (`status`, `reviewer_notes`); the
final `questions.json` only ever contains items with `status: "approved"`.

Translations into other languages are a separate, optional overlay on top
of this — see [Translations](#translations-multi-language-support) below.
They don't change anything about the shape described in this section.

This file is the contract between all four agents, across every track.
**Do not change field names or types without updating every agent
definition that reads/writes this schema — a change here affects every
track, not just one.**

## Item shape

```json
{
  "id": "performance-01",
  "track": "react-native",
  "area": "Performance",
  "level": "Mid",
  "type": "conceptual",
  "question": "Why does re-rendering a large FlatList cause jank, and how do you fix it?",
  "options": null,
  "status": "approved",
  "answer": "Concise, interview-ready answer (2-5 sentences).",
  "explanation": "Deeper technical explanation of *why* the answer is correct — the kind of detail that shows understanding, not memorization.",
  "code": "// optional runnable snippet, or null",
  "references": [
    { "label": "React Native docs — Optimizing FlatList Configuration", "url": "https://reactnative.dev/docs/optimizing-flatlist-configuration" }
  ],
  "reviewer_notes": []
}
```

## Field reference

| Field | Type | Notes |
|---|---|---|
| `id` | string | kebab-case, prefixed by area slug + 2-digit number, e.g. `navigation-03`. Must be unique **within its track** (cross-track collisions are fine, the site keys on `track` + `id` together). |
| `track` | string | Must match an `id` in `tracks/tracks-manifest.json` exactly, e.g. `"react-native"`. |
| `area` | string | One of the areas listed in that track's `track.md`. Exact string match — no synonyms. |
| `level` | string | One of `"Junior"`, `"Mid"`, `"Senior"` — same three values for every track, so the site's level filter works identically everywhere. |
| `type` | string | One of `"conceptual"`, `"code-challenge"`, `"multiple-choice"`, `"open-question"`. |
| `question` | string | The question exactly as it would be asked. |
| `options` | array of strings, or `null` | Required (4 options) for `multiple-choice`. `null` for every other type. |
| `status` | string | One of `"pending-answer"`, `"pending-review"`, `"needs-revision"`, `"approved"`. |
| `answer` | string, or `null` until answered | For `multiple-choice`, state the correct option verbatim plus a one-line reason. |
| `explanation` | string, or `null` until answered | Required before `pending-review`. |
| `code` | string, or `null` | Only when it adds real value (code-challenge items almost always need it). |
| `references` | array of `{label, url}` | At least one entry required before `pending-review`. URLs must be real and resolvable — prefer the official docs listed in that track's `track.md` over generic blog posts. |
| `reviewer_notes` | array of strings | Reviewer appends one entry per rejection cycle, e.g. `"2024-...: code example doesn't compile — missing useCallback import"`. Never deleted, only appended to (keeps a revision history). |

## Translations (multi-language support)

Every track's `questions.json` is that track's **base/default language file** —
its shape never changes for this feature, and none of the existing content
needs migration. A language is added by dropping in an additional file
alongside it; nothing is registered by hand.

### File naming

```
tracks/<track-id>/data/questions.json            # base/default language (unchanged, always present)
tracks/<track-id>/data/questions.<lang>.json      # translation layer (optional, one per added language)
```

`<lang>` is a short, lowercase language code — `en`, `pt-br`, `es`, `fr`,
`de`, etc. (loosely BCP-47, lowercased, region joined with a hyphen). The
base file's own language is declared once, per track, as `defaultLang` in
`tracks/tracks-manifest.json` (defaults to `"en"` if that key is absent).

Language files are discovered by **filename convention** — glob
`tracks/<track-id>/data/questions*.json` — not by registering a list
anywhere. Adding a language is just: create the file, populate it, done.

### Translation item shape

A translation file is a JSON array of **partial** items — it only needs to
contain the ids that have actually been translated so far, in any order:

```json
[
  {
    "id": "performance-01",
    "question": "Pergunta traduzida...",
    "answer": "Resposta traduzida...",
    "explanation": "Explicação traduzida...",
    "options": null,
    "code": null,
    "references": [
      { "label": "Referência traduzida (label apenas — a URL vem do item base)" }
    ]
  }
]
```

| Field | Rule |
|---|---|
| `id` | **Must** already exist as an `approved` item in that track's base `questions.json`. Only translate finished, approved content — never a `pending-*`/`needs-revision` item, since its content can still change. |
| `question`, `answer`, `explanation` | Translated text. |
| `options` | Only present (and only meaningful) when the base item's `type` is `multiple-choice`; exactly 4 entries, same order as the base item's options. `null` for every other type. |
| `code` | Translate comments if it aids clarity; never translate identifiers, keywords, or syntax. `null` if the base item's `code` is `null`, or if there's nothing worth translating in it. |
| `references` | If present, **must be the same length and order** as the base item's `references` array — position *i*'s `label` overrides the label for the base's reference *i*, whose `url` is always reused as-is. Omit the field entirely to just reuse the base language's labels and URLs unchanged. Never include a `url` here — URLs aren't translated, and duplicating them risks drifting out of sync when the base reference gets corrected. |
| `area`, `level`, `type`, `track`, `status`, `reviewer_notes` | **Never included** — always resolved from the base item with the matching `id`. A translation is a language overlay on a base item, not a standalone item. |

A translation file may be partial and grows incrementally — there's no
requirement to translate every item before the language "counts."

### Validation checklist (translation files)

- [ ] Valid JSON array
- [ ] No duplicate `id` within the file
- [ ] Every `id` exists in that track's base `questions.json` **and** is `status: "approved"` there
- [ ] `references`, if present, is the same length as the base item's `references`
- [ ] `options`, if present, has exactly 4 entries and only appears on `multiple-choice` items
- [ ] No `url`, `area`, `level`, `type`, `track`, `status`, or `reviewer_notes` fields present

## Files (per track)

- `tracks/<track-id>/data/questions-queue.json` — **in-flight work only**:
  items with status `pending-answer`, `pending-review`, or `needs-revision`,
  for that track only. This is where the researcher, answerer and reviewer
  all read/write while working that track. An item is **removed from this
  file** the moment it's approved — it never sits here with
  `status: "approved"`. Keeping the queue limited to unfinished work keeps
  it from growing forever and keeps the reviewer's read cost proportional
  to remaining work, not to the track's entire history.
- `tracks/<track-id>/data/questions.json` — final output for that track,
  and the **sole, permanent home** of every approved item once it's
  promoted (full item, all fields, including `reviewer_notes` — nothing is
  lost by removing it from the queue). This is the file the site build step
  reads for that track. Agents checking for existing questions (to avoid
  duplicates) or the next free `id` number must check **both** files —
  `questions.json` for everything already approved, the queue for
  everything still in flight.

## Validation checklist (any agent touching a track's file should self-check)

- [ ] Valid JSON (no trailing commas, no comments)
- [ ] Every `id` unique within the file
- [ ] `track` matches the track directory being worked (and an entry in `tracks-manifest.json`)
- [ ] `area` / `level` / `type` values match the enums for that track exactly (case-sensitive)
- [ ] `multiple-choice` items have exactly 4 `options` and the `answer` names one of them verbatim
- [ ] No item sits in `pending-review` or `approved` with `answer: null` or an empty `references` array

# Track: <Track Name>

> Copy this folder to `tracks/<track-id>/` and fill in every section below
> before running the agent pipeline against it. `<track-id>` should be a
> short kebab-case slug (e.g. `springboot`, `system-design`) — it's used as
> the `id` in `tracks/tracks-manifest.json` and as the `track` value on every
> item this track produces.

## Scope

**Areas (aim for 8–14):**
1. ...
2. ...

List the sub-domains of this subject that a real interview would cover.
Think in terms of "what would a hiring loop for this role actually probe":
language/runtime fundamentals, core framework concepts, data layer, testing,
architecture/design, deployment/ops, debugging, security — adapt to the
subject.

**Levels:** Junior, Mid, Senior (keep this consistent across all tracks so
the site's level filter works the same everywhere).

**Item types:** `conceptual`, `code-challenge`, `multiple-choice`,
`open-question` (see `data/schema.md` at the hub root for the full field
contract — it's shared by every track, don't fork it).

**Target volume:** pick a number that makes sense for the subject's breadth
— React Native's track targets ~80–90; a narrower subject might need less,
a broader one more.

**Default language:** set `defaultLang` for this track in
`tracks/tracks-manifest.json` (e.g. `"en"`) — that's the language this
track's base `questions.json` is written in. Translations are optional and
added later as separate `questions.<lang>.json` files; see
[Translations](../../data/schema.md#translations-multi-language-support) in
the shared schema. Nothing here needs to anticipate translations — add this
track in one language first.

## Trusted reference domains for this track

List the 5–10 official/reputable sources agents should prefer when
researching, answering and reviewing this track's content. Official docs
first, well-known maintainer blogs second, generic blog posts last resort.

## Notes for agents working this track

Anything subject-specific that would otherwise cause technical inaccuracies:
version-sensitive APIs, "legacy vs current" distinctions, terminology that's
easy to get wrong, ecosystem debates where there isn't one settled answer
(say so explicitly rather than picking a side as if it were fact).

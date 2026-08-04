## Type of contribution

<!-- Check the one that applies — see CONTRIBUTING.md for the full guide on each -->

- [ ] A. Questions in an existing track (new questions and/or fixes)
- [ ] B. A new track
- [ ] C. Site changes
- [ ] D. Agent definition / workflow changes
- [ ] E. A translation / new language
- [ ] Other (describe below)

## What changed and why

<!-- Short description. If this closes a needs-revision loop or fixes something you noticed while studying, say which item id(s). -->

## Validation checklist

<!-- Only fill in the section(s) that match what you touched — see CONTRIBUTING.md for the full checklist per type -->

**If you touched content (`tracks/*/data/*.json`):**
- [ ] File is still valid JSON
- [ ] Every `id` unique within the file
- [ ] `track` / `area` / `level` / `type` match the enums exactly
- [ ] Every reference URL is real and actually supports its claim (opened it, didn't assume)
- [ ] `multiple-choice` items have exactly 4 options, `answer` matches one verbatim
- [ ] `node site/build.js` runs cleanly against the updated data

**If you touched the site (`site/`):**
- [ ] `node site/build.js` runs cleanly
- [ ] `npm start` serves the result correctly, manually clicked through it
- [ ] Empty-track state still renders correctly (not blank/broken)
- [ ] Still fully self-contained — no new external requests
- [ ] Checked in both light and dark

**If you added a new track:**
- [ ] `tracks/<id>/track.md` filled in completely (areas, levels, trusted domains, notes)
- [ ] Registered in `tracks/tracks-manifest.json`
- [ ] Empty `questions-queue.json` / `questions.json` (`[]`) created
- [ ] Site picks it up with no code changes (`node site/build.js`, checked in browser)

**If you changed `data/schema.md` or an agent in `.claude/agents/`:**
- [ ] Every agent definition that reads/writes the changed contract was updated in this same PR
- [ ] Confirmed no track-specific content leaked into an agent `.md` file (that belongs in `track.md`)

**If you added a translation (`questions.<lang>.json`):**
- [ ] Every `id` exists in the base `questions.json` and is `status: "approved"` there
- [ ] No `url`/`area`/`level`/`type`/`track`/`status`/`reviewer_notes` fields present
- [ ] `references`, if included, matches the base item's length and order
- [ ] Code identifiers/syntax untouched, only comments (if anything) translated
- [ ] `node site/build.js` still runs cleanly

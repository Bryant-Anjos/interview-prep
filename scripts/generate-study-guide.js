#!/usr/bin/env node
"use strict";

// Dependency-free Markdown study guide generator — track-agnostic, per the
// rest of the pipeline. Reads a track's approved questions.json and writes
// a readable tracks/<track-id>/study-guide.md.
//
// Usage: node scripts/generate-study-guide.js <track-id>
//   (or: npm run study-guide -- <track-id>)

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LEVEL_ORDER = { Junior: 0, Mid: 1, Senior: 2 };
const TYPE_LABELS = {
  conceptual: "Conceptual",
  "code-challenge": "Code Challenge",
  "multiple-choice": "Multiple Choice",
  "open-question": "Open Question"
};

function readJson(relPath) {
  const abs = path.join(ROOT, relPath);
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

// Close enough to GitHub's heading-anchor algorithm for a personal-use TOC.
function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function main() {
  const trackId = process.argv[2];
  if (!trackId) {
    console.error("Usage: node scripts/generate-study-guide.js <track-id>");
    process.exit(1);
  }

  const manifest = readJson("tracks/tracks-manifest.json");
  const track = manifest.find((t) => t.id === trackId);
  if (!track) {
    console.error(`Track "${trackId}" not found in tracks/tracks-manifest.json`);
    process.exit(1);
  }

  let items;
  try {
    items = readJson(track.dataFile).filter((i) => i.status === "approved");
  } catch (e) {
    console.error(`Could not read/parse ${track.dataFile}: ${e.message}`);
    process.exit(1);
  }

  if (!items.length) {
    console.error(`No approved items found for track "${trackId}" (${track.dataFile}) — nothing to generate.`);
    process.exit(1);
  }

  // Group by area, preserving each area's first-appearance order in the data.
  const areaOrder = [];
  const byArea = new Map();
  items.forEach((item) => {
    if (!byArea.has(item.area)) {
      byArea.set(item.area, []);
      areaOrder.push(item.area);
    }
    byArea.get(item.area).push(item);
  });

  // Within each area: Junior -> Mid -> Senior, then id, for a study-friendly order.
  areaOrder.forEach((area) => {
    byArea.get(area).sort((a, b) => {
      const levelDiff = (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99);
      return levelDiff !== 0 ? levelDiff : a.id.localeCompare(b.id);
    });
  });

  const lines = [];
  lines.push(`# ${track.name} — Study Guide`);
  lines.push("");
  lines.push(
    `> Generated from \`${track.dataFile}\` — ${items.length} approved items across ${areaOrder.length} areas. ` +
    `Regenerate with \`node scripts/generate-study-guide.js ${trackId}\` whenever the bank changes.`
  );
  lines.push("");
  lines.push("## Contents");
  lines.push("");
  areaOrder.forEach((area) => {
    lines.push(`- [${area}](#${slugify(area)}) (${byArea.get(area).length})`);
  });
  lines.push("");

  areaOrder.forEach((area) => {
    lines.push(`## ${area}`);
    lines.push("");
    byArea.get(area).forEach((item, idx) => {
      lines.push(`### ${idx + 1}. ${item.question}`);
      lines.push("");
      lines.push(`*${item.level} · ${TYPE_LABELS[item.type] || item.type}*`);
      lines.push("");
      if (Array.isArray(item.options) && item.options.length) {
        item.options.forEach((opt) => lines.push(`- ${opt}`));
        lines.push("");
      }
      lines.push(`**Answer:** ${item.answer}`);
      lines.push("");
      if (item.explanation) {
        lines.push(`**Why:** ${item.explanation}`);
        lines.push("");
      }
      if (item.code) {
        lines.push("```");
        lines.push(item.code);
        lines.push("```");
        lines.push("");
      }
      if (Array.isArray(item.references) && item.references.length) {
        lines.push("**References:**");
        item.references.forEach((ref) => lines.push(`- [${ref.label}](${ref.url})`));
        lines.push("");
      }
      lines.push("---");
      lines.push("");
    });
  });

  const outPath = path.join(ROOT, `tracks/${trackId}/study-guide.md`);
  fs.writeFileSync(outPath, lines.join("\n"));
  console.log(`Wrote ${outPath} (${items.length} items, ${areaOrder.length} areas).`);
}

main();

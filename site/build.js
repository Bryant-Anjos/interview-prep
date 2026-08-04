#!/usr/bin/env node
/**
 * Build script for the Interview Prep Study Hub site.
 *
 * Reads tracks/tracks-manifest.json, loads each track's dataFile (falling
 * back to an empty array if the file is missing, unreadable, or invalid
 * JSON), embeds everything into site/template.html at the
 * `/*__SITE_DATA__*\/` marker, and writes the result to site/dist.html.
 *
 * No external dependencies — plain Node.js only.
 *
 * Usage: node site/build.js
 */

"use strict";

const fs = require("fs");
const path = require("path");

const SITE_DIR = __dirname;
const PROJECT_ROOT = path.join(SITE_DIR, "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "tracks", "tracks-manifest.json");
const TEMPLATE_PATH = path.join(SITE_DIR, "template.html");
const OUTPUT_PATH = path.join(SITE_DIR, "dist.html");
const MARKER = "/*__SITE_DATA__*/";

function readJson(filePath, fallback) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.warn(`  (missing, using fallback) ${filePath}`);
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`  (invalid JSON, using fallback) ${filePath}: ${err.message}`);
    return fallback;
  }
}

function main() {
  console.log(`Reading manifest: ${MANIFEST_PATH}`);
  const manifest = readJson(MANIFEST_PATH, []);
  if (!Array.isArray(manifest)) {
    throw new Error("tracks-manifest.json must be a JSON array of track objects.");
  }

  const data = {};
  manifest.forEach((track) => {
    if (!track || typeof track.id !== "string") {
      console.warn("  (skipping malformed track entry)", track);
      return;
    }
    const dataFilePath = track.dataFile
      ? path.join(PROJECT_ROOT, track.dataFile)
      : null;
    let items = [];
    if (dataFilePath) {
      console.log(`Reading track data: ${track.id} <- ${track.dataFile}`);
      const loaded = readJson(dataFilePath, []);
      items = Array.isArray(loaded) ? loaded : [];
    } else {
      console.warn(`  (no dataFile declared for track "${track.id}", using [])`);
    }
    data[track.id] = items;
  });

  const payload = { tracks: manifest, data: data };

  // Escape "</" so a stray "</script>" inside embedded strings (e.g. a code
  // sample or reference URL) can never break out of the <script> tag.
  const json = JSON.stringify(payload).replace(/<\//g, "<\\/");

  console.log(`Reading template: ${TEMPLATE_PATH}`);
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");

  if (template.indexOf(MARKER) === -1) {
    throw new Error(`Marker ${MARKER} not found in template.html — cannot inject data.`);
  }

  const output = template.replace(MARKER, json);

  fs.writeFileSync(OUTPUT_PATH, output, "utf8");

  const trackCount = manifest.length;
  const itemCount = Object.keys(data).reduce((sum, id) => sum + data[id].length, 0);
  console.log(
    `Wrote ${OUTPUT_PATH} (${trackCount} track${trackCount === 1 ? "" : "s"}, ${itemCount} item${itemCount === 1 ? "" : "s"} total).`
  );
}

main();

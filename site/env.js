#!/usr/bin/env node
/**
 * Minimal, dependency-free ".env" loader.
 *
 * Reads a `.env` file at the project root (if present), parses simple
 * `KEY=VALUE` lines (blank lines and lines starting with `#` are skipped),
 * and sets `process.env[KEY] = VALUE` only when that key isn't already
 * set. That means precedence is:
 *
 *   real shell env var (e.g. `PORT=5000 npm start`)  >  .env  >  hardcoded default
 *
 * No `dotenv` package involved — require this before reading `process.env`
 * values that should be configurable via `.env` (see site/serve.js).
 */

"use strict";

const fs = require("fs");
const path = require("path");

function loadEnv(envPath) {
  let raw;
  try {
    raw = fs.readFileSync(envPath, "utf8");
  } catch (err) {
    return; // no .env file present — nothing to load, not an error
  }

  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const eq = trimmed.indexOf("=");
    if (eq === -1) return;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    // Strip matching surrounding quotes, if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  });
}

loadEnv(path.join(__dirname, "..", ".env"));

module.exports = { loadEnv };

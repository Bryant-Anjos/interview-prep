#!/usr/bin/env node
/**
 * Minimal, dependency-free static file server for previewing the built
 * study site locally. Serves files out of site/ and defaults "/" to
 * site/dist.html — the build output `npm start` regenerates first.
 *
 * Uses only Node's built-in `http`, `fs`, and `path` modules (plus the
 * global WHATWG `URL`) and the local dependency-free `.env` loader in
 * site/env.js.
 *
 * Port resolution order: shell env var (`PORT=5000 npm start`) > `.env`
 * file at the project root > hardcoded default (4173).
 *
 * Usage: node site/serve.js
 */

"use strict";

require("./env"); // loads .env into process.env (without overriding real env vars)

const http = require("http");
const fs = require("fs");
const path = require("path");

const SITE_DIR = __dirname;
const DEFAULT_FILE = "dist.html";
const PORT = Number(process.env.PORT) || 4173;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function contentTypeFor(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function send404(res, requestedPath) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(`Not found: ${requestedPath}\n`);
}

function send500(res, err) {
  res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(`Server error: ${err.message}\n`);
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, "http://localhost");
  let pathname = decodeURIComponent(parsed.pathname || "/");

  if (pathname === "/") {
    pathname = "/" + DEFAULT_FILE;
  }

  // Resolve against SITE_DIR and make sure we never escape it (no path
  // traversal via "../..").
  const resolved = path.normalize(path.join(SITE_DIR, pathname));
  if (!resolved.startsWith(SITE_DIR)) {
    return send404(res, pathname);
  }

  fs.readFile(resolved, (err, contents) => {
    if (err) {
      if (err.code === "ENOENT") {
        if (pathname === "/" + DEFAULT_FILE) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(
            `site/${DEFAULT_FILE} not found. Run "npm run build" (or "node site/build.js") first.\n`
          );
          return;
        }
        return send404(res, pathname);
      }
      return send500(res, err);
    }
    res.writeHead(200, { "Content-Type": contentTypeFor(resolved) });
    res.end(contents);
  });
});

server.listen(PORT, () => {
  console.log(`Serving ${SITE_DIR}`);
  console.log(`Study site: http://localhost:${PORT}/  (serves site/${DEFAULT_FILE})`);
  console.log("Press Ctrl+C to stop.");
});

#!/usr/bin/env node
/**
 * Inlines the standalone build (single/vite.config.ts -> dist-single/) into ONE self-contained HTML file,
 * dist-single/dashboard.html, that opens by double-click or can be hosted anywhere as a static page.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "dist-single");
const assets = path.join(dir, "assets");
const pick = (ext) => {
  const f = fs.readdirSync(assets).find((n) => n.endsWith(ext));
  if (!f) throw new Error(`No ${ext} file in ${assets}; run "npm run build:single" first.`);
  return fs.readFileSync(path.join(assets, f), "utf8");
};

let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const js = pick(".js").replaceAll("</script", "<\\/script").replaceAll("<!--", "<\\!--");
const css = pick(".css");
const safeArea =
  ":root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}";

html = html
  .replace(/<script type="module"[^>]*><\/script>\s*/, "")
  .replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/[^"]*"[^>]*>\s*/, "")
  .replace("</head>", () => `<style>${safeArea}${css}</style>\n</head>`)
  .replace("</body>", () => `<script type="module">${js}</script>\n</body>`);

const out = path.join(dir, "dashboard.html");
fs.writeFileSync(out, html);
console.log(`Wrote ${path.relative(root, out)} (${(Buffer.byteLength(html) / 1e6).toFixed(2)} MB)`);

import { build } from "vite";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";

const sha = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const sourceTree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
  encoding: "utf8",
}).trim();
const workingTreeClean = !execFileSync("git", ["status", "--porcelain"], {
  encoding: "utf8",
}).trim();
await build({
  build: {
    outDir: "dist",
    manifest: "asset-manifest.json",
    chunkSizeWarningLimit: 1800,
  },
  define: { "process.env.IS_PREACT": "false" },
});
await writeFile(
  "dist/build.json",
  JSON.stringify(
    {
      source: sha,
      sourceTree,
      workingTreeClean,
      app: "ldraw",
      excalidraw: "0.18.1",
      builtAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
async function paths(root, prefix = "") {
  const output = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const relative = join(prefix, entry.name);
    if (entry.isDirectory())
      output.push(...(await paths(join(root, entry.name), relative)));
    else output.push(relative);
  }
  return output;
}
const files = (await paths("dist")).sort();
const digest = createHash("sha256");
for (const file of files)
  digest.update(file).update(await readFile(join("dist", file)));
const cache = `ldraw-${digest.digest("hex").slice(0, 24)}`;
// Precache the editor's static dependency graph and default fonts only. Other
// bundled languages, import helpers and fonts are cached after actual requests.
const manifest = JSON.parse(await readFile("dist/asset-manifest.json", "utf8"));
const core = new Set([
  "index.html",
  "asset-path.js",
  "build.json",
  "app.manifest.json",
  "brand/composer-mark.svg",
  "brand/space.woff2",
]);
const visited = new Set();
function collect(key) {
  if (visited.has(key)) return;
  visited.add(key);
  const chunk = manifest[key];
  if (!chunk) return;
  core.add(chunk.file);
  for (const css of chunk.css ?? []) core.add(css);
  for (const dependency of chunk.imports ?? []) collect(dependency);
}
for (const [key, chunk] of Object.entries(manifest))
  if (chunk.isEntry) collect(key);
for (const file of files)
  if (/^excalidraw-assets\/fonts\/(Assistant|Excalifont)\//.test(file))
    core.add(file);
// Cloudflare consumes control files without serving them as assets.
const available = files.filter(
  (file) => !["_headers", "_redirects"].includes(file),
);
const urls = [
  "/",
  ...[...core]
    .filter((file) => available.includes(file))
    .sort()
    .map((file) => `/${file}`),
];
let precacheBytes = 0;
for (const file of core)
  precacheBytes += (await readFile(join("dist", file))).length;
await writeFile(
  "dist/sw.js",
  `/* Generated local-only offline cache; no scene data is cached here. */
const CACHE = ${JSON.stringify(cache)};
const URLS = ${JSON.stringify(urls, null, 2)};
const ASSETS = new Set(${JSON.stringify(["/", ...available.map((file) => `/${file}`)])});
self.addEventListener('install', (event) => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(URLS);
  await self.skipWaiting();
})()));
async function notify() {
  const cache = await caches.open(CACHE);
  if (await cache.match('/')) for (const client of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) client.postMessage({ type: 'LDRAW_OFFLINE_READY' });
}
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('ldraw-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
  await notify();
})()));
self.addEventListener('message', (event) => { if (event.data?.type === 'LDRAW_CHECK_READY') event.waitUntil(notify()); });
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !ASSETS.has(url.pathname)) return;
  event.respondWith((async () => {
    let cache;
    let cached;
    try { cache = await caches.open(CACHE); cached = await cache.match(event.request, { ignoreSearch: true }); } catch { /* Online editing must survive optional cache failures. */ }
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok && cache) { try { await cache.put(url.pathname, response.clone()); } catch { /* Reduced offline availability must not break the network response. */ } }
    return response;
  })());
});
`,
);
console.log(
  JSON.stringify({
    source: sha,
    sourceTree,
    workingTreeClean,
    cache,
    precacheAssets: urls.length,
    precacheBytes,
    bundledAssets: available.length,
    app: "ldraw",
  }),
);

import { build } from "vite";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";

const sha = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
await build({
  build: { outDir: "dist", chunkSizeWarningLimit: 1800 },
  define: { "process.env.IS_PREACT": "false" },
});
await mkdir("dist/excalidraw-assets", { recursive: true });
await cp(
  "node_modules/@excalidraw/excalidraw/dist/prod/fonts",
  "dist/excalidraw-assets/fonts",
  { recursive: true },
);
await writeFile(
  "dist/build.json",
  JSON.stringify(
    {
      source: sha,
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
const urls = ["/", ...files.map((file) => `/${file}`)];
await writeFile(
  "dist/sw.js",
  `/* Generated local-only offline cache; no scene data is cached here. */
const CACHE = ${JSON.stringify(cache)};
const URLS = ${JSON.stringify(urls, null, 2)};
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
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await (await caches.open(CACHE)).match(event.request, { ignoreSearch: true });
    return cached || fetch(event.request);
  })());
});
`,
);
console.log(
  JSON.stringify({ source: sha, cache, assets: urls.length, app: "ldraw" }),
);

# LDraw

An independent local drawing app using the real Excalidraw editor. Composer #290
owns the requirements; Composer #11 owns shared release receipts.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm audit --audit-level low
pnpm build
```

The canvas retains Excalidraw's drawing, text, arrows, images, selection,
grouping, pan/zoom and undo. A project colour choice affects future content.
Editable examples append below existing content without changing its IDs.
Infrastructure, game and music labels describe diagram topics; they do not
substitute for approved portfolio identities.

Drawings autosave in this origin's IndexedDB, with one previous snapshot for
damaged-save recovery and an atomic revision check against concurrent tabs.
Storage failure leaves the current canvas in memory and tells you to download
an editable copy. Browser data can be cleared or evicted: keep `.excalidraw`
downloads. Opening a file explicitly replaces the canvas after confirmation;
undo remains available. Import rejects malformed data, duplicate IDs, missing
images, web embeds and remote image references; limits are 20 MB / 5,000
elements. Native element metadata, IDs, text and embedded image bytes are kept.

PNG/SVG preview and download use the same Excalidraw renderer as the editor,
with 24 px padding, chosen background and PNG 1×/2×/3× scale. Huge PNGs fail
with an actionable message instead of allocating an unbounded canvas.
All engine fonts are self-hosted. The service worker precaches the core editor
and default fonts, then caches additional local fonts and import/export helpers
as they load. “Offline workspace cached” describes that core cache, not proof
that every drawing/font/helper works offline. Load the current drawing and run
its export once before going offline. New fonts may need a connection. Drawing
in an already loaded tab and a fresh offline relaunch require separate browser
qualification with the current scene and export assets actually loaded.

## Local agent use

The core cache follows Vite's static imports, CSS and referenced assets, plus the
seven tiny conditional file-picker/save and canvas-polyfill modules needed at
native startup. Their published manifest identities are checked at build time.
Offline qualification clears the owned browser's HTTP cache while retaining
service-worker CacheStorage, so a normal browser cache cannot hide missing
startup resources. Additional fonts and optional import helpers still cache only
after they load.

Responses include `Cache-Control: public, no-transform` so Cloudflare's automatic
Web Analytics cannot inject an external beacon into the local drawing workspace.
The strict CSP and the zero-external-request browser check stay intact. This
app-local response policy follows [Cloudflare's documented control](https://developers.cloudflare.com/web-analytics/get-started/)
and does not change analytics settings for other portfolio sites.

Use the native `.excalidraw` version 2 file format; there is no second scene
protocol or MCP service. Authorise browser access yourself. In this exact editor
tab, `window.ldraw.readScene()` returns `{ revision, scene }` and
`await window.ldraw.replaceScene(scene, { expectedRevision })` validates the
native scene and rejects a stale revision, including human edits made while
the import is being restored. `exportBlob('png'|'svg')` returns the real renderer
output. This is a same-browser JavaScript interface, not a remote agent service.
Drawing contents never appear in URLs or server logs.

```sh
pnpm scene validate drawing.excalidraw
pnpm render drawing.excalidraw output/rendered
```

Rendering requires a built app and the host's existing Playwright Chromium.
It runs the editor on loopback, imports through the same validated API, checks
IDs/image bytes and writes editable/PNG/SVG files. One owned temporary profile
and download root is removed in `finally`; output is deliberately retained.
Do not run browser/render/build jobs alongside other heavy host validation.

## Independent release

This repo has its own source, lockfile, build, browser database, service worker,
Worker name and assets-only configuration. Proposed hostname:
`ldraw.loftwah.com`. No hostname, production or physical-device acceptance is
claimed by the source. Standalone and Composer-mounted origins never share
browser storage. Composer should adopt an exact independent source pin.

`pnpm deploy` requires clean pushed `main`, exact account/hostname, no service
bindings, a fresh `output/qualification.json` for the release SHA, passing audit,
check and build, then checks live `/build.json`. Root coordinates DNS and live
interaction proof. No GitHub Actions, new account or provider is required.
Device metadata starts `unknown`; desktop browser checks and physical phone/
tablet editing are distinct evidence. A responsive screenshot proves layout.

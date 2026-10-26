# LDraw

An independent local drawing app using the real Excalidraw editor. Composer #290
owns the requirements; Composer #11 owns shared release receipts.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm audit --audit-level low
pnpm build
node scripts/library-check.mjs   # built app + local Playwright
```

The canvas retains Excalidraw's drawing, text, arrows, images, selection,
grouping, pan/zoom and undo. A project colour choice affects future content.
Editable examples append below existing content without changing its IDs.
Infrastructure, game and music labels describe diagram topics; they do not
substitute for approved portfolio identities.

LDraw opens in dark appearance by default, because a blank white canvas is a
poor first impression on a dark desktop. The toolbar appearance control offers
Dark, Light and System; the choice is stored on this origin and applied by
`public/theme-init.js` before the first stylesheet paint. Excalidraw's dark
theme is an inverted canvas filter, so scenes keep a normal white scene
background and portable light-mode element colours. Exports therefore stay
readable when shared, without changing the saved drawing.

The **Library** button opens one Portfolio library with two coherent paths.
**Portfolio artwork** holds 22 real project images — approved App Composer and
Bubbles identities, MP-confirmed LoftwahFM, MP-commissioned SHOALSHOT,
MP-qualified Linkarooie, documented mini-app scenes, Woodhouse artwork and
current Fighter/Protocol 11 material. Thumbnails are searchable by project and
status; insertion embeds the local WebP bytes, an editable caption and scene
provenance, then survives native save/reopen and PNG/SVG export. Status badges
are deliberately honest: `approved`, `qualified`, `documented`,
`agent-selected`, `current` and `sample` are not synonyms. See
[docs/portfolio-artwork.md](docs/portfolio-artwork.md) for every source, hash,
licence caveat and gap. Launch Kit’s only image is labelled a fictional sample;
LDraw has no invented logo.

**Editable blocks** covers the maintained apps, App Composer journeys,
Cloudflare infrastructure, games, music and general wireframes with real
composition previews. The same vector items are merged into Excalidraw’s native
Library panel with stable IDs, so the owner’s own library items are preserved.
Blocks remain plain vectors and text: no remote image, hidden font or network
request is needed to insert, save, reopen or export them. The owner’s native
library content is untouched; image-backed artwork lives only on the custom
path because native library items cannot carry file bytes.

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

Drawings are native `.excalidraw` version 2 files; there is no second scene
protocol. In this exact editor tab, `window.ldraw.readScene()` returns
`{ revision, scene }` and `await window.ldraw.replaceScene(scene, { expectedRevision })`
validates the native scene and rejects a stale revision, including human edits
made while the import is being restored. `exportBlob('png'|'svg')` returns the
real renderer output. This is a same-browser JavaScript interface, not a remote
agent service. Drawing contents never appear in URLs or server logs.

For agent authoring there is now a **local stdio MCP adapter** over the same
scene, presets and renderer. The host picks one absolute drawings workspace at
launch; tools then take relative paths only, and every edit needs the exact
sha256 revision that was read:

```sh
pnpm build                                   # required before rendering
pnpm mcp --workspace /absolute/path/drawings # local stdio server
pnpm mcp --workspace /absolute/path/drawings --read-only
```

Codex (`~/.codex/config.toml`) or OpenCode V2 (`mcp.servers`) can launch
`node /absolute/path/to/scripts/mcp-server.mjs --workspace /absolute/path/drawings`.
The tools are `ldraw_list_templates`, `ldraw_read_scene`, `ldraw_create_scene`,
`ldraw_modify_scene` and `ldraw_render_scene`. See [docs/mcp.md](docs/mcp.md) for
exact versions, client configuration, the full security boundary, unsupported
clients, measured cost and remaining gates, and
[docs/agent-prompt.md](docs/agent-prompt.md) for a copyable agent prompt/skill.

Two committed examples are produced by those tools, not by hand:
`examples/app-composer-architecture/` (approved Composer orange) and
`examples/infrastructure-runtime/` (existing infrastructure diagram-topic
palette, explicitly not a second project brand). Regenerate them with
`pnpm mcp:demo`; that command replaces only those two directories.

The MCP server adds no remote URL, account, database or cloud dependency. It
reads and writes only inside the selected workspace, refuses absolute paths,
`..`, symlinks and non-`.excalidraw` files, never follows a symlink out of the
root, writes atomically and refuses stale revisions without touching newer file
bytes. Embedded image bytes are never returned in tool results, and scene text
never appears in diagnostics. It is not a public drawing API.

```sh
pnpm scene validate drawing.excalidraw
pnpm render drawing.excalidraw output/rendered
```

Rendering requires a built app and the host's existing Playwright Chromium.
The CLI and the MCP tool run the editor on loopback, import through the same
validated API, check IDs/image bytes and write editable/PNG/SVG files. One owned
temporary profile and download root is removed in `finally`; output is
deliberately retained. Do not run browser/render/build jobs alongside other
heavy host validation.

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

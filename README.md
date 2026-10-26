# LDraw

LDraw is a local-first portfolio drawing workspace built on the real Excalidraw
editor. It opens with actual work already available: project artwork, characters,
mascots, captures, reusable diagrams and source-verified architecture for the
maintained Loftwah portfolio.

Composer #290 owns product intent; Composer #11 owns shared release receipts.
This repository owns the implementation, its own source pin and its independent
release.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm audit --audit-level low
pnpm build
node scripts/library-check.mjs   # built app + local Playwright
```

## What opens

- **98 reusable library entries** — 95 real WebP artwork/illustration assets and
  three authored 16:9 compositions.
- **18 source-verified architecture scenes** — native `.excalidraw` files with
  previews, provenance and a public handoff manifest.
- **27 editable native blocks** — the retained library plus the expanded project
  cards, infrastructure, game, music and wireframe blocks.
- **18 maintained projects** — App Composer, LDraw, Paperwork, Here / there,
  Linkarooie, Link Check, Carry / forward, Hello World, Launch Kit, Asset
  Hunter, MAX, Protocol 11, Bubbles, SHOALSHOT, LOFTWAH FIGHTER, Pirates,
  LoftwahFM and Woodhouse.

Pirates is represented honestly by architecture only. Its third-party source
art is reference-only and is not bundled. Launch Kit's Night Signal artwork is
labelled a fictional sample, not a Launch Kit brand. Every asset carries its
strongest documented status: `approved`, `qualified`, `documented`,
`agent-selected`, `current`, `candidate` or `sample`; those words are not
synonyms. See [docs/portfolio-artwork.md](docs/portfolio-artwork.md).

## Portfolio library

The **Portfolio** toolbar action opens one first-party browser. Projects are the
primary rail; useful categories are Logos, Icons, Characters, Mascots,
Screenshots, UI, Backgrounds, Diagrams, Components, Illustrations and Templates.
Search covers project, asset name, character, tags and intended use. Favourites
and recently used items are stored on this origin.

A card opens a real preview with its credit, status, source path, SHA-256 hashes
and intended use. Insertion is explicit:

- **Insert artwork** — the actual standalone image. No surrounding information
  card, label or forced decoration.
- **Insert as card** — an optional branded card with editable title, subtitle and
  status line.
- **Insert composition** — a complete 16:9 native stage or walkthrough.
- **Open diagram** / **Add to canvas** — a reviewed architecture scene, either
  replacing the current canvas after confirmation or copied with fresh IDs.

New objects land near the current viewport, not at an arbitrary bottom edge. If
the exact centre is occupied, the library tries adjacent free space and then the
right of the existing drawing. Large compositions and diagrams are fitted after
insertion. The native Excalidraw personal library remains available from
**Personal library** in the library footer.

The original 18 blocks and the owner's own Excalidraw library items are retained.
Built-in native items keep stable `ldraw-*` IDs and merge with, never replace,
personal items.

## Architecture library

Every maintained project has a three-column system model describing surfaces,
runtime and data/services, with arrows and an explicit source-verified badge. The
models are authored in [`src/architecture.mjs`](src/architecture.mjs) from real
manifests, Worker configurations, entrypoints and architecture notes. They are
rendered by LDraw's existing Excalidraw renderer through the local MCP authoring
path; there is no second diagram format or renderer.

Open **Architecture** in the portfolio library, choose a project, inspect the
components and revision, then open the native scene. Source relationships are
recorded in [`docs/architecture-library.md`](docs/architecture-library.md) and
the public [`/architecture/manifest.json`](public/architecture/manifest.json).
Composer #375 and Woodhouse #149 can consume the exact scene/hash pair; LDraw
remains the editing surface. See [docs/cross-project-handoff.md](docs/cross-project-handoff.md).

The diagrams are reviewed content that ships with LDraw. An ordinary browser
does not query private repositories; a drift check reports when an owning source
revision has moved and needs review.

## Presentation

**Present** enters a distraction-free view: app chrome and save status are
hidden, Excalidraw is in zen/view mode, and a small HUD offers Fit and Exit. The
scene renders with its designed light colours rather than the inverted editor
skin, so published diagrams and the dark 16:9 stages look as intended. Pan and
zoom remain native Excalidraw behaviour. `Shift` + `P` toggles presentation and
`Shift` + `L` opens the library.

The three authored compositions are exactly 1920 × 1080. Their background carries
a native `ldrawPresentation` marker so **Export PNG** uses zero export padding and
preserves 16:9. At 1× the result is 1920 × 1080; at 2× it is 3840 × 2160. Other
drawings keep the documented 24 px padding. Uncheck **Background** for a
transparent export.

## Drawings, storage and export

The canvas retains Excalidraw's drawing, text, arrows, images, selection,
grouping, pan/zoom and undo. Drawings autosave in this origin's IndexedDB, with
one previous snapshot for damaged-save recovery and an atomic revision check
against concurrent tabs. Storage failure leaves the current canvas in memory and
tells you to download an editable copy.

Drawings are native `.excalidraw` version 2 files; there is no second scene
protocol. Opening a file explicitly replaces the canvas after confirmation;
undo remains available. Import rejects malformed data, duplicate IDs, missing
images, web embeds and remote image references; limits are 20 MB / 5,000
elements. Native element metadata, IDs, text and embedded image bytes are kept.

PNG/SVG preview and download use the same Excalidraw renderer as the editor.
Huge PNGs fail with an actionable message instead of allocating an unbounded
canvas. All engine fonts are self-hosted. The service worker precaches the core
editor, default fonts, the reviewed portfolio images, thumbnails, compositions
and architecture scenes. “Offline workspace cached” describes that core cache,
not proof that every drawing/font/helper works offline. Load the current drawing
and run its export once before going offline.

## Identity and sharing

LDraw now has its own original mark: a charcoal tile with an orange drafting
**L** and an ivory folded corner. It is not the Death Note logo, a copied
character, or a generic AI mark. The mark drives a dedicated SVG favicon,
16/32/48 px PNGs, a favicon.ico, a 180 px Apple touch icon, 192/512 px install
icons, a maskable icon and a web app manifest. The owner's taste approval of the
final mark is not separately recorded; the catalogue calls it `current`, not
`approved`.

The 1200 × 630 social card is rendered from the real built app through
Playwright, with local Space Grotesk and the authored mark. Its source revision,
canvas hash and image hash are recorded in
[`public/og/ldraw-og-provenance.json`](public/og/ldraw-og-provenance.json).
Metadata, canonical URL, structured data, robots and sitemap are checked by
`scripts/seo.mjs`.

## Local agent use

In this exact editor tab, `window.ldraw.readScene()` returns
`{ revision, scene }`, `readViewport()` returns the current scene viewport, and
`await window.ldraw.replaceScene(scene, { expectedRevision })` validates the
native scene and rejects a stale revision. `exportBlob('png'|'svg')` returns the
real renderer output. This is a same-browser JavaScript interface, not a remote
agent service. Drawing contents never appear in URLs or server logs.

For agent authoring there is a local stdio MCP adapter over the same scene,
presets, blocks, project architecture models and renderer. The host picks one
absolute drawings workspace at launch; tools then take relative paths only, and
every edit needs the exact sha256 revision that was read:

```sh
pnpm build
pnpm mcp --workspace /absolute/path/drawings
pnpm mcp --workspace /absolute/path/drawings --read-only
```

Codex (`~/.codex/config.toml`) or OpenCode V2 (`mcp.servers`) can launch
`node /absolute/path/to/scripts/mcp-server.mjs --workspace /absolute/path/drawings`.
The tools are `ldraw_list_templates`, `ldraw_read_scene`, `ldraw_create_scene`,
`ldraw_modify_scene` and `ldraw_render_scene`. The catalogue now also reports the
18 `arch-*` models and three `composition-*` stages. See [docs/mcp.md](docs/mcp.md)
for exact versions, security boundaries and remaining gates, and
[docs/agent-prompt.md](docs/agent-prompt.md) for a copyable prompt.

Two committed examples are produced by those tools:
`examples/app-composer-architecture/` and `examples/infrastructure-runtime/`.
Regenerate them with `pnpm mcp:demo`.

```sh
pnpm scene validate drawing.excalidraw
pnpm render drawing.excalidraw output/rendered
```

Rendering requires a built app and local Playwright Chromium. The CLI and MCP
tool run the editor on loopback, import through the same validated API, check IDs
and image bytes, and write editable/PNG/SVG files. One owned temporary profile
and download root is removed in `finally`; output is deliberately retained.

## Maintain the collection

The library is data, not dozens of hard-coded definitions:

```sh
node scripts/harvest-assets.mjs --discover   # tracked images not yet in the manifest
node scripts/harvest-assets.mjs --write      # copy, optimise, hash and thumbnail
node scripts/catalogue.mjs --write           # regenerate src/portfolio.mjs and docs
node scripts/architecture-build.mjs --write  # re-author and render all architecture scenes
node scripts/compositions-build.mjs --write  # re-author and render the 16:9 stages
node scripts/brand-assets.mjs                # icons + manifest
node scripts/seo.mjs --write                 # robots + sitemap
node scripts/og.mjs                          # social card from a clean built tree
pnpm check
```

`catalogue/assets.json` holds the editable approval/credit/use record;
`catalogue/projects.json` holds project identity; `catalogue/architecture.json` and
`catalogue/compositions.json` are generated from real scenes. The harvest command
preserves approval and notes, updates only bytes/dimensions/hashes, and never
rewrites a source project. See [docs/portfolio-workflow.md](docs/portfolio-workflow.md)
and the reusable [portfolio-harvest skill](skills/portfolio-harvest/SKILL.md).

The architecture and composition builders use the local MCP adapter to create
scenes, then render through the existing Excalidraw renderer. On a host whose
process sandbox prevents Chromium from launching, run the browser steps inside
the repository's Playwright Docker image with the repo mounted at `/work`; the
same commands and generated bytes apply. No GitHub Actions are used.

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

## Provenance

- [Portfolio artwork and every source hash](docs/portfolio-artwork.md)
- [Architecture coverage and scene records](docs/architecture-library.md)
- [Asset provenance and licence boundaries](docs/asset-provenance.md)
- [MCP adapter](docs/mcp.md) · [Agent prompt](docs/agent-prompt.md)
- [Cross-project handoff](docs/cross-project-handoff.md)
- [Presentation and export notes](docs/presentation.md)
- [Current delivery status](docs/STATUS.md) (where present) and the canonical
  release evidence index in Composer #11.

Real UI captures are labelled as captures. Generated artwork never substitutes
for a screenshot. App Composer orange is not applied as a universal portfolio
accent. No private owner records, real signatures or secrets are bundled.

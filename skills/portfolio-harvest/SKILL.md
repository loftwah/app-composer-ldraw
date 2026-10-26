---
name: portfolio-harvest
description: Harvest, review and package real Loftwah portfolio artwork and source-verified architecture into LDraw. Use when adding project assets, refreshing the manifest, finding newly tracked screenshots/characters/logos, or re-rendering the architecture library. Never use it to invent a brand or publish private material.
---

# Portfolio harvest

Use this workflow when the LDraw portfolio library needs new real material.

## Read first

- `AGENTS.md`, `README.md`, `docs/portfolio-workflow.md` and
  `docs/asset-provenance.md`.
- `catalogue/projects.json`, `catalogue/assets.json` and
  `catalogue/discovery.json`.
- The owning project's `PRODUCT.md`, `DESIGN.md`, asset manifest and provenance
  notes.

Brand/art approval is data. A public repository is not a redistribution licence.
An owner-approved mascot or character is never silently redrawn or replaced.

## Discover

```sh
node scripts/harvest-assets.mjs --discover --repos-root /path/to/gits
```

The command uses tracked files only and the include/ignore globs in
`catalogue/discovery.json`. It is read-only. Inspect `public/brand`,
`public/assets`, `public/icons`, `public/og`, `public/artwork`, `public/images`,
`public/mascots`, help captures, registered manifests and real UI captures.

Do not read or copy `node_modules`, `dist`, ignored `output`, private media,
real signatures, credentials, private reports or third-party reference art that
has no reuse basis.

## Review

For each candidate, write down:

- project, category, title, short subtitle and intended use;
- what the image actually is (authored, generated, capture, game specimen);
- exact source path and owning repository;
- strongest documented status: `approved`, `qualified`, `documented`,
  `agent-selected`, `current`, `candidate` or `sample`;
- credit, licence or the absence of a licence;
- character/identity constraints.

Add an explicit entry to `catalogue/assets.json`. A filename without a use,
credit and provenance is not an asset record.

## Package

```sh
node scripts/harvest-assets.mjs --write --repos-root /path/to/gits
node scripts/catalogue.mjs --write
```

The harvest writes a 1200 px WebP and 420 px thumbnail, hashes both the source
and derivative, and preserves the approval fields. It never edits an owning
repository and makes no network request.

## Architecture

Update `src/architecture.mjs` only from actual source. Then:

```sh
pnpm build
node scripts/architecture-build.mjs --write --repos-root /path/to/gits
node scripts/compositions-build.mjs --write
node scripts/catalogue.mjs --write
```

The architecture builder uses the local MCP adapter and the existing Excalidraw
renderer. Review the preview at real size. Do not invent a second diagram format,
renderer or plausible-sounding service.

## Verify

```sh
node scripts/catalogue.mjs --check
node scripts/architecture-build.mjs --check
node scripts/compositions-build.mjs --check
node scripts/brand-assets.mjs --check
node scripts/seo.mjs
pnpm check
pnpm build
node scripts/library-check.mjs
```

A browser check must use real assets and diagrams. Counting cards is not enough.
On a host whose process sandbox cannot launch Chromium, use the host's existing
Playwright Docker image with the repository mounted at `/work`; do not fabricate
a browser receipt.

## Report

Record the source revision, the exact commands, the assets/scenes added, the
output paths and hashes, the owned temporary resources removed, and every
remaining owner/licence/device gate. Do not claim owner approval or production
acceptance from a passing script.

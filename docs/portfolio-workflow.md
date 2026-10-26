# Portfolio asset workflow

The library is maintained as data, not as a growing pile of hand-written React
definitions. This is the repeatable agent workflow for adding real portfolio
material.

## Sources of truth

| File | Purpose |
| --- | --- |
| `catalogue/projects.json` | The maintained project list, groups, brand state, site and repository. |
| `catalogue/assets.json` | Every image: project, category, title, intended use, credit, approval status, source path, source hash, derivative and thumbnail. |
| `catalogue/architecture.json` | Generated architecture scene records, source revisions and hashes. |
| `catalogue/compositions.json` | Generated 16:9 composition records and hashes. |
| `catalogue/discovery.json` | Where to look for new tracked images in sibling repositories. |
| `src/architecture.mjs` | Authored, source-verified architecture models. |
| `src/compositions.mjs` | Authored 16:9 presentation stages. |
| `src/portfolio.mjs` | Generated runtime catalogue imported by the app. Never hand-edit. |

`src/portfolio.mjs`, `docs/portfolio-artwork.md`, `docs/architecture-library.md`
and `public/architecture/manifest.json` are generated. `node scripts/catalogue.mjs
--check` fails when they are stale.

## 1. Discover

Read the owning repositories, not guessed URLs:

```sh
node scripts/harvest-assets.mjs --discover --repos-root /path/to/gits
```

The command uses each repository's tracked file list and the include/ignore
globs in `catalogue/discovery.json`. It is read-only. It reports images that are
not already in `catalogue/assets.json`.

Investigate beyond the obvious brand folder: `public/brand`, `public/assets`,
`public/icons`, `public/og`, `public/images`, `public/artwork`, `public/mascots`,
game help captures, registered asset manifests, evidence captures and public UI
screenshots. Do not copy `node_modules`, `dist`, `output`, private media, real
signatures, credentials or third-party reference art that has no reuse basis.

## 2. Review before adding

For each candidate, establish:

- **Project and category** — the primary dimension and one useful type.
- **What it actually is** — real screenshot, authored mark, commissioned art,
  generated asset, game specimen, etc.
- **Intended use** — the specific slide, diagram or explanation it helps.
- **Approval state** — `approved`, `qualified`, `documented`, `agent-selected`,
  `current`, `candidate` or `sample`. Do not upgrade the strongest documented
  claim.
- **Source and licence** — exact source path, owning repository, licence or the
  absence of one. A public repository is not automatically a redistribution
  licence.
- **Identity preservation** — approved mascots and characters are not redrawn,
  restyled or replaced with an approximation.

Add an explicit record to `catalogue/assets.json` with a stable id, source path,
tags, credit, note and intended use. Do not add a filename without its provenance.

## 3. Harvest and hash

```sh
node scripts/harvest-assets.mjs --write --repos-root /path/to/gits
node scripts/catalogue.mjs --write
```

The harvest command:

1. Reads the explicit source path.
2. Converts to a 1200 px maximum WebP (quality 82) and a 420 px thumbnail.
3. Writes only `public/portfolio/<id>.webp` and
   `public/portfolio/thumbs/<id>.webp`.
4. Records dimensions and both SHA-256 values.
5. Preserves every approval, label, note and tag unchanged.

It uses an existing local ImageMagick or cwebp install. It makes no network
request and never edits an owning repository. `--check` verifies the local
derivative and a source hash when the source checkout is available.

## 4. Architecture and compositions

Architecture is authored from actual manifests and source, not guessed:

```sh
pnpm build
node scripts/architecture-build.mjs --write --repos-root /path/to/gits
node scripts/compositions-build.mjs --write
node scripts/catalogue.mjs --write
```

The architecture builder creates each scene through the local MCP adapter, adds
any reviewed source note, renders through the existing Excalidraw renderer, and
records:

- scene and preview SHA-256;
- element count;
- the owning repository revision;
- the exact source files used for the review;
- renderer identity and render metadata;
- an honest `humanReview` line.

The scene is the editable source. The preview is only an index image. The public
manifest is for Composer #375, Woodhouse #149 and other consumers; it retains the
scene/hash/source relationship.

## 5. Verify and release

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

The browser check opens a fresh profile, selects a real project, inserts real
artwork standalone and as a card, inserts a 16:9 composition, opens a native
architecture, adds an annotation, exports at the documented size and checks the
favicon/manifest/social metadata. `scripts/qualify.mjs` covers the wider storage,
offline, font and native file journeys.

On a host whose process sandbox prevents Chromium from starting, run the browser
commands inside the host's existing Playwright Docker image with the repository
mounted at `/work`. Do not fake a browser receipt.

## Adding a new project

1. Add the project to `catalogue/projects.json` with its real group, site,
   repository and strongest brand state.
2. Add its architecture model to `src/architecture.mjs` from real source.
3. Add approved/documented artwork records, or leave the artwork list empty and
   state why (as Pirates does).
4. Run the harvest, architecture, catalogue and test commands.
5. Update the owner issue and Composer #11 with the exact source, commands,
   output locations and any remaining licence/owner review.

A new project without cleared artwork is still discoverable through its
architecture and an honest empty artwork result. Do not fill the gap with a
generic generated logo.

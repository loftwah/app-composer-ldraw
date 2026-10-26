#!/usr/bin/env node
/**
 * Generate the runtime catalogue and the human-readable provenance records
 * from the small maintained JSON manifests.
 *
 *   node scripts/catalogue.mjs --check
 *   node scripts/catalogue.mjs --write
 *
 * The checked-in `src/portfolio.mjs`, `docs/portfolio-artwork.md` and
 * `docs/architecture-library.md` are generated. Never hand-edit them.
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const mode = process.argv.includes("--write") ? "write" : "check";
const CATALOGUE_DATE = "26 October 2026";

const read = async (path, fallback) => {
  try {
    return JSON.parse(await readFile(join(repoRoot, path), "utf8"));
  } catch (error) {
    if (fallback !== undefined) return fallback;
    throw error;
  }
};

const projects = await read("catalogue/projects.json");
const assets = await read("catalogue/assets.json");
const compositions = await read("catalogue/compositions.json", []);
const architecture = await read("catalogue/architecture.json", []);

const categories = [
  ["logo", "Logos"],
  ["icon", "Icons"],
  ["character", "Characters"],
  ["mascot", "Mascots"],
  ["screenshot", "Screenshots"],
  ["ui", "UI"],
  ["background", "Backgrounds"],
  ["diagram", "Diagrams"],
  ["component", "Components"],
  ["illustration", "Illustrations"],
  ["template", "Templates"],
];
const categoryLabel = Object.fromEntries(categories);
const statuses = new Set([
  "approved",
  "qualified",
  "documented",
  "agent-selected",
  "current",
  "candidate",
  "sample",
]);

function fail(message) {
  throw new Error(message);
}

const projectKeys = new Set();
for (const project of projects) {
  if (!project.key || projectKeys.has(project.key))
    fail(`duplicate or missing project key ${project.key}`);
  projectKeys.add(project.key);
  for (const field of ["label", "tagline", "description", "group", "accent", "tint"])
    if (!project[field]) fail(`${project.key}: missing ${field}`);
}

const projectByKey = Object.fromEntries(projects.map((p) => [p.key, p]));
const assetIds = new Set();
const fileHashes = new Map();
for (const asset of assets) {
  if (!asset.id || assetIds.has(asset.id)) fail(`duplicate asset ${asset.id}`);
  assetIds.add(asset.id);
  const project = projectByKey[asset.project];
  if (!project) fail(`${asset.id}: unknown project ${asset.project}`);
  if (!categoryLabel[asset.category])
    fail(`${asset.id}: unknown category ${asset.category}`);
  if (!statuses.has(asset.status))
    fail(`${asset.id}: unknown status ${asset.status}`);
  if (!asset.title || !asset.subtitle || !asset.credit || !asset.note)
    fail(`${asset.id}: incomplete record`);
  if (!asset.file?.startsWith("/portfolio/"))
    fail(`${asset.id}: local /portfolio/ file required`);
  if (!asset.thumb?.startsWith("/portfolio/thumbs/"))
    fail(`${asset.id}: local thumbnail required`);
  if (!/^[a-f0-9]{64}$/.test(asset.sourceSha ?? ""))
    fail(`${asset.id}: sourceSha missing; run harvest-assets --write`);
  if (!/^[a-f0-9]{64}$/.test(asset.derivativeSha ?? ""))
    fail(`${asset.id}: derivativeSha missing; run harvest-assets --write`);
  for (const path of [`public${asset.file}`, `public${asset.thumb}`]) {
    if (!existsSync(join(repoRoot, path)))
      fail(`${asset.id}: missing ${path}`);
  }
  const bytes = await readFile(join(repoRoot, `public${asset.file}`));
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== asset.derivativeSha)
    fail(`${asset.id}: derivative hash changed; rerun harvest --write`);
  fileHashes.set(asset.id, digest);
}

const compositionIds = new Set();
for (const composition of compositions) {
  if (!composition.id || compositionIds.has(composition.id))
    fail(`duplicate composition ${composition.id}`);
  compositionIds.add(composition.id);
  if (!projectByKey[composition.project])
    fail(`${composition.id}: unknown project ${composition.project}`);
  for (const field of ["title", "description", "scene", "preview"])
    if (!composition[field]) fail(`${composition.id}: missing ${field}`);
  if (!composition.scene.startsWith("/compositions/"))
    fail(`${composition.id}: scene must be a local /compositions/ path`);
  if (!composition.preview.startsWith("/compositions/"))
    fail(`${composition.id}: preview must be a local /compositions/ path`);
}

const architectureIds = new Set();
for (const entry of architecture) {
  if (!entry.id || architectureIds.has(entry.id))
    fail(`duplicate architecture entry ${entry.id}`);
  architectureIds.add(entry.id);
  if (!projectByKey[entry.project])
    fail(`${entry.id}: unknown project ${entry.project}`);
  for (const field of ["title", "summary", "scene", "preview", "reviewedAt"])
    if (!entry[field]) fail(`${entry.id}: missing ${field}`);
  if (!entry.scene.startsWith("/architecture/"))
    fail(`${entry.id}: scene must be a local /architecture/ path`);
  if (!entry.preview.startsWith("/architecture/"))
    fail(`${entry.id}: preview must be a local /architecture/ path`);
  for (const path of [`public${entry.scene}`, `public${entry.preview}`])
    if (!existsSync(join(repoRoot, path)))
      fail(`${entry.id}: missing ${path}`);
}

const projectOrder = projects.map((project) => project.key);
const assetsWithProject = assets.map((asset) => ({
  ...asset,
  projectLabel: projectByKey[asset.project].label,
  accent: projectByKey[asset.project].accent,
  tint: projectByKey[asset.project].tint,
}));
const sortedAssets = [...assetsWithProject].sort(
  (a, b) =>
    projectOrder.indexOf(a.project) - projectOrder.indexOf(b.project) ||
    categories.findIndex(([key]) => key === a.category) -
      categories.findIndex(([key]) => key === b.category) ||
    a.title.localeCompare(b.title),
);
const architectureWithStatus = architecture.map((entry) => ({
  ...entry,
  status: "documented",
  statusLabel: "Source-verified",
}));
const sortedArchitecture = [...architectureWithStatus].sort(
  (a, b) =>
    projectOrder.indexOf(a.project) - projectOrder.indexOf(b.project) ||
    a.title.localeCompare(b.title),
);
const artworkProjects = projects
  .map((project) => ({
    key: project.key,
    label: project.label,
    group: project.group,
    accent: project.accent,
    tint: project.tint,
    count: sortedAssets.filter((asset) => asset.project === project.key).length,
    architecture: sortedArchitecture.some((entry) => entry.project === project.key),
  }))
  .filter((project) => project.count || project.architecture);
const artworkCategories = categories
  .map(([key, label]) => ({
    key,
    label,
    count: sortedAssets.filter((asset) => asset.category === key).length,
  }))
  .filter((category) => category.count);
const libraryStats = {
  projects: projects.length,
  assets: sortedAssets.length,
  compositions: compositions.length,
  architecture: sortedArchitecture.length,
  categories: artworkCategories.length,
};
const projectArtwork = Object.fromEntries(
  projects.map((project) => [
    project.key,
    sortedAssets.filter((asset) => asset.project === project.key),
  ]),
);

const generated = `// Generated by scripts/catalogue.mjs. Do not hand-edit.
// Sources: catalogue/projects.json, catalogue/assets.json,
// catalogue/compositions.json and catalogue/architecture.json.
export const portfolioProjects = ${JSON.stringify(projects, null, 2)};

export const portfolioArtwork = ${JSON.stringify(sortedAssets, null, 2)};

export const artworkProjects = ${JSON.stringify(artworkProjects, null, 2)};

export const artworkCategories = ${JSON.stringify(artworkCategories, null, 2)};

export const portfolioCompositions = ${JSON.stringify(compositions, null, 2)};

export const architectureCatalogue = ${JSON.stringify(sortedArchitecture, null, 2)};

export const libraryStats = ${JSON.stringify(libraryStats, null, 2)};

export const projectsByKey = ${JSON.stringify(projectByKey, null, 2)};

export const artworkByProject = ${JSON.stringify(projectArtwork, null, 2)};

export function projectFor(key) {
  return projectsByKey[key] ?? null;
}
`;

const statusKey = `## Status key

- **approved** — documented owner/MP approval or an owner-approved asset manifest.
- **qualified** — documented qualified acceptance, MP-commissioned identity, or an owner-approved subset. Read the note, not only the badge.
- **documented** — a real authored/generated/captured asset with provenance and a clear licence or review record, but no owner art acceptance.
- **agent-selected** — documented material selected by an agent; explicitly not separately owner-approved.
- **current** — current authored/active identity or component, without a separate approval statement and/or without a repository licence.
- **candidate** — generated or authored candidate awaiting owner review. Never present it as approved.
- **sample** — fictional sample, not a product brand.

`;

const projectTable = `| Project | Group | Brand state | Artwork | Architecture |
| --- | --- | --- | ---: | --- |
${projects
  .map(
    (project) =>
      `| ${project.label} | ${project.group} | ${project.brand} | ${projectArtwork[project.key].length} | ${
        sortedArchitecture.some((entry) => entry.project === project.key)
          ? "source-verified scene"
          : "catalogue only"
      } |`,
  )
  .join("\n")}
`;

const assetRows = sortedAssets
  .map(
    (asset) =>
      `| ${projectByKey[asset.project].label} | ${categoryLabel[asset.category]} | ${asset.title} — ${asset.subtitle} | ${asset.status} | \`${asset.file}\` ${asset.width}×${asset.height} | \`${asset.source}\` | \`${asset.sourceSha.slice(0, 12)}…\` |`,
  )
  .join("\n");

const provenanceSections = sortedAssets
  .map(
    (asset) => `### ${asset.title}

- Project: ${projectByKey[asset.project].label}
- Category: ${categoryLabel[asset.category]}
- Status: ${asset.statusLabel} (\`${asset.status}\`)
- Credit: ${asset.credit}
- Source: \`${asset.source}\` (${asset.sourceKind})
- Source SHA-256: \`${asset.sourceSha}\`
- Derivative: \`${asset.file}\` (${asset.width}×${asset.height}), SHA-256 \`${asset.derivativeSha}\`
- Thumbnail: \`${asset.thumb}\`
- Intended use: ${asset.use}
- Tags: ${asset.tags.join(", ")}
- Note: ${asset.note}`,
  )
  .join("\n\n");

const gaps = `## Coverage and gaps

- Every maintained project in this catalogue has at least one source-verified architecture scene, including Pirates, which has no cleared artwork.
- **Pirates** is represented only by architecture. Its third-party source art is reference-only and is not bundled.
- **Launch Kit** has no approved brand mark. Night Signal remains a clearly labelled fictional sample.
- **LDraw** now has an original authored mark and favicon. The owner's taste approval of the final mark is not separately recorded; the record says \`current\`, not \`approved\`.
- **Protocol 11**, **SHOALSHOT**, **Fighter**, **LoftwahFM**, **Bubbles**, **Woodhouse** and **MAX** do not record a repository-wide redistribution licence. The assets are included for internal portfolio diagrams from the owner's public project repositories; that is not a redistribution licence.
- **Fighter** real-person expanded-roster portraits are excluded. Only original compact-roster characters and active promotional artwork are included.
- **Protocol 11** artpacks other than the late-night set are excluded. The included set still lacks commercial-entitlement metadata.
- **Bubbles** third-party or real-person-adjacent cast members (Miku, Pepe) are excluded. Fizz and Bubblecap are presentation-only.
- **Woodhouse** D2 diagrams are included only as a documented source reference; the MP-rejected visual treatment is not presented as approved art direction.
- Real UI captures are labeled as captures, not artwork. They are not generated and do not substitute for product identity.
- No private owner media, real signatures, credentials or secret records are included.

`;

const portfolioDoc = `# Portfolio artwork in LDraw

Generated ${CATALOGUE_DATE} by \`scripts/catalogue.mjs\`. The maintained record is \`catalogue/assets.json\`; this page and \`src/portfolio.mjs\` are generated from it. ${sortedAssets.length} local WebP assets cover ${artworkProjects.length} projects.

The library inserts the local WebP derived from the owning project. Source paths and both SHA-256 values travel with the record and into native image \`customData\`. Approval language is deliberately literal: \`approved\` is never substituted for \`documented\`, \`current\`, \`candidate\` or \`sample\`.

${statusKey}## Projects

${projectTable}

## Artwork records

| Project | Category | Artwork | Status | Derivative | Source | Source SHA-256 |
| --- | --- | --- | --- | --- | --- | --- |
${assetRows}

## Provenance records

${provenanceSections}

${gaps}## Reproduce the derivatives

\`\`\`sh
node scripts/harvest-assets.mjs --check
node scripts/harvest-assets.mjs --write
node scripts/catalogue.mjs --write
\`\`\`

The harvest command reads sibling project checkouts (or \`--repos-root\`), copies the selected source through an existing local ImageMagick or cwebp install, writes the WebP and 420 px thumbnail, and updates only dimensions and hashes. Approval, notes, credits and tags are preserved. \`--discover\` is read-only and reports tracked images that are not yet in the manifest.

`;

const architectureRows = sortedArchitecture
  .map(
    (entry) =>
      `| ${projectByKey[entry.project].label} | ${entry.title} — ${entry.summary} | ${entry.reviewedAt} | \`${entry.scene}\` | \`${entry.preview}\` | \`${entry.sourceRevision}\` |`,
  )
  .join("\n");

const architectureSections = sortedArchitecture
  .map(
    (entry) => `### ${entry.title}

- Project: ${projectByKey[entry.project].label}
- Reviewed: ${entry.reviewedAt}
- Coverage: ${entry.coverage}
- Scene: \`${entry.scene}\` (${entry.elements} elements), SHA-256 \`${entry.sceneSha256}\`
- Preview: \`${entry.preview}\` (${entry.previewWidth}×${entry.previewHeight}), SHA-256 \`${entry.previewSha256}\`
- Owning revision: \`${entry.sourceRevision}\`
- Source files: ${entry.sources.map((source) => `\`${source}\``).join(", ")}
- Facts:
${entry.facts.map((fact) => `  - ${fact}`).join("\n")}
- Renderer: ${entry.renderer}
- Human review: ${entry.humanReview}`,
  )
  .join("\n\n");

const architectureDoc = `# Loftwah architecture library

Generated ${CATALOGUE_DATE} by \`scripts/catalogue.mjs\` from \`src/architecture.mjs\` and \`catalogue/architecture.json\`. ${sortedArchitecture.length} source-verified project architecture scenes ship as native Excalidraw version 2 files with rendered PNG/SVG companions and browser previews.

The diagrams are authored from the source files named below, then rendered by LDraw's own Excalidraw renderer. They are not generated from a plausible-sounding prompt and they are not a second diagram format. Open the native scene in LDraw to edit it; the preview is only an index image.

## Coverage

| Project | Scene | Reviewed | Native scene | Preview | Source revision |
| --- | --- | --- | --- | --- | --- |
${architectureRows}

## Scene records

${architectureSections}

## Refresh and drift checks

\`\`\`sh
node scripts/architecture-build.mjs --check
node scripts/architecture-build.mjs --write
node scripts/catalogue.mjs --write
\`\`\`

\`--check\` verifies every committed scene and preview against the manifest and reports source revisions when the sibling checkouts are available. \`--write\` re-renders all scenes through the local MCP adapter and the existing renderer. A scene changes only when an authorised agent has reviewed the relevant source. A stale diagram is a content defect, not a reason to invent a new one.

## Boundaries

- These scenes describe what the maintained source and manifests actually establish. A passing renderer proves bytes and element IDs, not that an architecture is clear or true.
- Hosted private repositories are not read by the public browser. The scenes are reviewed, versioned content that ships with LDraw.
- Cross-project publication remains owned by Composer's diagram atlas and Woodhouse's portfolio edition. LDraw is the editing surface for the selected reviewed scenes; copied outputs must keep their source relationship visible.
- Physical-device and owner acceptance of every diagram remain separate gates.

`;

const publicArchitectureManifest = `${JSON.stringify(
  {
    contract: "ldraw.portfolio-architecture/1",
    app: "ldraw",
    source: "https://ldraw.loftwah.com/",
    entrypoint: "/architecture/manifest.json",
    note:
      "Reviewed native scenes. LDraw is the editing surface; consuming sites must retain the scene and source relationship when they publish an output.",
    entries: sortedArchitecture.map((entry) => ({
      id: entry.id,
      project: entry.project,
      title: entry.title,
      summary: entry.summary,
      coverage: entry.coverage,
      reviewedAt: entry.reviewedAt,
      sourceRevision: entry.sourceRevision,
      primarySourceRepo: entry.primarySourceRepo,
      sourceFiles: entry.sourceFiles,
      scene: entry.scene,
      sceneSha256: entry.sceneSha256,
      preview: entry.preview,
      previewSha256: entry.previewSha256,
      elements: entry.elements,
    })),
  },
  null,
  2,
)}
`;

const outputs = {
  "src/portfolio.mjs": generated,
  "docs/portfolio-artwork.md": portfolioDoc,
  "docs/architecture-library.md": architectureDoc,
  "public/architecture/manifest.json": publicArchitectureManifest,
};

let drift = false;
for (const [path, content] of Object.entries(outputs)) {
  const absolute = join(repoRoot, path);
  let current = null;
  try {
    current = await readFile(absolute, "utf8");
  } catch {
    current = null;
  }
  if (mode === "write") {
    await writeFile(absolute, content);
  } else if (current !== content) {
    drift = true;
    console.error(`drift: ${path} is not the generated catalogue`);
  }
}

console.log(
  JSON.stringify(
    {
      mode,
      projects: projects.length,
      assets: sortedAssets.length,
      compositions: compositions.length,
      architecture: sortedArchitecture.length,
      outputs: Object.keys(outputs),
      drift,
      next:
        mode === "write"
          ? "node scripts/harvest-assets.mjs --check && pnpm check"
          : undefined,
    },
    null,
    2,
  ),
);
if (mode === "check" && drift) process.exitCode = 1;

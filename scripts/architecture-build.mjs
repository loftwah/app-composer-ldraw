#!/usr/bin/env node
/**
 * Build the source-verified architecture catalogue through LDraw's own local
 * MCP adapter and Excalidraw renderer.
 *
 *   pnpm build
 *   node scripts/architecture-build.mjs --write
 *   node scripts/architecture-build.mjs --check
 *
 * `--write` is explicit: it authors each scene in an ignored staging area via
 * `ldraw_create_scene`, renders through `ldraw_render_scene`, writes the
 * native scene and WebP preview into `public/architecture/`, and records the
 * exact hashes, source revision and review facts in
 * `catalogue/architecture.json`. No network or new diagram engine is used.
 *
 * `--check` verifies committed bytes and element counts. Source checkouts are
 * inspected when present; `--strict-sources` turns a changed owning revision
 * into a failure. Ordinary checks stay runnable without sibling repositories.
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { access, copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { createLdrawMcp, launchScope, SERVER_VERSION } from "./mcp/server.mjs";
import { REPO_ROOT } from "./mcp/renderer.mjs";
import { architectureModels } from "../src/architecture.mjs";
import { validateScene } from "../src/scene.mjs";

const run = promisify(execFile);
const mode = process.argv.includes("--write") ? "write" : "check";
const strictSources = process.argv.includes("--strict-sources");
const rootIndex = process.argv.indexOf("--repos-root");
const reposRoot = resolve(
  rootIndex >= 0 ? process.argv[rootIndex + 1] : join(REPO_ROOT, ".."),
);
const manifestPath = join(REPO_ROOT, "catalogue", "architecture.json");
const reviewedAt = "2026-10-26";
const dockerImage = process.env.LDRAW_DOCKER_IMAGE;
const dockerChromium =
  process.env.LDRAW_DOCKER_CHROMIUM ??
  "/ms-playwright/chromium-1228/chrome-linux/chrome";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function buildSource() {
  try {
    const build = JSON.parse(
      await readFile(join(REPO_ROOT, "dist", "build.json"), "utf8"),
    );
    return build.source;
  } catch {
    return "unbuilt-local-tree";
  }
}

async function renderWithDocker(input, output, started) {
  const { stdout } = await run(
    "docker",
    [
      "run",
      "--rm",
      "--network",
      "none",
      "--user",
      `${process.getuid()}:${process.getgid()}`,
      "-e",
      "HOME=/tmp",
      "-v",
      `${REPO_ROOT}:/work`,
      "-w",
      "/work",
      "-e",
      `PLAYWRIGHT_CHROMIUM=${dockerChromium}`,
      dockerImage,
      "node",
      "scripts/render.mjs",
      input,
      output,
    ],
    { maxBuffer: 20 * 1024 * 1024, timeout: 180_000 },
  );
  const summary = JSON.parse(stdout.trim().split("\n").at(-1));
  const restored = validateScene(
    JSON.parse(await readFile(join(REPO_ROOT, output, "drawing.excalidraw"), "utf8")),
  );
  const svg = await readFile(join(REPO_ROOT, output, "drawing.svg"), "utf8");
  assert(!/(?:href|src)="https?:\/\//i.test(svg), "SVG has an external reference");
  return {
    scene: { elements: restored.elements.length },
    provenance: {
      renderer: summary.renderer,
      builtFrom: await buildSource(),
      exportPadding: 24,
      background: true,
      svgExternalReferences: 0,
      durationMs: Date.now() - started,
    },
  };
}

function webpSize(bytes) {
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  const chunk = bytes.toString("ascii", 12, 16);
  if (chunk === "VP8X")
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
    };
  if (chunk === "VP8L") {
    const b1 = bytes[21];
    const b2 = bytes[22];
    const b3 = bytes[23];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | bytes[20]),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }
  if (chunk === "VP8 ") {
    assert.equal(bytes.readUIntLE(23, 3), 0x2a019d);
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  }
  throw new Error(`Unknown WebP chunk ${chunk}`);
}

async function revision(repo, source) {
  const local = repo === "app-composer-ldraw";
  const path = local ? REPO_ROOT : join(reposRoot, repo);
  try {
    await access(path, constants.R_OK);
    const { stdout } = await run("git", ["-C", path, "rev-parse", "HEAD"]);
    return {
      repo,
      path,
      revision: stdout.trim(),
      available: true,
      source,
    };
  } catch {
    return { repo, path, revision: null, available: false, source };
  }
}

async function sourceRevisions(model) {
  const repos = [
    ...new Set(model.sources.map((source) => source.split("/")[0])),
  ];
  return Promise.all(
    repos.map((repo) =>
      revision(
        repo,
        model.sources.find((source) => source.startsWith(`${repo}/`)) ?? null,
      ),
    ),
  );
}

function sourceFile(model) {
  return model.sources.find((source) => !source.endsWith(".json")) ?? model.sources[0];
}

async function preview(tool, png, output) {
  const temp = `${output}.tmp.webp`;
  await run(
    tool,
    [
      png,
      "-strip",
      "-resize",
      "1000x1000>",
      "-quality",
      "82",
      `webp:${temp}`,
    ],
    { timeout: 90_000 },
  );
  await rename(temp, output);
}

async function convertTool() {
  for (const tool of ["magick", "convert"]) {
    try {
      await run(tool, ["-version"]);
      return tool;
    } catch {
      // Try the next local converter.
    }
  }
  throw new Error("Install ImageMagick (magick or convert) to build previews.");
}

if (mode === "check") {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const failures = [];
  const drift = [];
  for (const entry of manifest) {
    const scenePath = join(
      REPO_ROOT,
      "public",
      entry.scene.replace(/^\//, ""),
    );
    const previewPath = join(
      REPO_ROOT,
      "public",
      entry.preview.replace(/^\//, ""),
    );
    try {
      const sceneBytes = await readFile(scenePath);
      assert.equal(hash(sceneBytes), entry.sceneSha256, "scene hash");
      const scene = validateScene(JSON.parse(sceneBytes.toString()));
      assert.equal(scene.elements.length, entry.elements, "element count");
      const previewBytes = await readFile(previewPath);
      assert.equal(hash(previewBytes), entry.previewSha256, "preview hash");
      const size = webpSize(previewBytes);
      assert.equal(size.width, entry.previewWidth, "preview width");
      assert.equal(size.height, entry.previewHeight, "preview height");
    } catch (failure) {
      failures.push(`${entry.id}: ${failure.message}`);
    }
    const model = architectureModels.find((candidate) => candidate.key === entry.project);
    if (!model) {
      failures.push(`${entry.id}: no matching architecture model`);
      continue;
    }
    const revisions = await sourceRevisions(model);
    for (const source of revisions) {
      if (!source.available) continue;
      if (source.revision !== entry.sourceRevision)
        drift.push(
          `${entry.id}: ${source.repo} moved from ${entry.sourceRevision} to ${source.revision}`,
        );
    }
  }
  console.log(
    JSON.stringify(
      {
        mode,
        entries: manifest.length,
        failures,
        sourceDrift: drift,
        note: "Source drift is a review signal, not an automatic re-render. Use --strict-sources to fail on it.",
      },
      null,
      2,
    ),
  );
  process.exit(
    failures.length || (strictSources && drift.length) ? 1 : 0,
  );
}

const tool = await convertTool();
const scope = launchScope(["--workspace", REPO_ROOT]);
const server = createLdrawMcp(scope);
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "ldraw-architecture", version: SERVER_VERSION });
await server.connect(serverTransport);
await client.connect(clientTransport);

const entries = [];
try {
  for (const model of architectureModels) {
    const directory = join(REPO_ROOT, "public", "architecture", model.key);
    const staging = join(REPO_ROOT, "output", "architecture", model.key);
    const sourcePath = `output/architecture/${model.key}/source.excalidraw`;
    const renderPath = `output/architecture/${model.key}/rendered`;
    await rm(staging, { recursive: true, force: true });
    await mkdir(staging, { recursive: true });
    await mkdir(directory, { recursive: true });

    const created = await client.callTool({
      name: "ldraw_create_scene",
      arguments: {
        path: sourcePath,
        template: `arch-${model.key}`,
        x: 0,
        y: 0,
      },
    });
    if (created.isError) throw new Error(`${model.key}: ${created.content[0].text}`);
    const wrote = await client.callTool({
      name: "ldraw_modify_scene",
      arguments: {
        path: sourcePath,
        expectedRevision: created.structuredContent.revision,
        operations: [
          {
            op: "update_label",
            id: `arch-${model.key}-footer-project`,
            text: `${model.title} · source-verified ${reviewedAt} · open this scene to edit`,
            fontSize: 10,
            tone: "accent",
          },
        ],
      },
    });
    if (wrote.isError) throw new Error(`${model.key}: ${wrote.content[0].text}`);

    const rendered = dockerImage
      ? await renderWithDocker(sourcePath, renderPath, Date.now())
      : await client.callTool({
          name: "ldraw_render_scene",
          arguments: {
            path: sourcePath,
            outputDir: renderPath,
            expectedRevision: wrote.structuredContent.revision,
          },
        });
    if (rendered.isError) throw new Error(`${model.key}: ${rendered.content[0].text}`);
    const renderedResult = dockerImage
      ? rendered
      : rendered.structuredContent;

    await copyFile(
      join(REPO_ROOT, sourcePath),
      join(directory, "overview.excalidraw"),
    );
    const png = join(staging, "rendered", "drawing.png");
    const svg = join(staging, "rendered", "drawing.svg");
    await preview(tool, png, join(directory, "preview.webp"));

    const sceneBytes = await readFile(join(directory, "overview.excalidraw"));
    const previewBytes = await readFile(join(directory, "preview.webp"));
    const size = webpSize(previewBytes);
    const revisions = await sourceRevisions(model);
    const primary = revisions.find((source) => source.available);
    if (!primary)
      throw new Error(
        `${model.key}: no owning source checkout found under ${reposRoot}`,
      );
    const entry = {
      id: `${model.key}-architecture`,
      project: model.key,
      title: model.title,
      summary: model.subtitle,
      coverage: "source-verified",
      reviewedAt,
      sourceRevision: primary.revision,
      primarySourceRepo: primary.repo,
      sourceFiles: model.sources,
      sources: model.sources,
      facts: model.facts,
      scene: `/architecture/${model.key}/overview.excalidraw`,
      preview: `/architecture/${model.key}/preview.webp`,
      sceneSha256: hash(sceneBytes),
      previewSha256: hash(previewBytes),
      previewWidth: size.width,
      previewHeight: size.height,
      elements: renderedResult.scene.elements,
      renderer: renderedResult.provenance.renderer,
      render: {
        pngSha256: hash(await readFile(png)),
        svgSha256: hash(await readFile(svg)),
        builtFrom: renderedResult.provenance.builtFrom,
        durationMs: renderedResult.provenance.durationMs,
        exportPadding: renderedResult.provenance.exportPadding,
        background: renderedResult.provenance.background,
        svgExternalReferences:
          renderedResult.provenance.svgExternalReferences,
      },
      humanReview:
        "Source review performed; owner visual/taste review of the rendered composition remains pending.",
    };
    entries.push(entry);
    console.log(
      `${model.key}: ${entry.elements} elements, preview ${size.width}x${size.height}`,
    );
  }
} finally {
  await client.close();
}

const temp = `${manifestPath}.tmp`;
await writeFile(temp, `${JSON.stringify(entries, null, 2)}\n`);
await rename(temp, manifestPath);
console.log(
  JSON.stringify(
    {
      mode,
      entries: entries.length,
      reviewedAt,
      reposRoot,
      next: "node scripts/catalogue.mjs --write && pnpm check",
    },
    null,
    2,
  ),
);

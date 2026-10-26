#!/usr/bin/env node
/**
 * Build the 16:9 presentation compositions through the same local MCP
 * authoring path and Excalidraw renderer as the architecture scenes.
 *
 *   pnpm build
 *   node scripts/compositions-build.mjs --write
 *   node scripts/compositions-build.mjs --check
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { createLdrawMcp, launchScope, SERVER_VERSION } from "./mcp/server.mjs";
import { REPO_ROOT } from "./mcp/renderer.mjs";
import { compositionSpecs } from "../src/compositions.mjs";
import { validateScene } from "../src/scene.mjs";

const run = promisify(execFile);
const mode = process.argv.includes("--write") ? "write" : "check";
const manifestPath = join(REPO_ROOT, "catalogue", "compositions.json");
const reviewedAt = "2026-10-26";
const dockerImage = process.env.LDRAW_DOCKER_IMAGE;
const dockerChromium =
  process.env.LDRAW_DOCKER_CHROMIUM ??
  "/ms-playwright/chromium-1228/chrome-linux/chrome";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

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
    const b1 = bytes[21],
      b2 = bytes[22],
      b3 = bytes[23];
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
  throw new Error(`Unexpected WebP chunk ${chunk}`);
}

async function converter() {
  for (const tool of ["magick", "convert"]) {
    try {
      await run(tool, ["-version"]);
      return tool;
    } catch {
      // Try the next local tool.
    }
  }
  throw new Error("Install ImageMagick (magick or convert) to build previews.");
}

async function preview(tool, png, output) {
  await run(
    tool,
    [
      png,
      "-strip",
      "-shave",
      "48x48",
      "-resize",
      "1400x1400>",
      "-quality",
      "82",
      `webp:${output}.tmp.webp`,
    ],
    { timeout: 90_000 },
  );
  await rename(`${output}.tmp.webp`, output);
}

async function renderWithDocker(input, output) {
  const started = Date.now();
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
  return {
    elements: restored.elements.length,
    renderer: summary.renderer,
    durationMs: Date.now() - started,
  };
}

if (mode === "check") {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const failures = [];
  assert.equal(manifest.length, compositionSpecs.length);
  for (const entry of manifest) {
    try {
      const sceneBytes = await readFile(join(REPO_ROOT, "public", entry.scene.replace(/^\//, "")));
      assert.equal(hash(sceneBytes), entry.sceneSha256);
      const scene = validateScene(JSON.parse(sceneBytes.toString()));
      assert.equal(scene.elements.length, entry.elements);
      const previewBytes = await readFile(
        join(REPO_ROOT, "public", entry.preview.replace(/^\//, "")),
      );
      assert.equal(hash(previewBytes), entry.previewSha256);
      const size = webpSize(previewBytes);
      assert.equal(size.width, entry.previewWidth);
      assert.equal(size.height, entry.previewHeight);
    } catch (failure) {
      failures.push(`${entry.id}: ${failure.message}`);
    }
  }
  console.log(JSON.stringify({ mode, entries: manifest.length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
  process.exit(0);
}

const tool = await converter();
const scope = launchScope(["--workspace", REPO_ROOT]);
const server = createLdrawMcp(scope);
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "ldraw-compositions", version: SERVER_VERSION });
await server.connect(serverTransport);
await client.connect(clientTransport);

const entries = [];
try {
  for (const spec of compositionSpecs) {
    const slug = spec.id.replace(/^composition-/, "");
    const directory = join(REPO_ROOT, "public", "compositions");
    const staging = join(REPO_ROOT, "output", "compositions", slug);
    const sourcePath = `output/compositions/${slug}/source.excalidraw`;
    const renderPath = `output/compositions/${slug}/rendered`;
    await rm(staging, { recursive: true, force: true });
    await mkdir(staging, { recursive: true });
    await mkdir(directory, { recursive: true });

    const created = await client.callTool({
      name: "ldraw_create_scene",
      arguments: { path: sourcePath, template: spec.id, x: 0, y: 0 },
    });
    if (created.isError) throw new Error(`${spec.id}: ${created.content[0].text}`);
    const rendered = dockerImage
      ? await renderWithDocker(sourcePath, renderPath)
      : await client.callTool({
          name: "ldraw_render_scene",
          arguments: {
            path: sourcePath,
            outputDir: renderPath,
            expectedRevision: created.structuredContent.revision,
          },
        });
    if (rendered.isError) throw new Error(`${spec.id}: ${rendered.content[0].text}`);
    const summary = dockerImage
      ? rendered
      : {
          elements: rendered.structuredContent.scene.elements,
          renderer: rendered.structuredContent.provenance.renderer,
          durationMs: rendered.structuredContent.provenance.durationMs,
        };

    const sceneName = `${slug}.excalidraw`;
    const previewName = `${slug}.webp`;
    await copyFile(
      join(REPO_ROOT, sourcePath),
      join(directory, sceneName),
    );
    await preview(
      tool,
      join(staging, "rendered", "drawing.png"),
      join(directory, previewName),
    );
    const sceneBytes = await readFile(join(directory, sceneName));
    const previewBytes = await readFile(join(directory, previewName));
    const size = webpSize(previewBytes);
    entries.push({
      id: slug,
      project: "ldraw",
      title: spec.name,
      description: spec.description,
      scene: `/compositions/${sceneName}`,
      preview: `/compositions/${previewName}`,
      width: spec.width,
      height: spec.height,
      sceneSha256: hash(sceneBytes),
      previewSha256: hash(previewBytes),
      previewWidth: size.width,
      previewHeight: size.height,
      elements: summary.elements,
      reviewedAt,
      renderer: summary.renderer,
      durationMs: summary.durationMs,
      credit: "LDraw · authored presentation composition",
      note:
        "A local native composition authored for LDraw. It contains editable vectors and text, not a screenshot.",
      tags: ["composition", "presentation", "16:9", "template"],
      use:
        "Insert a complete 16:9 stage, then add project artwork, screenshots and your own notes.",
      status: "documented",
      statusLabel: "Authored composition",
    });
    console.log(`${slug}: ${summary.elements} elements, ${size.width}x${size.height}`);
  }
} finally {
  await client.close();
}

const temp = `${manifestPath}.tmp`;
await writeFile(temp, `${JSON.stringify(entries, null, 2)}\n`);
await rename(temp, manifestPath);
console.log(JSON.stringify({ mode, entries: entries.length }, null, 2));

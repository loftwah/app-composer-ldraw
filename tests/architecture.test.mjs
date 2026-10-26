import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import {
  architectureCatalogue,
  portfolioProjects,
} from "../src/portfolio.mjs";
import { validateScene } from "../src/scene.mjs";
import { architectureModels } from "../src/architecture.mjs";
import { librarySpecs } from "../src/diagrams.mjs";

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

test("every maintained project has a source-verified native architecture scene", () => {
  assert.equal(architectureCatalogue.length, 18);
  assert.equal(architectureModels.length, 18);
  const projects = new Set(portfolioProjects.map((project) => project.key));
  const seen = new Set();
  for (const entry of architectureCatalogue) {
    assert(projects.has(entry.project), entry.project);
    assert(!seen.has(entry.project), `duplicate ${entry.project}`);
    seen.add(entry.project);
    assert.equal(entry.coverage, "source-verified");
    assert.match(entry.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(entry.sourceRevision, /^[a-f0-9]{40}$/);
    assert.ok(entry.facts.length >= 3, `${entry.id} facts`);
    assert.ok(entry.sources.length >= 3, `${entry.id} sources`);
    assert.ok(entry.elements >= 40, `${entry.id} is too thin`);
    for (const path of [entry.scene, entry.preview]) {
      assert(existsSync(`public${path}`), `public${path}`);
    }
    const sceneBytes = readFileSync(`public${entry.scene}`);
    assert.equal(
      createHash("sha256").update(sceneBytes).digest("hex"),
      entry.sceneSha256,
      `${entry.id} scene hash`,
    );
    const scene = validateScene(JSON.parse(sceneBytes.toString()));
    assert.equal(scene.elements.length, entry.elements);
    const ids = new Set();
    for (const element of scene.elements) {
      assert(!ids.has(element.id), `duplicate element ${element.id}`);
      ids.add(element.id);
      assert(!/^https?:/.test(element.link ?? ""), "no remote element links");
      assert.equal(element.groupIds.length > 0, false);
    }
    const previewBytes = readFileSync(`public${entry.preview}`);
    assert.equal(
      createHash("sha256").update(previewBytes).digest("hex"),
      entry.previewSha256,
      `${entry.id} preview hash`,
    );
    const size = webpSize(previewBytes);
    assert.equal(size.width, entry.previewWidth);
    assert.equal(size.height, entry.previewHeight);
    assert.equal(entry.humanReview.includes("owner"), true);
  }
  assert.deepEqual([...seen].sort(), [...projects].sort());
});

test("architecture blocks are source data, not a second library copy", () => {
  const architectureBlocks = librarySpecs.filter(
    (item) => item.collection === "architecture",
  );
  assert.equal(architectureBlocks.length, architectureModels.length);
  for (const block of architectureBlocks) {
    assert.equal(block.native, false);
    assert.equal(block.width, 1120);
    assert.ok(block.elements.length >= 40);
    assert(block.elements.some((element) => element.type === "arrow"));
    assert(block.elements.some((element) => element.type === "text"));
    for (const element of block.elements) {
      assert.equal(Number.isFinite(element.x), true);
      assert.equal(Number.isFinite(element.y), true);
    }
  }
});

test("the public cross-project handoff manifest matches the bundled scenes", () => {
  const manifest = JSON.parse(
    readFileSync("public/architecture/manifest.json", "utf8"),
  );
  assert.equal(manifest.contract, "ldraw.portfolio-architecture/1");
  assert.equal(manifest.entries.length, architectureCatalogue.length);
  for (const entry of manifest.entries) {
    const bundled = architectureCatalogue.find((item) => item.id === entry.id);
    assert(bundled, entry.id);
    assert.equal(entry.scene, bundled.scene);
    assert.equal(entry.sceneSha256, bundled.sceneSha256);
    assert.match(entry.sourceRevision, /^[a-f0-9]{40}$/);
    assert(!("private" in entry));
  }
});

test("diagrams are not screenshots: every scene keeps real text and arrows", () => {
  for (const entry of architectureCatalogue) {
    const scene = validateScene(
      JSON.parse(readFileSync(`public${entry.scene}`, "utf8")),
    );
    const text = scene.elements.filter((element) => element.type === "text");
    const arrows = scene.elements.filter((element) => element.type === "arrow");
    assert.ok(text.length >= 15, `${entry.id} text`);
    assert.ok(arrows.length >= 6, `${entry.id} arrows`);
    assert(
      text.some((element) => element.text.includes("SOURCE-VERIFIED")),
      `${entry.id} coverage badge`,
    );
  }
});

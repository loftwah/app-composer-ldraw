import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { portfolioCompositions } from "../src/portfolio.mjs";
import { compositionSpecs } from "../src/compositions.mjs";
import { librarySpecs } from "../src/diagrams.mjs";
import { validateScene } from "../src/scene.mjs";

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

test("three reusable 16:9 compositions ship as editable native scenes", () => {
  assert.equal(portfolioCompositions.length, 3);
  assert.equal(compositionSpecs.length, 3);
  for (const entry of portfolioCompositions) {
    assert.equal(entry.project, "ldraw");
    for (const path of [entry.scene, entry.preview])
      assert(existsSync(`public${path}`), path);
    const sceneBytes = readFileSync(`public${entry.scene}`);
    assert.equal(
      createHash("sha256").update(sceneBytes).digest("hex"),
      entry.sceneSha256,
    );
    const scene = validateScene(JSON.parse(sceneBytes.toString()));
    assert.equal(scene.elements.length, entry.elements);
    const ids = new Set();
    for (const element of scene.elements) {
      assert(!ids.has(element.id), `duplicate ${element.id}`);
      ids.add(element.id);
    }
    const background = scene.elements.find(
      (element) => element.customData?.ldrawPresentation,
    );
    assert(background, "16:9 presentation marker");
    assert.equal(background.width, 1920);
    assert.equal(background.height, 1080);
    const preview = readFileSync(`public${entry.preview}`);
    assert.equal(
      createHash("sha256").update(preview).digest("hex"),
      entry.previewSha256,
    );
    const size = webpSize(preview);
    assert.equal(size.width / size.height, 1400 / 788);
    assert.equal(entry.width, 1920);
    assert.equal(entry.height, 1080);
  }
});

test("compositions are authored data, not a second renderer or image library", () => {
  for (const spec of compositionSpecs) {
    assert.equal(spec.composition, true);
    assert.equal(spec.native, false);
    assert.ok(spec.elements.length >= 10);
    assert(spec.elements.some((element) => element.type === "text"));
    assert(!spec.elements.some((element) => element.type === "image"));
    const inLibrary = librarySpecs.find((entry) => entry.id === spec.id);
    assert(inLibrary, `${spec.id} must remain available to the MCP adapter`);
    assert.equal(inLibrary.elements.length, spec.elements.length);
  }
});

test("the application template marker requests a true 16:9 export", () => {
  for (const entry of portfolioCompositions) {
    const scene = validateScene(
      JSON.parse(readFileSync(`public${entry.scene}`, "utf8")),
    );
    assert(
      scene.elements.some(
        (element) => element.customData?.ldrawAspect === "16:9",
      ),
    );
  }
});

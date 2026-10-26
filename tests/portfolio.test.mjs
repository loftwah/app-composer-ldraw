import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { artworkProjects, portfolioArtwork } from "../src/portfolio.mjs";

function webpSize(bytes) {
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  const chunk = bytes.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    const width = 1 + bytes.readUIntLE(24, 3),
      height = 1 + bytes.readUIntLE(27, 3);
    return { width, height };
  }
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
  throw new Error(`Unknown WebP chunk ${chunk}`);
}

test("portfolio artwork has local, hashed, correctly sized image bytes", () => {
  assert(portfolioArtwork.length >= 20);
  const ids = new Set();
  for (const item of portfolioArtwork) {
    assert(!ids.has(item.id), `duplicate ${item.id}`);
    ids.add(item.id);
    assert(item.title && item.subtitle && item.credit, item.id);
    assert(item.file.startsWith("/portfolio/"), item.id);
    assert(!/^https?:/.test(item.file), item.id);
    assert(!/^https?:/.test(item.source), item.id);
    const path = `public${item.file}`;
    assert(existsSync(path), path);
    const bytes = readFileSync(path);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      item.derivativeSha,
      `${item.id} derivative hash`,
    );
    const size = webpSize(bytes);
    assert.equal(size.width, item.width, `${item.id} width`);
    assert.equal(size.height, item.height, `${item.id} height`);
    assert.match(item.sourceSha, /^[a-f0-9]{64}$/);
    assert.match(item.derivativeSha, /^[a-f0-9]{64}$/);
    assert(
      ["approved", "qualified", "documented", "agent-selected", "current", "sample"].includes(
        item.status,
      ),
      item.id,
    );
  }
});

test("every named portfolio project has real artwork, with gaps expressed as status", () => {
  const projects = new Set(portfolioArtwork.map((item) => item.project));
  for (const project of [
    "composer",
    "paperwork",
    "hello",
    "herethere",
    "linkcheck",
    "carry",
    "linkarooie",
    "bubbles",
    "shoalshot",
    "fighter",
    "loftwahfm",
    "protocol11",
    "woodhouse",
    "assethunter",
    "launchkit",
  ])
    assert(projects.has(project), project);
  assert.deepEqual(
    artworkProjects.map((project) => project.key).sort(),
    [...projects].sort(),
  );
  const statuses = new Set(portfolioArtwork.map((item) => item.status));
  assert(statuses.has("approved"));
  assert(statuses.has("qualified"));
  assert(statuses.has("documented"));
  assert(statuses.has("sample"));
  // Launch Kit's only visual is explicitly a fictional sample, never a brand.
  const launch = portfolioArtwork.filter((item) => item.project === "launchkit");
  assert(launch.length);
  assert(launch.every((item) => item.status === "sample"));
  assert(launch.every((item) => /fictional|not a Launch Kit/i.test(item.note)));
});

test("provenance records the strongest documented claim without upgrading it", () => {
  const byId = Object.fromEntries(portfolioArtwork.map((item) => [item.id, item]));
  assert.equal(byId["app-composer-mark"].status, "approved");
  assert.match(byId["app-composer-mark"].note, /Owner|approved/i);
  assert.equal(byId["linkarooie-curator"].status, "qualified");
  assert.match(byId["linkarooie-curator"].note, /8\/10/);
  assert.equal(byId["paperwork-press"].status, "agent-selected");
  assert.match(byId["paperwork-press"].note, /not separately owner-approved/i);
  assert.equal(byId["bubbles-icon"].status, "approved");
  assert.match(byId["bubbles-icon"].note, /No repository licence/i);
  assert.equal(byId["fighter-poster"].status, "current");
  assert.match(byId["fighter-poster"].note, /not the same as documented MP art acceptance/i);
  assert.equal(byId["protocol11-table"].status, "documented");
  assert.match(byId["protocol11-table"].note, /MP subjective art acceptance/i);
});

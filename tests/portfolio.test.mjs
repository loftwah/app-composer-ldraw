import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import {
  architectureCatalogue,
  artworkByProject,
  artworkCategories,
  artworkProjects,
  libraryStats,
  portfolioArtwork,
  portfolioProjects,
} from "../src/portfolio.mjs";

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

const categories = new Set([
  "logo",
  "icon",
  "character",
  "mascot",
  "screenshot",
  "ui",
  "background",
  "diagram",
  "component",
  "illustration",
  "template",
]);
const statuses = new Set([
  "approved",
  "qualified",
  "documented",
  "agent-selected",
  "current",
  "candidate",
  "sample",
]);

test("the portfolio library is substantial, local, searchable and hashed", () => {
  assert.ok(portfolioArtwork.length >= 90, "keep the expanded collection");
  assert.equal(libraryStats.projects, 18);
  assert.equal(libraryStats.architecture, 18);
  const ids = new Set();
  for (const item of portfolioArtwork) {
    assert(!ids.has(item.id), `duplicate ${item.id}`);
    ids.add(item.id);
    assert(item.title && item.subtitle && item.credit && item.note, item.id);
    assert(item.use && item.use.length > 10, `${item.id} needs intended use`);
    assert(Array.isArray(item.tags) && item.tags.length, `${item.id} tags`);
    assert(categories.has(item.category), `${item.id} category`);
    assert(statuses.has(item.status), `${item.id} status`);
    assert(item.file.startsWith("/portfolio/"), item.id);
    assert(item.thumb.startsWith("/portfolio/thumbs/"), item.id);
    assert(!/^https?:/.test(item.file), item.id);
    assert(!/^https?:/.test(item.source), item.id);
    for (const path of [item.file, item.thumb]) {
      const file = `public${path}`;
      assert(existsSync(file), file);
      const bytes = readFileSync(file);
      assert.equal(bytes.toString("ascii", 0, 4), "RIFF", file);
    }
    const bytes = readFileSync(`public${item.file}`);
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
  }
});

test("all maintained projects are discoverable, including architecture-only work", () => {
  const expected = [
    "composer",
    "ldraw",
    "paperwork",
    "herethere",
    "linkarooie",
    "linkcheck",
    "carry",
    "hello",
    "launchkit",
    "assethunter",
    "max",
    "protocol11",
    "bubbles",
    "shoalshot",
    "fighter",
    "pirates",
    "loftwahfm",
    "woodhouse",
  ];
  assert.deepEqual(
    portfolioProjects.map((project) => project.key),
    expected,
  );
  assert.deepEqual(
    artworkProjects.map((project) => project.key),
    expected,
    "project rail includes every project",
  );
  for (const project of expected)
    assert.ok(
      artworkByProject[project].length ||
        architectureCatalogue.some((entry) => entry.project === project),
      `${project} must have artwork or architecture`,
    );
  // Pirates has no cleared third-party art, but its system model is present.
  assert.equal(artworkByProject.pirates.length, 0);
  assert(
    architectureCatalogue.some((entry) => entry.project === "pirates"),
  );
});

test("categories and statuses are broad enough for the real collection", () => {
  for (const category of [
    "logo",
    "icon",
    "character",
    "mascot",
    "screenshot",
    "ui",
    "background",
    "component",
    "illustration",
    "template",
  ])
    assert(
      artworkCategories.some((entry) => entry.key === category),
      category,
    );
  const found = new Set(portfolioArtwork.map((item) => item.status));
  for (const status of [
    "approved",
    "qualified",
    "documented",
    "agent-selected",
    "current",
    "sample",
  ])
    assert(found.has(status), status);
  const launch = portfolioArtwork.filter(
    (item) => item.project === "launchkit",
  );
  assert(launch.length >= 3);
  const launchVisuals = launch.filter((item) => item.category !== "screenshot");
  assert(launchVisuals.length >= 3);
  assert(launchVisuals.every((item) => item.status === "sample"));
  assert(
    launchVisuals.every((item) => /fictional|not a Launch Kit/i.test(item.note)),
  );
  assert.equal(
    launch.find((item) => item.id === "launchkit-editor").status,
    "documented",
  );
});

test("provenance records the strongest documented claim without upgrading it", () => {
  const byId = Object.fromEntries(
    portfolioArtwork.map((item) => [item.id, item]),
  );
  assert.equal(byId["composer-mark"].status, "approved");
  assert.match(byId["composer-mark"].note, /Owner|approved/i);
  assert.equal(byId["linkarooie-curator"].status, "qualified");
  assert.match(byId["linkarooie-curator"].note, /8\/10/);
  assert.equal(byId["paperwork-press"].status, "agent-selected");
  assert.match(byId["paperwork-press"].note, /not separately owner-approved/i);
  assert.equal(byId["bubbles-icon"].status, "approved");
  assert.match(byId["bubbles-icon"].note, /No repository licence/i);
  assert.equal(byId["fighter-duo"].status, "current");
  assert.match(
    byId["fighter-duo"].note,
    /not the same as documented MP art acceptance/i,
  );
  assert.equal(byId["protocol11-table"].status, "documented");
  assert.match(
    byId["protocol11-table"].note,
    /MP subjective art acceptance/i,
  );
  assert.equal(byId["ldraw-mark"].status, "current");
  assert.match(byId["ldraw-mark"].note, /not copied from Death Note/i);
  assert.equal(byId["max-mark"].status, "current");
  assert.match(byId["max-mark"].note, /owner taste approval is not claimed/i);
});

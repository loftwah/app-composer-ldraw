import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assetEntries,
  categoriesFor,
  entryKey,
  filterEntries,
  projectGroupsFor,
  pushRecent,
  statusTone,
} from "../src/library.mjs";

test("the browser can search by project, character, name and intended use", () => {
  const fizz = filterEntries(assetEntries, { query: "fizz mascot" });
  assert(fizz.some((entry) => entry.id === "bubbles-fizz"));
  const protocol = filterEntries(assetEntries, { query: "protocol 11 table" });
  assert(protocol.some((entry) => entry.project === "protocol11"));
  const presentation = filterEntries(assetEntries, { query: "presentation" });
  assert(presentation.length >= 5);
  const screenshot = filterEntries(assetEntries, { query: "screenshot", category: "screenshot" });
  assert(screenshot.length >= 8);
  const none = filterEntries(assetEntries, { query: "no-such-asset-xyz" });
  assert.equal(none.length, 0);
});

test("projects and categories remain the primary filters", () => {
  const bubbles = filterEntries(assetEntries, { project: "bubbles" });
  assert.ok(bubbles.length >= 10);
  assert(bubbles.every((entry) => entry.project === "bubbles"));
  const mascots = filterEntries(assetEntries, { category: "mascot" });
  assert.ok(mascots.length >= 3);
  assert(mascots.every((entry) => entry.category === "mascot"));
  const groups = projectGroupsFor(assetEntries);
  assert.deepEqual(
    groups.map((group) => group.group),
    ["Apps", "Games", "Music", "Portfolio"],
  );
  assert.equal(
    groups.reduce((total, group) => total + group.projects.length, 0),
    18,
  );
  const categories = categoriesFor(assetEntries);
  assert.ok(categories.some((category) => category.key === "screenshot"));
  assert.ok(categories.some((category) => category.key === "mascot"));
});

test("favourites and recents use stable keys without mixing namespaces", () => {
  const fizz = assetEntries.find((entry) => entry.id === "bubbles-fizz");
  const composer = assetEntries.find((entry) => entry.id === "composer-mark");
  assert.equal(entryKey(fizz), "artwork:bubbles-fizz");
  assert.equal(entryKey(composer), "artwork:composer-mark");
  assert.equal(
    entryKey({ id: "composer-architecture", project: "composer", scene: "x" }),
    "diagram:composer-architecture",
  );
  assert.equal(entryKey({ id: "apps-composer" }), "block:apps-composer");
  const favourites = new Set([entryKey(fizz)]);
  const only = filterEntries(assetEntries, {
    project: "favourites",
    favouriteIds: favourites,
  });
  assert.deepEqual(
    only.map((entry) => entry.id),
    ["bubbles-fizz"],
  );
  const recent = pushRecent(
    [entryKey(composer), entryKey(fizz)],
    entryKey(fizz),
  );
  assert.deepEqual(recent, [entryKey(fizz), entryKey(composer)]);
  const recentOnly = filterEntries(assetEntries, {
    project: "recent",
    recentIds: recent,
  });
  assert.deepEqual(
    recentOnly.map((entry) => entry.id),
    ["bubbles-fizz", "composer-mark"],
  );
});

test("status tone stays honest for candidates and qualified assets", () => {
  assert.equal(statusTone("approved"), "good");
  assert.equal(statusTone("qualified"), "qualified");
  assert.equal(statusTone("documented"), "documented");
  assert.equal(statusTone("candidate"), "candidate");
  assert.equal(statusTone("sample"), "sample");
});

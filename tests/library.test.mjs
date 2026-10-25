import { test } from "node:test";
import assert from "node:assert/strict";
import {
  apps,
  buildPreset,
  collections,
  INK,
  librarySpecs,
} from "../src/diagrams.mjs";

const allowed = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "arrow",
  "line",
  "text",
]);

test("built-in library covers every declared collection with stable ids", () => {
  const collectionIds = new Set(collections.map((item) => item.id));
  assert.equal(collectionIds.size, collections.length);
  const itemIds = new Set();
  const elementIds = new Set();
  for (const item of librarySpecs) {
    assert.ok(collectionIds.has(item.collection), item.id);
    assert.ok(item.name && item.description, item.id);
    assert.ok(!itemIds.has(item.id), `duplicate item ${item.id}`);
    itemIds.add(item.id);
    assert.ok(item.elements.length >= 2, `${item.id} needs a real block`);
    for (const element of item.elements) {
      assert.ok(element.id, `${item.id} has an element without an id`);
      assert.ok(
        !elementIds.has(element.id),
        `duplicate element id ${element.id}`,
      );
      elementIds.add(element.id);
      assert.ok(allowed.has(element.type), element.type);
      assert.ok(Number.isFinite(element.x) && Number.isFinite(element.y));
      assert.ok(!["image", "embeddable", "iframe"].includes(element.type));
      if (element.type === "text")
        assert.ok(element.text.trim(), `${element.id} has empty text`);
    }
  }
  for (const collection of collections)
    assert.ok(
      librarySpecs.some((item) => item.collection === collection.id),
      `${collection.id} is empty`,
    );
});

test("library carries the maintained app identities and a generic template surface", () => {
  const names = librarySpecs.map((item) => item.name);
  for (const name of [
    "App Composer",
    "LDraw",
    "Paperwork",
    "Linkarooie",
    "Guestbook",
    "Showcase",
    "Link Check",
    "Launch Kit",
    "Browser frame",
    "Phone frame",
    "Before / after",
    "Launch checklist",
  ])
    assert.ok(names.includes(name), name);
  assert.equal(apps.length, 8);
  for (const app of apps) {
    const item = librarySpecs.find((entry) => entry.name === app.title);
    assert.ok(item, app.title);
    const card = item.elements.find((element) => element.type === "rectangle");
    assert.ok(card.backgroundColor && card.backgroundColor !== "transparent");
    const title = item.elements.find(
      (element) => element.type === "text" && element.text === app.title,
    );
    assert.equal(
      title.strokeColor,
      INK,
      `${app.title} text must stay readable`,
    );
  }
});

test("every starting example builds editable vector content", () => {
  for (const name of [
    "portfolio",
    "journey",
    "architecture",
    "game",
    "release",
    "beforeAfter",
  ]) {
    const light = buildPreset(name, "composer", INK);
    const dark = buildPreset(name, "composer", "#F4F4F5");
    assert.ok(light.length > 8, `${name} is too thin`);
    assert.equal(light.length, dark.length);
    assert.ok(
      light.some((element) => element.type === "text"),
      `${name} needs readable text`,
    );
    assert.ok(
      light.some((element) => element.type === "rectangle"),
      `${name} needs real shapes`,
    );
    const ids = new Set();
    for (const element of light) {
      assert.ok(!ids.has(element.id), `duplicate id ${element.id} in ${name}`);
      ids.add(element.id);
      assert.ok(!["image", "embeddable", "iframe"].includes(element.type));
    }
  }
});

test("preset ink follows the canvas instead of baking a light-only title", () => {
  const light = buildPreset("journey", "composer", INK);
  const dark = buildPreset("journey", "composer", "#F4F4F5");
  const title = (elements) =>
    elements.find((element) => element.id === "preset-title").strokeColor;
  assert.equal(title(light), INK);
  assert.equal(title(dark), "#F4F4F5");
});

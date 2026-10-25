import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_ELEMENTS, validateScene } from "../src/scene.mjs";
import {
  measureText,
  metricsProvenance,
  unsupportedCharacters,
} from "../scripts/mcp/metrics.mjs";
import {
  applyOperations,
  buildSceneFromTemplate,
  summariseScene,
  templateNames,
} from "../scripts/mcp/native.mjs";
import { librarySpecs, presetBuilders } from "../src/diagrams.mjs";

const elementIds = (scene) => scene.elements.map((element) => element.id);

test("measured font table covers the documented Latin set exactly", () => {
  const provenance = metricsProvenance();
  assert.equal(provenance.font, "Excalifont");
  assert.equal(provenance.engine, "@excalidraw/excalidraw@0.18.1");
  assert.equal(provenance.sampleSize, 100);
  assert.ok(provenance.characters >= 95);
  assert.equal(provenance.worstSampleErrorPx, 0);
  for (let code = 32; code <= 126; code += 1)
    assert.deepEqual(unsupportedCharacters(String.fromCharCode(code)), []);
  assert.equal(measureText("App Composer architecture", 20).width, 259.97);
  const single = measureText("App Composer architecture", 20).width;
  const doubled = measureText("App Composer architecture", 40).width;
  assert.ok(Math.abs(doubled - single * 2) <= 0.02, "advances scale linearly");
  assert.equal(measureText("Two\nlines", 16).height, 40);
  assert.equal(measureText("Two\nlines", 16).lines, 2);
  assert.equal(
    measureText("Two\nlines", 16).width,
    Math.max(measureText("Two", 16).width, measureText("lines", 16).width),
  );
  assert.throws(
    () => measureText("Deploy \u{1F680}", 16),
    /Unsupported characters/,
  );
  assert.throws(() => measureText("ok", 4), /between 8 and 96/);
});

test("authored presets and blocks materialise as valid native scenes with stable ids", () => {
  assert.deepEqual(templateNames().presets, Object.keys(presetBuilders).sort());
  assert.equal(templateNames().blocks.length, librarySpecs.length);
  for (const template of [
    ...templateNames().presets,
    ...templateNames().blocks,
  ]) {
    const first = buildSceneFromTemplate({ template });
    const second = buildSceneFromTemplate({ template });
    const valid = validateScene(first.scene);
    assert.equal(valid.elements.length, first.scene.elements.length);
    assert.deepEqual(elementIds(first.scene), elementIds(second.scene));
    assert.deepEqual(
      first.scene,
      second.scene,
      `${template} must be deterministic`,
    );
    assert.ok(first.scene.elements.length >= 2, template);
    for (const element of first.scene.elements) {
      assert.ok(
        Number.isFinite(element.width) && element.width >= 0,
        `${element.id} width`,
      );
      assert.ok(
        Number.isFinite(element.height) && element.height >= 0,
        `${element.id} height`,
      );
      assert.ok(
        element.width > 0 || element.height > 0,
        `${element.id} has no size`,
      );
      assert.equal(element.angle, 0);
      assert.equal(element.isDeleted, false);
      assert.deepEqual(element.groupIds, []);
      if (element.type === "text") {
        assert.equal(element.fontFamily, 5);
        assert.equal(element.originalText, element.text);
        assert.equal(element.lineHeight, 1.25);
        assert.equal(element.autoResize, true);
      }
    }
  }
  assert.throws(
    () => buildSceneFromTemplate({ template: "not-a-template" }),
    /ldraw_list_templates/,
  );
});

test("chip labels become real editable text with measured bounds", () => {
  const scene = buildSceneFromTemplate({ template: "composer-pipeline" }).scene;
  const labels = scene.elements.filter((element) => element.type === "text");
  assert.deepEqual(
    labels.map((element) => element.text),
    [
      "Brief",
      "Setup",
      "Init",
      "Agent",
      "Deploy",
      "Owner intent stays separate from agent implementation.",
    ],
  );
  const brief = labels[0];
  const chip = scene.elements.find(
    (element) => element.id === "composer-pipeline-1",
  );
  assert.equal(brief.id, "composer-pipeline-1-label");
  assert.ok(brief.x > chip.x && brief.x < chip.x + chip.width);
  assert.ok(brief.y > chip.y && brief.y < chip.y + chip.height);
  assert.equal(brief.width, measureText("Brief", 15).width);
  assert.equal(brief.strokeColor, "#1D2330");
});

test("theme ink follows the requested canvas while brand colours stay approved", () => {
  const light = buildSceneFromTemplate({
    template: "journey",
    ink: "#1D2330",
  }).scene;
  const dark = buildSceneFromTemplate({
    template: "journey",
    ink: "#F4F4F5",
  }).scene;
  const title = (scene) =>
    scene.elements.find((element) => element.id === "preset-title");
  assert.equal(title(light).strokeColor, "#1D2330");
  assert.equal(title(dark).strokeColor, "#F4F4F5");
  const composer = buildSceneFromTemplate({ template: "apps-composer" }).scene;
  const card = composer.elements.find(
    (element) => element.type === "rectangle",
  );
  assert.equal(card.strokeColor, "#FC5B05");
  const infrastructure = buildSceneFromTemplate({
    template: "apps-guestbook",
  }).scene;
  assert.equal(
    infrastructure.elements.find((element) => element.type === "rectangle")
      .strokeColor,
    "#1E40AF",
  );
});

test("bounded edits preserve existing ids and re-measure only changed text", () => {
  const original = buildSceneFromTemplate({
    template: "composer-pipeline",
  }).scene;
  const before = elementIds(original);
  const originalFirstText = original.elements.find(
    (element) => element.type === "text",
  );
  const applied = applyOperations(original, [
    {
      op: "add_label",
      id: "architecture-title",
      text: "App Composer architecture",
      x: 80,
      y: 40,
      fontSize: 32,
    },
    {
      op: "add_label",
      id: "architecture-note",
      text: "Local-first",
      x: 80,
      y: 86,
      fontSize: 16,
      tone: "muted",
    },
    {
      op: "insert_block",
      block: "composer-review",
      idPrefix: "review",
      x: 80,
      y: 180,
    },
    { op: "update_label", id: originalFirstText.id, text: "Brief and intent" },
  ]);
  const next = validateScene(applied.scene);
  for (const id of before)
    assert.ok(elementIds(next).includes(id), `lost ${id}`);
  assert.deepEqual(applied.updated, [originalFirstText.id]);
  assert.ok(applied.added.includes("architecture-title"));
  assert.ok(applied.added.includes("review-composer-review-agent"));
  const updated = next.elements.find(
    (element) => element.id === originalFirstText.id,
  );
  assert.equal(updated.text, "Brief and intent");
  assert.equal(updated.version, originalFirstText.version + 1);
  assert.equal(updated.originalText, "Brief and intent");
  assert.equal(updated.width, measureText("Brief and intent", 15).width);
  assert.equal(
    next.elements.find((element) => element.id === "architecture-note")
      .strokeColor,
    "#6B645C",
  );
  // The input scene is untouched: edits apply to a clone.
  assert.equal(
    original.elements.find((element) => element.id === originalFirstText.id)
      .text,
    "Brief",
  );
});

test("unsafe or colliding edits are refused before anything changes", () => {
  const scene = buildSceneFromTemplate({ template: "composer-pipeline" }).scene;
  const snapshot = structuredClone(scene);
  assert.throws(
    () =>
      applyOperations(scene, [
        {
          op: "insert_block",
          block: "composer-review",
          idPrefix: "review",
          x: 0,
          y: 0,
        },
        {
          op: "insert_block",
          block: "composer-review",
          idPrefix: "review",
          x: 400,
          y: 0,
        },
      ]),
    /already exists/,
  );
  assert.throws(
    () =>
      applyOperations(scene, [
        { op: "add_label", id: "composer-pipeline-1", text: "x", x: 0, y: 0 },
      ]),
    /already exists/,
  );
  assert.throws(
    () =>
      applyOperations(scene, [
        { op: "update_label", id: "composer-pipeline-1", text: "x" },
      ]),
    /Only text labels/,
  );
  assert.throws(
    () =>
      applyOperations(scene, [
        { op: "add_label", id: "Bad Id", text: "x", x: 0, y: 0 },
      ]),
    /stable id/,
  );
  assert.throws(
    () =>
      applyOperations(scene, [
        { op: "add_label", id: "emoji", text: "ship \u{1F680}", x: 0, y: 0 },
      ]),
    /Unsupported characters/,
  );
  assert.throws(
    () =>
      applyOperations(scene, [
        {
          op: "insert_block",
          block: "missing-block",
          idPrefix: "x",
          x: 0,
          y: 0,
        },
      ]),
    /existing library block/,
  );
  assert.deepEqual(scene, snapshot);
});

test("scene summaries stay bounded and never include image bytes", () => {
  const scene = buildSceneFromTemplate({ template: "architecture" }).scene;
  const summary = summariseScene(scene, "sha256:" + "a".repeat(64), {
    limit: 3,
  });
  assert.equal(summary.elements, scene.elements.length);
  assert.equal(summary.valid, true);
  assert.equal(summary.elementSummaries.length, 3);
  assert.equal(summary.truncated, true);
  assert.equal(JSON.stringify(summary).includes("data:image"), false);
  assert.ok(summary.byType.rectangle > 0);
  assert.ok(scene.elements.length <= MAX_ELEMENTS);
});

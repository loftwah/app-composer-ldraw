import { test } from "node:test";
import assert from "node:assert/strict";
import { validateScene, nextDraft, recoverDraft } from "../src/scene.mjs";

const element = {
  id: "human-edit",
  type: "text",
  x: 3,
  y: 4,
  width: 100,
  height: 30,
  angle: 0,
  text: "Keep my words",
  version: 8,
  versionNonce: 42,
  groupIds: ["group"],
  customData: { author: "fictional" },
};
const scene = {
  type: "excalidraw",
  version: 2,
  source: "local",
  elements: [element],
  appState: { viewBackgroundColor: "#fff" },
  files: {},
};
test("native scene preserves IDs, human changes, grouping and metadata", () => {
  assert.deepEqual(validateScene(JSON.stringify(scene)), scene);
});
test("native embedded images survive validation", () => {
  const image = { ...element, id: "image", type: "image", fileId: "pixel" };
  const files = {
    pixel: {
      id: "pixel",
      mimeType: "image/png",
      dataURL: "data:image/png;base64,aGVsbG8=",
      created: 10,
    },
  };
  assert.deepEqual(
    validateScene({ ...scene, elements: [image], files }).files,
    files,
  );
});
test("rejects unbounded or hostile input while leaving original unchanged", () => {
  for (const mutation of [
    { elements: [element, element] },
    { elements: [{ ...element, x: Infinity }] },
    { elements: [{ ...element, type: "embeddable" }] },
    { elements: [{ ...element, link: "javascript:alert(1)" }] },
    { elements: [{ ...element, type: "image", fileId: "missing" }] },
    { files: { x: { id: "x", dataURL: "https://untrusted.invalid/a.png" } } },
    { version: 1 },
    {
      elements: Array.from({ length: 5001 }, (_, i) => ({
        ...element,
        id: String(i),
      })),
    },
  ])
    assert.throws(() => validateScene({ ...scene, ...mutation }));
  assert.equal(scene.elements[0].text, "Keep my words");
});
test("stale tab saves cannot overwrite newer local work", () => {
  const first = nextDraft(null, 0, scene);
  const changed = {
    ...scene,
    elements: [{ ...element, text: "Human revision" }],
  };
  const next = nextDraft(first, 1, changed);
  assert.throws(() => nextDraft(next, 1, scene), /Another tab/);
  assert.deepEqual(next.previous, scene);
  assert.equal(next.scene.elements[0].text, "Human revision");
});
test("damaged latest save recovers previous snapshot and reports it", () => {
  assert.deepEqual(recoverDraft({ scene: {}, previous: scene, revision: 9 }), {
    scene,
    revision: 9,
    recovered: true,
  });
  assert.throws(
    () => recoverDraft({ scene: {}, previous: null, revision: 9 }),
    /could not be read/,
  );
  assert.equal(recoverDraft(null).revision, 0);
  const repaired = nextDraft(
    { scene: {}, previous: scene, revision: 9 },
    9,
    scene,
  );
  assert.deepEqual(
    repaired.previous,
    scene,
    "Recovery retains a valid fallback after the next save",
  );
});

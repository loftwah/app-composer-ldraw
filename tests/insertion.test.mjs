import { test } from "node:test";
import assert from "node:assert/strict";
import {
  boundsOf,
  centerElements,
  fitSize,
  maxArtworkSize,
  placeNearViewport,
  remapScene,
  sceneElementsForAdd,
  viewportCenter,
} from "../src/insertion.mjs";

const appState = {
  width: 1200,
  height: 800,
  scrollX: -200,
  scrollY: -100,
  zoom: { value: 2 },
};

test("viewport placement uses the real Excalidraw scene coordinate formula", () => {
  assert.deepEqual(viewportCenter(appState), { x: 500, y: 300 });
  const elements = [
    { id: "a", x: 10, y: 20, width: 100, height: 40, isDeleted: false },
    { id: "b", x: 140, y: 80, width: 60, height: 60, isDeleted: false },
  ];
  assert.deepEqual(boundsOf(elements), {
    left: 10,
    top: 20,
    width: 190,
    height: 120,
  });
  const placed = centerElements(elements, appState);
  const bounds = boundsOf(placed);
  assert.equal(bounds.left + bounds.width / 2, 500);
  assert.equal(bounds.top + bounds.height / 2, 300);
  assert.deepEqual(
    placed.map((element) => [element.x, element.y]),
    [
      [405, 240],
      [535, 300],
    ],
  );
});

test("new artwork avoids the existing drawing instead of covering it", () => {
  const existing = [
    { id: "existing", x: 0, y: 0, width: 1000, height: 700, isDeleted: false },
  ];
  const artwork = [
    { id: "new", x: 0, y: 0, width: 300, height: 300, isDeleted: false },
  ];
  const placed = placeNearViewport(artwork, appState, existing);
  const rect = placed[0];
  assert.ok(rect.x >= 1036, "place to the right when the centre is occupied");
  assert.ok(
    !(rect.x < 1000 && rect.x + rect.width > 0 && rect.y < 700 && rect.y + rect.height > 0),
    "must not overlap the existing drawing",
  );
  const empty = placeNearViewport(artwork, appState, []);
  assert.equal(empty[0].x + empty[0].width / 2, 500);
  assert.equal(empty[0].y + empty[0].height / 2, 300);
});

test("artwork sizes stay useful without gigantic inserts", () => {
  assert.deepEqual(fitSize(2000, 1000, 600, 400), {
    width: 600,
    height: 300,
  });
  assert.deepEqual(fitSize(200, 100, 600, 400), { width: 200, height: 100 });
  assert.deepEqual(maxArtworkSize("logo"), { width: 320, height: 320 });
  assert.deepEqual(maxArtworkSize("screenshot"), {
    width: 660,
    height: 460,
  });
});

test("additive scenes remap every identifier and image key together", () => {
  const scene = {
    type: "excalidraw",
    version: 2,
    elements: [
      {
        id: "rect",
        type: "rectangle",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        groupIds: ["group"],
        frameId: "frame",
        boundElements: [{ id: "text", type: "text" }],
        isDeleted: false,
      },
      {
        id: "text",
        type: "text",
        x: 10,
        y: 10,
        width: 50,
        height: 20,
        groupIds: ["group"],
        frameId: "frame",
        containerId: "rect",
        isDeleted: false,
      },
      {
        id: "image",
        type: "image",
        x: 0,
        y: 0,
        width: 20,
        height: 20,
        fileId: "file",
        groupIds: [],
        frameId: null,
        isDeleted: false,
      },
      {
        id: "arrow",
        type: "arrow",
        x: 0,
        y: 0,
        width: 20,
        height: 20,
        points: [
          [0, 0],
          [20, 20],
        ],
        startBinding: { elementId: "rect", focus: 0, gap: 1 },
        endBinding: { elementId: "frame", focus: 0, gap: 1 },
        groupIds: [],
        frameId: null,
        isDeleted: false,
      },
      {
        id: "frame",
        type: "frame",
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        groupIds: [],
        frameId: null,
        isDeleted: false,
      },
    ],
    files: { file: { id: "file", dataURL: "data:image/png;base64,AA==" } },
  };
  const copy = remapScene(scene, "copy-");
  assert.deepEqual(
    copy.elements.map((element) => element.id),
    ["copy-rect", "copy-text", "copy-image", "copy-arrow", "copy-frame"],
  );
  assert.deepEqual(copy.elements[0].groupIds, ["copy-group"]);
  assert.equal(copy.elements[0].frameId, "copy-frame");
  assert.deepEqual(copy.elements[0].boundElements, [
    { id: "copy-text", type: "text" },
  ]);
  assert.equal(copy.elements[1].containerId, "copy-rect");
  assert.equal(copy.elements[2].fileId, "copy-file");
  assert.equal(copy.files["copy-file"].id, "copy-file");
  assert.equal(copy.elements[3].startBinding.elementId, "copy-rect");
  assert.equal(copy.elements[3].endBinding.elementId, "copy-frame");
  // The source scene stays untouched.
  assert.equal(scene.elements[0].id, "rect");
  assert.equal(scene.files.file.id, "file");
});

test("adding a native diagram centres a remapped copy in the viewport", () => {
  const scene = {
    type: "excalidraw",
    version: 2,
    elements: [
      {
        id: "arch-rect",
        type: "rectangle",
        x: 100,
        y: 200,
        width: 400,
        height: 200,
        groupIds: [],
        frameId: null,
        isDeleted: false,
      },
    ],
    files: {},
  };
  const copy = sceneElementsForAdd(scene, appState, "copy-");
  const bounds = boundsOf(copy.elements);
  assert.equal(copy.elements[0].id, "copy-arch-rect");
  assert.equal(bounds.left + bounds.width / 2, 500);
  assert.equal(bounds.top + bounds.height / 2, 300);
});

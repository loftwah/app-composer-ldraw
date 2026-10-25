/**
 * One native scene contract: turn the existing authored diagram skeletons in
 * `src/diagrams.mjs` into real Excalidraw version 2 elements, and apply
 * bounded label/block edits to an existing native scene.
 *
 * This is not a second schema or editor. It fills the standard native fields
 * that the browser editor normally adds through `convertToExcalidrawElements`
 * (seeds, versions, empty group/frame/binding arrays) and measures text with
 * the pinned font table, so `validateScene()` from `src/scene.mjs` accepts the
 * result and the real renderer opens it unchanged.
 *
 * Element IDs are preserved exactly, except for inserted blocks where the
 * caller supplies a stable prefix so a second insert cannot collide.
 */
import {
  buildPreset,
  INK,
  librarySpecs,
  MUTED,
  ORANGE,
  presetBuilders,
} from "../../src/diagrams.mjs";
import { validateScene } from "../../src/scene.mjs";
import {
  FONT_FAMILY,
  LINE_HEIGHT,
  measureText,
  TextRefusal,
} from "./metrics.mjs";

/** Fixed authored timestamp keeps byte output reproducible across runs. */
export const AUTHORED_AT = 1_761_350_400_000;
export const TONES = { ink: INK, muted: MUTED, accent: ORANGE };
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

export class SceneRefusal extends Error {}

function stableSeed(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash % 2147483647;
}

const round = (value) => Math.round(value * 100) / 100;

function baseElement(skeleton, geometry) {
  const id = skeleton.id;
  return {
    id,
    type: skeleton.type,
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
    angle: 0,
    strokeColor: skeleton.strokeColor ?? INK,
    backgroundColor: skeleton.backgroundColor ?? "transparent",
    fillStyle: skeleton.fillStyle ?? "solid",
    strokeWidth: skeleton.strokeWidth ?? 2,
    strokeStyle: skeleton.strokeStyle ?? "solid",
    roughness: skeleton.roughness ?? 0,
    opacity: skeleton.opacity ?? 100,
    groupIds: [],
    frameId: null,
    roundness: skeleton.roundness ?? null,
    seed: stableSeed(id),
    version: 1,
    versionNonce: stableSeed(`${id}:version`),
    isDeleted: false,
    boundElements: null,
    updated: AUTHORED_AT,
    link: null,
    locked: false,
  };
}

export function toTextElement({ id, text, x, y, fontSize = 16, color = INK }) {
  const size = measureText(text, fontSize);
  return {
    ...baseElement(
      { id, type: "text", strokeColor: color },
      { x: round(x), y: round(y), width: size.width, height: size.height },
    ),
    text,
    fontSize,
    fontFamily: FONT_FAMILY,
    textAlign: "left",
    verticalAlign: "top",
    containerId: null,
    originalText: text,
    lineHeight: LINE_HEIGHT,
    autoResize: true,
  };
}

/**
 * Convert authored skeletons into native elements. `label` is the existing
 * diagrams.mjs way of naming a chip, so it becomes a real editable text
 * element centred on that chip rather than an invented binding.
 */
export function materialise(
  skeletons,
  { idPrefix, offsetX = 0, offsetY = 0, warnings = [] } = {},
) {
  const elements = [];
  for (const skeleton of skeletons) {
    const { label, ...rest } = skeleton;
    const id = idPrefix ? `${idPrefix}-${rest.id}` : rest.id;
    const x = (rest.x ?? 0) + offsetX;
    const y = (rest.y ?? 0) + offsetY;
    const geometry = {
      x: round(x),
      y: round(y),
      width: rest.width ?? 0,
      height: rest.height ?? 0,
    };
    if (rest.type === "text") {
      const text = label?.text ?? rest.text;
      if (typeof text !== "string" || !text.trim())
        throw new SceneRefusal("Every authored text element needs a label.");
      elements.push(
        toTextElement({
          id,
          text,
          x,
          y,
          fontSize: rest.fontSize ?? 16,
          color: rest.strokeColor ?? INK,
        }),
      );
    } else {
      const handled = new Set([
        "id",
        "type",
        "x",
        "y",
        "width",
        "height",
        "text",
        "label",
        "fontSize",
        "fontFamily",
        "strokeColor",
        "backgroundColor",
        "fillStyle",
        "strokeWidth",
        "strokeStyle",
        "roughness",
        "opacity",
        "roundness",
      ]);
      const extra = Object.fromEntries(
        Object.entries(rest).filter(([key]) => !handled.has(key)),
      );
      elements.push({ ...baseElement({ ...rest, id }, geometry), ...extra });
    }
    if (label && rest.type !== "text") {
      const fontSize = label.fontSize ?? 15;
      const size = measureText(label.text, fontSize);
      if (size.width > geometry.width - 16)
        warnings.push(
          `Label "${label.text}" is wider than block element ${id}; it may overflow its card.`,
        );
      elements.push(
        toTextElement({
          id: `${id}-label`,
          text: label.text,
          x: geometry.x + (geometry.width - size.width) / 2,
          y: geometry.y + (geometry.height - size.height) / 2,
          fontSize,
          color: label.strokeColor ?? INK,
        }),
      );
    }
  }
  return elements;
}

export function newScene(elements) {
  return validateScene({
    type: "excalidraw",
    version: 2,
    source: "ldraw-mcp",
    elements,
    appState: { viewBackgroundColor: "#ffffff" },
    files: {},
  });
}

export function templateNames() {
  return {
    presets: Object.keys(presetBuilders).sort(),
    blocks: librarySpecs.map((item) => item.id),
  };
}

function boundsOf(elements) {
  return {
    left: Math.min(...elements.map((element) => element.x)),
    top: Math.min(...elements.map((element) => element.y)),
  };
}

/**
 * `x`/`y` place the template's top-left corner. Block and preset authors
 * already use absolute coordinates, so this is one translation, never a
 * re-layout.
 */
export function buildSceneFromTemplate({
  template,
  project = "composer",
  ink = INK,
  idPrefix,
  x = 0,
  y = 0,
}) {
  const warnings = [];
  const presets = presetBuilders;
  const skeletons = Object.hasOwn(presets, template)
    ? buildPreset(template, project, ink)
    : librarySpecs.find((item) => item.id === template)?.elements;
  if (!skeletons)
    throw new SceneRefusal(
      "Choose a preset or library block from ldraw_list_templates.",
    );
  const bounds = boundsOf(skeletons);
  const scene = newScene(
    materialise(skeletons, {
      idPrefix,
      offsetX: x - bounds.left,
      offsetY: y - bounds.top,
      warnings,
    }),
  );
  const base = Object.hasOwn(presets, template)
    ? { kind: "preset", id: template, project }
    : {
        kind: "block",
        id: template,
        collection: librarySpecs.find((item) => item.id === template)
          .collection,
      };
  return { scene, template: { ...base, x, y }, warnings };
}

export function sceneHasElement(scene, id) {
  return scene.elements.some((element) => element.id === id);
}

function blockBounds(elements) {
  const left = Math.min(...elements.map((element) => element.x));
  const top = Math.min(...elements.map((element) => element.y));
  return { left, top };
}

/** Bounded edits. Every operation is applied to a clone before one write. */
export function applyOperations(input, operations) {
  const scene = validateScene(structuredClone(input));
  const added = [];
  const updated = [];
  const warnings = [];
  for (const operation of operations) {
    if (operation.op === "insert_block") {
      const block = librarySpecs.find((item) => item.id === operation.block);
      if (!block)
        throw new SceneRefusal("Choose an existing library block id.");
      if (!ID_PATTERN.test(operation.idPrefix ?? ""))
        throw new SceneRefusal(
          "idPrefix must be a short lower-case slug such as composer-review.",
        );
      const skeletons = block.elements;
      const bounds = blockBounds(skeletons);
      const inserted = materialise(skeletons, {
        idPrefix: operation.idPrefix,
        offsetX: operation.x - bounds.left,
        offsetY: operation.y - bounds.top,
        warnings,
      });
      for (const element of inserted) {
        if (sceneHasElement(scene, element.id))
          throw new SceneRefusal(
            `Element id ${element.id} already exists. Choose a different idPrefix; nothing was written.`,
          );
        scene.elements.push(element);
        added.push(element.id);
      }
    } else if (operation.op === "add_label") {
      if (!ID_PATTERN.test(operation.id ?? ""))
        throw new SceneRefusal(
          "Give each label a stable id such as owner-boundary.",
        );
      if (sceneHasElement(scene, operation.id))
        throw new SceneRefusal(`Element id ${operation.id} already exists.`);
      const element = toTextElement({
        id: operation.id,
        text: operation.text,
        x: operation.x,
        y: operation.y,
        fontSize: operation.fontSize ?? 16,
        color: TONES[operation.tone ?? "ink"],
      });
      scene.elements.push(element);
      added.push(element.id);
    } else if (operation.op === "update_label") {
      const element = scene.elements.find((entry) => entry.id === operation.id);
      if (!element)
        throw new SceneRefusal(
          `No element has id ${operation.id}. Nothing was written.`,
        );
      if (element.type !== "text")
        throw new SceneRefusal("Only text labels can be updated by id.");
      if (element.isDeleted)
        throw new SceneRefusal("That label is deleted in the current scene.");
      const next = toTextElement({
        id: element.id,
        text: operation.text,
        x: element.x,
        y: element.y,
        fontSize: operation.fontSize ?? element.fontSize,
        color: TONES[operation.tone ?? "ink"],
      });
      Object.assign(element, {
        ...next,
        version: element.version + 1,
        versionNonce: stableSeed(`${element.id}:${element.version + 1}`),
      });
      updated.push(element.id);
    } else {
      throw new SceneRefusal("Unsupported scene operation.");
    }
  }
  return { scene: validateScene(scene), added, updated, warnings };
}

export function summariseScene(scene, revision, { limit = 400 } = {}) {
  const counts = {};
  for (const element of scene.elements)
    counts[element.type] = (counts[element.type] ?? 0) + 1;
  const elements = scene.elements.slice(0, limit).map((element) => ({
    id: element.id,
    type: element.type,
    ...(element.type === "text" ? { text: element.text.slice(0, 160) } : {}),
    ...(element.isDeleted ? { isDeleted: true } : {}),
  }));
  return {
    revision,
    valid: true,
    elements: scene.elements.length,
    images: Object.keys(scene.files ?? {}).length,
    imageIds: Object.keys(scene.files ?? {}),
    byType: counts,
    truncated: scene.elements.length > limit,
    elementSummaries: elements,
  };
}

export { TextRefusal };

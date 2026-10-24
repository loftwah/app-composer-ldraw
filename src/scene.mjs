export const MAX_SCENE_BYTES = 20 * 1024 * 1024;
export const MAX_ELEMENTS = 5000;
const types = new Set([
  "rectangle",
  "diamond",
  "ellipse",
  "line",
  "arrow",
  "freedraw",
  "text",
  "image",
  "frame",
  "magicframe",
]);

/** Validate bounds without reconstructing elements or losing native metadata. */
export function validateScene(input) {
  const raw = typeof input === "string" ? input : JSON.stringify(input);
  if (new TextEncoder().encode(raw).length > MAX_SCENE_BYTES)
    throw new Error("Drawing exceeds the 20 MB local import limit.");
  const scene =
    typeof input === "string" ? JSON.parse(input) : structuredClone(input);
  if (
    !scene ||
    scene.type !== "excalidraw" ||
    scene.version !== 2 ||
    !Array.isArray(scene.elements)
  )
    throw new Error("Choose a native Excalidraw version 2 drawing.");
  if (scene.elements.length > MAX_ELEMENTS)
    throw new Error("Drawing exceeds the 5,000 element local limit.");
  const ids = new Set();
  const files = scene.files ?? {};
  if (!files || typeof files !== "object" || Array.isArray(files))
    throw new Error("Invalid drawing image files.");
  for (const [id, file] of Object.entries(files)) {
    if (
      !file ||
      file.id !== id ||
      typeof file.dataURL !== "string" ||
      !/^data:image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml);base64,[a-zA-Z0-9+/=\s]+$/.test(
        file.dataURL,
      )
    )
      throw new Error(
        "Drawing images must be embedded image data. Remote images are unavailable.",
      );
  }
  for (const element of scene.elements) {
    if (
      !element ||
      typeof element.id !== "string" ||
      !element.id ||
      ids.has(element.id) ||
      !types.has(element.type)
    )
      throw new Error(
        "Drawing contains duplicate IDs or unsupported elements. Web embeds are unavailable.",
      );
    ids.add(element.id);
    for (const key of ["x", "y", "width", "height", "angle"]) {
      if (
        typeof element[key] !== "number" ||
        !Number.isFinite(element[key]) ||
        Math.abs(element[key]) > 1e8
      )
        throw new Error("Drawing contains invalid geometry.");
    }
    if (element.link && !/^(https?:\/\/|mailto:|#)/i.test(element.link))
      throw new Error("Drawing contains an unsupported link.");
    if (
      element.type === "image" &&
      !element.isDeleted &&
      element.fileId &&
      !files[element.fileId]
    )
      throw new Error("An image is missing its embedded file.");
  }
  if (
    scene.appState != null &&
    (typeof scene.appState !== "object" || Array.isArray(scene.appState))
  )
    throw new Error("Invalid drawing settings.");
  return scene;
}

export function nextDraft(current, expectedRevision, scene) {
  if ((current?.revision ?? 0) !== expectedRevision)
    throw new Error(
      "Another tab saved a newer drawing. Download this drawing before reloading.",
    );
  return {
    revision: expectedRevision + 1,
    savedAt: new Date().toISOString(),
    scene: validateScene(scene),
    previous: current?.scene ?? null,
  };
}

export function recoverDraft(record) {
  if (!record) return { scene: null, revision: 0, recovered: false };
  try {
    return {
      scene: validateScene(record.scene),
      revision: record.revision,
      recovered: false,
    };
  } catch {
    if (record.previous)
      return {
        scene: validateScene(record.previous),
        revision: record.revision,
        recovered: true,
      };
    throw new Error(
      "The browser draft could not be read. Open your downloaded .excalidraw file to recover it.",
    );
  }
}

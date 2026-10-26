/**
 * Scene geometry and portable ID remapping for library insertion.
 *
 * The caller still uses Excalidraw's own `convertToExcalidrawElements` and
 * `api.addFiles`; this module only calculates predictable placement and makes
 * a safe copy of an existing native scene when the visitor chooses
 * "Add to canvas" instead of replacing the drawing.
 */

export function fitSize(width, height, maxWidth, maxHeight = Infinity) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function maxArtworkSize(category) {
  if (["logo", "icon", "component"].includes(category))
    return { width: 320, height: 320 };
  if (["mascot", "character"].includes(category))
    return { width: 440, height: 440 };
  if (["screenshot", "ui"].includes(category))
    return { width: 660, height: 460 };
  if (category === "background") return { width: 760, height: 500 };
  return { width: 560, height: 440 };
}

export function viewportCenter(appState) {
  const zoom = appState?.zoom?.value || 1;
  return {
    x: (appState?.width ?? 0) / (2 * zoom) - (appState?.scrollX ?? 0),
    y: (appState?.height ?? 0) / (2 * zoom) - (appState?.scrollY ?? 0),
  };
}

export function boundsOf(elements) {
  const visible = elements.filter((element) => !element.isDeleted);
  if (!visible.length) return { left: 0, top: 0, width: 0, height: 0 };
  const left = Math.min(...visible.map((element) => element.x));
  const top = Math.min(...visible.map((element) => element.y));
  const right = Math.max(...visible.map((element) => element.x + element.width));
  const bottom = Math.max(
    ...visible.map((element) => element.y + element.height),
  );
  return { left, top, width: right - left, height: bottom - top };
}

/** Translate every element by a scene-space delta without changing IDs. */
export function translateElements(elements, dx, dy) {
  return elements.map((element) => ({
    ...element,
    x: element.x + dx,
    y: element.y + dy,
  }));
}

/** Place a group's visual centre at the current viewport centre. */
export function centerElements(elements, appState) {
  const bounds = boundsOf(elements);
  const center = viewportCenter(appState);
  return translateElements(
    elements,
    center.x - (bounds.left + bounds.width / 2),
    center.y - (bounds.top + bounds.height / 2),
  );
}

/**
 * Copy a native scene for additive insertion. IDs, group IDs, frame IDs,
 * text containers, bindings and image file IDs are remapped together so a
 * second copy cannot collide with the drawing that is already open.
 */
export function remapScene(scene, prefix) {
  const elements = scene.elements ?? [];
  const idMap = new Map(
    elements.map((element) => [element.id, `${prefix}${element.id}`]),
  );
  for (const groupId of new Set(
    elements.flatMap((element) => element.groupIds ?? []),
  ))
    idMap.set(groupId, `${prefix}${groupId}`);
  const fileMap = new Map(
    Object.keys(scene.files ?? {}).map((key) => [key, `${prefix}${key}`]),
  );
  const remap = (value, map = idMap) =>
    value && map.has(value) ? map.get(value) : value;
  const next = structuredClone(scene);
  next.elements = elements.map((element) => {
    const copy = { ...element };
    copy.id = remap(copy.id);
    if (copy.fileId) copy.fileId = remap(copy.fileId, fileMap);
    if (Array.isArray(copy.groupIds))
      copy.groupIds = copy.groupIds.map((id) => remap(id));
    if (copy.frameId) copy.frameId = remap(copy.frameId);
    if (copy.containerId) copy.containerId = remap(copy.containerId);
    if (Array.isArray(copy.boundElements))
      copy.boundElements = copy.boundElements.map((binding) => ({
        ...binding,
        id: remap(binding.id),
      }));
    for (const key of ["startBinding", "endBinding"]) {
      if (copy[key])
        copy[key] = {
          ...copy[key],
          elementId: remap(copy[key].elementId),
        };
    }
    return copy;
  });
  next.files = Object.fromEntries(
    Object.entries(scene.files ?? {}).map(([key, file]) => {
      const id = remap(key, fileMap);
      return [id, { ...file, id }];
    }),
  );
  return next;
}

export function sceneElementsForAdd(scene, appState, prefix) {
  const copy = remapScene(scene, prefix);
  const placed = centerElements(copy.elements, appState);
  return {
    ...copy,
    elements: placed,
    appState: { ...copy.appState, viewBackgroundColor: "#ffffff" },
  };
}


function overlaps(a, b, margin = 20) {
  return !(
    a.left + a.width + margin <= b.left ||
    b.left + b.width + margin <= a.left ||
    a.top + a.height + margin <= b.top ||
    b.top + b.height + margin <= a.top
  );
}

/**
 * Prefer the viewport centre, then try a small set of adjacent positions so a
 * new mascot or screenshot does not land on top of the drawing that is already
 * there. If the visible area is genuinely full, place to the right of the
 * existing content and let the editor fit the result. This is deliberately not
 * an append-to-bottom rule.
 */
export function placeNearViewport(elements, appState, existing = []) {
  const visible = existing.filter((element) => !element.isDeleted);
  const size = boundsOf(elements);
  const center = viewportCenter(appState);
  const zoom = appState?.zoom?.value || 1;
  const viewport = {
    left: -appState.scrollX,
    top: -appState.scrollY,
    width: (appState.width || 0) / zoom,
    height: (appState.height || 0) / zoom,
  };
  const gap = 36;
  if (!visible.length) return centerElements(elements, appState);
  const existingBounds = boundsOf(visible);
  const right = existingBounds.left + existingBounds.width;
  const bottom = existingBounds.top + existingBounds.height;
  const centered = {
    left: center.x - size.width / 2,
    top: center.y - size.height / 2,
    width: size.width,
    height: size.height,
  };
  const viewportRight = viewport.left + viewport.width;
  const viewportBottom = viewport.top + viewport.height;
  const candidates = [
    centered,
    {
      left: viewportRight - size.width - 24,
      top: viewport.top + 24,
      width: size.width,
      height: size.height,
    },
    {
      left: viewport.left + 24,
      top: viewport.top + 24,
      width: size.width,
      height: size.height,
    },
    {
      left: viewportRight - size.width - 24,
      top: viewportBottom - size.height - 24,
      width: size.width,
      height: size.height,
    },
    {
      left: viewport.left + 24,
      top: viewportBottom - size.height - 24,
      width: size.width,
      height: size.height,
    },
    {
      left: right + gap,
      top: center.y - size.height / 2,
      width: size.width,
      height: size.height,
    },
    {
      left: existingBounds.left - gap - size.width,
      top: center.y - size.height / 2,
      width: size.width,
      height: size.height,
    },
    {
      left: center.x - size.width / 2,
      top: bottom + gap,
      width: size.width,
      height: size.height,
    },
    {
      left: center.x - size.width / 2,
      top: existingBounds.top - gap - size.height,
      width: size.width,
      height: size.height,
    },
    {
      left: viewport.left + 24,
      top: center.y - size.height / 2,
      width: size.width,
      height: size.height,
    },
    {
      left: center.x - size.width / 2,
      top: bottom + gap,
      width: size.width,
      height: size.height,
    },
    {
      left: center.x - size.width / 2,
      top: viewport.top + viewport.height - size.height - 24,
      width: size.width,
      height: size.height,
    },
  ];
  const box = (element) => ({
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
  });
  const occupied = visible.map(box);
  const chosen =
    candidates.find((candidate) =>
      occupied.every((area) => !overlaps(candidate, area)),
    ) ?? {
      left: right + gap,
      top: center.y - size.height / 2,
      width: size.width,
      height: size.height,
    };
  return translateElements(elements, chosen.left - size.left, chosen.top - size.top);
}

/** Whether the whole group is currently inside the scene viewport. */
export function isFullyVisible(elements, appState) {
  const bounds = boundsOf(elements);
  const zoom = appState?.zoom?.value || 1;
  const left = -appState.scrollX;
  const top = -appState.scrollY;
  const right = left + appState.width / zoom;
  const bottom = top + appState.height / zoom;
  return (
    bounds.left >= left &&
    bounds.top >= top &&
    bounds.left + bounds.width <= right &&
    bounds.top + bounds.height <= bottom
  );
}

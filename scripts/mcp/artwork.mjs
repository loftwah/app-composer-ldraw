import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { portfolioArtwork } from "../../src/portfolio.mjs";
import { SceneRefusal } from "./native.mjs";

const reviewedIds = new Set([
  "composer-mark",
  "bubbles-icon",
  "bubbles-fizz",
  "loftwahfm-logo",
  "idea-to-software",
  "tabler-browser",
  "tabler-cloud",
  "tabler-database",
  "tabler-device-gamepad-2",
  "tabler-device-mobile",
  "tabler-git-pull-request",
  "tabler-list-check",
  "tabler-photo",
  "tabler-rocket",
  "tabler-server",
  "tabler-shield-lock",
  "tabler-webhook",
]);
const reviewed = new Map(
  portfolioArtwork
    .filter((item) => reviewedIds.has(item.id))
    .map((item) => [item.id, item]),
);

export function agentArtworkCatalogue() {
  return [...reviewed.values()].map(({ id, title, project, status, credit, note, use, derivativeSha }) => ({
    id, title, project, status, credit, note, use, derivativeSha,
  }));
}

export async function loadAgentArtwork(id) {
  const item = reviewed.get(id);
  if (!item)
    throw new SceneRefusal("Choose a reviewed artwork ID from ldraw_list_templates.");
  if (!/^\/portfolio\/[a-z0-9-]+\.webp$/.test(item.file))
    throw new SceneRefusal("The artwork is outside the bundled image path.");
  let bytes;
  try {
    bytes = await readFile(new URL(`../../public${item.file}`, import.meta.url));
  } catch {
    throw new SceneRefusal("The bundled artwork is unavailable. Restore the reviewed LDraw checkout.");
  }
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== item.derivativeSha)
    throw new SceneRefusal("The bundled artwork does not match its catalogue hash.");
  return { item, dataURL: `data:image/webp;base64,${bytes.toString("base64")}` };
}

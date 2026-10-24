import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
import { validateScene } from "../src/scene.mjs";
import { withBrowser, sceneAndExports } from "./browser.mjs";

const [input, destination] = process.argv.slice(2);
if (!input || !destination)
  throw new Error(
    "Usage: pnpm render drawing.excalidraw output/drawing (requires built assets and installed Playwright Chromium)",
  );
const scene = validateScene(await readFile(input, "utf8"));
const directory = resolve(destination);
await mkdir(directory, { recursive: true });
await withBrowser(async ({ page }) => {
  await page.evaluate(async (scene) => {
    const { revision } = window.ldraw.readScene();
    await window.ldraw.replaceScene(scene, { expectedRevision: revision });
  }, scene);
  const result = await sceneAndExports(page);
  for (const element of scene.elements)
    assert.ok(
      result.scene.elements.some((next) => next.id === element.id),
      `Element ID lost: ${element.id}`,
    );
  for (const [key, file] of Object.entries(scene.files ?? {}))
    assert.equal(
      result.scene.files[key]?.dataURL,
      file.dataURL,
      "Embedded image changed",
    );
  await Promise.all([
    writeFile(
      join(directory, "drawing.excalidraw"),
      JSON.stringify(result.scene, null, 2),
    ),
    writeFile(
      join(directory, "drawing.png"),
      Buffer.from(result.png, "base64"),
    ),
    writeFile(
      join(directory, "drawing.svg"),
      Buffer.from(result.svg, "base64"),
    ),
  ]);
  console.log(
    JSON.stringify({
      output: directory,
      elements: result.scene.elements.length,
      renderer: "@excalidraw/excalidraw@0.18.1",
      temporaryResources: "removed on exit",
    }),
  );
});

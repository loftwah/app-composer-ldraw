import { readFile } from "node:fs/promises";
import { validateScene } from "../src/scene.mjs";
const [command, file] = process.argv.slice(2);
if (command !== "validate" || !file)
  throw new Error("Usage: pnpm scene validate drawing.excalidraw");
const scene = validateScene(await readFile(file, "utf8"));
console.log(
  JSON.stringify({
    valid: true,
    elements: scene.elements.length,
    images: Object.keys(scene.files ?? {}).length,
  }),
);

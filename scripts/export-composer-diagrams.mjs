import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  composerMaps,
  composerMapSource,
  composerPageDecisionId,
} from "../src/composer-maps.mjs";
import { librarySpecs } from "../src/diagrams.mjs";
import { architectureCatalogue } from "../src/portfolio.mjs";
import { validateScene } from "../src/scene.mjs";
import { sceneAndExports, withBrowser } from "./browser.mjs";
import { buildSceneFromTemplate } from "./mcp/native.mjs";

const root = "output/app-composer-diagrams";
const composer = [...composerMaps.map(({ id }) => id), composerPageDecisionId];

const rows = [
  "# App Composer engineering diagrams",
  "",
  "Open an editable original in LDraw, or use the matching PNG or SVG in a document or presentation.",
  "",
  "App Composer connects a creator’s intent to the work needed to make and run an owned product. It brings together briefs, a chosen agent, reusable capabilities, creative tools and release evidence. The person decides the outcome. The project keeps its source, data and release boundary.",
  "",
  "Start with **What App Composer is for**. Its final row is product direction. Use the engineering diagrams to inspect the supported handoffs, permissions and verification steps.",
  "",
  "## Composer diagrams",
  "",
  `Reviewed Composer source: [${composerMapSource.slice(0, 7)}](https://github.com/loftwah/app-composer/tree/${composerMapSource}).`,
  "",
];

await mkdir(join(root, "composer"), { recursive: true });
await mkdir(join(root, "related-projects"), { recursive: true });
function indexLine(title, path, note) {
  return `- **${title}** · [Editable](${path}.excalidraw) · [PNG](${path}.png) · [SVG](${path}.svg) — ${note}`;
}

await withBrowser(async ({ page }) => {
  async function saveDiagram(file, source) {
    const scene = validateScene(source);
    await page.evaluate(async (drawing) => {
      const { revision } = window.ldraw.readScene();
      await window.ldraw.replaceScene(drawing, { expectedRevision: revision });
    }, scene);
    const rendered = await sceneAndExports(page);
    const exported = new Map(
      rendered.scene.elements.map((element) => [element.id, element]),
    );
    for (const element of scene.elements) {
      assert(exported.has(element.id), `Lost element ${element.id} in ${file}`);
      assert.equal(exported.get(element.id).link, element.link);
    }
    await Promise.all([
      writeFile(join(root, file + ".excalidraw"), source),
      writeFile(join(root, file + ".png"), Buffer.from(rendered.png, "base64")),
      writeFile(join(root, file + ".svg"), Buffer.from(rendered.svg, "base64")),
    ]);
  }
  for (const id of composer) {
    const block = librarySpecs.find((item) => item.id === id);
    const { scene, warnings } = buildSceneFromTemplate({ template: id });
    assert.deepEqual(warnings, [], id);
    const path = "composer/" + id;
    await saveDiagram(path, JSON.stringify(scene, null, 2) + "\n");
    rows.push(indexLine(block.name, path, block.description));
  }

  rows.push(
    "",
    "## Related project architecture",
    "",
    "Each diagram records the project source revision it was reviewed against.",
    "",
  );
  for (const entry of architectureCatalogue) {
    const path = "related-projects/" + entry.id;
    const source = await readFile(join("public", entry.scene.slice(1)), "utf8");
    await saveDiagram(path, source);
    rows.push(
      indexLine(
        entry.title,
        path,
        `Reviewed ${entry.sourceRevision.slice(0, 7)}. ${entry.summary}`,
      ),
    );
  }
});

rows.push(
  "",
  "The [Composer diagram atlas](https://composer.loftwah.com/diagrams) also keeps its committed Get Ready, approval, environment and contribution diagrams in Composer’s `public/diagrams/ldraw/`.",
  "",
);
await writeFile(join(root, "README.md"), rows.join("\n"));
console.log(
  `Exported ${composer.length} Composer diagrams and ${architectureCatalogue.length} project architecture diagrams to ${root}.`,
);

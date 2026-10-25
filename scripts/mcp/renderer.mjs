/**
 * Render an already validated native scene through the existing local
 * Playwright/Excalidraw pipeline (scripts/browser.mjs) and return the exact
 * native scene Excalidraw restored plus real PNG and SVG bytes.
 *
 * Writes nothing itself: the caller owns the authorised workspace and writes
 * the outputs atomically. No remote URL, server dependency or image service is
 * involved. A missing build or browser fails loudly instead of faking output.
 */
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateScene } from "../../src/scene.mjs";
import { sceneAndExports, withBrowser } from "../browser.mjs";

export const REPO_ROOT = resolve(
  fileURLToPath(new URL("../..", import.meta.url)),
);
export const ENGINE = "@excalidraw/excalidraw@0.18.1";
const DEFAULT_TIMEOUT_MS = 120_000;

export class RenderRefusal extends Error {}

async function buildProvenance() {
  try {
    await access(join(REPO_ROOT, "dist", "index.html"));
    await access(join(REPO_ROOT, "dist", "_headers"));
    return JSON.parse(
      await readFile(join(REPO_ROOT, "dist", "build.json"), "utf8"),
    );
  } catch {
    throw new RenderRefusal(
      "Rendering needs the built local app. Run pnpm build in the LDraw repository, then retry. No scene file was changed.",
    );
  }
}

/**
 * @returns {{scene: unknown, png: string, svg: string, provenance: object}}
 */
export async function renderScene(
  sceneInput,
  { timeoutMs = DEFAULT_TIMEOUT_MS } = {},
) {
  const scene = validateScene(sceneInput);
  if (!scene.elements.some((element) => !element.isDeleted))
    throw new RenderRefusal("Add something to the drawing before rendering.");
  const build = await buildProvenance();
  const started = Date.now();
  const result = await withBrowser(
    async ({ page, context }) => {
      const timer = setTimeout(() => {
        void context.close().catch(() => {});
      }, timeoutMs);
      try {
        await page.evaluate(async (input) => {
          const { revision } = window.ldraw.readScene();
          await window.ldraw.replaceScene(input, {
            expectedRevision: revision,
          });
        }, scene);
        const rendered = await sceneAndExports(page);
        for (const element of scene.elements)
          assert.ok(
            rendered.scene.elements.some((next) => next.id === element.id),
            `Element ID lost: ${element.id}`,
          );
        for (const [key, file] of Object.entries(scene.files ?? {}))
          assert.equal(
            rendered.scene.files[key]?.dataURL,
            file.dataURL,
            "Embedded image changed",
          );
        return rendered;
      } finally {
        clearTimeout(timer);
      }
    },
    { appRoot: REPO_ROOT },
  );
  const png = Buffer.from(result.png, "base64");
  if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a")
    throw new RenderRefusal("The renderer did not return a real PNG.");
  const svg = Buffer.from(result.svg, "base64");
  const text = svg.toString("utf8");
  if (!text.includes("<svg"))
    throw new RenderRefusal("The renderer did not return a real SVG.");
  if (/@font-face/.test(text) === false)
    throw new RenderRefusal("The SVG is missing its embedded local font.");
  if (/(?:href|src)="https?:\/\//i.test(text))
    throw new RenderRefusal("The SVG contains an external reference.");
  return {
    scene: validateScene(result.scene),
    png,
    svg,
    provenance: {
      renderer: ENGINE,
      app: "ldraw",
      builtFrom: build.source,
      builtWorkingTreeClean: build.workingTreeClean === true,
      exportPadding: 24,
      background: true,
      svgEmbedsLocalFont: true,
      svgExternalReferences: 0,
      durationMs: Date.now() - started,
      temporaryResources:
        "owned browser profile and download root removed on exit",
      humanReview:
        "not performed by this adapter; inspect PNG/SVG before publishing",
    },
  };
}

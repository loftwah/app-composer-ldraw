import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { withBrowser, sceneAndExports } from "./browser.mjs";

const output = "output/library-check-20261026";
await mkdir(output, { recursive: true });

const result = await withBrowser(async ({ context, page, browserErrors }) => {
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page.waitForSelector(".library-dialog[open]");
  assert.equal(await page.locator(".artwork-card").count(), 22);
  await page.locator(".library-search input").fill("Bubbles");
  assert.equal(await page.locator(".artwork-card").count(), 2);
  await page.locator(".library-search input").fill("");
  await page.getByRole("button", { name: "Bubbles", exact: true }).click();
  assert.equal(await page.locator(".artwork-card").count(), 2);
  await page.getByRole("button", { name: "All projects", exact: true }).click();
  await page.screenshot({ path: `${output}/artwork-tab.png` });
  await page
    .locator(".artwork-card")
    .filter({ hasText: "App Composer mark" })
    .click();
  await page.waitForSelector(".library-dialog", { state: "hidden" });
  await page.waitForFunction(
    () => window.ldraw.readScene().scene.elements.some((e) => e.type === "image"),
  );

  const captured = await sceneAndExports(page);
  const images = captured.scene.elements.filter((e) => e.type === "image");
  assert.equal(images.length, 1);
  assert.equal(Object.keys(captured.scene.files ?? {}).length, 1);
  assert(images.every((element) => captured.scene.files[element.fileId]));
  await writeFile(`${output}/drawing.excalidraw`, JSON.stringify(captured.scene));
  await writeFile(`${output}/drawing.png`, Buffer.from(captured.png, "base64"));
  await writeFile(`${output}/drawing.svg`, Buffer.from(captured.svg, "base64"));
  await page.screenshot({ path: `${output}/inserted.png` });

  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page.getByRole("tab", { name: "Editable blocks" }).click();
  const vectorBlocks = await page.locator(".library-item").count();
  assert(vectorBlocks >= 18);
  await page.locator(".library-search input").fill("trust");
  assert.equal(await page.locator(".library-item").count(), 1);
  await page.keyboard.press("Escape");

  const fresh = await context.newPage();
  fresh.on("dialog", (dialog) => dialog.accept());
  await fresh.goto(page.url(), { waitUntil: "networkidle" });
  await fresh.waitForFunction(() => Boolean(window.ldraw));
  await fresh
    .locator('input[type="file"]')
    .setInputFiles(`${output}/drawing.excalidraw`);
  await fresh.waitForFunction(
    () =>
      window.ldraw.readScene().scene.elements.filter((e) => e.type === "image")
        .length === 1,
  );
  const reopened = await fresh.evaluate(() => window.ldraw.readScene());
  assert.equal(Object.keys(reopened.scene.files ?? {}).length, 1);

  assert.deepEqual(browserErrors, []);
  return {
    artwork_cards: 22,
    vector_blocks: await page.locator(".library-item").count(),
    image_elements: images.length,
    embedded_files: Object.keys(captured.scene.files ?? {}).length,
    png_bytes: Buffer.from(captured.png, "base64").length,
    svg_bytes: Buffer.from(captured.svg, "base64").length,
    reopened_images: reopened.scene.elements.filter((e) => e.type === "image")
      .length,
    reopened_files: Object.keys(reopened.scene.files ?? {}).length,
  };
});

console.log(JSON.stringify({ output, ...result }, null, 2));

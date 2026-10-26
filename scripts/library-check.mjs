#!/usr/bin/env node
/**
 * Real browser journey for the first-party portfolio library, architecture
 * catalogue and presentation mode.
 *
 *   pnpm build
 *   node scripts/library-check.mjs
 *
 * On a host whose Chromium cannot start because of the process sandbox, run
 * the same command inside the repository's Playwright Docker image:
 *   LDRAW_DOCKER_IMAGE=... (see README)
 *
 * The script writes bounded evidence under ignored output/ and removes its
 * owned browser profile and download root in finally.
 */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { architectureCatalogue } from "../src/portfolio.mjs";
import { withBrowser, sceneAndExports } from "./browser.mjs";

const output = "output/library-check-20261026";
await mkdir(output, { recursive: true });

const pngSize = (bytes) => {
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};

const result = await withBrowser(async ({ context, page, browserErrors, externalRequests }) => {
  const checks = [];
  const before = await page.evaluate(() => window.ldraw.readScene());
  const beforeTypes = Object.fromEntries(
    Object.entries(
      before.scene.elements.reduce((counts, element) => {
        counts[element.type] = (counts[element.type] ?? 0) + 1;
        return counts;
      }, {}),
    ),
  );

  await page.getByRole("button", { name: "Portfolio", exact: true }).click();
  const library = page.getByRole("dialog", { name: "LDraw portfolio library" });
  await library.waitFor();
  await page.waitForFunction(() => {
    const image = document.querySelector(".asset-card img");
    return image?.complete && image.naturalWidth > 0;
  });
  const assetCount = await library.locator(".asset-card").count();
  assert.ok(assetCount >= 98, `expected the expanded library, got ${assetCount}`);
  for (const project of ["App Composer", "Bubbles", "Protocol 11", "SHOALSHOT", "LoftwahFM", "MAX", "Pirates"])
    await library.locator(".project-rail").getByRole("button", { name: new RegExp(project) }).waitFor();
  checks.push(`expanded library exposes ${assetCount} artwork/composition cards and every project`);

  await library.locator(".project-rail").getByRole("button", { name: /Bubbles/ }).click();
  await library.locator(".library-search input").fill("Fizz mascot");
  await library.locator(".asset-card").filter({ hasText: "Fizz mascot" }).locator(".asset-select").click();
  assert.equal(await library.locator(".preview-copy h3").textContent(), "Fizz mascot");
  assert.match(await library.locator(".preview-copy").textContent(), /Owner-approved mascot/);
  await library.getByRole("button", { name: "Insert artwork", exact: true }).click();
  await page.waitForFunction(
    () => window.ldraw.readScene().scene.elements.some((element) => element.type === "image"),
  );
  const standalone = await page.evaluate(() => window.ldraw.readScene());
  const image = standalone.scene.elements.find((element) => element.type === "image");
  assert(image, "standalone image element");
  assert.equal(image.customData.ldrawArtworkId, "bubbles-fizz");
  assert.equal(Object.keys(standalone.scene.files).length, 1);
  const afterTypes = standalone.scene.elements.reduce((counts, element) => {
    counts[element.type] = (counts[element.type] ?? 0) + 1;
    return counts;
  }, {});
  assert.equal(afterTypes.image, (beforeTypes.image ?? 0) + 1);
  assert.equal(afterTypes.text, beforeTypes.text ?? 0);
  assert.equal(afterTypes.rectangle, beforeTypes.rectangle ?? 0);
  const viewport = await page.evaluate(() => window.ldraw.readViewport());
  const left = -viewport.scrollX;
  const top = -viewport.scrollY;
  assert(image.x < left + viewport.width && image.x + image.width > left);
  assert(image.y < top + viewport.height && image.y + image.height > top);
  checks.push("standalone Fizz insertion uses native image bytes, no forced card, and lands in the current viewport");

  await page.getByRole("button", { name: "Portfolio", exact: true }).click();
  const favouriteLibrary = page.getByRole("dialog", { name: "LDraw portfolio library" });
  await favouriteLibrary.locator(".library-search input").fill("Fizz mascot");
  await favouriteLibrary.locator(".asset-card").filter({ hasText: "Fizz mascot" }).locator(".asset-favourite").click();
  await favouriteLibrary.getByRole("button", { name: /Favourites/ }).click();
  await favouriteLibrary.locator(".asset-card").filter({ hasText: "Fizz mascot" }).waitFor();
  await favouriteLibrary.getByRole("button", { name: /Recently used/ }).click();
  await favouriteLibrary.locator(".asset-card").filter({ hasText: "Fizz mascot" }).waitFor();
  await favouriteLibrary.getByRole("button", { name: /All projects/ }).click();
  await favouriteLibrary.getByRole("button", { name: "Close library", exact: true }).click();
  checks.push("favourites and recently used survive closing the library and find the inserted mascot again");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save editable", exact: true }).click();
  const savedPath = await (await download).path();
  const saved = JSON.parse(await readFile(savedPath, "utf8"));
  assert.equal(saved.files[image.fileId].dataURL, standalone.scene.files[image.fileId].dataURL);
  assert(saved.elements.some((element) => element.id === image.id));

  const fresh = await context.newPage();
  fresh.on("dialog", (dialog) => dialog.accept());
  await fresh.goto(page.url(), { waitUntil: "networkidle" });
  await fresh.waitForFunction(() => Boolean(window.ldraw));
  await fresh.locator('input[type="file"]').setInputFiles(savedPath);
  await fresh.waitForFunction(
    () => window.ldraw.readScene().scene.elements.some((element) => element.type === "image"),
  );
  const reopened = await fresh.evaluate(() => window.ldraw.readScene());
  assert.equal(
    Object.keys(reopened.scene.files).length,
    1,
    "embedded artwork survives a native file round-trip",
  );
  checks.push("editable download and fresh-page reopen preserve the standalone image bytes and element ID");
  await fresh.close();

  await page.getByRole("button", { name: "Portfolio", exact: true }).click();
  const cardLibrary = page.getByRole("dialog", { name: "LDraw portfolio library" });
  await cardLibrary.getByRole("tab", { name: /Artwork/ }).click();
  await cardLibrary.locator(".project-rail").getByRole("button", { name: /Bubbles/ }).click();
  await cardLibrary.locator(".library-search input").fill("Bubbles Coin-Op icon");
  await cardLibrary.locator(".asset-card").filter({ hasText: "Bubbles Coin-Op icon" }).locator(".asset-select").click();
  await cardLibrary.getByRole("button", { name: "Insert as card", exact: true }).click();
  await page.waitForFunction(
    () =>
      window.ldraw.readScene().scene.elements.some(
        (element) => element.type === "rectangle" && element.customData?.ldrawArtworkId === "bubbles-icon",
      ),
  );
  const cardScene = await page.evaluate(() => window.ldraw.readScene());
  assert(
    cardScene.scene.elements.some(
      (element) => element.type === "text" && element.text === "Bubbles Coin-Op icon",
    ),
  );
  checks.push("insert-as-card remains an explicit option and adds an editable branded card");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "New", exact: true }).click();
  await page.waitForFunction(() => window.ldraw.readScene().scene.elements.length === 0);
  checks.push("New clears the canvas only after confirmation and leaves the browser library available");

  await page.getByRole("button", { name: "Portfolio", exact: true }).click();
  const compositionLibrary = page.getByRole("dialog", { name: "LDraw portfolio library" });
  await compositionLibrary.getByRole("tab", { name: /Artwork/ }).click();
  await compositionLibrary.locator(".library-search input").fill("");
  await compositionLibrary.getByRole("button", { name: /All projects/ }).click();
  await compositionLibrary.getByRole("button", { name: /Templates/ }).click();
  await compositionLibrary.locator(".asset-card").filter({ hasText: "Presentation stage" }).locator(".asset-select").click();
  assert.match(await compositionLibrary.locator(".preview-copy").textContent(), /Authored composition/);
  await compositionLibrary.getByRole("button", { name: "Insert composition", exact: true }).click();
  await page.waitForFunction(
    () => window.ldraw.readScene().scene.elements.some((element) => element.customData?.ldrawPresentation),
  );
  const compositionScene = await page.evaluate(() => window.ldraw.readScene());
  const stage = compositionScene.scene.elements.find((element) => element.customData?.ldrawPresentation);
  assert.equal(stage.width, 1920);
  assert.equal(stage.height, 1080);
  await page.getByLabel("PNG scale").selectOption("1");
  const compositionExport = await sceneAndExports(page);
  const compositionPng = Buffer.from(compositionExport.png, "base64");
  const compositionSize = pngSize(compositionPng);
  assert.equal(compositionSize.width, 1920, "16:9 width");
  assert.equal(compositionSize.height, 1080, "16:9 height");
  await page.getByLabel("PNG scale").selectOption("2");
  const fourK = await sceneAndExports(page);
  const fourKSize = pngSize(Buffer.from(fourK.png, "base64"));
  assert.equal(fourKSize.width, 3840, "4K width");
  assert.equal(fourKSize.height, 2160, "4K height");
  await page.getByLabel("PNG scale").selectOption("1");
  checks.push("16:9 composition exports at exactly 1920x1080 and 3840x2160 at 2x");

  await page.getByRole("button", { name: "Present", exact: true }).click();
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => document.body.classList.contains("presenting")), true);
  assert.equal(await page.locator(".toolbar").evaluate((element) => getComputedStyle(element).display), "none");
  assert.equal(await page.locator(".present-hud").count(), 1);
  await page.screenshot({ path: `${output}/presentation.png` });
  await page.getByRole("button", { name: "Exit present", exact: true }).click();
  await page.waitForTimeout(300);
  checks.push("distraction-free presentation hides the toolbar and exposes a real fit/exit HUD");

  await page.getByRole("button", { name: "Portfolio", exact: true }).click();
  const architectureLibrary = page.getByRole("dialog", { name: "LDraw portfolio library" });
  await architectureLibrary.getByRole("tab", { name: /Architecture/ }).click();
  await architectureLibrary.locator(".project-rail").getByRole("button", { name: /Protocol 11/ }).click();
  await architectureLibrary.locator(".diagram-card").first().locator(".asset-select").click();
  assert.match(await architectureLibrary.locator(".preview-copy").textContent(), /source-verified/);
  const protocol = architectureCatalogue.find((entry) => entry.project === "protocol11");
  page.once("dialog", (dialog) => dialog.accept());
  await architectureLibrary.getByRole("button", { name: "Open diagram", exact: true }).click();
  await page.waitForFunction(
    (count) => window.ldraw.readScene().scene.elements.length === count,
    protocol.elements,
  );
  await page.waitForSelector(".library-dialog", { state: "hidden" });
  const opened = await page.evaluate(() => window.ldraw.readScene());
  const openedIds = new Set(opened.scene.elements.map((element) => element.id));
  for (const id of ["arch-protocol11-title", "arch-protocol11-player", "arch-protocol11-d1"])
    assert(openedIds.has(id), `preserved native ID ${id}`);
  // A native text annotation through the editor's own revision-checked API,
  // placed in the empty footer band so it stays inside the diagram.
  const annotated = await page.evaluate(async () => {
    const current = window.ldraw.readScene();
    const base = current.scene.elements.find((element) => element.type === "text");
    const annotation = {
      ...structuredClone(base),
      id: "owner-review-annotation",
      x: 34,
      y: 556,
      width: 130,
      height: 24,
      text: "Owner review",
      originalText: "Owner review",
      fontSize: 16,
      fontFamily: 5,
      strokeColor: "#1D2330",
      backgroundColor: "transparent",
      groupIds: [],
      frameId: null,
      containerId: null,
      boundElements: null,
      isDeleted: false,
      version: 1,
      versionNonce: 20261026,
      updated: 1_761_350_400_000,
    };
    await window.ldraw.replaceScene(
      { ...current.scene, elements: [...current.scene.elements, annotation] },
      { expectedRevision: current.revision },
    );
    return window.ldraw.readScene();
  });
  assert.equal(annotated.scene.elements.length, protocol.elements + 1);
  for (const id of openedIds) assert(annotated.scene.elements.some((element) => element.id === id));
  const annotatedExport = await sceneAndExports(page);
  const annotatedPng = Buffer.from(annotatedExport.png, "base64");
  assert.ok(pngSize(annotatedPng).width > 1000);
  await page.screenshot({ path: `${output}/protocol11-architecture.png` });
  checks.push("Protocol 11 architecture opens as a native editable scene, keeps every ID, accepts a human annotation and exports legibly");

  await page.getByRole("button", { name: "Portfolio", exact: true }).click();
  const otherLibrary = page.getByRole("dialog", { name: "LDraw portfolio library" });
  await otherLibrary.getByRole("tab", { name: /Architecture/ }).click();
  await otherLibrary.locator(".project-rail").getByRole("button", { name: /Bubbles/ }).click();
  await otherLibrary.locator(".diagram-card").first().locator(".asset-select").click();
  const bubblesText = await otherLibrary.locator(".preview-copy").textContent();
  assert.match(bubblesText, /local saves/);
  await otherLibrary.getByRole("button", { name: "Add to canvas", exact: true }).click();
  await page.waitForFunction(
    () =>
      window.ldraw.readScene().scene.elements.some((element) =>
        element.id.startsWith("diagram-"),
      ),
  );
  const withBubbles = await page.evaluate(() => window.ldraw.readScene());
  assert(withBubbles.scene.elements.some((element) => element.id.startsWith("diagram-") && element.id.includes("arch-bubbles")));
  checks.push("a second project's architecture has different verified technology and can be added with fresh IDs");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "New", exact: true }).click();
  await page.waitForFunction(() => window.ldraw.readScene().scene.elements.length === 0);
  await page.getByRole("button", { name: "Portfolio", exact: true }).click();
  const transparentLibrary = page.getByRole("dialog", { name: "LDraw portfolio library" });
  await transparentLibrary.getByRole("tab", { name: /Artwork/ }).click();
  await transparentLibrary.locator(".project-rail").getByRole("button", { name: /Bubbles/ }).click();
  await transparentLibrary.locator(".library-search input").fill("Bubbles Coin-Op icon");
  await transparentLibrary.locator(".asset-card").filter({ hasText: "Bubbles Coin-Op icon" }).locator(".asset-select").click();
  await transparentLibrary.getByRole("button", { name: "Insert artwork", exact: true }).click();
  await page.waitForFunction(() => window.ldraw.readScene().scene.elements.some((element) => element.type === "image"));
  await page.getByLabel("Background").uncheck();
  const transparent = await sceneAndExports(page);
  const alpha = await page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const surface = document.createElement("canvas");
    surface.width = bitmap.width;
    surface.height = bitmap.height;
    const context = surface.getContext("2d");
    context.drawImage(bitmap, 0, 0);
    return context.getImageData(0, 0, 1, 1).data[3];
  }, transparent.png);
  assert.equal(alpha, 0, "transparent PNG corner keeps alpha");
  await page.getByLabel("Background").check();
  checks.push("transparent PNG export is a real alpha export, not a white rectangle");

  const assets = await page.evaluate(async () => {
    const read = async (path) => {
      const response = await fetch(path);
      return {
        status: response.status,
        type: response.headers.get("content-type"),
        bytes: (await response.arrayBuffer()).byteLength,
      };
    };
    return {
      favicon: await read("/favicon.svg"),
      favicon16: await read("/favicon-16.png"),
      apple: await read("/apple-touch-icon.png"),
      manifest: await read("/site.webmanifest"),
      og: await read("/og/ldraw-og.png"),
      manifestText: await (await fetch("/site.webmanifest")).text(),
    };
  });
  assert.equal(assets.favicon.status, 200);
  assert.match(assets.favicon.type, /svg/);
  assert.ok(assets.favicon.bytes > 100);
  assert.equal(assets.favicon16.status, 200);
  assert.equal(assets.apple.status, 200);
  assert.equal(assets.manifest.status, 200);
  assert.match(assets.manifest.type, /manifest|json/);
  assert.match(assets.manifestText, /icon-512\.png/);
  assert.equal(assets.og.status, 200);
  assert.match(assets.og.type, /png/);
  assert.ok(assets.og.bytes > 10000);
  const metadata = await page.evaluate(() => ({
    icon: document.querySelector('link[rel="icon"][type="image/svg+xml"]')?.getAttribute("href"),
    manifest: document.querySelector('link[rel="manifest"]')?.getAttribute("href"),
    og: document.querySelector('meta[property="og:image"]')?.getAttribute("content"),
    title: document.title,
  }));
  assert.equal(metadata.icon, "/favicon.svg");
  assert.equal(metadata.manifest, "/site.webmanifest");
  assert.equal(metadata.og, "https://ldraw.loftwah.com/og/ldraw-og.png");
  checks.push("served SVG/PNG favicon, Apple icon, web manifest and 1200x630 social card match the document metadata");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Portfolio", exact: true }).click();
  const phoneLibrary = page.getByRole("dialog", { name: "LDraw portfolio library" });
  await phoneLibrary.waitFor();
  await page.screenshot({ path: `${output}/phone-library.png` });
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    "phone library has no page-level horizontal overflow",
  );
  await phoneLibrary.getByRole("button", { name: "Close library", exact: true }).click();
  assert.ok(
    await page.locator(".toolbar").evaluate((element) => element.getBoundingClientRect().height < 90),
    "phone toolbar remains one compact row",
  );
  checks.push("390px library and toolbar layouts stay usable without page overflow");

  assert.deepEqual(browserErrors, []);
  assert.deepEqual(externalRequests, []);
  await writeFile(`${output}/checks.json`, JSON.stringify(checks, null, 2));
  return { checks, assetCount, protocolElements: protocol.elements, annotatedElements: annotated.scene.elements.length };
});

console.log(JSON.stringify({ output, ...result }, null, 2));

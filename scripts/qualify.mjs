import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { withBrowser, sceneAndExports } from "./browser.mjs";

await mkdir("output", { recursive: true });
const source = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const build = JSON.parse(await readFile("dist/build.json", "utf8"));
assert.equal(
  build.source,
  source,
  "Build source must match qualification source.",
);
const checks = [];
await withBrowser(async ({ page, context, origin, temporaryRoot }) => {
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  const externalRequests = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(origin) && /^https?:/.test(request.url()))
      externalRequests.push(new URL(request.url()).origin);
  });
  const initial = await page.evaluate(() => window.ldraw.readScene());
  assert.ok(
    initial.scene.elements.length > 8,
    "Real editable starting diagram is present.",
  );
  await page.getByLabel("New content", { exact: false }).selectOption("music");
  const recoloured = await page.evaluate(() => window.ldraw.readScene());
  assert.deepEqual(
    recoloured.scene.elements,
    initial.scene.elements,
    "Project choice must not recolour existing content.",
  );
  await page.getByRole("button", { name: "Insert example" }).click();
  const appended = await page.evaluate(() => window.ldraw.readScene());
  for (const element of initial.scene.elements)
    assert.ok(appended.scene.elements.some((e) => e.id === element.id));
  checks.push(
    "native editable examples append; colour choice preserves existing elements",
  );

  // Human keyboard/text journey through the native drawing engine, not the API.
  await page.mouse.click(900, 760);
  await page.keyboard.press("t");
  await page.mouse.click(900, 760);
  await page.keyboard.type("Human note stays editable");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() =>
    window.ldraw
      .readScene()
      .scene.elements.some((e) => e.text === "Human note stays editable"),
  );
  const human = await page.evaluate(() => window.ldraw.readScene());
  const stale = await page.evaluate(async (old) => {
    try {
      await window.ldraw.replaceScene(old.scene, {
        expectedRevision: old.revision,
      });
      return false;
    } catch (error) {
      return /changed/.test(error.message);
    }
  }, initial);
  assert.equal(stale, true, "Stale agent update must be rejected.");
  checks.push("native human text entry and stale agent revision rejection");

  const pixel =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWyQAAAAASUVORK5CYII=";
  const fixture = structuredClone(human.scene);
  const base = fixture.elements.find((e) => e.type === "rectangle");
  fixture.elements.push({
    ...base,
    id: "qualification-image",
    type: "image",
    x: 30,
    y: 30,
    width: 50,
    height: 50,
    fileId: "qualification-pixel",
    status: "saved",
    scale: [1, 1],
    crop: null,
    boundElements: null,
    version: 1,
    versionNonce: 1,
  });
  fixture.files["qualification-pixel"] = {
    id: "qualification-pixel",
    dataURL: pixel,
    mimeType: "image/png",
    created: 1,
  };
  await writeFile(
    join(temporaryRoot, "roundtrip.excalidraw"),
    JSON.stringify(fixture),
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("input[type=file]")
    .setInputFiles(join(temporaryRoot, "roundtrip.excalidraw"));
  await page.waitForFunction(() =>
    window.ldraw
      .readScene()
      .scene.elements.some((e) => e.id === "qualification-image"),
  );
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save editable" }).click();
  const download = await downloadEvent;
  const saved = JSON.parse(await readFile(await download.path(), "utf8"));
  for (const element of fixture.elements)
    assert.ok(
      saved.elements.some((e) => e.id === element.id),
      `Lost imported ID ${element.id}`,
    );
  assert.equal(saved.files["qualification-pixel"].dataURL, pixel);
  assert.ok(saved.elements.some((e) => e.text === "Human note stays editable"));
  checks.push(
    "native file-open/download roundtrip preserves element IDs, image bytes and human text",
  );
  const result = await sceneAndExports(page);
  assert.equal(
    Buffer.from(result.png, "base64").subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a",
  );
  const svg = Buffer.from(result.svg, "base64").toString();
  assert.match(svg, /<svg/);
  assert.match(svg, /data:image\/png;base64/);
  assert.match(svg, /Human note stays editable/);
  assert.match(svg, /@font-face/);
  await writeFile(
    "output/qualification.excalidraw",
    JSON.stringify(result.scene, null, 2),
  );
  await writeFile(
    "output/qualification.png",
    Buffer.from(result.png, "base64"),
  );
  await writeFile("output/qualification.svg", svg);
  await page.getByRole("button", { name: "PNG", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.waitForFunction(() => {
    const image = document.querySelector(".preview img");
    return image?.complete && image.naturalWidth > 0;
  });
  await page.screenshot({ path: "output/desktop-export.png" });
  await page.getByRole("button", { name: "Close export preview" }).click();
  checks.push(
    "same-renderer PNG signature, SVG embedded image/fonts/text and actual export preview",
  );

  await page.waitForFunction(
    () =>
      document.querySelector("[role=status]")?.textContent ===
      "Saved on this browser",
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() =>
    window.ldraw
      ?.readScene()
      .scene.elements.some((e) => e.text === "Human note stays editable"),
  );
  await page.waitForFunction(
    () => document.body.textContent.includes("Offline copy ready"),
    { timeout: 90000 },
  );
  await context.setOffline(true);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() =>
    window.ldraw
      ?.readScene()
      .scene.elements.some((e) => e.id === "qualification-image"),
  );
  const offlineExports = await sceneAndExports(page);
  assert.equal(
    offlineExports.scene.files["qualification-pixel"].dataURL,
    pixel,
  );
  checks.push(
    "autosave browser reload, full-assets offline relaunch and offline PNG/SVG export",
  );
  await page.screenshot({ path: "output/desktop-offline.png" });
  await context.setOffline(false);

  // A second tab must not silently overwrite the first tab's newer draft.
  const second = await context.newPage();
  await second.goto(origin, { waitUntil: "networkidle" });
  await second.waitForFunction(() => Boolean(window.ldraw));
  await page.getByRole("button", { name: "Insert example" }).click();
  await page.waitForFunction(
    () =>
      document.querySelector("[role=status]")?.textContent ===
      "Saved on this browser",
  );
  await second.getByRole("button", { name: "Insert example" }).click();
  await second
    .getByRole("alert")
    .filter({ hasText: "Another tab saved a newer drawing" })
    .waitFor();
  await second.close();
  checks.push("actual IndexedDB concurrent-tab stale save refused");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "output/phone-layout-only.png" });
  assert.ok(
    await page
      .locator(".canvas")
      .evaluate((element) => element.getBoundingClientRect().height > 400),
  );
  checks.push("390px responsive layout only; no physical touch editing claim");
  assert.deepEqual(browserErrors, []);
  assert.deepEqual(externalRequests, []);
});
await writeFile(
  "output/qualification.json",
  JSON.stringify(
    {
      source,
      status: "passed",
      environment: "local static assets / Playwright Chromium",
      engine: "0.18.1",
      checks,
      temporaryResources: "owned profile/download root removed",
      production: "unverified",
      physicalDevices: "unverified",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ source, status: "passed", checks }));

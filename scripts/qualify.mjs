import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { withBrowser, sceneAndExports } from "./browser.mjs";

async function clearOwnedHttpCache(page, context) {
  const workerCaches = await page.evaluate(() => caches.keys());
  assert.ok(workerCaches.length, "The offline workspace must be cached first.");
  const protocol = await context.newCDPSession(page);
  try {
    await protocol.send("Network.clearBrowserCache");
  } finally {
    await protocol.detach();
  }
  assert.deepEqual(
    await page.evaluate(() => caches.keys()),
    workerCaches,
    "Browser HTTP cache clearing must retain service-worker CacheStorage.",
  );
}

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
assert.equal(
  build.sourceTree,
  execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
    encoding: "utf8",
  }).trim(),
);
assert.equal(
  build.workingTreeClean,
  true,
  "Qualification requires a clean source build.",
);
assert.equal(
  execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim(),
  "",
  "Qualification source must be clean.",
);
const checks = [];
const startupGeometry = [];
await withBrowser(
  async ({
    page,
    context,
    origin,
    temporaryRoot,
    browserErrors,
    externalRequests,
  }) => {
    const initial = await page.evaluate(() => window.ldraw.readScene());
    await page.evaluate(() =>
      document.fonts.load("32px Excalifont", "Creator journey ·"),
    );
    assert.ok(
      initial.scene.elements.length > 8,
      "Real editable starting diagram is present.",
    );
    await page
      .getByLabel("New content", { exact: false })
      .selectOption("music");
    const recoloured = await page.evaluate(() => window.ldraw.readScene());
    assert.deepEqual(
      recoloured.scene.elements,
      initial.scene.elements,
      "Project choice must not recolour existing content.",
    );
    await page.getByRole("button", { name: "Insert example" }).click();
    await page.waitForFunction(
      () =>
        window.ldraw
          .readScene()
          .scene.elements.filter(
            (element) => element.text === "Creator journey",
          ).length === 2,
    );
    const appended = await page.evaluate(() => window.ldraw.readScene());
    for (const text of [
      "Creator journey",
      "One owner · independent apps · shared discovery",
    ]) {
      const cold = initial.scene.elements.find(
        (element) => element.text === text,
      );
      const later = appended.scene.elements.find(
        (element) => element.text === text && element.id !== cold.id,
      );
      assert.equal(cold.fontFamily, later.fontFamily);
      assert.equal(cold.fontSize, later.fontSize);
      assert.ok(
        Math.abs(cold.width - later.width) < 0.01,
        "Cold startup text must have the same native font geometry as insertion after font load.",
      );
      startupGeometry.push({
        text,
        initialWidth: cold.width,
        loadedWidth: later.width,
      });
    }
    checks.push(
      "cold initial preset title/subtitle geometry matches native insertion after Excalifont loads",
    );
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
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    const humanElement = human.scene.elements.find(
      (e) => e.text === "Human note stays editable",
    );
    await page.keyboard.press(`${modifier}+z`);
    await page.waitForFunction(
      () =>
        !window.ldraw
          .readScene()
          .scene.elements.some(
            (e) => !e.isDeleted && e.text === "Human note stays editable",
          ),
    );
    await page.keyboard.press(`${modifier}+Shift+z`);
    await page.waitForFunction(
      (id) =>
        window.ldraw
          .readScene()
          .scene.elements.some((e) => !e.isDeleted && e.id === id),
      humanElement.id,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      true,
    );
    await page.keyboard.press("Alt+Shift+d");
    await page.locator(".excalidraw.theme--dark").waitFor();
    await page.screenshot({ path: "output/desktop-dark-reduced-motion.png" });
    await page.keyboard.press("Alt+Shift+d");
    await page.locator(".excalidraw:not(.theme--dark)").first().waitFor();
    checks.push(
      "native keyboard undo/redo preserves text ID; desktop native dark/light canvases exercised with reduced motion; LDraw toolbar remains neutral light",
    );
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
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
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
    const restoredHuman = saved.elements.find(
      (element) => element.id === humanElement.id,
    );
    for (const key of [
      "x",
      "y",
      "width",
      "height",
      "fontSize",
      "fontFamily",
      "text",
    ])
      assert.deepEqual(
        restoredHuman[key],
        humanElement[key],
        "Imported human text geometry and identity must remain intact.",
      );
    assert.ok(
      saved.elements.some((e) => e.text === "Human note stays editable"),
    );
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
    assert.match(svg, /data:font\/woff2;base64/);
    assert.ok(!svg.includes("esm.sh"));
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
    await page.getByRole("dialog", { name: "PNG export preview" }).waitFor();
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
      () => document.body.textContent.includes("Offline workspace cached"),
      undefined,
      { timeout: 90000 },
    );
    await clearOwnedHttpCache(page, context);
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
      "autosave browser reload, offline relaunch and offline current-scene PNG/SVG export after required assets loaded",
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

    const beforeEmptyExport = await page.evaluate(() =>
      window.ldraw.readScene(),
    );
    await page.evaluate(async () => {
      const current = window.ldraw.readScene();
      await window.ldraw.replaceScene(
        { ...current.scene, elements: [] },
        { expectedRevision: current.revision },
      );
    });
    await page.getByRole("button", { name: "PNG", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Add something to the drawing" })
      .waitFor();
    assert.equal(
      (await page.evaluate(() => window.ldraw.readScene())).scene.elements
        .length,
      0,
    );
    await page.evaluate(async (prior) => {
      const current = window.ldraw.readScene();
      await window.ldraw.replaceScene(prior, {
        expectedRevision: current.revision,
      });
    }, beforeEmptyExport.scene);
    await page.getByRole("button", { name: "Dismiss message" }).click();
    checks.push(
      "empty export fails visibly without losing the editable scene; prior drawing restores through the validated revision API",
    );
    // Excalidraw's supported restore normalizes native bindings/line geometry.
    // Isolate the invalid-import assertion from that preceding valid restore.
    const beforeBadImport = await page.evaluate(() => window.ldraw.readScene());
    await writeFile(
      join(temporaryRoot, "invalid.excalidraw"),
      JSON.stringify({
        type: "excalidraw",
        version: 2,
        elements: [{ id: "bad", type: "embeddable" }],
      }),
    );
    await page
      .locator("input[type=file]")
      .setInputFiles(join(temporaryRoot, "invalid.excalidraw"));
    await page.getByRole("alert").waitFor();
    assert.deepEqual(
      (await page.evaluate(() => window.ldraw.readScene())).scene.elements,
      beforeBadImport.scene.elements,
    );
    await page.getByRole("button", { name: "Dismiss message" }).click();
    checks.push(
      "malformed native import rejected without modifying the current drawing",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    const rectanglesBefore = await page.evaluate(
      () =>
        window.ldraw
          .readScene()
          .scene.elements.filter((e) => e.type === "rectangle").length,
    );
    await page.mouse.click(100, 500);
    await page.keyboard.press("r");
    await page.mouse.move(80, 500);
    await page.mouse.down();
    await page.mouse.move(190, 580, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(
      (before) =>
        window.ldraw
          .readScene()
          .scene.elements.filter((e) => e.type === "rectangle").length > before,
      rectanglesBefore,
    );
    await page.keyboard.press("Escape");
    await page.keyboard.press("t");
    await page.mouse.click(70, 630);
    await page.keyboard.type("Phone viewport edit");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() =>
      window.ldraw
        .readScene()
        .scene.elements.some((e) => e.text === "Phone viewport edit"),
    );
    const phoneDownloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save editable" }).click();
    const phoneDownload = await phoneDownloadEvent;
    const phoneFile = join(temporaryRoot, "phone.excalidraw");
    await phoneDownload.saveAs(phoneFile);
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("input[type=file]").setInputFiles(phoneFile);
    await page.waitForFunction(() =>
      window.ldraw
        .readScene()
        .scene.elements.some((e) => e.text === "Phone viewport edit"),
    );
    await page.getByRole("button", { name: "SVG", exact: true }).click();
    await page.getByRole("dialog", { name: "SVG export preview" }).waitFor();
    await page.waitForFunction(() => {
      const image = document.querySelector(".preview img");
      return image?.complete && image.naturalWidth > 0;
    });
    await page.screenshot({ path: "output/phone-edit-import-export.png" });
    await page.getByRole("button", { name: "Close export preview" }).click();
    await page.mouse.click(280, 470);
    await page.keyboard.press("Alt+Shift+d");
    await page.locator(".excalidraw.theme--dark").waitFor();
    await page.screenshot({ path: "output/phone-dark-reduced-motion.png" });
    await page.keyboard.press("Alt+Shift+d");
    await page.locator(".excalidraw:not(.theme--dark)").first().waitFor();
    assert.ok(
      await page
        .locator(".canvas")
        .evaluate((element) => element.getBoundingClientRect().height > 400),
    );
    checks.push(
      "390px browser rectangle drawing, text editing, native file roundtrip and SVG preview; physical touch remains unverified",
    );

    await page.waitForFunction(
      () =>
        document.querySelector("[role=status]")?.textContent ===
        "Saved on this browser",
    );
    const quota = await context.newPage();
    await quota.goto(origin, { waitUntil: "networkidle" });
    await quota.waitForFunction(() => Boolean(window.ldraw));
    await quota.evaluate(() => {
      IDBObjectStore.prototype.put = function () {
        throw new DOMException(
          "Storage quota exceeded. Download an editable copy.",
          "QuotaExceededError",
        );
      };
    });
    await quota.getByRole("button", { name: "Insert example" }).click();
    await quota
      .getByRole("alert")
      .filter({ hasText: "Storage quota exceeded" })
      .waitFor();
    const quotaDownloadEvent = quota.waitForEvent("download");
    await quota.getByRole("button", { name: "Save editable" }).click();
    const quotaDownload = await quotaDownloadEvent;
    assert.ok(
      JSON.parse(await readFile(await quotaDownload.path(), "utf8")).elements
        .length > 0,
    );
    await quota.close();
    checks.push(
      "injected browser quota failure keeps a downloadable native drawing",
    );

    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        const request = indexedDB.open("ldraw-local-v1", 1);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("drafts", "readwrite");
          const store = transaction.objectStore("drafts");
          const read = store.get("current");
          read.onsuccess = () => {
            const record = read.result;
            record.previous = structuredClone(record.scene);
            record.scene = {};
            store.put(record, "current");
          };
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
    });
    await page.reload({ waitUntil: "networkidle" });
    await page
      .getByRole("alert")
      .filter({ hasText: "previous save was recovered" })
      .waitFor();
    await page.waitForFunction(() =>
      window.ldraw
        ?.readScene()
        .scene.elements.some((e) => e.text === "Phone viewport edit"),
    );
    await page.waitForFunction(
      () =>
        document.querySelector("[role=status]")?.textContent ===
        "Saved on this browser",
    );
    await clearOwnedHttpCache(page, context);
    await context.setOffline(true);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() =>
      window.ldraw
        ?.readScene()
        .scene.elements.some((e) => e.text === "Phone viewport edit"),
    );
    const phoneOffline = await sceneAndExports(page);
    assert.ok(phoneOffline.png && phoneOffline.svg);
    await context.setOffline(false);
    checks.push(
      "actual corrupted latest draft recovers previous snapshot; 390px offline relaunch/current-scene exports work after required assets loaded",
    );
    assert.deepEqual(browserErrors, []);
    assert.deepEqual(externalRequests, []);
  },
);
await writeFile(
  "output/qualification.json",
  JSON.stringify(
    {
      source,
      status: "passed",
      environment: "local static assets / Playwright Chromium",
      engine: "0.18.1",
      checks,
      startupGeometry,
      temporaryResources: "owned profile/download root removed",
      production: "unverified",
      physicalDevices: "unverified",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ source, status: "passed", checks }));

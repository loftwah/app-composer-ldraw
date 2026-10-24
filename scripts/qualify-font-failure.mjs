import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { withBrowser } from "./browser.mjs";
const source = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
assert.equal(
  JSON.parse(await readFile("dist/build.json", "utf8")).source,
  source,
);
await mkdir("output", { recursive: true });
const pattern = "**/excalidraw-assets/fonts/Excalifont/**";
let blockedRequests = 0;
await withBrowser(
  async ({ page, context, browserErrors, externalRequests }) => {
    await page
      .getByRole("alert", { name: "Example font", exact: true })
      .waitFor();
    assert.ok(blockedRequests > 0, "A real local font request must fail.");
    assert.match(
      await page
        .getByRole("alert", { name: "Example font", exact: true })
        .textContent(),
      /Save editable, then reload/,
    );
    assert.equal(
      await page.getByRole("button", { name: "Insert example" }).isDisabled(),
      true,
    );
    await page.mouse.click(500, 650);
    await page.keyboard.press("r");
    await page.mouse.move(400, 500);
    await page.mouse.down();
    await page.mouse.move(600, 600, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.press("Escape");
    await page.waitForFunction(() =>
      window.ldraw
        .readScene()
        .scene.elements.some(
          (element) => element.type === "rectangle" && !element.isDeleted,
        ),
    );
    const human = await page.evaluate(() =>
      window.ldraw
        .readScene()
        .scene.elements.find(
          (element) => element.type === "rectangle" && !element.isDeleted,
        ),
    );
    await page.waitForFunction(() =>
      document
        .querySelector("[role=status]")
        ?.textContent.endsWith("Saved on this browser"),
    );
    const event = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save editable" }).click();
    const download = await event;
    const saved = JSON.parse(await readFile(await download.path(), "utf8"));
    assert.ok(saved.elements.some((element) => element.id === human.id));
    await writeFile(
      "output/font-failure-drawing.excalidraw",
      JSON.stringify(saved, null, 2),
    );
    await page.screenshot({ path: "output/font-failure-saved.png" });
    await context.unroute(pattern);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => Boolean(window.ldraw));
    const restored = await page.evaluate(() => window.ldraw.readScene());
    assert.ok(
      restored.scene.elements.some((element) => element.id === human.id),
    );
    await page.getByRole("button", { name: "Insert example" }).click();
    await page.waitForFunction(() =>
      window.ldraw
        .readScene()
        .scene.elements.some((element) => element.text === "Creator journey"),
    );
    assert.equal(
      await page
        .getByRole("alert", { name: "Example font", exact: true })
        .count(),
      0,
    );
    const recovered = await page.evaluate(() => window.ldraw.readScene());
    const retained = recovered.scene.elements.find(
      (element) => element.id === human.id,
    );
    for (const key of ["x", "y", "width", "height"])
      assert.equal(retained[key], human[key]);
    assert.deepEqual(browserErrors, []);
    assert.deepEqual(externalRequests, []);
  },
  {
    serviceWorkers: "block",
    beforeNavigate: async ({ context }) => {
      await context.route(pattern, (route) => {
        blockedRequests++;
        return route.abort("failed");
      });
    },
  },
);
await writeFile(
  "output/font-failure-qualification.json",
  JSON.stringify(
    {
      source,
      status: "passed",
      blockedRequests,
      checks: [
        "real local font request failed visibly",
        "native human rectangle remained editable, autosaved and downloadable",
        "reconnect plus saved-drawing reload enabled successful preset insertion",
        "human shape ID/geometry retained; font error cleared; no page errors or external requests",
      ],
      temporaryResources: "owned profile/download root removed",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ source, status: "passed", blockedRequests }));

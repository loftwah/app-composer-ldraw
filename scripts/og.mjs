#!/usr/bin/env node
/**
 * Rebuild the 1200×630 share card from the actually built app.
 *
 *   pnpm build
 *   node scripts/og.mjs                 # clean tree only
 *   node scripts/og.mjs --allow-dirty   # design iteration; records the dirt
 *
 * The card is not a mockup: the browser loads the app, hides Excalidraw's
 * chrome, captures the real canvas at its native dark rendering and trims to
 * the drawing. The headline replaces the example's own title, so no copy is
 * duplicated. Space Grotesk and the L mark are local files. No network.
 *
 * The exact Playwright Chromium build and Space Grotesk face are part of the
 * result; re-rendering on another platform can change pixels. That is why the
 * card and its provenance are committed, and why the release re-renders from a
 * clean tree rather than trusting a previous image.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { withBrowser } from "./browser.mjs";
import {
  pngSize,
  shareAlt,
  shareHeight,
  sharePath,
  shareWidth,
  title,
} from "./seo.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const allowDirty = process.argv.slice(2).includes("--allow-dirty");
const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const source = git("rev-parse", "HEAD");
const sourceTree = git("rev-parse", "HEAD^{tree}");
const workingTreeClean = !git("status", "--porcelain");
if (!workingTreeClean && !allowDirty)
  throw new Error(
    "The share card must be rendered from a clean tree. Commit first, or pass --allow-dirty for a design draft.",
  );
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const reviewedAt = new Date().toISOString().slice(0, 10);

const font = (await readFile(join(root, "public/brand/space.woff2"))).toString(
  "base64",
);
const mark = (
  await readFile(join(root, "public/brand/ldraw-mark.svg"))
).toString("base64");

/** Hide native Excalidraw chrome so the capture is the drawing, not a UI shot. */
const hideChrome = `
  .excalidraw .App-menu_top,
  .excalidraw .App-menu_bottom,
  .excalidraw .App-menu__left,
  .excalidraw .HintViewer,
  .excalidraw .help-icon,
  .excalidraw .scroll-back-to-content,
  .excalidraw .layer-ui__wrapper__top-right,
  .excalidraw .layer-ui__wrapper__footer { display: none !important; }
`;

const captured = await withBrowser(async ({ page, context }) => {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: hideChrome });
  await page.waitForFunction(
    () => window.ldraw?.readScene().scene.elements.length > 0,
    null,
    { timeout: 15000 },
  );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const canvas = page.locator(".excalidraw");
  const shot = await canvas.screenshot();
  const trimmed = await page.evaluate(async (src) => {
    const bytes = Uint8Array.from(atob(src), (character) =>
      character.charCodeAt(0),
    );
    const bitmap = await createImageBitmap(
      new Blob([bytes], { type: "image/png" }),
    );
    const surface = document.createElement("canvas");
    surface.width = bitmap.width;
    surface.height = bitmap.height;
    const draw = surface.getContext("2d", { willReadFrequently: true });
    draw.drawImage(bitmap, 0, 0);
    const { data } = draw.getImageData(0, 0, surface.width, surface.height);
    const background = [data[0], data[1], data[2]];
    const differs = (x, y) => {
      const i = (y * surface.width + x) * 4;
      return (
        Math.abs(data[i] - background[0]) +
          Math.abs(data[i + 1] - background[1]) +
          Math.abs(data[i + 2] - background[2]) >
        24
      );
    };
    let minX = surface.width;
    let minY = surface.height;
    let maxX = -1;
    let maxY = -1;
    const rowHasInk = [];
    const columnHasInk = [];
    for (let y = 0; y < surface.height; y++) {
      let row = false;
      for (let x = 0; x < surface.width; x++) {
        if (!differs(x, y)) continue;
        row = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        columnHasInk[x] = true;
      }
      rowHasInk[y] = row;
    }
    if (maxX < 0) throw new Error("The canvas capture is empty");
    // The example's own title and subtitle sit above a wide background gap.
    // Cut at that gap so the card's headline is the only title.
    let gapStart = -1;
    let gapEnd = -1;
    for (let y = minY + 24; y < Math.floor((minY + maxY) / 2); y++) {
      if (rowHasInk[y]) continue;
      let end = y;
      while (end < surface.height && !rowHasInk[end]) end++;
      if (end - y >= 18) {
        gapStart = y;
        gapEnd = end;
        break;
      }
    }
    if (gapStart < 0)
      throw new Error(
        "No title gap in the canvas. Recheck the example layout before publishing this card.",
      );
    void columnHasInk;
    const pad = 10;
    const left = Math.max(0, minX - pad);
    const top = Math.max(0, gapEnd - pad);
    const right = Math.min(surface.width, maxX + pad + 1);
    const bottom = Math.min(surface.height, maxY + pad + 1);
    const crop = document.createElement("canvas");
    crop.width = right - left;
    crop.height = bottom - top;
    crop
      .getContext("2d")
      .drawImage(
        surface,
        left,
        top,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height,
      );
    return {
      dataUrl: crop.toDataURL("image/png"),
      width: crop.width,
      height: crop.height,
      gap: [gapStart, gapEnd],
      bounds: [minX, minY, maxX, maxY],
    };
  }, shot.toString("base64"));
  const captureBytes = Buffer.from(trimmed.dataUrl.split(",")[1], "base64");
  const captureSize = pngSize(captureBytes);
  assert.equal(captureSize.width, trimmed.width);
  assert.equal(captureSize.height, trimmed.height);

  const card = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${title}</title>
<style>
@font-face{font-family:"Space Grotesk";src:url(data:font/woff2;base64,${font}) format("woff2");font-display:block}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${shareWidth}px;height:${shareHeight}px;overflow:hidden;background:#121212}
body{font-family:"Space Grotesk",system-ui,sans-serif;color:#F7F3EA}
.card{position:relative;width:${shareWidth}px;height:${shareHeight}px}
.brand{position:absolute;left:72px;top:46px;display:flex;align-items:center;gap:15px}
.brand img{width:52px;height:52px;border-radius:12px}
.brand b{font-size:55px;line-height:1;letter-spacing:-.05em;font-weight:600}
.spec{position:absolute;right:72px;top:63px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#7C7C84}
.headline{position:absolute;left:72px;top:118px;font-size:32px;line-height:1.14;letter-spacing:-.03em;font-weight:500}
.headline em{font-style:normal;color:#FC5B05}
.art{position:absolute;left:40px;right:40px;top:172px;height:376px;display:flex;align-items:center;justify-content:center}
.art img{max-width:100%;max-height:100%;width:auto;display:block}
.foot{position:absolute;left:72px;right:72px;bottom:32px;border-top:1px solid #2B2B30;padding-top:14px;display:flex;justify-content:space-between;font-size:13px;color:#8F8F98}
</style></head>
<body><div class="card">
  <div class="brand"><img src="data:image/svg+xml;base64,${mark}" alt=""><b>LDraw</b></div>
  <div class="spec">Local-first Excalidraw workspace</div>
  <div class="headline">Draw it out. <em>Keep it editable.</em></div>
  <div class="art"><img src="${trimmed.dataUrl}" alt="A diagram of the creator journey drawn in LDraw"></div>
  <div class="foot"><span>ldraw.loftwah.com</span><span>Native .excalidraw &nbsp;·&nbsp; PNG + SVG &nbsp;·&nbsp; no account</span></div>
</div></body></html>`;

  const cardPage = await context.newPage();
  await cardPage.setViewportSize({ width: shareWidth, height: shareHeight });
  await cardPage.setContent(card, { waitUntil: "load" });
  await cardPage.evaluate(() => document.fonts.ready);
  const cardBytes = await cardPage.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: shareWidth, height: shareHeight },
  });
  await cardPage.close();
  return { captureBytes, captureSize, cardBytes, trimmed, card };
});

const image = pngSize(captured.cardBytes);
assert.equal(image.width, shareWidth);
assert.equal(image.height, shareHeight);
assert(captured.cardBytes.length < 5 * 1024 * 1024);
await mkdir(join(root, "public/og"), { recursive: true });
await mkdir(join(root, "output/og-card"), { recursive: true });
await writeFile(join(root, "public" + sharePath), captured.cardBytes);
await writeFile(
  join(root, "output/og-card/ldraw-og-source.html"),
  captured.card,
);
await writeFile(
  join(root, "output/og-card/canvas-capture.png"),
  captured.captureBytes,
);
const provenance = {
  app: "ldraw",
  kind: "social-card",
  path: sharePath,
  width: shareWidth,
  height: shareHeight,
  alt: shareAlt,
  headline: "Draw it out. Keep it editable.",
  method:
    "Playwright Chromium loads the built app, hides native Excalidraw chrome, captures the real dark canvas and trims the example title at the measured background gap. The card is then composed in local HTML with Space Grotesk and the authored LDraw mark.",
  renderer: "scripts/og.mjs",
  rendererSha256: sha(await readFile(join(root, "scripts/og.mjs"))),
  capturedAt: reviewedAt,
  source,
  sourceTree,
  workingTreeClean,
  browser: "Playwright Chromium, 1200×630 viewport, device scale 1",
  canvas: {
    width: captured.captureSize.width,
    height: captured.captureSize.height,
    sha256: sha(captured.captureBytes),
    trimmedGap: captured.trimmed.gap,
  },
  image: {
    width: image.width,
    height: image.height,
    bytes: captured.cardBytes.length,
    sha256: sha(captured.cardBytes),
  },
  fonts: [
    {
      family: "Space Grotesk",
      file: "public/brand/space.woff2",
      sha256: sha(await readFile(join(root, "public/brand/space.woff2"))),
    },
  ],
  mark: {
    file: "public/brand/ldraw-mark.svg",
    sha256: sha(await readFile(join(root, "public/brand/ldraw-mark.svg"))),
  },
  ownerReview: "not recorded",
};
await writeFile(
  join(root, "public/og/ldraw-og-provenance.json"),
  JSON.stringify(provenance, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      wrote: "public" + sharePath,
      width: image.width,
      height: image.height,
      bytes: captured.cardBytes.length,
      sha256: provenance.image.sha256,
      source,
      workingTreeClean,
      canvas: provenance.canvas,
    },
    null,
    2,
  ),
);

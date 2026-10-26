import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  canonical,
  checkLocal,
  description,
  inspectHead,
  origin,
  pngSize,
  robotsText,
  shareAlt,
  shareHeight,
  sharePath,
  shareWidth,
  sha256,
  sitemapText,
  socialImage,
  title,
} from "../scripts/seo.mjs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url));
const html = read("index.html").toString("utf8");

test("the committed head is a complete, indexable sharing contract", () => {
  const head = inspectHead(html);
  assert.equal(head.canonical, canonical);
  assert.equal(head.image, socialImage);
  assert.equal(head.title, title);
  assert.equal(head.description, description);
  assert.match(head.description, /Excalidraw/);
  assert.match(head.description, /no account or uploads/);
  assert.equal(head.schema["@type"], "WebApplication");
  assert.equal(head.schema.name, "LDraw");
  assert.deepEqual(head.schema.featureList.length, 4);
  assert.equal(head.schema.isAccessibleForFree, true);
  assert.equal(shareAlt.length > 80, true);
});

test("the share card is a real 1200×630 PNG bound to its provenance", () => {
  const bytes = read("public" + sharePath);
  const image = pngSize(bytes);
  assert.equal(image.width, shareWidth);
  assert.equal(image.height, shareHeight);
  assert.equal(image.bitDepth, 8);
  assert.ok(bytes.length > 40_000, "a blank card would not carry this detail");
  assert.ok(bytes.length < 5 * 1024 * 1024);
  const provenance = JSON.parse(
    read("public/og/ldraw-og-provenance.json").toString("utf8"),
  );
  assert.equal(provenance.path, sharePath);
  assert.equal(provenance.image.sha256, sha256(bytes));
  assert.equal(provenance.image.width, shareWidth);
  assert.equal(provenance.image.height, shareHeight);
  assert.equal(
    provenance.fonts[0].sha256,
    sha256(read("public/brand/space.woff2")),
  );
  assert.equal(
    provenance.mark.sha256,
    sha256(read("public/brand/ldraw-mark.svg")),
  );
  assert.equal(provenance.canvas.sha256.length, 64);
  assert.match(provenance.method, /Playwright Chromium/);
  // The card is agent-rendered. Never record an owner approval that did not happen.
  assert.equal(provenance.ownerReview, "not recorded");
});

test("robots and sitemap describe exactly this one public page", () => {
  assert.equal(read("public/robots.txt").toString("utf8"), robotsText());
  assert.equal(read("public/sitemap.xml").toString("utf8"), sitemapText());
  assert.match(
    robotsText(),
    /Sitemap: https:\/\/ldraw\.loftwah\.com\/sitemap\.xml/,
  );
  assert.equal((sitemapText().match(/<loc>/g) || []).length, 1);
});

test("the local release gate agrees with the committed source", () => {
  const summary = checkLocal();
  assert.equal(summary.canonical, canonical);
  assert.equal(summary.image.width, shareWidth);
  assert.equal(summary.image.height, shareHeight);
  assert.equal(summary.robots, true);
  assert.equal(summary.sitemap, true);
  assert.equal(summary.shareReady, true);
});

test("a preview, duplicate or missing field cannot pass as the public contract", () => {
  const noindex = html.replace(
    'content="index,follow,max-image-preview:large"',
    'content="noindex,nofollow"',
  );
  assert.throws(() => inspectHead(noindex), /indexable/);
  const duplicate = html.replace(
    '<meta property="og:type" content="website" />',
    '<meta property="og:type" content="website" /><meta property="og:type" content="article" />',
  );
  assert.throws(() => inspectHead(duplicate), /Duplicate/);
  const wrongCanonical = html.replace(
    '<link rel="canonical" href="https://ldraw.loftwah.com/" />',
    '<link rel="canonical" href="https://composer-ldraw.loftwah.workers.dev/" />',
  );
  assert.throws(() => inspectHead(wrongCanonical), /Canonical/);
  const wrongImage = html.replaceAll(socialImage, origin + "/og/other.png");
  assert.throws(() => inspectHead(wrongImage), /og:image/);
  const noSchema = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    "",
  );
  assert.throws(() => inspectHead(noSchema), /structured data/);
});

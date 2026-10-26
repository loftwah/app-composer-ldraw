// One reviewed public identity for search results and share cards.
// This app has a single public deployment; a preview or portable copy must set
// its own origin rather than inherit this one.
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const origin = "https://ldraw.loftwah.com";
export const pagePath = "/";
export const canonical = origin + pagePath;
export const siteName = "LDraw";
export const title = "LDraw — editable diagrams in your browser";
export const description =
  "Draw diagrams on a real Excalidraw canvas, keep the editable .excalidraw file and export PNG or SVG. Your drawings stay in this browser — no account or uploads.";
export const sharePath = "/og/ldraw-og.png";
export const shareAlt =
  "LDraw: the orange L mark and the words “Draw it out. Keep it editable.” above a diagram drawn in the charcoal Excalidraw workspace.";
export const shareWidth = 1200;
export const shareHeight = 630;
export const shareType = "image/png";
export const socialImage = origin + sharePath;

export const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export function pngSize(bytes) {
  if (
    bytes.length < 33 ||
    bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a" ||
    bytes.toString("ascii", 12, 16) !== "IHDR"
  )
    throw new Error("Expected a real PNG");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType: bytes[25],
  };
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const decode = (value) =>
  value.replace(
    /&(amp|quot|lt|gt|#39);/g,
    (_, name) => ({ amp: "&", quot: '"', lt: "<", gt: ">", "#39": "'" })[name],
  );

/** The social crawler contract, checked against the committed source head. */
export function inspectHead(html, options = {}) {
  const expectedCanonical = options.canonical ?? canonical;
  const image = options.image ?? socialImage;
  const expectedSiteName = options.siteName ?? siteName;
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  if (!head) throw new Error("Missing server-rendered head");
  const attrs = (tag) =>
    Object.fromEntries(
      [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(
        ([, key, a, b]) => [key.toLowerCase(), decode(a ?? b)],
      ),
    );
  const values = new Map();
  for (const tag of head.match(/<meta\b[^>]*>/gi) || []) {
    const a = attrs(tag);
    const key = a.property || a.name;
    if (!key) continue;
    if (values.has(key)) throw new Error("Duplicate metadata: " + key);
    values.set(key, a.content);
  }
  const canonicals = (head.match(/<link\b[^>]*>/gi) || [])
    .map(attrs)
    .filter((a) => a.rel === "canonical");
  if (canonicals.length !== 1)
    throw new Error("Exactly one canonical is required");
  if (canonicals[0].href !== expectedCanonical)
    throw new Error("Canonical does not match the reviewed origin");
  const titles = [...head.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  if (titles.length !== 1) throw new Error("Exactly one title is required");
  const foundTitle = decode(titles[0][1]);
  if (!foundTitle.includes("LDraw") || !/diagram/i.test(foundTitle))
    throw new Error("Title must identify LDraw and its diagram editor");
  const required = {
    "og:type": "website",
    "og:url": expectedCanonical,
    "og:site_name": expectedSiteName,
    "og:locale": "en_AU",
    "og:image": image,
    "og:image:secure_url": image,
    "og:image:type": shareType,
    "og:image:width": String(shareWidth),
    "og:image:height": String(shareHeight),
    "twitter:card": "summary_large_image",
    "twitter:image": image,
  };
  for (const [key, value] of Object.entries(required))
    if (values.get(key) !== value)
      throw new Error(key + " is " + JSON.stringify(values.get(key)));
  if (values.get("og:title") !== foundTitle)
    throw new Error("Open Graph title must match the document title");
  if (values.get("twitter:title") !== foundTitle)
    throw new Error("Twitter title must match the document title");
  const foundDescription = values.get("description") || "";
  if (foundDescription.length < 100 || foundDescription.length > 200)
    throw new Error("Description must stay useful in search results");
  for (const key of ["og:description", "twitter:description"])
    if (values.get(key) !== foundDescription)
      throw new Error(key + " must match the description");
  for (const key of ["og:image:alt", "twitter:image:alt"])
    if (values.get(key) !== shareAlt)
      throw new Error(key + " must describe the share card");
  if (/noindex/i.test(values.get("robots") || ""))
    throw new Error("The public page must stay indexable");
  if (!/max-image-preview:large/.test(values.get("robots") || ""))
    throw new Error("Ask crawlers for a large image preview");
  const schema = JSON.parse(
    head.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    )?.[1] || "null",
  );
  if (!schema) throw new Error("Missing structured data");
  if (schema["@type"] !== "WebApplication" || schema.url !== expectedCanonical)
    throw new Error("Structured data must describe this application");
  if (schema.image !== image) throw new Error("Structured data image drifted");
  return {
    title: foundTitle,
    canonical: expectedCanonical,
    image,
    description: foundDescription,
    schema,
  };
}

export function robotsText() {
  return "User-agent: *\nAllow: /\n\nSitemap: " + canonical + "sitemap.xml\n";
}

export function sitemapText() {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "  <url><loc>" +
    escape(canonical) +
    "</loc></url>\n" +
    "</urlset>\n"
  );
}

function file(root, relative) {
  return readFileSync(resolve(root, relative));
}

function requireFile(root, relative) {
  const path = resolve(root, relative);
  try {
    if (!statSync(path).isFile()) throw new Error("not a file");
  } catch {
    throw new Error("Missing " + relative);
  }
  return path;
}

/**
 * Local release gate. It reads the committed source head, the generated public
 * files and the exact share-card bytes. It never contacts the network.
 */
export function checkLocal(root = process.cwd()) {
  const head = inspectHead(file(root, "index.html").toString("utf8"));
  const config = JSON.parse(file(root, "wrangler.json").toString("utf8"));
  const route = config.routes?.find((entry) => entry.custom_domain);
  if (!route || route.pattern !== new URL(origin).host)
    throw new Error("Wrangler custom domain must match the reviewed origin");
  if (config.workers_dev !== true)
    throw new Error("The workers.dev address is an expected preview alias");

  for (const [relative, expected] of [
    ["public/robots.txt", robotsText()],
    ["public/sitemap.xml", sitemapText()],
  ]) {
    const actual = file(root, relative).toString("utf8");
    if (actual !== expected)
      throw new Error(
        relative + " is stale. Run node scripts/seo.mjs --write.",
      );
  }

  const imageBytes = file(root, "public" + sharePath);
  if (imageBytes.length > 5 * 1024 * 1024)
    throw new Error("Share card must stay under 5 MB");
  const image = pngSize(imageBytes);
  if (image.width !== shareWidth || image.height !== shareHeight)
    throw new Error(
      "Share card must be " + shareWidth + "×" + shareHeight + " pixels",
    );
  const provenance = JSON.parse(
    file(root, "public/og/ldraw-og-provenance.json").toString("utf8"),
  );
  if (provenance.path !== sharePath)
    throw new Error("Share-card provenance names another path");
  if (provenance.image?.sha256 !== sha256(imageBytes))
    throw new Error(
      "Share-card pixels changed without updating provenance. Re-run node scripts/og.mjs.",
    );
  if (
    provenance.image.width !== shareWidth ||
    provenance.image.height !== shareHeight
  )
    throw new Error("Share-card provenance dimensions drifted");

  const manifest = JSON.parse(
    file(root, "public/site.webmanifest").toString("utf8"),
  );
  if (
    manifest.name !== siteName ||
    manifest.short_name !== siteName ||
    manifest.start_url !== pagePath ||
    manifest.theme_color !== "#121212"
  )
    throw new Error("Install manifest drifted from the public identity");
  for (const icon of manifest.icons) {
    const bytes = file(root, "public" + icon.src);
    const image = pngSize(bytes);
    const [width, height] = String(icon.sizes).split("x").map(Number);
    if (image.width !== width || image.height !== height)
      throw new Error(
        "Install icon " + icon.src + " does not match its declared size",
      );
  }
  for (const relative of [
    "public/apple-touch-icon.png",
    "public/favicon.svg",
    "public/favicon-16.png",
    "public/favicon-32.png",
    "public/favicon-48.png",
    "public/favicon.ico",
    "public/brand/ldraw-mark.svg",
  ])
    requireFile(root, relative);
  for (const reference of [
    'href="/favicon.svg"',
    'href="/favicon-16.png"',
    'href="/favicon-32.png"',
    'href="/favicon-48.png"',
    'href="/apple-touch-icon.png"',
    'href="/site.webmanifest"',
    socialImage,
  ])
    if (!file(root, "index.html").toString("utf8").includes(reference))
      throw new Error("index.html does not reference " + reference);

  const headers = file(root, "public/_headers").toString("utf8");
  if (!headers.includes(sharePath + "\n  Cache-Control: public,"))
    throw new Error("The share card must have its own cache policy");

  return {
    ...head,
    image: { ...image, bytes: imageBytes.length, sha256: sha256(imageBytes) },
    robots: true,
    sitemap: true,
    icons: manifest.icons.length,
    shareReady: true,
  };
}

const write = process.argv.slice(2).includes("--write");
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  if (write) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(resolve("public/robots.txt"), robotsText());
    writeFileSync(resolve("public/sitemap.xml"), sitemapText());
    console.log("Wrote public/robots.txt and public/sitemap.xml");
  } else {
    try {
      console.log(JSON.stringify(checkLocal(), null, 2));
    } catch (error) {
      console.error("SEO check failed: " + error.message);
      process.exitCode = 1;
    }
  }
}

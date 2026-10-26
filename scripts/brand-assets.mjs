#!/usr/bin/env node
/**
 * LDraw's own favicon, install icons and web manifest, generated locally from
 * the authored mark. No remote service, font download or image model is used.
 *
 *   node scripts/brand-assets.mjs           # write the public files
 *   node scripts/brand-assets.mjs --check   # verify the committed files
 *
 * The 1200×630 social card is a separate release artifact: scripts/og.mjs.
 */
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { pngSize } from "./seo.mjs";

const run = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const publicDir = join(root, "public");
const check = process.argv.slice(2).includes("--check");
if (!check && process.argv.slice(2).length)
  throw new Error("Use --check or no argument.");

const manifest = {
  name: "LDraw",
  short_name: "LDraw",
  description:
    "A local-first Excalidraw workspace for editable diagrams, native files and PNG or SVG export.",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#121212",
  theme_color: "#121212",
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};

async function converter() {
  for (const candidate of ["magick", "convert"]) {
    try {
      await run(candidate, ["-version"]);
      return candidate;
    } catch {
      // Try the next local converter.
    }
  }
  throw new Error("ImageMagick (magick or convert) is required.");
}

const sizes = [
  ["favicon-16.png", 16, "mark"],
  ["favicon-32.png", 32, "mark"],
  ["favicon-48.png", 48, "mark"],
  ["apple-touch-icon.png", 180, "tile"],
  ["icon-192.png", 192, "icon"],
  ["icon-512.png", 512, "icon"],
];

async function writeAssets() {
  const convert = await converter();
  await writeFile(
    join(publicDir, "favicon.svg"),
    await readFile(join(publicDir, "brand", "ldraw-mark.svg")),
  );
  const convertOne = (source, size, output, extra = []) =>
    run(convert, [
      join(publicDir, "brand", source),
      "-background",
      "#141416",
      "-resize",
      `${size}x${size}`,
      ...extra,
      "-strip",
      "-depth",
      "8",
      `PNG32:${join(publicDir, output)}`,
    ]);
  for (const [output, size, source] of sizes)
    await convertOne(
      source === "icon" ? "ldraw-icon.svg" : "ldraw-mark.svg",
      size,
      output,
      source === "tile" ? ["-flatten"] : [],
    );
  // The maskable icon keeps its content inside the safe circle. It uses the
  // mark's own tile colour so there is no second square inside the tile.
  await run(convert, [
    join(publicDir, "brand", "ldraw-icon.svg"),
    "-background",
    "#141416",
    "-resize",
    "368x368",
    "-gravity",
    "center",
    "-extent",
    "512x512",
    "-flatten",
    "-strip",
    "-depth",
    "8",
    `PNG32:${join(publicDir, "icon-maskable-512.png")}`,
  ]);
  // A small multi-size ICO covers legacy tabs without a second source.
  const temporaryRoot = await mkdtemp(join(tmpdir(), "ldraw-brand-"));
  try {
    const icoParts = [];
    for (const size of [16, 32, 48]) {
      const part = join(temporaryRoot, `favicon-${size}.png`);
      await run(convert, [
        join(publicDir, "brand", "ldraw-mark.svg"),
        "-background",
        "none",
        "-resize",
        `${size}x${size}`,
        "-strip",
        "-depth",
        "8",
        part,
      ]);
      icoParts.push(part);
    }
    await run(convert, [...icoParts, "-strip", join(publicDir, "favicon.ico")]);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
  await writeFile(
    join(publicDir, "site.webmanifest"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        icons: [...sizes.map(([name]) => "/" + name), "/icon-maskable-512.png"],
        ico: "/favicon.ico",
        manifest: "/site.webmanifest",
      },
      null,
      2,
    ),
  );
}

async function checkAssets() {
  const failures = [];
  for (const [output, size] of sizes) {
    try {
      const bytes = await readFile(join(publicDir, output));
      const image = pngSize(bytes);
      if (image.width !== size || image.height !== size)
        failures.push(
          `${output} is ${image.width}×${image.height}, not ${size}`,
        );
      if (image.bitDepth !== 8) failures.push(`${output} is not 8-bit`);
    } catch (error) {
      failures.push(output + ": " + error.message);
    }
  }
  for (const [output, size] of [["icon-maskable-512.png", 512]]) {
    try {
      const image = pngSize(await readFile(join(publicDir, output)));
      if (image.width !== size || image.height !== size)
        failures.push(`${output} is not ${size}×${size}`);
    } catch (error) {
      failures.push(output + ": " + error.message);
    }
  }
  const ico = await readFile(join(publicDir, "favicon.ico"));
  if (ico.readUInt16LE(0) !== 0 || ico.readUInt16LE(2) !== 1)
    failures.push("favicon.ico is not a real icon container");
  if (ico.readUInt16LE(4) < 2) failures.push("favicon.ico has too few sizes");
  const written = JSON.parse(
    await readFile(join(publicDir, "site.webmanifest"), "utf8"),
  );
  if (JSON.stringify(written) !== JSON.stringify(manifest))
    failures.push(
      "site.webmanifest is stale. Run node scripts/brand-assets.mjs.",
    );
  for (const icon of manifest.icons) {
    try {
      await readFile(join(publicDir, icon.src));
    } catch {
      failures.push("manifest points at missing " + icon.src);
    }
  }
  const svg = await readFile(
    join(publicDir, "brand", "ldraw-mark.svg"),
    "utf8",
  );
  if (!svg.includes('aria-label="LDraw"'))
    failures.push("The mark lost its accessible name");
  const faviconSvg = await readFile(join(publicDir, "favicon.svg"), "utf8");
  if (faviconSvg !== svg)
    failures.push("favicon.svg is not the authored mark. Re-run the writer.");
  if (!faviconSvg.startsWith("<svg") || faviconSvg.length < 100)
    failures.push("favicon.svg is not a usable SVG icon");
  if (failures.length) {
    console.error("Brand asset check failed:\n- " + failures.join("\n- "));
    process.exitCode = 1;
  } else {
    console.log(
      JSON.stringify(
        {
          icons: (await readdir(publicDir))
            .filter((name) => /^(favicon|icon-|apple-touch)/.test(name))
            .sort(),
          manifest: "verified",
          maskableSafeArea: "content at 368 of 512 px",
        },
        null,
        2,
      ),
    );
  }
}

if (check) await checkAssets();
else await writeAssets();

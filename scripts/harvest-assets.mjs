#!/usr/bin/env node
/**
 * Repeatable portfolio asset harvest.
 *
 *   node scripts/harvest-assets.mjs --check
 *   node scripts/harvest-assets.mjs --write
 *   node scripts/harvest-assets.mjs --discover
 *
 * The maintained record is catalogue/assets.json. The source files live in
 * sibling project checkouts, selected once with --repos-root. The command
 * preserves every approval/label/note field and only updates the local WebP,
 * thumbnail, dimensions and hashes. Discovery is read-only and prints
 * tracked images that are not yet in the manifest.
 *
 * No network request is made. Conversion uses an existing ImageMagick or
 * cwebp install; a missing converter fails loudly instead of shipping a fake
 * derivative.
 */
import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  readdir,
  rename,
  writeFile,
} from "node:fs/promises";
import { constants } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifestPath = join(repoRoot, "catalogue", "assets.json");
const discoveryPath = join(repoRoot, "catalogue", "discovery.json");
const args = process.argv.slice(2);
const mode = args.includes("--write")
  ? "write"
  : args.includes("--discover")
    ? "discover"
    : "check";
const rootIndex = args.indexOf("--repos-root");
const reposRoot = resolve(
  rootIndex >= 0 ? args[rootIndex + 1] : join(repoRoot, ".."),
);

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

function webpSize(bytes) {
  if (bytes.toString("ascii", 0, 4) !== "RIFF")
    throw new Error("Not a WebP file");
  if (bytes.toString("ascii", 8, 12) !== "WEBP")
    throw new Error("Not a WebP file");
  const chunk = bytes.toString("ascii", 12, 16);
  if (chunk === "VP8X")
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
    };
  if (chunk === "VP8L") {
    const b1 = bytes[21];
    const b2 = bytes[22];
    const b3 = bytes[23];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | bytes[20]),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }
  if (chunk === "VP8 ") {
    if (bytes.readUIntLE(23, 3) !== 0x2a019d)
      throw new Error("Unsupported VP8 WebP frame");
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  }
  throw new Error(`Unknown WebP chunk ${chunk}`);
}

async function converter() {
  for (const candidate of [
    ["magick", ["-version"]],
    ["convert", ["-version"]],
    ["cwebp", ["-version"]],
  ]) {
    try {
      await run(candidate[0], candidate[1], { timeout: 10_000 });
      return candidate[0];
    } catch {
      // Try the next existing host tool.
    }
  }
  throw new Error(
    "Install ImageMagick (magick or convert) or cwebp before harvesting portfolio assets.",
  );
}

function sourcePath(entry) {
  const [first] = entry.source.split("/");
  if (first.startsWith("app-composer-") || first === "app-composer") {
    return { repo: first, path: join(reposRoot, entry.source) };
  }
  const candidates = [
    "woodhouse-new",
    "phase-11",
    "bubbles",
    "shoalshot-release",
    "fighter",
    "loftwahfm",
    "asset-hunter",
    "max",
    "pirates",
  ];
  const repo = candidates.find(
    (name) => entry.source === name || entry.source.startsWith(`${name}/`),
  );
  if (repo) return { repo, path: join(reposRoot, entry.source) };
  return { repo: "app-composer-ldraw", path: join(repoRoot, entry.source) };
}

async function convert(tool, input, output, max, quality) {
  await mkdir(dirname(output), { recursive: true });
  const temp = `${output}.tmp.webp`;
  if (tool === "cwebp") {
    await run(
      tool,
      ["-quiet", "-q", String(quality), "-resize", String(max), "0", input, "-o", temp],
      { timeout: 90_000 },
    );
  } else {
    await run(
      tool,
      [
        input,
        "-auto-orient",
        "-strip",
        "-background",
        "none",
        "-resize",
        `${max}x${max}>`,
        "-quality",
        String(quality),
        `webp:${temp}`,
      ],
      { timeout: 90_000 },
    );
  }
  await rename(temp, output);
}

async function discover(entries) {
  let config = {};
  try {
    config = JSON.parse(await readFile(discoveryPath, "utf8"));
  } catch {
    config = {};
  }
  const known = new Set(entries.map((entry) => entry.source));
  const repos = Object.keys(config);
  const results = [];
  for (const repo of repos) {
    const settings = config[repo];
    let files = [];
    try {
      const { stdout } = await run("git", ["-C", join(reposRoot, repo), "ls-files"], {
        maxBuffer: 20 * 1024 * 1024,
      });
      files = stdout.split("\n").filter(Boolean);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!/\.(png|jpe?g|webp|gif|avif)$/i.test(file)) continue;
      if (!settings.include.some((prefix) => file.startsWith(prefix))) continue;
      if ((settings.ignore ?? []).some((pattern) => new RegExp(pattern).test(file)))
        continue;
      const source = `${repo}/${file}`;
      if (!known.has(source)) results.push(source);
    }
  }
  results.sort();
  console.log(
    JSON.stringify(
      {
        reposRoot,
        mode: "discover",
        manifestAssets: entries.length,
        candidates: results.length,
        firstCandidates: results.slice(0, 120),
        note: "Read-only. Review a candidate, add an explicit approval/status record, then run --write.",
      },
      null,
      2,
    ),
  );
}

const entries = JSON.parse(await readFile(manifestPath, "utf8"));
if (!Array.isArray(entries) || !entries.length)
  throw new Error("catalogue/assets.json must contain a non-empty array.");
if (mode === "discover") {
  await discover(entries);
  process.exit(0);
}

const tool = mode === "write" ? await converter() : null;
const failures = [];
const changes = [];

for (const entry of entries) {
  const source = sourcePath(entry);
  const output = join(repoRoot, "public", entry.file.replace(/^\//, ""));
  const thumb = join(repoRoot, "public", entry.thumb.replace(/^\//, ""));
  let sourceBytes;
  try {
    sourceBytes = await readFile(source.path);
  } catch {
    if (mode === "write")
      failures.push(`${entry.id}: source missing at ${entry.source}`);
    else
      console.warn(
        `warning: ${entry.id}: source checkout unavailable (${entry.source}); derivative checked only`,
      );
  }

  if (mode === "write") {
    if (!sourceBytes) continue;
    await convert(tool, source.path, output, 1200, 82);
    await convert(tool, output, thumb, 420, 80);
    const derivative = await readFile(output);
    const size = webpSize(derivative);
    entry.sourceSha = hash(sourceBytes);
    entry.derivativeSha = hash(derivative);
    entry.width = size.width;
    entry.height = size.height;
    changes.push(entry.id);
    continue;
  }

  if (sourceBytes && entry.sourceSha && hash(sourceBytes) !== entry.sourceSha)
    failures.push(
      `${entry.id}: source changed (${entry.source}); run --write after review`,
    );
  try {
    const derivative = await readFile(output);
    if (hash(derivative) !== entry.derivativeSha)
      failures.push(`${entry.id}: derivative hash does not match the manifest`);
    const size = webpSize(derivative);
    if (size.width !== entry.width || size.height !== entry.height)
      failures.push(`${entry.id}: derivative dimensions do not match the manifest`);
    await access(thumb, constants.R_OK);
  } catch {
    failures.push(`${entry.id}: derivative or thumbnail is missing`);
  }
}

if (mode === "write") {
  const temp = `${manifestPath}.tmp`;
  await writeFile(temp, `${JSON.stringify(entries, null, 2)}\n`);
  await rename(temp, manifestPath);
  console.log(
    JSON.stringify(
      {
        mode,
        reposRoot,
        assets: entries.length,
        converted: changes.length,
        failures,
        next: "node scripts/catalogue.mjs --write",
      },
      null,
      2,
    ),
  );
} else {
  console.log(
    JSON.stringify(
      {
        mode,
        reposRoot,
        assets: entries.length,
        failures,
        note: "Check verifies local derivatives and available source hashes. Run --write to refresh changed sources.",
      },
      null,
      2,
    ),
  );
}
if (failures.length) process.exitCode = 1;

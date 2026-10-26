import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { readReleaseConfig } from "./release-config.mjs";
import { verifySeo } from "./verify-seo.mjs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
function guard() {
  if (git("branch", "--show-current") !== "main")
    throw new Error("Release requires main.");
  const sha = git("rev-parse", "HEAD");
  if (git("rev-parse", "origin/main") !== sha || git("status", "--porcelain"))
    throw new Error("Release requires clean pushed origin/main.");
  return sha;
}
const sha = guard();
await readReleaseConfig();
const qualification = JSON.parse(
  await readFile("output/qualification.json", "utf8"),
);
if (qualification.source !== sha || qualification.status !== "passed")
  throw new Error(
    "Run fresh local qualification at the exact release source first.",
  );
for (const args of [["audit", "--audit-level", "low"], ["check"], ["build"]])
  execFileSync("pnpm", args, { stdio: "inherit" });
if (guard() !== sha) throw new Error("Source changed during release checks.");
execFileSync(
  "pnpm",
  ["exec", "wrangler", "deploy", "--message", `LDraw ${sha}`],
  { stdio: "inherit" },
);
const response = await fetch(
  `https://ldraw.loftwah.com/build.json?source=${sha}`,
  { cache: "no-store" },
);
if (!response.ok || (await response.json()).source !== sha)
  throw new Error("Live source identity does not match the release.");
const seo = await verifySeo({
  origin: "https://ldraw.loftwah.com",
  imageBytes: await readFile("public/og/ldraw-og.png"),
});
console.log(
  JSON.stringify(
    {
      seo: {
        image: seo.image,
        imageSha256: seo.imageSha256,
        crawlers: seo.records.length,
        robots: seo.robots,
        sitemap: seo.sitemap,
        real404: seo.real404,
        providerCacheRenderingVerified: false,
      },
    },
    null,
    2,
  ),
);
console.log(
  `Deployed exact source ${sha}; fresh live interaction and hostname evidence remains required.`,
);

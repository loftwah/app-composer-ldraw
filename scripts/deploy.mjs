// Local-only release from reviewed clean pushed main to the declared LDraw target.
// One monotonic run spans the dependency audit, required checks, the single build,
// qualification of that exact build, upload and exact live identity. The split
// check/build/qualify commands are not run again outside this contract, so the
// release does not duplicate a build. No pre-existing qualification is trusted:
// the run builds, then qualifies the same tree.
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { readReleaseConfig, verifyQualification } from "./release-config.mjs";
import { assertReleaseProvenance } from "./seo.mjs";
import { verifySeo } from "./verify-seo.mjs";
import {
  createGitHubAdapter,
  createReleaseRun,
} from "./lib/release-timing.mjs";

const REPO = "loftwah/app-composer-ldraw";
const ORIGIN = "https://ldraw.loftwah.com";
const run = (command, args, options = {}) =>
  execFileSync(command, args, { encoding: "utf8", ...options });
const git = (...args) => run("git", args).trim();
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
assertReleaseProvenance();

let github = null;
try {
  github = createGitHubAdapter({ repo: REPO });
} catch (error) {
  console.error(
    "Delivery SLA alert reporting is unavailable; a redacted pending event will be queued. " +
      error.message,
  );
}
const release = createReleaseRun({
  repo: REPO,
  project: "ldraw",
  sha,
  releasePath: "scripts/deploy.mjs",
  kind: "worker-static-assets",
  receiptDir: ".release/timing",
  firstEditAt: process.env.LDRAW_FIRST_EDIT_AT,
  github,
});
await release.flushPending();

const stage = async (name, work) => {
  const started = performance.now();
  const result = await release.stage(name, work);
  console.log(
    `Release gate passed: ${name} (${((performance.now() - started) / 1000).toFixed(1)}s)`,
  );
  return result;
};

let target = null;
try {
  await stage("dependency audit", () =>
    run("pnpm", ["run", "audit"], { stdio: "inherit" }),
  );
  await stage("required checks", () =>
    run("pnpm", ["check"], { stdio: "inherit" }),
  );
  await stage("build", () => run("pnpm", ["build"], { stdio: "inherit" }));
  if (guard() !== sha) throw new Error("Source changed during release checks.");

  // Qualify writes the receipt only after the current build passes.
  await stage("qualification of this build", () =>
    run("pnpm", ["qualify"], { stdio: "inherit" }),
  );
  const qualification = verifyQualification(
    JSON.parse(await readFile("output/qualification.json", "utf8")),
    sha,
  );
  if (guard() !== sha) throw new Error("Source changed during qualification.");

  await stage("upload", () =>
    run("pnpm", ["exec", "wrangler", "deploy", "--message", `LDraw ${sha}`], {
      stdio: "inherit",
    }),
  );
  target = ORIGIN;

  const verified = await stage("exact live identity and SEO", async () => {
    const response = await fetch(`${ORIGIN}/build.json?source=${sha}`, {
      cache: "no-store",
    });
    if (!response.ok || (await response.json()).source !== sha)
      throw new Error("Live source identity does not match the release.");
    const seo = await verifySeo({
      origin: ORIGIN,
      imageBytes: await readFile("public/og/ldraw-og.png"),
    });
    return seo;
  });

  const receipt = await release.finish({
    status: "passed",
    target,
    liveRevision: sha,
  });
  console.log(
    JSON.stringify(
      {
        sourceSha: sha,
        origin: target,
        liveRevision: sha,
        qualification: qualification.source,
        timing: {
          status: receipt.status,
          totalMs: receipt.totalMs,
          receipt: `.release/timing/receipt-${receipt.runId}.json`,
        },
        seo: {
          image: verified.image,
          imageSha256: verified.imageSha256,
          crawlers: verified.records.length,
          robots: verified.robots,
          sitemap: verified.sitemap,
          real404: verified.real404,
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
  console.log(
    `release ${receipt.status}: ${(receipt.totalMs / 1000).toFixed(1)}s (target ${(receipt.targetMs / 1000).toFixed(0)}s, limit ${(receipt.limitMs / 1000).toFixed(0)}s)`,
  );
} catch (error) {
  await release.fail(error, { target });
  throw error;
}

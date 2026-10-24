import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

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
const config = JSON.parse(await readFile("wrangler.jsonc", "utf8"));
if (
  config.name !== "composer-ldraw" ||
  config.account_id !== "1003dc1d93af0ebea56b2f1252f89627" ||
  config.assets?.directory !== "dist" ||
  config.routes?.length !== 1 ||
  config.routes[0].pattern !== "ldraw.loftwah.com" ||
  config.routes[0].custom_domain !== true
)
  throw new Error("Unexpected LDraw account, assets or hostname.");
for (const key of [
  "main",
  "d1_databases",
  "r2_buckets",
  "services",
  "kv_namespaces",
  "queues",
  "triggers",
])
  if (config[key]) throw new Error(`LDraw cannot deploy ${key}.`);
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
console.log(
  `Deployed exact source ${sha}; fresh live interaction and hostname evidence remains required.`,
);

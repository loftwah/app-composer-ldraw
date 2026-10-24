import { readFile } from "node:fs/promises";

export function validateReleaseConfig(config) {
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
  return config;
}
export async function readReleaseConfig() {
  return validateReleaseConfig(
    JSON.parse(
      await readFile(new URL("../wrangler.json", import.meta.url), "utf8"),
    ),
  );
}

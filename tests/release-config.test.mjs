import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readReleaseConfig,
  validateReleaseConfig,
} from "../scripts/release-config.mjs";

test("actual release configuration parses and passes the deployed guard parser", async () => {
  const config = await readReleaseConfig();
  assert.equal(config.name, "composer-ldraw");
  assert.equal(config.routes[0].pattern, "ldraw.loftwah.com");
});
test("release rejects another account or hostname", async () => {
  const config = await readReleaseConfig();
  assert.throws(
    () => validateReleaseConfig({ ...config, account_id: "other" }),
    /Unexpected/,
  );
  assert.throws(
    () =>
      validateReleaseConfig({
        ...config,
        routes: [{ pattern: "other.invalid", custom_domain: true }],
      }),
    /Unexpected/,
  );
});
test("release rejects accidental production service or data bindings", async () => {
  const config = await readReleaseConfig();
  for (const binding of [
    "main",
    "d1_databases",
    "r2_buckets",
    "services",
    "kv_namespaces",
    "queues",
    "triggers",
  ])
    assert.throws(
      () => validateReleaseConfig({ ...config, [binding]: [{}] }),
      /cannot deploy/,
    );
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readReleaseConfig,
  validateReleaseConfig,
  verifyQualification,
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
test("release only accepts fresh qualification of the exact source", () => {
  const sha = "a".repeat(40);
  assert.equal(
    verifyQualification({ source: sha, status: "passed" }, sha).source,
    sha,
  );
  assert.throws(
    () =>
      verifyQualification({ source: "b".repeat(40), status: "passed" }, sha),
    /exact release source/,
  );
  assert.throws(
    () => verifyQualification({ source: sha, status: "failed" }, sha),
    /exact release source/,
  );
  assert.throws(() => verifyQualification(null, sha), /exact release source/);
});

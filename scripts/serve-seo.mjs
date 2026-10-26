#!/usr/bin/env node
/**
 * Run the live search/sharing gate against the built static assets.
 *
 *   pnpm build
 *   pnpm seo:serve
 *
 * Cloudflare's `_headers` rules are not emulated by the local static server, so
 * the delivery cache-header assertion is skipped here. The same script runs in
 * `pnpm deploy` against the real hostname with those headers required.
 */
import { readFile } from "node:fs/promises";
import { withBrowser } from "./browser.mjs";
import { origin as publicOrigin, sharePath } from "./seo.mjs";
import { verifySeo } from "./verify-seo.mjs";

const imageBytes = await readFile(
  new URL("../public" + sharePath, import.meta.url),
);
const result = await withBrowser(async ({ origin }) =>
  verifySeo({
    origin,
    publicOrigin,
    imageBytes,
    cacheHeaders: false,
  }),
);
console.log(JSON.stringify(result, null, 2));

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { localizeFontFallback } from "../scripts/font-assets.mjs";

for (const mode of ["dev", "prod"]) {
  test(`pinned Excalidraw ${mode} font manager registers only a local fallback`, async () => {
    const directory = `node_modules/@excalidraw/excalidraw/dist/${mode}`;
    let rewritten = 0;
    for (const filename of await readdir(directory)) {
      if (!filename.endsWith(".js")) continue;
      const source = await readFile(`${directory}/${filename}`, "utf8");
      const result = localizeFontFallback(source);
      if (result === null) continue;
      rewritten += 1;
      assert.ok(
        result.includes(
          "new URL('/excalidraw-assets/', window.location.origin).href",
        ),
      );
      assert.ok(!result.includes("https://esm.sh/"));
      assert.equal(
        (result.match(/new URL\('\/excalidraw-assets\//g) ?? []).length,
        1,
      );
    }
    assert.equal(
      rewritten,
      1,
      "Expected exactly one published font manager module",
    );
  });
}
test("a changed upstream font declaration fails closed", () => {
  assert.throws(
    () => localizeFontFallback("ASSETS_FALLBACK_URL = changed"),
    /Review the pinned package/,
  );
  assert.equal(localizeFontFallback("unrelated module"), null);
});

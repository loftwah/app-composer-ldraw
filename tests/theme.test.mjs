import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("first paint resolves a dark default before the editor module runs", async () => {
  const html = await readFile("index.html", "utf8");
  const init = await readFile("public/theme-init.js", "utf8");
  assert.ok(
    html.indexOf("/theme-init.js") > 0 &&
      html.indexOf("/theme-init.js") < html.indexOf("/src/main.tsx"),
    "theme-init must run before the editor bundle",
  );
  assert.match(html, /name="theme-color" content="#121212"/);
  assert.match(init, /stored === "light"[\s\S]*: "dark"/);
  assert.match(init, /prefers-color-scheme: dark/);
  assert.match(init, /root\.style\.backgroundColor/);
});

test("the public contract publishes appearance, library and example features", async () => {
  const manifest = JSON.parse(
    await readFile("public/app.manifest.json", "utf8"),
  );
  assert.equal(manifest.version, "1.3.0");
  for (const feature of [
    "dark-default-appearance",
    "named-block-library",
    "finished-examples",
    "portfolio-artwork-library",
    "source-verified-architecture",
    "presentation-mode",
    "favicons-and-manifest",
  ])
    assert.ok(manifest.ldraw.features.includes(feature), feature);
});

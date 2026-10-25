import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { createLdrawMcp, launchScope } from "../scripts/mcp/server.mjs";
import { measureText } from "../scripts/mcp/metrics.mjs";
import { withBrowser } from "../scripts/browser.mjs";

const enabled = process.env.LDRAW_RENDER_TEST === "1";
const corpus = [
  "App Composer architecture",
  "Owner intent stays separate from agent implementation.",
  "One owner · independent apps · shared discovery",
  "Brief and intent",
  "The quick brown fox jumps over the lazy dog 0123456789",
];

test(
  "the MCP render tool writes real editable/PNG/SVG output and the font table is exact",
  {
    skip: enabled
      ? false
      : "set LDRAW_RENDER_TEST=1 after pnpm build to run the browser render check",
  },
  async (t) => {
    const root = await mkdtemp(join(tmpdir(), "ldraw-mcp-render-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    const scope = launchScope(["--workspace", root]);
    const server = createLdrawMcp(scope);
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({
      name: "ldraw-render-consumer",
      version: "1.0.0",
    });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
      const created = await client.callTool({
        name: "ldraw_create_scene",
        arguments: {
          path: "app-composer.excalidraw",
          template: "composer-pipeline",
        },
      });
      assert.equal(created.isError, undefined);
      const modified = await client.callTool({
        name: "ldraw_modify_scene",
        arguments: {
          path: "app-composer.excalidraw",
          expectedRevision: created.structuredContent.revision,
          operations: [
            {
              op: "insert_block",
              block: "composer-review",
              idPrefix: "review",
              x: 0,
              y: 140,
            },
            {
              op: "add_label",
              id: "demo-title",
              text: "App Composer architecture",
              x: 0,
              y: -70,
              fontSize: 32,
            },
          ],
        },
      });
      assert.equal(modified.isError, undefined);

      const rendered = await client.callTool({
        name: "ldraw_render_scene",
        arguments: {
          path: "app-composer.excalidraw",
          outputDir: "rendered",
          expectedRevision: modified.structuredContent.revision,
        },
      });
      assert.equal(rendered.isError, undefined, rendered.content?.[0]?.text);
      const value = rendered.structuredContent;
      assert.equal(value.provenance.renderer, "@excalidraw/excalidraw@0.18.1");
      assert.equal(value.provenance.svgEmbedsLocalFont, true);
      assert.equal(value.provenance.svgExternalReferences, 0);
      assert.ok(value.provenance.durationMs > 0);
      assert.deepEqual(
        value.files.map((file) => file.path),
        [
          "rendered/drawing.excalidraw",
          "rendered/drawing.png",
          "rendered/drawing.svg",
        ],
      );
      const png = await readFile(join(root, "rendered/drawing.png"));
      assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
      const svg = await readFile(join(root, "rendered/drawing.svg"), "utf8");
      assert.match(svg, /<svg/);
      assert.match(svg, /App Composer architecture/);
      assert.match(svg, /@font-face/);
      assert.match(svg, /data:font\/woff2;base64/);
      assert.doesNotMatch(svg, /(?:href|src)="https?:\/\//);
      assert.doesNotMatch(svg, /esm\.sh/);
      const restored = JSON.parse(
        await readFile(join(root, "rendered/drawing.excalidraw"), "utf8"),
      );
      assert.equal(restored.type, "excalidraw");
      assert.equal(restored.version, 2);
      const source = JSON.parse(
        await readFile(join(root, "app-composer.excalidraw"), "utf8"),
      );
      for (const element of source.elements)
        assert.ok(
          restored.elements.some((next) => next.id === element.id),
          `renderer lost ${element.id}`,
        );
      assert.equal(value.source.revision, modified.structuredContent.revision);

      // A stale render revision renders nothing and writes nothing.
      const stale = await client.callTool({
        name: "ldraw_render_scene",
        arguments: {
          path: "app-composer.excalidraw",
          outputDir: "stale",
          expectedRevision: created.structuredContent.revision,
        },
      });
      assert.equal(stale.isError, true);
      assert.match(stale.content[0].text, /changed since it was read/);
      assert.deepEqual(await readdir(root).catch(() => []), [
        "app-composer.excalidraw",
        "rendered",
      ]);

      // Empty scenes fail before a browser launch and create no output folder.
      await writeFile(
        join(root, "empty.excalidraw"),
        JSON.stringify({
          type: "excalidraw",
          version: 2,
          elements: [],
          appState: {},
          files: {},
        }),
      );
      const empty = await client.callTool({
        name: "ldraw_render_scene",
        arguments: { path: "empty.excalidraw", outputDir: "empty-render" },
      });
      assert.equal(empty.isError, true);
      assert.match(empty.content[0].text, /Add something/);
      await assert.rejects(() => readdir(join(root, "empty-render")), /ENOENT/);
    } finally {
      await client.close();
      await server.close();
    }

    // Same browser, same bundled font: the committed table must match the
    // engine's own Canvas measurement exactly, or the saved bounds would clip.
    const measured = await withBrowser(async ({ page }) => {
      await page.evaluate(() =>
        document.fonts.load("100px Excalifont", "App Composer"),
      );
      return page.evaluate((strings) => {
        const context = document.createElement("canvas").getContext("2d");
        return strings.map((value) => {
          context.font = "20px Excalifont";
          return { value, width: context.measureText(value).width };
        });
      }, corpus);
    });
    for (const row of measured) {
      const predicted = measureText(row.value, 20).width;
      assert.ok(
        Math.abs(predicted - row.width) <= 0.02,
        `${row.value}: predicted ${predicted} vs engine ${row.width}`,
      );
    }
  },
);

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { createLdrawMcp, launchScope } from "../scripts/mcp/server.mjs";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const readOnlyTools = ["ldraw_list_templates", "ldraw_read_scene"];
const editingTools = [
  "ldraw_create_scene",
  "ldraw_modify_scene",
  "ldraw_render_scene",
];

async function workspace(t) {
  const root = await mkdtemp(join(tmpdir(), "ldraw-mcp-server-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function connect(root, extra = []) {
  const scope = launchScope(["--workspace", root, ...extra]);
  const server = createLdrawMcp(scope);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "ldraw-test-consumer", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    client,
    async close() {
      await client.close();
      await server.close();
    },
  };
}

test("launch scope is fixed by the host and credentials are not launch arguments", () => {
  assert.deepEqual(launchScope(["--workspace", "/fictional/drawings"]), {
    workspace: "/fictional/drawings",
    readOnly: false,
  });
  assert.equal(
    launchScope(["--workspace", "/fictional/drawings", "--read-only"]).readOnly,
    true,
  );
  for (const args of [
    [],
    ["--workspace"],
    ["--workspace", "--read-only"],
    ["--workspace", "/a", "--workspace", "/b"],
    ["--workspace", "/a", "--read-only", "--read-only"],
    ["--workspace", "/a", "--token", "fictional"],
    ["--workspace", "/a", "--allow-shell"],
    ["relative"],
  ])
    assert.throws(() => launchScope(args));
});

test("tool surface is bounded, annotated and read-only mode exposes no writes", async (t) => {
  const root = await workspace(t);
  const editable = await connect(root);
  try {
    const tools = (await editable.client.listTools()).tools;
    assert.deepEqual(
      tools.map((tool) => tool.name).sort(),
      [...readOnlyTools, ...editingTools].sort(),
    );
    for (const tool of tools) {
      assert.equal(tool.annotations.openWorldHint, false, tool.name);
      assert.equal(tool.annotations.destructiveHint, false, tool.name);
      assert.equal(
        tool.annotations.readOnlyHint,
        readOnlyTools.includes(tool.name),
        tool.name,
      );
      assert.match(
        tool.description,
        /workspace|Read|write|render|edit/i,
        tool.name,
      );
    }
    for (const tool of tools) {
      const refused = await editable.client.callTool({
        name: tool.name,
        arguments: { path: "x.excalidraw", command: "rm -rf /" },
      });
      assert.equal(refused.isError, true, tool.name);
    }
    assert.deepEqual(
      await readFile(join(root, "x.excalidraw"), "utf8").catch(() => null),
      null,
    );
  } finally {
    await editable.close();
  }
  const readOnly = await connect(root, ["--read-only"]);
  try {
    const tools = (await readOnly.client.listTools()).tools;
    assert.deepEqual(tools.map((tool) => tool.name).sort(), readOnlyTools);
  } finally {
    await readOnly.close();
  }
});

test("catalogue reports honest brand status and the measured font set", async (t) => {
  const root = await workspace(t);
  const { client, close } = await connect(root);
  try {
    const catalog = (
      await client.callTool({ name: "ldraw_list_templates", arguments: {} })
    ).structuredContent;
    assert.equal(catalog.presets.length, 6);
    assert.ok(catalog.blocks.length >= 18);
    assert.ok(
      catalog.collections.some((collection) => collection.id === "composer"),
    );
    const composer = catalog.projects.find(
      (project) => project.key === "composer",
    );
    assert.equal(composer.brand.status, "approved-identity");
    assert.equal(composer.stroke, "#FC5B05");
    const infrastructure = catalog.projects.find(
      (project) => project.key === "infrastructure",
    );
    assert.equal(infrastructure.brand.status, "diagram-topic");
    const unresolved = catalog.apps.filter(
      (app) => app.brand.status === "starting-data",
    );
    assert.ok(
      unresolved.length >= 3,
      "starting colours must not read as approval",
    );
    assert.deepEqual(catalog.unresolvedBrandIdentities, ["Pirates"]);
    assert.equal(catalog.textMetrics.font, "Excalifont");
    assert.equal(catalog.textMetrics.engine, "@excalidraw/excalidraw@0.18.1");
    assert.equal(
      catalog.rules.network,
      "none; rendering is local Playwright against the built app",
    );
  } finally {
    await close();
  }
});

test("create, read, modify and validate round trip keeps ids and refuses stale edits", async (t) => {
  const root = await workspace(t);
  const { client, close } = await connect(root);
  try {
    const created = await client.callTool({
      name: "ldraw_create_scene",
      arguments: {
        path: "drawings/architecture.excalidraw",
        template: "architecture",
        project: "infrastructure",
      },
    });
    assert.equal(created.isError, undefined);
    assert.match(created.structuredContent.revision, /^sha256:[a-f0-9]{64}$/);
    const path = join(root, "drawings/architecture.excalidraw");
    const first = JSON.parse(await readFile(path, "utf8"));
    assert.equal(first.type, "excalidraw");
    assert.equal(first.version, 2);
    const before = first.elements.map((element) => element.id);

    const again = await client.callTool({
      name: "ldraw_create_scene",
      arguments: {
        path: "drawings/architecture.excalidraw",
        template: "architecture",
      },
    });
    assert.equal(again.isError, true);
    assert.match(again.content[0].text, /already exists/);

    const read = await client.callTool({
      name: "ldraw_read_scene",
      arguments: { path: "drawings/architecture.excalidraw" },
    });
    assert.equal(read.structuredContent.valid, true);
    assert.equal(
      read.structuredContent.revision,
      created.structuredContent.revision,
    );
    assert.ok(
      read.structuredContent.elementSummaries.some(
        (entry) => entry.type === "text",
      ),
    );

    const modified = await client.callTool({
      name: "ldraw_modify_scene",
      arguments: {
        path: "drawings/architecture.excalidraw",
        expectedRevision: read.structuredContent.revision,
        operations: [
          {
            op: "update_label",
            id: "preset-title",
            text: "Service architecture (reviewed)",
          },
          {
            op: "add_label",
            id: "review-owner",
            text: "Owner decision",
            x: 80,
            y: 520,
            fontSize: 20,
            tone: "accent",
          },
          {
            op: "insert_block",
            block: "composer-review",
            idPrefix: "review",
            x: 420,
            y: 500,
          },
        ],
      },
    });
    assert.equal(modified.isError, undefined);
    assert.deepEqual(modified.structuredContent.updated, ["preset-title"]);
    assert.ok(modified.structuredContent.added.includes("review-owner"));

    const next = JSON.parse(await readFile(path, "utf8"));
    for (const id of before)
      assert.ok(
        next.elements.some((element) => element.id === id),
        id,
      );
    assert.equal(
      next.elements.find((element) => element.id === "preset-title").text,
      "Service architecture (reviewed)",
    );
    assert.ok(
      next.elements.some(
        (element) => element.id === "review-composer-review-owner",
      ),
    );

    const stale = await client.callTool({
      name: "ldraw_modify_scene",
      arguments: {
        path: "drawings/architecture.excalidraw",
        expectedRevision: created.structuredContent.revision,
        operations: [
          { op: "update_label", id: "preset-title", text: "Stale overwrite" },
        ],
      },
    });
    assert.equal(stale.isError, true);
    assert.match(stale.content[0].text, /changed since it was read/);
    assert.match(stale.content[0].text, /ldraw_read_scene/);
    assert.match(stale.content[0].text, /was not modified/);
    assert.equal(
      JSON.parse(await readFile(path, "utf8")).elements.find(
        (element) => element.id === "preset-title",
      ).text,
      "Service architecture (reviewed)",
    );

    const refused = await client.callTool({
      name: "ldraw_modify_scene",
      arguments: {
        path: "drawings/architecture.excalidraw",
        expectedRevision: modified.structuredContent.revision,
        operations: [{ op: "update_label", id: "does-not-exist", text: "x" }],
      },
    });
    assert.equal(refused.isError, true);
    assert.match(refused.content[0].text, /No element has id/);
    assert.equal(
      JSON.parse(await readFile(path, "utf8")).elements.length,
      next.elements.length,
    );
  } finally {
    await close();
  }
});

test("malformed, remote-asset and missing-image scenes fail without a write", async (t) => {
  const root = await workspace(t);
  const { client, close } = await connect(root);
  try {
    const base = {
      type: "excalidraw",
      version: 2,
      elements: [
        {
          id: "human",
          type: "text",
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          angle: 0,
          text: "keep me",
        },
      ],
      appState: {},
      files: {},
    };
    const cases = {
      "bad-json.excalidraw": '{"type":"excalidraw",',
      "bad-version.excalidraw": JSON.stringify({ ...base, version: 1 }),
      "duplicate.excalidraw": JSON.stringify({
        ...base,
        elements: [base.elements[0], base.elements[0]],
      }),
      "remote.excalidraw": JSON.stringify({
        ...base,
        files: { x: { id: "x", dataURL: "https://untrusted.invalid/a.png" } },
      }),
      "missing-image.excalidraw": JSON.stringify({
        ...base,
        elements: [
          {
            ...base.elements[0],
            type: "image",
            fileId: "not-embedded",
            text: undefined,
          },
        ],
      }),
    };
    for (const [name, contents] of Object.entries(cases)) {
      const file = join(root, name);
      await writeFile(file, contents);
      for (const tool of ["ldraw_read_scene", "ldraw_modify_scene"]) {
        const refused = await client.callTool({
          name: tool,
          arguments:
            tool === "ldraw_read_scene"
              ? { path: name }
              : {
                  path: name,
                  expectedRevision: "sha256:" + "0".repeat(64),
                  operations: [
                    { op: "add_label", id: "x", text: "x", x: 0, y: 0 },
                  ],
                },
        });
        assert.equal(refused.isError, true, `${tool} ${name}`);
        assert.doesNotMatch(
          refused.content[0].text,
          /untrusted\.invalid|keep me|dataURL/i,
        );
      }
      assert.equal(
        await readFile(file, "utf8"),
        contents,
        `${name} must be unchanged`,
      );
    }
    const escaped = await client.callTool({
      name: "ldraw_read_scene",
      arguments: { path: "../outside.excalidraw" },
    });
    assert.equal(escaped.isError, true);
    assert.match(escaped.content[0].text, /escape/);
  } finally {
    await close();
  }
});

test("tool errors never echo scene text or absolute host paths", async (t) => {
  const root = await workspace(t);
  const { client, close } = await connect(root);
  try {
    const created = await client.callTool({
      name: "ldraw_create_scene",
      arguments: { path: "private.excalidraw", template: "journey" },
    });
    const file = join(root, "private.excalidraw");
    const scene = JSON.parse(await readFile(file, "utf8"));
    scene.elements.push({
      ...scene.elements[0],
      id: "secret-label",
      type: "text",
      text: "fictional-private-customer",
      x: 0,
      y: 900,
      width: 10,
      height: 10,
    });
    await writeFile(file, JSON.stringify(scene));
    const refused = await client.callTool({
      name: "ldraw_modify_scene",
      arguments: {
        path: "private.excalidraw",
        expectedRevision: created.structuredContent.revision,
        operations: [{ op: "add_label", id: "new", text: "x", x: 0, y: 0 }],
      },
    });
    assert.equal(refused.isError, true);
    const payload = JSON.stringify(refused);
    assert.doesNotMatch(payload, /fictional-private-customer/);
    assert.doesNotMatch(
      payload,
      new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    assert.doesNotMatch(payload, /at Object\.|node:internal/);
  } finally {
    await close();
  }
});

test("read_scene never returns embedded image bytes", async (t) => {
  const root = await workspace(t);
  const { client, close } = await connect(root);
  try {
    const pixel =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    const element = {
      id: "pixel",
      type: "image",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      angle: 0,
      fileId: "pixel-file",
      status: "saved",
    };
    await writeFile(
      join(root, "image.excalidraw"),
      JSON.stringify({
        type: "excalidraw",
        version: 2,
        elements: [element],
        appState: {},
        files: {
          "pixel-file": {
            id: "pixel-file",
            mimeType: "image/png",
            dataURL: pixel,
            created: 1,
          },
        },
      }),
    );
    const read = await client.callTool({
      name: "ldraw_read_scene",
      arguments: { path: "image.excalidraw", includeElements: true },
    });
    assert.equal(read.isError, undefined);
    assert.equal(read.structuredContent.images, 1);
    assert.deepEqual(read.structuredContent.imageIds, ["pixel-file"]);
    assert.equal(
      JSON.stringify(read.structuredContent).includes("data:image"),
      false,
    );
  } finally {
    await close();
  }
});

test("the real stdio entrypoint serves MCP and refuses a bad launch safely", async (t) => {
  const root = await workspace(t);
  const script = join(repoRoot, "scripts/mcp-server.mjs");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [script, "--workspace", root],
    cwd: repoRoot,
    env: { PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "" },
    stderr: "pipe",
  });
  let stderr = "";
  transport.stderr?.on("data", (chunk) => {
    stderr += String(chunk);
  });
  const client = new Client({ name: "ldraw-stdio-consumer", version: "1.0.0" });
  await client.connect(transport);
  try {
    const tools = (await client.listTools()).tools;
    assert.ok(tools.some((tool) => tool.name === "ldraw_create_scene"));
    const created = await client.callTool({
      name: "ldraw_create_scene",
      arguments: { path: "stdio.excalidraw", template: "composer-review" },
    });
    assert.equal(created.isError, undefined);
    assert.ok((await stat(join(root, "stdio.excalidraw"))).size > 0);
  } finally {
    await client.close();
  }
  assert.equal(stderr, "");

  const denied = spawnSync(process.execPath, [script], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(denied.status, 1);
  assert.match(denied.stderr, /absolute --workspace/);
  assert.doesNotMatch(denied.stderr, /Users|private\/var|\/tmp/);
});

test("unsupported label text gives actionable measured-font refusal and preserves scene", async (t) => {
  const root = await workspace(t);
  const { client, close } = await connect(root);
  try {
    const created = await client.callTool({
      name: "ldraw_create_scene",
      arguments: { path: "review.excalidraw", template: "composer-review" },
    });
    const before = await readFile(join(root, "review.excalidraw"), "utf8");
    const response = await client.callTool({
      name: "ldraw_modify_scene",
      arguments: {
        path: "review.excalidraw",
        expectedRevision: created.structuredContent.revision,
        operations: [
          {
            op: "add_label",
            id: "unsupported-label",
            text: "Review → release",
            x: 0,
            y: 100,
          },
        ],
      },
    });
    assert.equal(response.isError, true);
    assert.match(response.content[0].text, /U\+2192.*measured Latin set/);
    assert.doesNotMatch(response.content[0].text, /Review|release|\/tmp\//);
    assert.equal(
      await readFile(join(root, "review.excalidraw"), "utf8"),
      before,
    );
  } finally {
    await close();
  }
});

test("existing native preset label IDs retain their case during agent editing", async (t) => {
  const root = await workspace(t);
  const { client, close } = await connect(root);
  try {
    const made = await client.callTool({
      name: "ldraw_create_scene",
      arguments: { path: "native.excalidraw", template: "architecture" },
    });
    const original = JSON.parse(
      await readFile(join(root, "native.excalidraw"), "utf8"),
    );
    const label = original.elements.find(
      (element) => element.type === "text" && /[A-Z]/.test(element.id),
    );
    assert.ok(label);
    const reply = await client.callTool({
      name: "ldraw_modify_scene",
      arguments: {
        path: "native.excalidraw",
        expectedRevision: made.structuredContent.revision,
        operations: [{ op: "update_label", id: label.id, text: "Git" }],
      },
    });
    assert.equal(reply.isError, undefined);
    const updated = JSON.parse(
      await readFile(join(root, "native.excalidraw"), "utf8"),
    );
    assert.deepEqual(
      updated.elements.map((element) => element.id),
      original.elements.map((element) => element.id),
    );
    assert.equal(
      updated.elements.find((element) => element.id === label.id).text,
      "Git",
    );
  } finally {
    await close();
  }
});

/**
 * Reproduce the committed example diagrams through the real MCP tools.
 *
 *   pnpm build
 *   pnpm mcp:demo
 *
 * This is an explicit owner-run command, never part of `pnpm check`/`build`.
 * It replaces only the two example directories it names, then writes one
 * agent-authored native scene, the renderer's restored native scene, real PNG
 * and SVG, and a provenance record for each example.
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { createLdrawMcp, launchScope, SERVER_VERSION } from "./mcp/server.mjs";
import { REPO_ROOT } from "./mcp/renderer.mjs";

const examples = [
  {
    name: "app-composer-architecture",
    brand: {
      status: "approved-identity",
      identity: "App Composer",
      accent: "#FC5B05",
      note: "Canonical Composer orange and flat merging-block mark per docs/asset-provenance.md. No other brand is invented.",
    },
    async build(client) {
      const created = await client.callTool({
        name: "ldraw_create_scene",
        arguments: {
          path: "examples/app-composer-architecture/source.excalidraw",
          template: "composer-pipeline",
          x: 80,
          y: 172,
        },
      });
      if (created.isError) throw new Error(created.content[0].text);
      const modified = await client.callTool({
        name: "ldraw_modify_scene",
        arguments: {
          path: "examples/app-composer-architecture/source.excalidraw",
          expectedRevision: created.structuredContent.revision,
          operations: [
            {
              op: "insert_block",
              block: "apps-composer",
              idPrefix: "identity",
              x: 1050,
              y: 32,
            },
            {
              op: "insert_block",
              block: "composer-review",
              idPrefix: "review",
              x: 80,
              y: 332,
            },
            {
              op: "insert_block",
              block: "infra-trust",
              idPrefix: "trust",
              x: 680,
              y: 332,
            },
            {
              op: "add_label",
              id: "architecture-title",
              text: "App Composer architecture",
              x: 80,
              y: 40,
              fontSize: 32,
            },
            {
              op: "add_label",
              id: "architecture-subtitle",
              text: "Owner intent, agent proposal and qualified delivery stay separate.",
              x: 80,
              y: 92,
              fontSize: 16,
              tone: "muted",
            },
            {
              op: "add_label",
              id: "section-journey",
              text: "Owner journey",
              x: 80,
              y: 140,
              fontSize: 20,
            },
            {
              op: "add_label",
              id: "section-review",
              text: "Review boundary",
              x: 80,
              y: 300,
              fontSize: 20,
            },
            {
              op: "add_label",
              id: "section-trust",
              text: "Trust lanes",
              x: 680,
              y: 300,
              fontSize: 20,
            },
            {
              op: "add_label",
              id: "architecture-footer",
              text: "Local native files · shared Excalidraw renderer · no server dependency",
              x: 80,
              y: 550,
              fontSize: 14,
              tone: "muted",
            },
          ],
        },
      });
      if (modified.isError) throw new Error(modified.content[0].text);
      return {
        created: created.structuredContent,
        modified: modified.structuredContent,
      };
    },
  },
  {
    name: "infrastructure-runtime",
    brand: {
      status: "diagram-topic",
      identity: null,
      accent: "#1E40AF",
      note: "The infrastructure palette is authored and documented as a diagram topic. It is not an approved project identity, so no second portfolio brand is claimed.",
      unresolvedProjectIdentity: true,
    },
    async build(client) {
      const created = await client.callTool({
        name: "ldraw_create_scene",
        arguments: {
          path: "examples/infrastructure-runtime/source.excalidraw",
          template: "architecture",
          project: "infrastructure",
          x: 0,
          y: 0,
        },
      });
      if (created.isError) throw new Error(created.content[0].text);
      const modified = await client.callTool({
        name: "ldraw_modify_scene",
        arguments: {
          path: "examples/infrastructure-runtime/source.excalidraw",
          expectedRevision: created.structuredContent.revision,
          operations: [
            {
              op: "add_label",
              id: "topic-note",
              text: "Diagram topic palette · no project brand claimed",
              x: 740,
              y: 470,
              fontSize: 12,
              tone: "muted",
            },
          ],
        },
      });
      if (modified.isError) throw new Error(modified.content[0].text);
      return {
        created: created.structuredContent,
        modified: modified.structuredContent,
      };
    },
  },
];

const scope = launchScope(["--workspace", REPO_ROOT]);
const server = createLdrawMcp(scope);
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "ldraw-demo", version: SERVER_VERSION });
await server.connect(serverTransport);
await client.connect(clientTransport);

try {
  const summary = [];
  for (const example of examples) {
    const directory = join(REPO_ROOT, "examples", example.name);
    await rm(directory, { recursive: true, force: true });
    await mkdir(directory, { recursive: true });
    const steps = await example.build(client);
    const rendered = await client.callTool({
      name: "ldraw_render_scene",
      arguments: {
        path: `examples/${example.name}/source.excalidraw`,
        outputDir: `examples/${example.name}/rendered`,
        expectedRevision: steps.modified.revision,
      },
    });
    if (rendered.isError) throw new Error(rendered.content[0].text);
    const provenance = {
      example: example.name,
      brand: example.brand,
      authoring: {
        server: "ldraw",
        version: SERVER_VERSION,
        scene: "source.excalidraw",
        template: steps.created.template,
        elements: steps.modified.elements,
        added: steps.modified.added,
        updated: steps.modified.updated,
        warnings: steps.modified.warnings,
        sourceRevision: steps.modified.revision,
      },
      render: rendered.structuredContent.provenance,
      outputs: rendered.structuredContent.files,
      review: {
        automated:
          "validateScene, element ID/image preservation and real PNG/SVG signatures",
        humanVisualReview: "not performed",
        publication: "not authorised by this record",
      },
    };
    await writeFile(
      join(directory, "provenance.json"),
      `${JSON.stringify(provenance, null, 2)}\n`,
    );
    summary.push({
      example: example.name,
      source: `examples/${example.name}/source.excalidraw`,
      outputs: rendered.structuredContent.files.map((file) => file.path),
      durationMs: rendered.structuredContent.provenance.durationMs,
    });
  }
  console.log(
    JSON.stringify({
      examples: summary,
      build: "dist/build.json",
      network: "none",
    }),
  );
} finally {
  await client.close();
  await server.close();
}

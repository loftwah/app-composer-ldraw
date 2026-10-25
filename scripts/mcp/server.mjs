/**
 * Local-first stdio MCP adapter for LDraw.
 *
 * The host fixes one absolute `--workspace` at launch; every tool argument is
 * a relative path inside it. There is no remote URL, no account, no shell and
 * no arbitrary code tool. Reads, edits and renders reuse the repository's own
 * native scene validator, preset/library data and Playwright renderer.
 *
 * Tool results carry relative paths, element summaries, hashes and provenance.
 * They never carry embedded image bytes, credentials or whole-scene dumps
 * unless the caller explicitly asks for a bounded element list.
 */
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import {
  apps,
  brandStatus,
  collections,
  librarySpecs,
  presetCatalog,
  projectBrand,
  projects,
  unresolvedBrandIdentities,
} from "../../src/diagrams.mjs";
import { validateScene } from "../../src/scene.mjs";
import { metricsProvenance } from "./metrics.mjs";
import {
  applyOperations,
  buildSceneFromTemplate,
  SceneRefusal,
  TextRefusal,
  summariseScene,
  templateNames,
} from "./native.mjs";
import { renderScene, RenderRefusal } from "./renderer.mjs";
import {
  createSceneFile,
  createWorkspace,
  prepareOutputDirectory,
  readSceneFile,
  replaceSceneFile,
  WorkspaceRefusal,
  writeRenderOutputs,
} from "./workspace.mjs";

export const SERVER_NAME = "ldraw";
export const SERVER_VERSION = "1.0.0";
const MAX_INLINE_ELEMENTS_BYTES = 2 * 1024 * 1024;

const SAFE_ERRORS = [
  WorkspaceRefusal,
  SceneRefusal,
  TextRefusal,
  RenderRefusal,
];
const text = (value) => [{ type: "text", text: JSON.stringify(value) }];
const result = (value) => ({ content: text(value), structuredContent: value });
const refusal = (message) => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

const idSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,79}$/, "Use a short lower-case slug.");
const coordinate = z.number().finite().min(-1_000_000).max(1_000_000);
const fontSize = z.number().finite().min(8).max(96);
const tone = z.enum(["ink", "muted", "accent"]);
const revision = z
  .string()
  .regex(
    /^(?:sha256:)?[a-f0-9]{64}$/,
    "Use the sha256 revision returned by ldraw_read_scene.",
  );

const operationSchema = z.discriminatedUnion("op", [
  z
    .object({
      op: z.literal("insert_block"),
      block: z.string().min(1).max(80),
      idPrefix: idSchema,
      x: coordinate,
      y: coordinate,
    })
    .strict(),
  z
    .object({
      op: z.literal("add_label"),
      id: idSchema,
      text: z.string().min(1).max(600),
      x: coordinate,
      y: coordinate,
      fontSize: fontSize.optional(),
      tone: tone.optional(),
    })
    .strict(),
  z
    .object({
      op: z.literal("update_label"),
      // Existing native IDs are not new authored slugs; presets and user scenes
      // include uppercase/underscore IDs. Match them exactly without renaming.
      id: z
        .string()
        .min(1)
        .max(256)
        .regex(/^[^\u0000-\u001f\u007f]+$/),
      text: z.string().min(1).max(600),
      fontSize: fontSize.optional(),
      tone: tone.optional(),
    })
    .strict(),
]);

const empty = z.object({}).strict();

/**
 * Parse only the flags the host owns. Models cannot choose or change scope,
 * and no credential is a launch argument.
 */
export function launchScope(args) {
  const flags = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === "--read-only") {
      if (flags.has(flag)) throw new Error("Do not repeat --read-only.");
      flags.set(flag, true);
      continue;
    }
    if (flag !== "--workspace")
      throw new Error(
        "Supported launch flags are --workspace <absolute path> and --read-only.",
      );
    if (flags.has(flag)) throw new Error("Do not repeat --workspace.");
    const value = args[index + 1];
    if (typeof value !== "string" || !value || value.startsWith("--"))
      throw new Error("Provide an absolute --workspace path.");
    flags.set(flag, value);
    index += 1;
  }
  const workspace = flags.get("--workspace");
  if (!workspace)
    throw new Error("Start the server with an explicit absolute --workspace.");
  return Object.freeze({
    workspace,
    readOnly: flags.has("--read-only"),
  });
}

function catalog() {
  const presets = Object.entries(presetCatalog).map(([id, value]) => ({
    kind: "preset",
    id,
    label: value.label,
    notes: value.notes,
    projects: Object.keys(projects),
  }));
  const blocks = librarySpecs.map((item) => ({
    kind: "block",
    id: item.id,
    name: item.name,
    description: item.description,
    collection: item.collection,
    width: item.width,
    height: item.height,
    elements: item.elements.length,
  }));
  return {
    presets,
    blocks,
    collections,
    projects: Object.entries(projects).map(([key, value]) => ({
      key,
      label: value.label,
      topic: value.topic,
      stroke: value.stroke,
      fill: value.fill,
      brand: projectBrand[key] ?? {
        status: "unresolved",
        note: "No brand data.",
      },
    })),
    apps: apps.map((app) => ({
      key: app.key,
      title: app.title,
      subtitle: app.subtitle,
      accent: app.accent,
      tint: app.tint,
      brand: brandStatus[app.key] ?? {
        status: "unresolved",
        note: "No approved asset or palette data in this repository.",
      },
    })),
    unresolvedBrandIdentities,
    templateNames: templateNames(),
    textMetrics: metricsProvenance(),
    rules: {
      workspace: "relative paths only; the host selected one absolute root",
      network: "none; rendering is local Playwright against the built app",
      writes: "only create_scene, modify_scene and render_scene write files",
      staleEdits: "modify_scene requires the exact sha256 revision it read",
    },
  };
}

export function createLdrawMcp(
  options,
  { render = renderScene, now = Date.now } = {},
) {
  if (!options || typeof options !== "object" || Array.isArray(options))
    throw new Error("Select a host workspace.");
  const keys = Object.keys(options).sort();
  if (keys.some((key) => !["workspace", "readOnly"].includes(key)))
    throw new Error("Unsupported MCP host scope.");
  if (
    typeof options.readOnly !== "undefined" &&
    typeof options.readOnly !== "boolean"
  )
    throw new Error("Select a boolean read-only capability.");
  if (typeof options.workspace !== "string" || !options.workspace)
    throw new Error("Select an explicit absolute workspace.");
  const scope = Object.freeze({
    workspace: options.workspace,
    readOnly: options.readOnly === true,
  });
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  // The workspace is canonicalised once per connection, before any tool runs.
  let workspace;
  const ready = createWorkspace(scope.workspace).then((value) => {
    workspace = value;
    return value;
  });
  // Keep an invalid workspace as a per-call refusal instead of an unhandled
  // rejection if the client connects but never calls a tool.
  ready.catch(() => {});

  const handler = (action) => async (input, context) => {
    if (context.mcpReq.signal.aborted)
      return refusal("The request was cancelled. No change was started.");
    try {
      await ready;
      const value = await action(input, workspace);
      if (context.mcpReq.signal.aborted)
        return refusal(
          "The request was cancelled after its bounded local step. Inspect the workspace before retrying; no automatic retry was started.",
        );
      return result(value);
    } catch (failure) {
      if (SAFE_ERRORS.some((type) => failure instanceof type))
        return refusal(failure.message);
      if (failure?.code === "ENOENT")
        return refusal(
          "A required local file is missing. Inspect the workspace path and retry.",
        );
      return refusal(
        "The operation failed and the scene file was not replaced. Inspect the workspace, the built app and the file name, then retry with a fresh ldraw_read_scene.",
      );
    }
  };

  server.registerTool(
    "ldraw_list_templates",
    {
      title: "List LDraw presets, blocks and brand status",
      description:
        "Read-only catalogue of the existing LDraw starting examples, reusable blocks, project topics, app cards and honest brand status. Reports which portfolio identities are unresolved so an agent cannot invent a logo or palette. Also returns the measured font set and the workspace/network rules. No arguments.",
      inputSchema: empty,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    handler(async () => catalog()),
  );

  server.registerTool(
    "ldraw_read_scene",
    {
      title: "Read and validate one native scene",
      description:
        "Read one .excalidraw version 2 scene inside the authorised workspace, validate it with the app's own validator and return its sha256 revision, element counts and a bounded element summary. Set includeElements only when the full native element list is needed (images are never returned). Read-only.",
      inputSchema: z
        .object({
          path: z.string().min(1).max(300),
          includeElements: z.boolean().optional(),
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    handler(async ({ path, includeElements }) => {
      const file = await readSceneFile(workspace, path);
      const scene = validateStandalone(file.text);
      const summary = summariseScene(scene, file.revision);
      if (!includeElements) return summary;
      const elements = JSON.stringify(scene.elements);
      if (elements.length > MAX_INLINE_ELEMENTS_BYTES)
        return {
          ...summary,
          elements: null,
          note: "The element list is too large to return inline. Use the summary or read the file locally.",
        };
      return { ...summary, elements: scene.elements };
    }),
  );

  if (!scope.readOnly) {
    server.registerTool(
      "ldraw_create_scene",
      {
        title: "Create a native scene from an existing preset or block",
        description:
          "Create one new .excalidraw version 2 scene from an existing LDraw preset or reusable block, with stable authored element IDs and exact measured text bounds. Optional x/y place the template's top-left corner. Refuses to replace an existing file. Editing tool; writes one file inside the authorised workspace.",
        inputSchema: z
          .object({
            path: z.string().min(1).max(300),
            template: z.string().min(1).max(80),
            project: z
              .enum(["composer", "infrastructure", "game", "music", "general"])
              .optional(),
            x: coordinate.optional(),
            y: coordinate.optional(),
          })
          .strict(),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      handler(async ({ path, template, project, x, y }) => {
        const built = buildSceneFromTemplate({
          template,
          project: project ?? "composer",
          x: x ?? 0,
          y: y ?? 0,
        });
        const written = await createSceneFile(
          workspace,
          path,
          JSON.stringify(built.scene, null, 2) + "\n",
        );
        return {
          path: written.relative,
          revision: written.revision,
          template: built.template,
          elements: built.scene.elements.length,
          warnings: built.warnings,
          next: "Call ldraw_read_scene, then ldraw_modify_scene for labelled changes, then ldraw_render_scene.",
        };
      }),
    );

    server.registerTool(
      "ldraw_modify_scene",
      {
        title: "Edit labels or insert existing blocks safely",
        description:
          "Apply 1-40 bounded operations (insert_block, add_label, update_label) to an existing native scene. Requires the exact sha256 revision from ldraw_read_scene; a stale revision is refused and the newer file is left byte-identical. All operations must succeed before one atomic replacement. Element IDs, existing artwork and image bytes are preserved. Editing tool.",
        inputSchema: z
          .object({
            path: z.string().min(1).max(300),
            expectedRevision: revision,
            operations: z.array(operationSchema).min(1).max(40),
          })
          .strict(),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      handler(async ({ path, expectedRevision, operations }) => {
        const current = await readSceneFile(workspace, path);
        const scene = validateStandalone(current.text);
        const applied = applyOperations(scene, operations);
        const written = await replaceSceneFile(
          workspace,
          path,
          normaliseRevision(expectedRevision),
          JSON.stringify(applied.scene, null, 2) + "\n",
        );
        return {
          path: written.relative,
          previousRevision: written.previousRevision,
          revision: written.revision,
          added: applied.added,
          updated: applied.updated,
          elements: applied.scene.elements.length,
          warnings: applied.warnings,
        };
      }),
    );

    server.registerTool(
      "ldraw_render_scene",
      {
        title: "Render a native scene to editable source, SVG and PNG",
        description:
          "Render one validated scene with the existing local Playwright/Excalidraw renderer. Writes the renderer's own restored drawing.excalidraw plus real drawing.png and drawing.svg into an output directory inside the authorised workspace, then returns relative paths, sha256 hashes and provenance. Needs pnpm build and local Playwright Chromium; no network, account or remote service. Editing tool.",
        inputSchema: z
          .object({
            path: z.string().min(1).max(300),
            outputDir: z.string().min(1).max(300),
            expectedRevision: revision.optional(),
          })
          .strict(),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      handler(async ({ path, outputDir, expectedRevision }) => {
        const current = await readSceneFile(workspace, path);
        if (
          expectedRevision &&
          normaliseRevision(expectedRevision) !== current.revision
        )
          throw new WorkspaceRefusal(
            `The scene changed since it was read. Expected ${expectedRevision}, now ${current.revision}. Call ldraw_read_scene and retry; nothing was rendered or written.`,
          );
        const scene = validateStandalone(current.text);
        if (!scene.elements.some((element) => !element.isDeleted))
          throw new SceneRefusal(
            "Add something to the drawing before rendering. Nothing was rendered or written.",
          );
        const directory = await prepareOutputDirectory(workspace, outputDir);
        if (`${directory.relative}/drawing.excalidraw` === current.relative)
          throw new WorkspaceRefusal(
            "Choose a different output directory: the renderer's drawing.excalidraw would replace the scene it is rendering.",
          );
        const rendered = await render(scene);
        const files = await writeRenderOutputs(workspace, directory, {
          "drawing.excalidraw": JSON.stringify(rendered.scene, null, 2) + "\n",
          "drawing.png": rendered.png,
          "drawing.svg": rendered.svg,
        });
        return {
          source: { path: current.relative, revision: current.revision },
          files,
          provenance: {
            ...rendered.provenance,
            finishedAt: new Date(now()).toISOString(),
          },
          scene: summariseScene(rendered.scene, current.revision, { limit: 0 }),
          next: "Inspect the SVG and PNG, then open the rendered drawing.excalidraw in LDraw before publishing.",
        };
      }),
    );
  }

  return server;
}

function normaliseRevision(value) {
  return value.startsWith("sha256:") ? value : `sha256:${value}`;
}

/** The single native scene validator from src/scene.mjs. */
function validateStandalone(raw) {
  try {
    return validateScene(raw);
  } catch (failure) {
    if (failure instanceof SyntaxError)
      throw new SceneRefusal(
        "That file is not valid JSON. Choose a native .excalidraw version 2 file.",
      );
    // Validator messages are fixed constants: they never echo scene content.
    throw new SceneRefusal(failure.message);
  }
}

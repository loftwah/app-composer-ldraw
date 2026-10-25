/**
 * Authorised local workspace boundary for the LDraw MCP adapter.
 *
 * Every path the model supplies is a relative path inside one host-selected
 * root. Absolute paths, `..`, NUL/backslash tricks, symlinked files and
 * symlinked parent directories that resolve outside the root are refused
 * before any read or write. Writes are temp-file + rename replacements in the
 * same directory, so a failure or crash cannot leave a half-written scene.
 *
 * Only the native `.excalidraw` scene type and the renderer's own PNG/SVG
 * outputs are handled here. No shell, code execution, network or secret store.
 */
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  open,
  realpath,
  rename,
  stat,
  unlink,
} from "node:fs/promises";
import { constants } from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  normalize,
  resolve,
  sep,
} from "node:path";
import { MAX_SCENE_BYTES } from "../../src/scene.mjs";

export const SCENE_EXTENSION = ".excalidraw";
export const RENDER_OUTPUTS = [
  "drawing.excalidraw",
  "drawing.png",
  "drawing.svg",
];
/** Fixed, machine-checkable refusals. They never include scene bytes. */
export class WorkspaceRefusal extends Error {}

const refuse = (message) => {
  throw new WorkspaceRefusal(message);
};
const sha256 = (value) =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`;

function insideRoot(root, target) {
  return target === root || target.startsWith(`${root}${sep}`);
}

function assertRelativePath(input) {
  if (typeof input !== "string" || !input.trim())
    refuse("Choose a relative scene path inside the authorised workspace.");
  if (input.includes("\0"))
    refuse("Paths must not contain control characters.");
  if (input.includes("\\"))
    refuse("Use forward slashes in relative workspace paths.");
  if (isAbsolute(input) || /^[a-zA-Z]:/.test(input) || input.startsWith("~"))
    refuse(
      "Paths are relative to the authorised workspace root, never absolute.",
    );
  const normal = normalize(input);
  if (normal !== input.replace(/\/+/g, "/"))
    refuse(
      "Paths must be already-normalised relative paths without '.' segments.",
    );
  if (input.split("/").some((part) => part === ".."))
    refuse("Paths must not escape the authorised workspace root.");
  return normal;
}

/** Existing symlinked ancestors are resolved; the result must stay inside. */
async function deepestExistingParent(root, target) {
  let current = dirname(target);
  for (;;) {
    try {
      const info = await lstat(current);
      if (info) {
        const canonical = await realpath(current);
        if (!insideRoot(root, canonical))
          refuse("That path resolves outside the authorised workspace.");
        return canonical;
      }
    } catch (failure) {
      if (failure?.code !== "ENOENT") throw failure;
    }
    if (current === root || current === dirname(current)) return root;
    current = dirname(current);
  }
}

export async function createWorkspace(input) {
  if (typeof input !== "string" || !input.trim())
    refuse("Start the server with an explicit absolute --workspace.");
  if (input.includes("\0")) refuse("The workspace path is invalid.");
  if (!isAbsolute(input))
    refuse("Start the server with an explicit absolute --workspace.");
  if (resolve(input) !== input)
    refuse("Start the server with a normalised absolute --workspace.");
  let canonical;
  try {
    canonical = await realpath(input);
  } catch {
    refuse("The selected workspace does not exist or is not readable.");
  }
  const info = await stat(canonical);
  if (!info.isDirectory()) refuse("The selected workspace is not a directory.");
  return Object.freeze({ root: canonical });
}

/** Resolve an authorised scene path; `mustExist` distinguishes edit/create. */
export async function resolveScenePath(workspace, input) {
  const relative = assertRelativePath(input);
  if (!relative.endsWith(SCENE_EXTENSION))
    refuse(`Only native ${SCENE_EXTENSION} scenes are supported.`);
  const target = resolve(workspace.root, relative);
  if (!insideRoot(workspace.root, target))
    refuse("That path escapes the authorised workspace.");
  await deepestExistingParent(workspace.root, target);
  return { relative, target };
}

async function assertRegularFileNotLink(target) {
  let info;
  try {
    info = await lstat(target);
  } catch (failure) {
    if (failure?.code === "ENOENT")
      refuse("That scene does not exist inside the authorised workspace.");
    throw failure;
  }
  if (info.isSymbolicLink())
    refuse("Symbolic links are not followed. Choose a regular scene file.");
  if (!info.isFile()) refuse("That path is not a regular scene file.");
  return info;
}

/** Read one bounded scene file without following a final-component symlink. */
export async function readSceneFile(workspace, input) {
  const { relative, target } = await resolveScenePath(workspace, input);
  await assertRegularFileNotLink(target);
  let handle;
  try {
    handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (failure) {
    if (failure?.code === "ELOOP")
      refuse("Symbolic links are not followed. Choose a regular scene file.");
    throw failure;
  }
  try {
    const info = await handle.stat();
    if (!info.isFile()) refuse("That path is not a regular scene file.");
    if (info.size > MAX_SCENE_BYTES)
      refuse("The scene is larger than the 20 MB local limit.");
    const bytes = await handle.readFile();
    return {
      relative,
      target,
      bytes,
      text: bytes.toString("utf8"),
      revision: sha256(bytes),
    };
  } finally {
    await handle.close();
  }
}

async function stageWrite(target, data) {
  const temporary = join(
    dirname(target),
    `.${basename(target)}.${randomUUID()}.tmp`,
  );
  let handle;
  try {
    handle = await open(temporary, "wx", 0o600);
    await handle.writeFile(data);
    await handle.sync();
  } catch (failure) {
    await handle?.close().catch(() => {});
    await unlink(temporary).catch(() => {});
    throw failure;
  }
  await handle.close();
  return temporary;
}

async function writeAtomic(target, data) {
  const temporary = await stageWrite(target, data);
  try {
    await rename(temporary, target);
  } catch (failure) {
    await unlink(temporary).catch(() => {});
    throw failure;
  }
  return sha256(data);
}

/** Create a new scene file; an existing file is never replaced implicitly. */
export async function createSceneFile(workspace, input, scene) {
  const { relative, target } = await resolveScenePath(workspace, input);
  try {
    const info = await lstat(target);
    if (info)
      refuse(
        "That scene already exists. Read it and use modify_scene, or choose a new path.",
      );
  } catch (failure) {
    if (failure instanceof WorkspaceRefusal) throw failure;
    if (failure?.code !== "ENOENT") throw failure;
  }
  await mkdir(dirname(target), { recursive: true });
  const canonical = await realpath(dirname(target));
  if (!insideRoot(workspace.root, canonical))
    refuse("That path resolves outside the authorised workspace.");
  const revision = await writeAtomic(target, scene);
  return { relative, target, revision };
}

/**
 * Replace an existing scene only when its exact bytes still match the
 * revision the caller inspected. A stale edit leaves the newer file intact.
 */
export async function replaceSceneFile(
  workspace,
  input,
  expectedRevision,
  scene,
) {
  const current = await readSceneFile(workspace, input);
  if (current.revision !== expectedRevision)
    refuse(
      `The scene changed since it was read. Expected ${expectedRevision}, now ${current.revision}. Call ldraw_read_scene, re-apply the change and retry; the newer file was not modified.`,
    );
  await assertRegularFileNotLink(current.target);
  const revision = await writeAtomic(current.target, scene);
  return {
    relative: current.relative,
    target: current.target,
    previousRevision: current.revision,
    revision,
  };
}

export async function prepareOutputDirectory(workspace, input) {
  if (typeof input !== "string" || !input.trim())
    refuse(
      "Choose a relative output directory inside the authorised workspace.",
    );
  if (input.includes("\0"))
    refuse("Paths must not contain control characters.");
  if (input.includes("\\"))
    refuse("Use forward slashes in relative workspace paths.");
  if (isAbsolute(input) || input.startsWith("~"))
    refuse("Output directories are relative to the authorised workspace root.");
  const normal = normalize(input);
  if (normal.startsWith(".."))
    refuse("Output directories must not escape the authorised workspace.");
  const target = resolve(workspace.root, normal);
  if (!insideRoot(workspace.root, target))
    refuse("That output directory escapes the authorised workspace.");
  await deepestExistingParent(workspace.root, target);
  await mkdir(target, { recursive: true });
  const canonical = await realpath(target);
  if (!insideRoot(workspace.root, canonical))
    refuse("That output directory resolves outside the authorised workspace.");
  return { relative: normal, target: canonical };
}

/** Stage every render output first, then replace all three together. */
export async function writeRenderOutputs(workspace, directory, outputs) {
  const staged = [];
  const files = [];
  try {
    for (const name of RENDER_OUTPUTS) {
      if (!Object.hasOwn(outputs, name))
        refuse("The renderer did not return every expected output.");
      const target = join(directory.target, name);
      if (!insideRoot(directory.target, target))
        refuse("Render output escaped its directory.");
      staged.push({
        name,
        target,
        temporary: await stageWrite(target, outputs[name]),
      });
    }
    for (const entry of staged) {
      await rename(entry.temporary, entry.target);
      files.push({
        path: `${directory.relative}/${entry.name}`,
        bytes: Buffer.byteLength(outputs[entry.name]),
        revision: sha256(outputs[entry.name]),
      });
    }
    return files;
  } catch (failure) {
    for (const entry of staged) await unlink(entry.temporary).catch(() => {});
    throw failure;
  }
}

export { sha256, insideRoot };

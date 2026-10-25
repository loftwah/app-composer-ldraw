import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAX_SCENE_BYTES } from "../src/scene.mjs";
import {
  createSceneFile,
  createWorkspace,
  prepareOutputDirectory,
  readSceneFile,
  replaceSceneFile,
  writeRenderOutputs,
} from "../scripts/mcp/workspace.mjs";

async function owned(t) {
  const root = await mkdtemp(join(tmpdir(), "ldraw-mcp-workspace-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test("workspace must be an existing absolute normalised directory", async (t) => {
  const root = await owned(t);
  await assert.rejects(
    () => createWorkspace("relative/drawings"),
    /absolute --workspace/,
  );
  await assert.rejects(
    () => createWorkspace(`${root}/../${root.split("/").at(-1)}`),
    /normalised/,
  );
  await assert.rejects(
    () => createWorkspace(join(root, "missing")),
    /does not exist/,
  );
  const file = join(root, "scene.excalidraw");
  await writeFile(file, "{}");
  await assert.rejects(() => createWorkspace(file), /not a directory/);
  const workspace = await createWorkspace(root);
  assert.equal(workspace.root, await realpath(root));
  assert.ok(Object.isFrozen(workspace));
});

test("relative scene paths cannot escape the authorised workspace", async (t) => {
  const root = await owned(t);
  const workspace = await createWorkspace(root);
  await writeFile(
    join(root, "keep.excalidraw"),
    JSON.stringify({ secret: true }),
  );
  for (const attempt of [
    "../outside.excalidraw",
    "nested/../../outside.excalidraw",
    "/etc/passwd.excalidraw",
    "~/drawing.excalidraw",
    "./drawing.excalidraw",
    "nested\\drawing.excalidraw",
    "drawing.excalidraw\0.json",
    "drawing.txt",
    "",
    "   ",
    "nested/",
  ])
    await assert.rejects(
      () => readSceneFile(workspace, attempt),
      /relative|escape|control|forward slashes|Only native|Path|Choose/i,
      attempt,
    );
  assert.equal(
    (await readSceneFile(workspace, "keep.excalidraw")).relative,
    "keep.excalidraw",
  );
});

test("symlinked files and symlinked directories outside the root are refused", async (t) => {
  const root = await owned(t);
  const outside = await owned(t);
  const workspace = await createWorkspace(root);
  await writeFile(join(outside, "secret.excalidraw"), "outside");
  await symlink(
    join(outside, "secret.excalidraw"),
    join(root, "alias.excalidraw"),
  );
  await symlink(outside, join(root, "linked"), "dir");
  await assert.rejects(
    () => readSceneFile(workspace, "alias.excalidraw"),
    /Symbolic links/,
  );
  await assert.rejects(
    () => readSceneFile(workspace, "linked/secret.excalidraw"),
    /outside the authorised/,
  );
  await assert.rejects(
    () => createSceneFile(workspace, "linked/new.excalidraw", "{}"),
    /outside the authorised/,
  );
  await assert.rejects(
    () => prepareOutputDirectory(workspace, "../output"),
    /escape/,
  );
});

test("creating never replaces an existing drawing", async (t) => {
  const root = await owned(t);
  const workspace = await createWorkspace(root);
  const original = JSON.stringify({ keep: "human work" });
  await writeFile(join(root, "drawing.excalidraw"), original);
  await assert.rejects(
    () =>
      createSceneFile(
        workspace,
        "drawing.excalidraw",
        JSON.stringify({ replaced: true }),
      ),
    /already exists/,
  );
  assert.equal(
    await readFile(join(root, "drawing.excalidraw"), "utf8"),
    original,
  );
});

test("a stale revision is refused without replacing newer bytes", async (t) => {
  const root = await owned(t);
  const workspace = await createWorkspace(root);
  await createSceneFile(
    workspace,
    "nested/drawing.excalidraw",
    '{"version":1}\n',
  );
  const first = await readSceneFile(workspace, "nested/drawing.excalidraw");
  assert.match(first.revision, /^sha256:[a-f0-9]{64}$/);
  await replaceSceneFile(
    workspace,
    "nested/drawing.excalidraw",
    first.revision,
    '{"version":2}\n',
  );
  const newer = await readFile(join(root, "nested/drawing.excalidraw"), "utf8");
  await assert.rejects(
    () =>
      replaceSceneFile(
        workspace,
        "nested/drawing.excalidraw",
        first.revision,
        '{"version":"stale-agent"}\n',
      ),
    (failure) => {
      assert.match(failure.message, /changed since it was read/);
      assert.match(failure.message, /ldraw_read_scene/);
      assert.match(failure.message, /was not modified/);
      return true;
    },
  );
  assert.equal(
    await readFile(join(root, "nested/drawing.excalidraw"), "utf8"),
    newer,
  );
});

test("oversized, unreadable and missing files fail without a write", async (t) => {
  const root = await owned(t);
  const workspace = await createWorkspace(root);
  await writeFile(
    join(root, "huge.excalidraw"),
    Buffer.alloc(MAX_SCENE_BYTES + 1),
  );
  await assert.rejects(
    () => readSceneFile(workspace, "huge.excalidraw"),
    /20 MB/,
  );
  await assert.rejects(
    () => readSceneFile(workspace, "absent.excalidraw"),
    /does not exist/,
  );
  // A parent that is a regular file cannot become a directory.
  await writeFile(join(root, "blocked"), "not a directory");
  await assert.rejects(() =>
    createSceneFile(workspace, "blocked/drawing.excalidraw", "{}"),
  );
  await assert.rejects(
    () => readFile(join(root, "blocked/drawing.excalidraw")),
    /ENOENT|ENOTDIR/,
  );
});

test("render outputs are hashed, contained and limited to the renderer's files", async (t) => {
  const root = await owned(t);
  const workspace = await createWorkspace(root);
  const directory = await prepareOutputDirectory(workspace, "rendered/demo");
  const outputs = await writeRenderOutputs(workspace, directory, {
    "drawing.excalidraw": "{}",
    "drawing.png": Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    "drawing.svg": "<svg/>",
  });
  assert.deepEqual(
    outputs.map((file) => file.path.split("/").at(-1)),
    ["drawing.excalidraw", "drawing.png", "drawing.svg"],
  );
  for (const file of outputs)
    assert.match(file.revision, /^sha256:[0-9a-f]{64}$/);
  await assert.rejects(
    () => writeRenderOutputs(workspace, directory, { "drawing.png": "x" }),
    /every expected output/,
  );
});

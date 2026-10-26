# LDraw local MCP adapter

Status: implemented and locally verified 25 October 2026 against LDraw issue #1.
Source-only evidence: no hostname, production, owner or publication acceptance
is claimed here.

The adapter is a **local stdio MCP server** that lets an authorised agent author
and revise real LDraw drawings. It does not add a second drawing format,
editor, renderer or brand library:

- scenes are the native Excalidraw **version 2** `.excalidraw` contract validated
  by [`src/scene.mjs`](../src/scene.mjs);
- templates and blocks come from [`src/diagrams.mjs`](../src/diagrams.mjs);
- PNG and SVG come from the same local Excalidraw renderer that
  `pnpm render` uses ([`scripts/browser.mjs`](../scripts/browser.mjs));
- viewing and rendering never need the MCP server or any remote service.

## Why an adapter instead of a new service

The browser's `window.ldraw.readScene()` / `replaceScene()` API is same-tab
JavaScript, and the CLI (`pnpm scene validate`, `pnpm render`) is not an agent
endpoint. The adapter wraps those existing pieces in a bounded tool surface, so
an agent can create, edit and render files without a browser session, a public
URL, an account, a database or a cloud dependency.

## Requirements and exact versions

| Component | Version |
| --- | --- |
| Node.js | `>=22 <23` (verified 22.23.4) |
| pnpm | 12.8.1 (`packageManager`) |
| `@modelcontextprotocol/server` | 2.3.1 (same pin as Composer) |
| `@modelcontextprotocol/client` | 2.3.1 (devDependency, tests only) |
| `zod` | 4.6.7 (same pin as Composer) |
| `@excalidraw/excalidraw` | 0.18.1 |
| `playwright` | 1.62.1 (devDependency, render only) |

`pnpm-lock.yaml` pins integrity for each of these. No extra service, account or
paid plan is involved.

## Install

```sh
cd /absolute/path/to/app-composer-ldraw
pnpm install --frozen-lockfile
pnpm build                     # required before rendering, not before authoring
pnpm exec playwright install chromium   # only if the host has no Chromium
```

`pnpm build` writes the local static app into `dist/`; the renderer serves that
directory on loopback. Authoring (`list`, `read`, `create`, `modify`) works
without a build and without a browser.

## Configure a client

The host selects one absolute workspace of drawings at launch. Every tool
argument is then a relative path inside it. Credentials are never launch
arguments, and the server reads no secret store.

Codex 0.145.0 (`~/.codex/config.toml`), verified to parse with
`codex mcp list --json`:

```toml
[mcp_servers.ldraw]
command = "node"
args = [
  "/absolute/path/to/app-composer-ldraw/scripts/mcp-server.mjs",
  "--workspace",
  "/absolute/path/to/drawings",
]
startup_timeout_sec = 20
tool_timeout_sec = 180
```

The equivalent CLI form is:

```sh
codex mcp add ldraw -- node /absolute/path/to/scripts/mcp-server.mjs \
  --workspace /absolute/path/to/drawings
```

OpenCode V2 (`opencode.jsonc`, from the official
[MCP server docs](https://opencode.ai/v2/docs/mcp-servers)):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "ldraw": {
        "type": "local",
        "command": [
          "node",
          "/absolute/path/to/app-composer-ldraw/scripts/mcp-server.mjs",
          "--workspace",
          "/absolute/path/to/drawings"
        ]
      }
    }
  }
}
```

OpenCode's default Code Mode exposes these as `tools.ldraw.*`; add
`"codemode": false` if you want them on the native tool list.

Any other MCP stdio client works if it can launch a command with arguments:
`node scripts/mcp-server.mjs --workspace /absolute/path [--read-only]`.

### Verified in this run

- `tests/mcp-server.test.mjs` starts the real entrypoint through the official
  `StdioClientTransport` and `Client` from `@modelcontextprotocol/client@2.3.1`,
  lists tools, creates a scene and closes the connection.
- Codex CLI 0.145.0 read the config above from a throw-away `CODEX_HOME` and
  reported the server as an enabled `stdio` transport. No model-driven Codex or
  OpenCode session was run, because that needs the owner's authenticated model
  budget.

## Tools

| Tool | Mode | Purpose |
| --- | --- | --- |
| `ldraw_list_templates` | read-only | Presets, reusable blocks, project topics, app cards, honest brand status, measured font set, rules. |
| `ldraw_read_scene` | read-only | Validate one `.excalidraw` scene, return its sha256 revision and a bounded element summary. |
| `ldraw_create_scene` | editing | Create one scene from a preset or block with stable IDs and measured text bounds. Refuses to replace an existing file. |
| `ldraw_modify_scene` | editing | Apply 1–40 bounded operations with an exact revision check and one atomic replacement. |
| `ldraw_render_scene` | editing | Render through the existing local renderer into `drawing.excalidraw`, `drawing.png`, `drawing.svg`. |

`--read-only` registers only the first two tools. Tool annotations mark
`readOnlyHint`, `destructiveHint: false` and `openWorldHint: false` accordingly.

### `ldraw_create_scene`

```json
{
  "path": "drawings/app.excalidraw",
  "template": "composer-pipeline",
  "project": "composer",
  "x": 80,
  "y": 160
}
```

`template` is a preset id (`portfolio`, `journey`, `architecture`, `game`,
`release`, `beforeAfter`) or a library block id (`apps-composer`,
`composer-pipeline`, `composer-review`, `infra-runtime`, `infra-trust`, …).
`project` selects an existing project topic palette. `x`/`y` place the
template's top-left corner.

### `ldraw_modify_scene`

```json
{
  "path": "drawings/app.excalidraw",
  "expectedRevision": "sha256:…",
  "operations": [
    { "op": "insert_block", "block": "composer-review", "idPrefix": "review", "x": 80, "y": 320 },
    { "op": "add_label", "id": "owner-boundary", "text": "Owner decision", "x": 80, "y": 280, "fontSize": 20, "tone": "accent" },
    { "op": "update_label", "id": "preset-title", "text": "Service architecture (reviewed)" }
  ]
}
```

- `insert_block` translates an existing block and prefixes every ID with
  `idPrefix`, so two inserts cannot collide. An existing ID refuses the whole
  edit.
- `add_label` creates a real native text element; `tone` is `ink`, `muted` or
  `accent` (the approved `#FC5B05`). Text is limited to 600 characters and 20
  lines and must use the measured character set.
- `update_label` re-measures only that text element, bumps its native version
  and preserves every other element, ID, grouping and image byte.

All operations must succeed before one temp-file + rename replacement. A stale
`expectedRevision` is refused with the current revision and recovery steps; the
newer file stays byte-identical.

### `ldraw_render_scene`

```json
{ "path": "drawings/app.excalidraw", "outputDir": "drawings/rendered", "expectedRevision": "sha256:…" }
```

Requires `pnpm build` and local Playwright Chromium. It imports through
`window.ldraw.replaceScene` (the app's own validated revision API), exports with
the same `exportToBlob`/`exportToSvg` calls as the editor, asserts that every
element ID and embedded image byte survived, and writes:

- `drawing.excalidraw` — the native scene Excalidraw itself restored;
- `drawing.png` — real PNG (`89504e470d0a1a0a` signature checked);
- `drawing.svg` — real SVG with embedded local fonts and no external reference.

The result carries relative paths, sha256 hashes, renderer/engine versions,
the build source commit, export padding (24 px), background, duration and an
explicit `humanReview: "not performed"` note.

## Scene and text correctness

Native text bounds must be exact or the exported canvas clips labels. The
adapter therefore measures text with `scripts/mcp/font-metrics.json`, a
generated advance + kerning table for the bundled **Excalifont** at 100 px,
scaled linearly. It matches the engine's own
`CanvasRenderingContext2D.measureText` to under 0.001 px at every editor size
(see `tests/mcp-render.test.mjs`, opt-in). Characters outside the measured Latin
set (emoji, CJK, arrows) are refused rather than measured against a
machine-specific system font. Regenerate the table only when the pinned font or
engine changes:

```sh
pnpm build
pnpm mcp:font-metrics
```

The adapter fills the native fields the browser normally adds
(`seed`, `version`, `versionNonce`, `groupIds`, `frameId`, `boundElements`,
`updated`); it does not introduce a second schema. The scene is validated by
`validateScene()` before every write and again by the editor on import.

## Security boundaries

- One absolute, normalised `--workspace` fixed by the host at launch; no
  model-selected scope.
- Relative paths only. Absolute paths, `..`, `.` segments, NUL, backslashes and
  non-`.excalidraw` files are refused.
- Symlinked files are never followed (`O_NOFOLLOW` + `lstat`), and a parent
  directory that resolves outside the workspace is refused.
- Native scene limits apply: 20 MB, 5,000 elements, supported element types,
  embedded image data only. Remote image URLs, web embeds and malformed scenes
  are refused and never rewritten.
- Create never overwrites. Modify and render require the exact sha256 revision.
  Writes are temp file + fsync + rename in the same directory.
- No shell, code execution, network, account or secret tool. The server reads
  no environment credentials and writes diagnostics only as fixed redacted
  messages on stderr. stdout carries MCP messages only.
- Results contain relative paths, IDs, counts, text labels and hashes; embedded
  image bytes are never returned. Error text never includes scene content or
  absolute host paths.
- Rendering is local: a loopback static server over `dist/`, bundled fonts, no
  external requests. The SVG result is rejected if it references an external
  URL.

## Verified local workflow

1. `ldraw_list_templates` — choose a preset/block and read the brand status.
2. `ldraw_create_scene` — create a native scene with stable IDs.
3. `ldraw_read_scene` — note the `sha256:` revision.
4. `ldraw_modify_scene` — add labels/blocks with that revision.
5. `ldraw_render_scene` — produce the editable source, PNG and SVG.
6. Inspect the PNG and SVG, then open `rendered/drawing.excalidraw` in LDraw.
7. Commit the scene and outputs through a normal reviewed change; automated
   checks cannot certify that a diagram is clear or technically true.

A copyable agent prompt/skill is in [`docs/agent-prompt.md`](agent-prompt.md).

## Measured cost

On the verification host (Apple silicon macOS, Node 22.23.4, local build,
headless Chromium already installed), over one real stdio session:

| Step | Time |
| --- | --- |
| MCP connect (process + initialize) | 269 ms |
| `ldraw_create_scene` | 14 ms |
| `ldraw_modify_scene` (1 label) | 7 ms |
| `ldraw_render_scene` (browser launch + import + PNG/SVG export) | 878 ms |
| Full create → modify → render loop | 1.17 s |

Regenerating both committed examples with `pnpm mcp:demo` took 2.13 s wall
(renderer-reported 910 ms and 860 ms). No network requests were made.

## Example scenes

- `examples/app-composer-architecture/` — readable App Composer architecture
  using the approved Composer orange `#FC5B05`, existing fonts and existing
  blocks. `source.excalidraw` is the agent-authored scene;
  `rendered/drawing.excalidraw` is the same scene as Excalidraw restored it;
  `rendered/drawing.png` / `.svg` are the real outputs.
- `examples/infrastructure-runtime/` — the existing `architecture` preset with
  the infrastructure **diagram-topic** palette. It intentionally is not a
  second project brand; see its `provenance.json` and the unresolved-brand note
  below.

Both are regenerated only by the explicit `pnpm mcp:demo` command. It replaces
those two directories and nothing else. PNG and SVG bytes are deterministic for
the same scene; the renderer-restored `drawing.excalidraw` legitimately changes
Excalidraw's own normalisation fields (`versionNonce`, `updated`, `index`) on
each run, so compare content and IDs rather than raw JSON there.

## Unsupported clients and limits

- No remote transport: there is no HTTP/SSE endpoint, no public MCP URL, no
  OAuth and no multi-user access. Remote-only clients cannot connect.
- Clients that cannot launch a local stdio command cannot use it.
- Model-driven Codex/OpenCode sessions, Windows path semantics and physical
  devices were not exercised in this run.
- Text is limited to the measured Latin set; emoji, CJK and arrow glyphs are
  refused instead of falling back to a host font.
- The adapter preserves embedded images but does not create, fetch or edit
  them. The browser Portfolio library can insert real local artwork; a
  subsequent MCP read/modify/render cycle keeps those bytes (see
  [portfolio-artwork.md](portfolio-artwork.md)).
- Rendering needs the built app and Playwright; a missing build or browser
  fails with an actionable message and writes nothing.

## Remaining gates (not claimed)

- Human visual review of both examples, the new artwork placements and any
  publication decision. Agent tests prove bytes and geometry, not taste.
- Owner/licence confirmation before publishing an artwork-only asset outside
  the portfolio. The image records distinguish approved, qualified,
  documented, agent-selected, current and sample; several game/FM projects have
  no repository redistribution licence.
- An actual model-driven MCP session in the owner's client, and any editor
  round-trip on a physical device.
- Deployment, hostname, DNS and live-site verification (owned by the existing
  release path, not this adapter).

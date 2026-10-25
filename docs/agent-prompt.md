---
name: ldraw-diagrams
description: Author, revise and render editable LDraw diagrams through the local LDraw MCP server. Use when asked to draw an architecture, journey, loop or comparison as an editable .excalidraw scene with real PNG/SVG output, or to change labels in an existing LDraw scene.
---

# LDraw diagrams

Use the local `ldraw` MCP tools. They own the native `.excalidraw` contract, the
project presets and the renderer. Never write your own scene JSON, SVG or PNG,
never call an image service, and never invent a logo or palette.

## Rules

- Work only on relative paths inside the workspace the host selected. If a path
  is refused, ask the host for an authorised drawing path; do not try to escape.
- Read before you edit. `ldraw_modify_scene` requires the exact
  `sha256:` revision from `ldraw_read_scene`; a stale revision is a stop signal,
  not a retry with a guessed value.
- Preserve IDs, labels, images and human edits. Change only what the request
  needs.
- Brand status is data. Only App Composer (`#FC5B05`) is an approved identity
  here. `starting-data`, `diagram-topic` and unresolved names must not be
  presented as a brand; say so instead.
- Text must use the measured Latin set. No emoji, CJK or arrow glyphs; rewording
  is the fix.
- Rendering is local and needs `pnpm build`. A missing build is a clear blocker,
  not an invitation to fake output.
- Automated checks cannot prove a diagram is clear or technically true. Report
  that human review is still required and never claim publication or production
  acceptance.

## Workflow

1. **Catalogue.** Call `ldraw_list_templates`. Note the presets, blocks,
   collection ids, project topics, brand status and unresolved identities.
2. **Choose one purpose.** Decide the diagram's claim, audience and the labels
   that make it true. Prefer one readable idea over a dense wall of boxes.
3. **Create.** Call `ldraw_create_scene` with a preset or block, the most
   suitable existing `project` palette, and an `x`/`y` origin. Give the file a
   stable, descriptive relative path.
4. **Read.** Call `ldraw_read_scene` and keep the returned revision.
5. **Compose.** Call `ldraw_modify_scene` with bounded operations:
   `insert_block` for existing blocks (unique `idPrefix`), `add_label` for new
   labels, `update_label` to revise existing text. Keep related elements
   aligned; leave breathing room between sections.
6. **Render.** Call `ldraw_render_scene` with the same revision and an output
   directory that is not the source directory. Expect
   `rendered/drawing.excalidraw`, `rendered/drawing.png`, `rendered/drawing.svg`.
7. **Inspect.** Open the PNG and the SVG. Check: no clipped or overlapping
   text, no dangling arrows, readable at page width, orange only where the
   Composer identity is intended, correct labels and connections. Fix with
   another read → modify → render cycle.
8. **Report.** Give the scene path, the rendered paths, the revisions, the
   brand status you relied on, what you visually checked, and that human review
   and publication are still outstanding.

## Operation shapes

```json
{ "op": "insert_block", "block": "composer-pipeline", "idPrefix": "pipeline", "x": 80, "y": 160 }
{ "op": "add_label", "id": "section-review", "text": "Review boundary", "x": 80, "y": 300, "fontSize": 20, "tone": "ink" }
{ "op": "update_label", "id": "preset-title", "text": "App Composer architecture", "fontSize": 32 }
```

`tone` is `ink`, `muted` or `accent`. `fontSize` is 8–96. Keep IDs lower-case
slugs. Use explicit `\n` for a second line rather than a long wrapped line.

## Failure handling

- **Stale revision**: re-read the scene, re-apply the intended change, retry
  once. Never overwrite newer work.
- **Path or workspace refusal**: stop and ask the host. Do not retry variants.
- **Unsupported characters**: reword using Latin text.
- **Missing build/browser**: report the exact message and stop; do not produce
  substitute images.
- **Renderer lost an ID or image byte**: treat it as a defect; keep the source
  scene and report it.

## What not to do

- Do not create a second scene format, a custom SVG writer or a screenshot.
- Do not add new brand colours, logos or mascots.
- Do not edit `src/diagrams.mjs` to work around a layout problem in one
  drawing; move or re-label elements in the drawing instead.
- Do not publish, deploy or claim owner approval.

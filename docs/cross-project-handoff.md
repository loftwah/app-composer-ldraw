# Cross-project architecture handoff

LDraw ships the reviewed native scenes; consuming sites publish their own
outputs. This note defines the contract so Composer #375 and Woodhouse #149 do
not drift into unrelated copies.

## LDraw owns

- the editable native `.excalidraw` scene;
- the rendering pass that produced the preview and the recorded PNG/SVG evidence;
- the source revision and source-file list used for the review;
- the scene, preview and PNG/SVG hashes;
- the visual editing surface and future reviewed updates.

## Consumers own

- their own page, layout, alt text and delivery;
- the decision to publish or not publish a particular diagram;
- the exact adopted revision or hash;
- any derivative SVG/PNG/thumbnail they serve, with a visible relationship to the
  LDraw scene.

A copied output must keep a link or recorded reference to the LDraw scene and its
hash. A consumer must not silently restyle a diagram into a different technical
claim.

## Public manifest

`https://ldraw.loftwah.com/architecture/manifest.json` contains:

```json
{
  "contract": "ldraw.portfolio-architecture/1",
  "entries": [
    {
      "id": "protocol11-architecture",
      "project": "protocol11",
      "title": "Protocol 11",
      "summary": "A local card table with optional rooms, invitations and persistent platform records.",
      "coverage": "source-verified",
      "reviewedAt": "2026-10-26",
      "sourceRevision": "<40-character git revision>",
      "primarySourceRepo": "<owning repository>",
      "sourceFiles": ["..."],
      "scene": "/architecture/protocol11/overview.excalidraw",
      "sceneSha256": "<sha256>",
      "preview": "/architecture/protocol11/preview.webp",
      "previewSha256": "<sha256>",
      "elements": 50
    }
  ]
}
```

The manifest is data. It is not an instruction to deploy, publish or execute
anything. Consumers should pin the scene hash they adopt.

## Composer #375

Composer's diagram atlas can use the preview for its `/diagrams` index while
linking to the exact native scene. It should not build a second Excalidraw editor,
renderer or source of truth. If the atlas wants a different crop or copy, it
should record that as a derivative of the named scene.

Composer should adopt an exact independent LDraw source pin as part of its normal
release process. This repository does not write into Composer's working tree.

## Woodhouse #149

Woodhouse can publish a reviewed project/system page or a static export for its
public edition. The source relationship, review date and LDraw scene hash should
travel with the output. Woodhouse remains the editorial publisher; LDraw remains
the editing surface.

## Refresh

When an owning repository's architecture materially changes:

1. Re-read the manifest and source revision.
2. Update `src/architecture.mjs` only from the changed source.
3. Run `node scripts/architecture-build.mjs --write` and
   `node scripts/catalogue.mjs --write`.
4. Review the rendered preview at real size.
5. Publish a new LDraw release and tell consumers which scene/hash changed.

A source drift report is a review signal, not permission to invent a new diagram.

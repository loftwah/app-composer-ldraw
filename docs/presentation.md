# Presentation and export notes

LDraw is a drawing workspace, not a streaming platform or video editor. The
presentation work is limited to showing the existing canvas clearly.

## Present view

- **Present** or `Shift` + `P` toggles the clean view.
- The custom toolbar, save status, errors and library are hidden.
- Excalidraw enters zen and view mode; pointer pan, wheel/pinch zoom and the
  native zoom controls remain.
- A small HUD provides **Fit** and **Exit present**. The HUD does not claim to be
  a recording surface.
- The editor body requests fullscreen in the click gesture. If the browser
  refuses, the same clean view still works in-page.
- The scene renders with Excalidraw's light theme in present mode even when the
  editor chrome is dark. Scenes are authored with their own light/dark
  backgrounds, so this preserves the intended colours instead of inverting them.
- `Escape` leaves presentation. The native fullscreen change also exits cleanly.

This is intentionally not a second renderer. The same Excalidraw canvas is shown.

## 16:9 compositions

The Portfolio library includes:

- **Presentation stage** — a dark 1920 × 1080 stage with three content zones.
- **Project intro** — a light 1920 × 1080 opener with an artwork zone.
- **Architecture walkthrough** — a dark 1920 × 1080 three-step system stage.

Each native scene carries a background element with
`customData.ldrawPresentation = true` and `customData.ldrawAspect = "16:9"`.
`exportBlob` detects that marker and uses zero export padding so the output is a
true 1920 × 1080. At PNG scale 1× that is 1080p; at 2× it is 4K (3840 × 2160).
Other drawings keep the documented 24 px padding.

The preview WebP is cropped from the real renderer output (the renderer's 2×
padding is removed) and remains 1400 × 788, a 16:9 index image.

## Sharing

- PNG and SVG use the same Excalidraw renderer as the editor.
- Background can be unchecked for transparent export.
- SVG embeds local fonts and images; it is not a screenshot.
- The 1200 × 630 social card is a separate artifact rendered by
  `scripts/og.mjs`; it is not a substitute for a real project export.
- Keep an editable `.excalidraw` download for reuse. PNG/SVG do not preserve the
  editable scene.

## Limits

- Physical phone/tablet editing, stylus behaviour and screen-reader acceptance
  remain separate evidence; responsive screenshots prove layout only.
- Browser fullscreen permission may be refused; presentation still works in-page.
- Very large PNGs are refused with an actionable message rather than allocating
  an unbounded canvas.
- Offline presentation works only after the core editor, fonts and the current
  scene assets have loaded and been cached.

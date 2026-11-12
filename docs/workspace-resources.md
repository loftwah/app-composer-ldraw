# Daily diagram resources

[LDraw #10](https://github.com/loftwah/app-composer-ldraw/issues/10) records the
delivery plan and issue dispositions. The library has eight editable workflow
starters for app wiring, release verification, incident response, player and
first-run journeys, publication review, data recovery and agent handoff. The
labels describe example workflows and can be edited in Excalidraw.

## Asset provenance

- The 12 technical symbols come from [Tabler Icons v3.49.0](https://github.com/tabler/tabler-icons/tree/bbed884d15354b5cebf2493371f20dc2d5e83eaf/icons/outline).
  Each catalogue entry names its upstream file and revision. Local SVGs retain
  the original geometry, with a larger viewport output size, graphite stroke
  and an ivory backing. The PNG masters were rendered with macOS ImageIO
  (`sips -s format png <source.svg> --out <master.png>`). [The MIT notice](../public/licenses/Tabler-MIT.txt)
  accompanies the local WebP images and thumbnails.
- **From sketch to software** was generated with Codex's built-in ImageGen on
  12 November 2026. The [original source](../catalogue/source/idea-to-software.png)
  and the catalogue's SHA-256 identify the exact generation used for the local
  derivative. It is an original explanatory illustration.
- The [Hugging Face SVG Stack mirror](https://huggingface.co/datasets/MrOvkill/svg-stack-labeled/tree/09ff8559ae7fc65d985caa3abb35e0030056c418)
  was screened. Sample rows include logos and the dataset schema lacks dedicated
  per-asset source and licence fields. No dataset imagery was imported or used
  as a generation reference.

## ImageGen prompt

> Productivity visual, original diagram resource artwork for LDraw. One wide landscape editorial illustration for a product system explainer, in a precise hand-drafted ink and muted graphite style on warm ivory. A visual metaphor for taking an idea from notebook to live software: on a single continuous desk surface, a neatly open grid notebook with a few simple sketched shapes flows into three small abstract physical modular blocks and a slim unbranded upright display with a simple chart silhouette. Deliberate silhouette and generous breathing room, low contrast fine details and a few restrained burnt-orange accents. Objects read well in a small thumbnail and leave a little whitespace around the edges. No words, no letters, no numbers, no logos, no watermarks, no brand references. This is an insertable standalone visual for explaining the design-to-delivery process.

## Updating selected assets

After reviewing sources and updating the asset records, run
`node scripts/harvest-assets.mjs --write --ids id-one,id-two` and
`node scripts/catalogue.mjs --write`. The scoped harvest retains existing
derivatives for other assets and rejects unknown IDs.

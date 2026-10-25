/**
 * Regenerate the local Excalifont advance/kerning table used by the MCP adapter.
 *
 * The table is measured from the exact bundled font in a real browser through
 * the existing built app, using the same Canvas measureText() call that the
 * pinned Excalidraw renderer uses for native text sizing. The adapter never
 * guesses glyph widths: an unknown character is rejected instead.
 *
 * Run only when the pinned font or engine changes:
 *   node scripts/font-metrics.mjs
 * Requires `pnpm build` and the host Playwright Chromium. No network is used.
 */
import { writeFile } from "node:fs/promises";
import { withBrowser } from "./browser.mjs";

export const SAMPLE_SIZE = 100;
export const LINE_HEIGHT = 1.25;
/**
 * Explicit, bounded character set. Anything else is refused by the adapter
 * rather than measured against a machine-specific system fallback font.
 * Arrows, emoji and CJK are deliberately excluded: the bundled fonts do not
 * cover them, so their advance width would vary by host.
 */
export const EXTRA_CHARS = [
  "\u00b7",
  "\u2013",
  "\u2014",
  "\u2018",
  "\u2019",
  "\u201c",
  "\u201d",
  "\u2026",
  "\u2022",
  "\u00d7",
  "\u2713",
];
const charset = [
  ...Array.from({ length: 95 }, (_, index) => String.fromCharCode(32 + index)),
  ...EXTRA_CHARS,
];
const round = (value) => Math.round(value * 1000) / 1000;

/** Measured in the real editor page so its registered font files are used. */
export async function measureFont() {
  return withBrowser(async ({ page }) => {
    await page.evaluate(async () => {
      await document.fonts.load("100px Excalifont", "App Composer ·");
    });
    return page.evaluate(
      ({ charset, size }) => {
        const context = document.createElement("canvas").getContext("2d");
        // `context.font` is mutable state, so each helper sets it explicitly.
        const width = (text) => {
          context.font = `${size}px Excalifont`;
          return context.measureText(text).width;
        };
        const fallback = (text) => {
          context.font = `${size}px "__ldraw_missing_font_for_coverage__"`;
          return context.measureText(text).width;
        };
        const chars = {};
        const coverage = {};
        const errors = [];
        for (const character of charset) {
          const exact = width(character);
          if (!Number.isFinite(exact) || exact <= 0)
            errors.push(
              `U+${character.codePointAt(0).toString(16).toUpperCase()} has no measurable advance`,
            );
          // A width identical to an absent font means the bundled fonts do not
          // cover the glyph, so the result would depend on the host system.
          coverage[character] = exact !== fallback(character);
          if (!coverage[character])
            errors.push(
              `U+${character.codePointAt(0).toString(16).toUpperCase()} is not covered by the bundled fonts`,
            );
          chars[character] = exact;
        }
        const pairs = {};
        for (const first of charset)
          for (const second of charset) {
            const pair = first + second;
            const delta = width(pair) - chars[first] - chars[second];
            if (Math.abs(delta) > 0.001) pairs[pair] = delta;
          }
        // Exactness check for every character and pair, then multi-character
        // strings that exercise the additive model the adapter relies on.
        let worst = 0;
        const samples = [
          "App Composer architecture",
          "Owner intent stays separate from agent implementation.",
          "One owner \u00b7 independent apps \u00b7 shared discovery",
          "The quick brown fox jumps over the lazy dog 0123456789",
          "fi fl ffi office AVATAR To Wa 11 -- // \u2026",
        ];
        for (const sample of samples) {
          let predicted = 0;
          for (let index = 0; index < sample.length; index += 1) {
            predicted += chars[sample[index]] ?? 0;
            if (index)
              predicted += pairs[sample.slice(index - 1, index + 1)] ?? 0;
          }
          worst = Math.max(worst, Math.abs(predicted - width(sample)));
        }
        return {
          chars,
          coverage,
          pairs,
          errors,
          worstSampleError: worst,
          loadedFamilies: [...document.fonts]
            .filter((font) => font.status === "loaded")
            .map((font) => font.family),
        };
      },
      { charset, size: SAMPLE_SIZE },
    );
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const measured = await measureFont();
  if (measured.errors.length) throw new Error(measured.errors.join("; "));
  if (measured.worstSampleError > 0.01)
    throw new Error(
      `Additive advance table is off by ${measured.worstSampleError}px; review the font before trusting it.`,
    );
  const uncovered = Object.entries(measured.coverage)
    .filter(([, covered]) => !covered)
    .map(([character]) => `U+${character.codePointAt(0).toString(16)}`);
  if (uncovered.length)
    throw new Error(`Fonts do not cover: ${uncovered.join(", ")}`);
  const data = {
    provenance: {
      font: "Excalifont",
      engine: "@excalidraw/excalidraw@0.18.1",
      measuredWith:
        "CanvasRenderingContext2D.measureText in the built LDraw app",
      sampleSize: SAMPLE_SIZE,
      lineHeight: LINE_HEIGHT,
      characters: charset.length,
      kerningPairs: Object.keys(measured.pairs).length,
      worstSampleErrorPx: round(measured.worstSampleError),
      network: "none",
    },
    chars: Object.fromEntries(
      Object.entries(measured.chars).map(([key, value]) => [key, round(value)]),
    ),
    pairs: Object.fromEntries(
      Object.entries(measured.pairs).map(([key, value]) => [key, round(value)]),
    ),
  };
  await writeFile(
    "scripts/mcp/font-metrics.json",
    `${JSON.stringify(data, null, 2)}\n`,
  );
  console.log(
    JSON.stringify({
      characters: data.provenance.characters,
      kerningPairs: data.provenance.kerningPairs,
      worstSampleErrorPx: data.provenance.worstSampleErrorPx,
      loadedFamilies: measured.loadedFamilies,
      written: "scripts/mcp/font-metrics.json",
    }),
  );
}

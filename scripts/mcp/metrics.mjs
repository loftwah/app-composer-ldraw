/**
 * Exact native text metrics for the pinned editor font.
 *
 * `font-metrics.json` is generated from the bundled Excalifont in a real
 * browser (see `scripts/font-metrics.mjs`) and is additive: advance widths
 * plus non-zero kerning pairs, measured at 100 px and scaled linearly, which
 * matches Canvas measureText() to under 0.001 px at every editor size.
 *
 * Characters outside the measured set are refused instead of silently
 * falling back to a host-specific system font. This keeps saved scenes and
 * rendered PNG/SVG bounds identical on every machine.
 */
import data from "./font-metrics.json" with { type: "json" };

export const LINE_HEIGHT = data.provenance.lineHeight;
export const FONT_FAMILY = 5;
export const MEASURED_CHARACTERS = Object.keys(data.chars);
const supported = new Set(MEASURED_CHARACTERS);

export class TextRefusal extends Error {}

/** Return every character the measured font does not cover. */
export function unsupportedCharacters(text) {
  return [
    ...new Set(
      [...text].filter(
        (character) =>
          character !== "\n" && character !== "\t" && !supported.has(character),
      ),
    ),
  ];
}

function advance(text, fontSize) {
  let total = 0;
  for (let index = 0; index < text.length; index += 1) {
    total += data.chars[text[index]] ?? 0;
    if (index) total += data.pairs[text.slice(index - 1, index + 1)] ?? 0;
  }
  return (total / data.provenance.sampleSize) * fontSize;
}

/**
 * Native text size for the exact bytes an agent asked to draw.
 * Width is rounded up at 0.01 px so the saved bound can never clip a glyph.
 */
export function measureText(input, fontSize) {
  if (typeof input !== "string" || !input.length)
    throw new TextRefusal("Text must contain at least one character.");
  if (!Number.isFinite(fontSize) || fontSize < 8 || fontSize > 96)
    throw new TextRefusal("Font size must be between 8 and 96.");
  // Excalidraw expands tabs to eight spaces before measuring a line.
  const normalised = input.replace(/\t/g, "        ");
  const missing = unsupportedCharacters(normalised);
  if (missing.length)
    throw new TextRefusal(
      `Unsupported characters: ${missing
        .map(
          (character) =>
            `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`,
        )
        .join(
          ", ",
        )}. Use the measured Latin set described by ldraw_list_templates.`,
    );
  const lines = normalised.split("\n");
  if (lines.length > 20) throw new TextRefusal("Text is limited to 20 lines.");
  const width =
    Math.ceil(Math.max(...lines.map((line) => advance(line, fontSize))) * 100) /
    100;
  return {
    width,
    height: Math.ceil(lines.length * fontSize * LINE_HEIGHT * 100) / 100,
    lines: lines.length,
  };
}

export function metricsProvenance() {
  return {
    font: data.provenance.font,
    engine: data.provenance.engine,
    sampleSize: data.provenance.sampleSize,
    lineHeight: data.provenance.lineHeight,
    characters: MEASURED_CHARACTERS.length,
    kerningPairs: Object.keys(data.pairs).length,
    worstSampleErrorPx: data.provenance.worstSampleErrorPx,
    measuredWith: data.provenance.measuredWith,
  };
}

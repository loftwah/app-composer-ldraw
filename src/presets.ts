import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { LibraryItem } from "@excalidraw/excalidraw/types";
import {
  buildPreset,
  INK,
  librarySpecs,
  type PresetName,
  type ProjectName,
} from "./diagrams.mjs";

let presetFont: Promise<void> | undefined;
export const PRESET_FONT_ERROR =
  "The example font is unavailable. Your drawing is unchanged. Save editable, then reload when connected.";
/** Wait for the native registered font before measuring any new preset text. */
export function preparePresetFont(): Promise<void> {
  return (presetFont ??= new Promise<void>((resolve, reject) => {
    let frame = 0;
    let settled = false;
    const timer = setTimeout(() => finish(new Error(PRESET_FONT_ERROR)), 8000);
    function finish(error?: unknown) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      if (error) reject(error);
      else resolve();
    }
    function registered() {
      const available = [...document.fonts].some(
        (font) => font.family.replace(/["']/g, "") === "Excalifont",
      );
      if (!available) {
        frame = requestAnimationFrame(registered);
        return;
      }
      void document.fonts
        .load("32px Excalifont", "Creator journey ·")
        .then((fonts) => {
          if (!fonts.length || fonts.some((font) => font.status !== "loaded"))
            finish(new Error(PRESET_FONT_ERROR));
          else finish();
        }, finish);
    }
    registered();
  }).catch(() => {
    // A failed native FontFace can stay rejected for this document's lifetime.
    // Recovery is an explicit saved-drawing reload, never a promised in-page retry.
    throw new Error(PRESET_FONT_ERROR);
  }));
}

export const projects = {
  composer: { label: "Composer", stroke: "#FC5B05", fill: "#FFE8D9" },
  infrastructure: {
    label: "Infrastructure",
    stroke: "#1E40AF",
    fill: "#DBEAFE",
  },
  game: { label: "Game design", stroke: "#6D28D9", fill: "#EDE9FE" },
  music: { label: "Music / FM", stroke: "#047857", fill: "#D1FAE5" },
  general: { label: "General", stroke: "#1B1B1F", fill: "#F5F5F4" },
} as const;
export type Project = keyof typeof projects;

export const presets = {
  portfolio: {
    label: "Portfolio map",
    notes: "The maintained apps, their owner and audience.",
  },
  journey: {
    label: "Creator journey",
    notes: "One owner · independent apps · shared discovery",
  },
  architecture: {
    label: "Service architecture",
    notes: "Draw the trust boundaries, then connect the real services.",
  },
  game: {
    label: "Game loop",
    notes: "An editable loop: add the player choices and the stakes.",
  },
  release: {
    label: "Music release",
    notes: "Add the release details, artwork and distribution paths.",
  },
  beforeAfter: {
    label: "Before / after",
    notes: "Show the concrete problem and the resulting experience.",
  },
} as const;
export type Preset = keyof typeof presets;

/** Call preparePresetFont() before measuring newly generated scene elements. */
export function makePreset(
  name: Preset,
  project: Project,
  offsetY = 0,
  ink = INK,
) {
  const elements = buildPreset(
    name as PresetName,
    project as ProjectName,
    ink,
  ).map((element) => ({ ...element, y: (element.y ?? 0) + offsetY }));
  return convertToExcalidrawElements(elements);
}

/** Stable ids keep the built-in library merged with, never duplicated over, the owner's own items. */
export function makeLibraryItems(): LibraryItem[] {
  return librarySpecs.map((item) => ({
    id: `ldraw-${item.id}`,
    status: "published" as const,
    name: item.name,
    created: 1_761_350_400_000,
    elements: convertToExcalidrawElements(item.elements, {
      regenerateIds: false,
    }),
  }));
}

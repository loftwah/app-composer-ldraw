import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";

let presetFont: Promise<void> | undefined;
/** Wait for the native registered font before measuring any new preset text. */
export function preparePresetFont(): Promise<void> {
  return (presetFont ??= new Promise<void>((resolve, reject) => {
    let frame = 0;
    let settled = false;
    const timer = setTimeout(
      () =>
        finish(
          new Error(
            "The example font could not load. Local drawing and downloads remain available; try Insert example again when connected.",
          ),
        ),
      8000,
    );
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
            finish(
              new Error(
                "The example font is unavailable. Your existing drawing is unchanged.",
              ),
            );
          else finish();
        }, finish);
    }
    registered();
  }).catch((error) => {
    presetFont = undefined;
    throw error;
  }));
}

export const projects = {
  composer: { label: "Composer", stroke: "#FC5B05", fill: "#fff4ed" },
  infrastructure: {
    label: "Infrastructure",
    stroke: "#1e40af",
    fill: "#dbeafe",
  },
  game: { label: "Game design", stroke: "#6d28d9", fill: "#ede9fe" },
  music: { label: "Music / FM", stroke: "#047857", fill: "#d1fae5" },
  general: { label: "General", stroke: "#1b1b1f", fill: "#f5f5f4" },
} as const;
export type Project = keyof typeof projects;
export const presets = {
  journey: {
    label: "Creator journey",
    labels: ["Creator", "Composer", "Mini-apps", "Audience"],
    notes: "One owner · independent apps · shared discovery",
  },
  architecture: {
    label: "Service architecture",
    labels: ["Browser", "Worker", "Database", "Assets"],
    notes: "Draw the trust boundaries, then connect the real services.",
  },
  game: {
    label: "Game loop",
    labels: ["Play", "Challenge", "Reward", "One more round"],
    notes: "An editable loop: add the player choices and the stakes.",
  },
  release: {
    label: "Music release",
    labels: ["Create", "Master", "Publish", "Listen"],
    notes: "Add the release details, artwork and distribution paths.",
  },
  beforeAfter: {
    label: "Before / after",
    labels: ["Before", "Change", "After"],
    notes: "Show the concrete problem and the resulting experience.",
  },
} as const;
export type Preset = keyof typeof presets;
/** Call preparePresetFont() before measuring newly generated scene elements. */
export function makePreset(name: Preset, project: Project, offsetY = 0) {
  const { labels, notes } = presets[name];
  const palette = projects[project];
  const elements: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      x: 80,
      y: 70 + offsetY,
      text: presets[name].label,
      fontSize: 32,
      fontFamily: 5,
      strokeColor: "#1b1b1f",
    },
    {
      type: "text",
      x: 80,
      y: 120 + offsetY,
      text: notes,
      fontSize: 18,
      fontFamily: 5,
      strokeColor: "#57534e",
    },
  ];
  labels.forEach((label, i) => {
    elements.push({
      type: "rectangle",
      x: 80 + i * 230,
      y: 210 + offsetY,
      width: 180,
      height: 110,
      strokeColor: palette.stroke,
      backgroundColor: palette.fill,
      fillStyle: "solid",
      roundness: { type: 3 },
      label: { text: label, fontSize: 22, fontFamily: 5 },
    });
    if (i < labels.length - 1)
      elements.push({
        type: "arrow",
        x: 270 + i * 230,
        y: 265 + offsetY,
        width: 30,
        height: 0,
        points: [
          [0, 0],
          [30, 0],
        ],
        strokeColor: palette.stroke,
      });
  });
  return convertToExcalidrawElements(elements);
}

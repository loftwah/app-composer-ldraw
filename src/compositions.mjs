/**
 * Authored 16:9 presentation compositions.
 *
 * These are plain native-vector skeletons, not a second scene format. They are
 * exposed in the Portfolio library as reusable compositions and can also be
 * authored through the same MCP template path as any other block. Text uses
 * the measured Excalifont; nothing here fetches an image or a font.
 */
const INK = "#1D2330";
const IVORY = "#F7F3EA";
const CHARCOAL = "#141416";
const ORANGE = "#FC5B05";
const MUTED = "#6B645C";
const SOFT = "#C8C8CF";
const RULE = "#3B3B42";

function rect(id, x, y, width, height, options = {}) {
  return {
    id,
    type: "rectangle",
    x,
    y,
    width,
    height,
    strokeColor: options.stroke ?? RULE,
    backgroundColor: options.fill ?? "transparent",
    fillStyle: "solid",
    strokeWidth: options.strokeWidth ?? 1,
    strokeStyle: options.strokeStyle ?? "solid",
    roughness: 0,
    roundness: options.roundness === false ? null : { type: 3 },
    opacity: 100,
    ...(options.customData ? { customData: options.customData } : {}),
  };
}

function text(id, x, y, value, options = {}) {
  return {
    id,
    type: "text",
    x,
    y,
    text: value,
    fontSize: options.size ?? 16,
    fontFamily: 5,
    strokeColor: options.color ?? INK,
    textAlign: "left",
    verticalAlign: "top",
    opacity: 100,
  };
}

function line(id, x, y, width, height, options = {}) {
  return {
    id,
    type: "line",
    x,
    y,
    width,
    height,
    points: [
      [0, 0],
      [width, height],
    ],
    strokeColor: options.stroke ?? RULE,
    strokeWidth: options.strokeWidth ?? 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
  };
}

function arrow(id, x1, y1, x2, y2, options = {}) {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  return {
    id,
    type: "arrow",
    x: left,
    y: top,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    points: [
      [x1 - left, y1 - top],
      [x2 - left, y2 - top],
    ],
    strokeColor: options.stroke ?? ORANGE,
    strokeWidth: options.strokeWidth ?? 2,
    strokeStyle: "solid",
    roughness: 0,
    endArrowhead: "arrow",
    startArrowhead: null,
    opacity: 100,
  };
}

function stageFrame(prefix) {
  return [
    rect(`${prefix}-bg`, 0, 0, 1920, 1080, {
      stroke: CHARCOAL,
      fill: CHARCOAL,
      strokeWidth: 1,
      roundness: false,
      customData: { ldrawPresentation: true, ldrawAspect: "16:9" },
    }),
    rect(`${prefix}-accent`, 96, 78, 84, 7, {
      stroke: ORANGE,
      fill: ORANGE,
      strokeWidth: 1,
      roundness: false,
    }),
    text(`${prefix}-kicker`, 96, 106, "PORTFOLIO / PRESENTATION", {
      size: 16,
      color: ORANGE,
    }),
    line(`${prefix}-footer-rule`, 96, 1004, 1728, 0, { stroke: RULE }),
    text(`${prefix}-footer`, 96, 1022, "LDraw · local-first Excalidraw workspace", {
      size: 14,
      color: "#8F8F98",
    }),
    text(`${prefix}-format`, 1510, 1022, "16:9 · 1920 × 1080", {
      size: 14,
      color: "#8F8F98",
    }),
  ];
}

const stage = {
  id: "composition-stage",
  name: "Presentation stage",
  description: "A 16:9 dark stage with three content zones",
  collection: "general",
  composition: true,
  native: false,
  width: 1920,
  height: 1080,
  elements: [
    ...stageFrame("composition-stage"),
    text("composition-stage-title", 96, 146, "Project name", {
      size: 64,
      color: IVORY,
    }),
    text(
      "composition-stage-subtitle",
      96,
      238,
      "One line that explains what this is and why it matters.",
      { size: 24, color: SOFT },
    ),
    rect("composition-stage-zone-1", 96, 358, 520, 540, {
      stroke: "#FFFFFF40",
      fill: "#FFFFFF08",
      strokeStyle: "dashed",
    }),
    text("composition-stage-zone-1-title", 124, 386, "01 · Context", {
      size: 22,
      color: IVORY,
    }),
    text(
      "composition-stage-zone-1-note",
      124,
      424,
      "The person, the problem or the moment.",
      { size: 16, color: SOFT },
    ),
    rect("composition-stage-zone-2", 700, 358, 520, 540, {
      stroke: "#FFFFFF40",
      fill: "#FFFFFF08",
      strokeStyle: "dashed",
    }),
    text("composition-stage-zone-2-title", 728, 386, "02 · System", {
      size: 22,
      color: IVORY,
    }),
    text(
      "composition-stage-zone-2-note",
      728,
      424,
      "The real architecture, flow or design.",
      { size: 16, color: SOFT },
    ),
    rect("composition-stage-zone-3", 1304, 358, 520, 540, {
      stroke: "#FFFFFF40",
      fill: "#FFFFFF08",
      strokeStyle: "dashed",
    }),
    text("composition-stage-zone-3-title", 1332, 386, "03 · Result", {
      size: 22,
      color: IVORY,
    }),
    text(
      "composition-stage-zone-3-note",
      1332,
      424,
      "The evidence, outcome or next decision.",
      { size: 16, color: SOFT },
    ),
  ],
};

const intro = {
  id: "composition-intro",
  name: "Project intro",
  description: "A 16:9 project opener with an artwork zone",
  collection: "general",
  composition: true,
  native: false,
  width: 1920,
  height: 1080,
  elements: [
    rect("composition-intro-bg", 0, 0, 1920, 1080, {
      stroke: IVORY,
      fill: IVORY,
      strokeWidth: 1,
      roundness: false,
      customData: { ldrawPresentation: true, ldrawAspect: "16:9" },
    }),
    rect("composition-intro-bar", 96, 96, 8, 888, {
      stroke: ORANGE,
      fill: ORANGE,
      strokeWidth: 1,
      roundness: false,
    }),
    text("composition-intro-kicker", 140, 100, "PROJECT", {
      size: 16,
      color: ORANGE,
    }),
    text("composition-intro-title", 140, 136, "Project name", {
      size: 72,
      color: INK,
    }),
    text(
      "composition-intro-subtitle",
      140,
      240,
      "What it is, in one useful sentence.",
      { size: 26, color: MUTED },
    ),
    rect("composition-intro-art", 140, 342, 900, 590, {
      stroke: "#C8C2B8",
      fill: "#FFFFFF",
      strokeStyle: "dashed",
    }),
    text("composition-intro-art-label", 404, 610, "Drop artwork or a real screenshot here", {
      size: 22,
      color: MUTED,
    }),
    text("composition-intro-why", 1130, 342, "Why it matters", {
      size: 30,
      color: INK,
    }),
    text(
      "composition-intro-why-note",
      1130,
      390,
      "Add two or three concrete lines. Keep the real system,\nnot a generic claim.",
      { size: 20, color: MUTED },
    ),
    line("composition-intro-rule", 1130, 510, 560, 0, { stroke: "#D6D3D1" }),
    text("composition-intro-proof", 1130, 542, "What is proven", {
      size: 22,
      color: INK,
    }),
    text(
      "composition-intro-proof-note",
      1130,
      586,
      "Source-verified diagram\nEditable native scene\nReal project artwork",
      { size: 19, color: MUTED },
    ),
    text("composition-intro-footer", 1130, 930, "LDraw · 16:9 project opener", {
      size: 14,
      color: MUTED,
    }),
  ],
};

const walkthrough = {
  id: "composition-walkthrough",
  name: "Architecture walkthrough",
  description: "A 16:9 three-step system explanation",
  collection: "general",
  composition: true,
  native: false,
  width: 1920,
  height: 1080,
  elements: [
    ...stageFrame("composition-walkthrough"),
    text("composition-walkthrough-title", 96, 146, "How it works", {
      size: 64,
      color: IVORY,
    }),
    text(
      "composition-walkthrough-subtitle",
      96,
      238,
      "Follow one real request from a person to the system of record.",
      { size: 24, color: SOFT },
    ),
    rect("composition-walkthrough-1", 96, 370, 470, 500, {
      stroke: "#FFFFFF40",
      fill: "#FFFFFF0A",
    }),
    text("composition-walkthrough-1-kicker", 124, 398, "01 · SURFACE", {
      size: 15,
      color: ORANGE,
    }),
    text("composition-walkthrough-1-title", 124, 430, "What the person does", {
      size: 24,
      color: IVORY,
    }),
    text(
      "composition-walkthrough-1-note",
      124,
      474,
      "Name the actual entry point, the\naction and the visible result.",
      { size: 17, color: SOFT },
    ),
    rect("composition-walkthrough-2", 724, 370, 470, 500, {
      stroke: "#FFFFFF40",
      fill: "#FFFFFF0A",
    }),
    text("composition-walkthrough-2-kicker", 752, 398, "02 · RUNTIME", {
      size: 15,
      color: ORANGE,
    }),
    text("composition-walkthrough-2-title", 752, 430, "What actually runs", {
      size: 24,
      color: IVORY,
    }),
    text(
      "composition-walkthrough-2-note",
      752,
      474,
      "Use the real runtime, service\nboundary and API names.",
      { size: 17, color: SOFT },
    ),
    rect("composition-walkthrough-3", 1352, 370, 470, 500, {
      stroke: "#FFFFFF40",
      fill: "#FFFFFF0A",
    }),
    text("composition-walkthrough-3-kicker", 1380, 398, "03 · DATA", {
      size: 15,
      color: ORANGE,
    }),
    text("composition-walkthrough-3-title", 1380, 430, "What is kept", {
      size: 24,
      color: IVORY,
    }),
    text(
      "composition-walkthrough-3-note",
      1380,
      474,
      "Storage, cache, retention and\nthe honest recovery boundary.",
      { size: 17, color: SOFT },
    ),
    arrow("composition-walkthrough-arrow-1", 566, 620, 724, 620),
    arrow("composition-walkthrough-arrow-2", 1194, 620, 1352, 620),
    text(
      "composition-walkthrough-footer-note",
      96,
      930,
      "Open a source-verified architecture scene for the real components, then use this stage for the story.",
      { size: 16, color: SOFT },
    ),
  ],
};

export const compositionSpecs = [stage, intro, walkthrough];

export const compositionCatalogue = compositionSpecs.map((item) => ({
  id: item.id,
  name: item.name,
  description: item.description,
}));

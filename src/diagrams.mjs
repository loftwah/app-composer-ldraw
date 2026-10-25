/**
 * Pure diagram data for LDraw's built-in library and starting examples.
 *
 * Nothing here imports Excalidraw, measures text or touches the DOM, so the
 * exact blocks can be inspected in Node before the editor converts them.
 * Every library item is self-contained: card fills stay light so the same
 * block remains readable on a dark or light canvas.
 */

export const INK = "#1D2330";
export const MUTED = "#6B645C";
export const PAPER = "#F4F0E8";
export const LINE = "#D6D3D1";
export const ORANGE = "#FC5B05";
export const ORANGE_TINT = "#FFE8D9";
export const BLUE = "#1E40AF";
export const BLUE_TINT = "#DBEAFE";
export const VIOLET = "#6D28D9";
export const VIOLET_TINT = "#EDE9FE";
export const GREEN = "#047857";
export const GREEN_TINT = "#D1FAE5";
export const LIME = "#4D7C0F";
export const LIME_TINT = "#ECFCCB";

export const collections = [
  {
    id: "apps",
    label: "Apps",
    description: "Editable cards for the maintained portfolio apps.",
  },
  {
    id: "composer",
    label: "App Composer",
    description: "The owner journey, review boundary and delivery path.",
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    description: "Cloudflare runtime, storage and trust boundaries.",
  },
  {
    id: "games",
    label: "Games",
    description: "Loops, progression and player-facing building blocks.",
  },
  {
    id: "music",
    label: "Music / FM",
    description: "Production, release and listener journeys.",
  },
  {
    id: "general",
    label: "General",
    description: "Wireframes, comparisons and launch checks.",
  },
];

export const apps = [
  {
    key: "composer",
    title: "App Composer",
    subtitle: "Describe · build · deploy · own",
    accent: ORANGE,
    tint: ORANGE_TINT,
  },
  {
    key: "ldraw",
    title: "LDraw",
    subtitle: "Editable diagrams, local-first",
    accent: ORANGE,
    tint: ORANGE_TINT,
  },
  {
    key: "paperwork",
    title: "Paperwork",
    subtitle: "Fill, sign and print PDFs",
    accent: "#C74400",
    tint: "#FFE8D9",
  },
  {
    key: "linkarooie",
    title: "Linkarooie",
    subtitle: "One link for every project",
    accent: LIME,
    tint: LIME_TINT,
  },
  {
    key: "guestbook",
    title: "Guestbook",
    subtitle: "Visitor notes, owner review",
    accent: BLUE,
    tint: BLUE_TINT,
  },
  {
    key: "showcase",
    title: "Showcase",
    subtitle: "A gallery of real apps",
    accent: VIOLET,
    tint: VIOLET_TINT,
  },
  {
    key: "linkcheck",
    title: "Link Check",
    subtitle: "Open Graph and SEO checks",
    accent: GREEN,
    tint: GREEN_TINT,
  },
  {
    key: "launchkit",
    title: "Launch Kit",
    subtitle: "Icons, PWA and share art",
    accent: "#9A3412",
    tint: "#FFEDD5",
  },
];

/**
 * Honest brand state. A colour in `apps` is starting diagram data, not an
 * approved identity: only App Composer's flat orange mark, LDraw's typographic
 * wordmark and Linkarooie's documented lime family have supporting notes in
 * docs/asset-provenance.md. Everything else stays visibly unresolved so an
 * agent cannot invent a rebrand.
 */
export const brandStatus = {
  composer: {
    status: "approved-identity",
    note: "Canonical App Composer orange #FC5B05 and flat merging-block mark, per docs/asset-provenance.md.",
  },
  ldraw: {
    status: "typographic",
    note: "Typographic wordmark only; this app reuses Composer orange as a UI accent, not as a new logo.",
  },
  linkarooie: {
    status: "documented-palette",
    note: "Documented Linkarooie lime family; a full identity asset package is not included in this repository.",
  },
  paperwork: {
    status: "starting-data",
    note: "Diagram starting colour only. Not an approved Paperwork brand package.",
  },
  guestbook: {
    status: "starting-data",
    note: "Diagram starting colour only. Not an approved Guestbook brand package.",
  },
  showcase: {
    status: "starting-data",
    note: "Diagram starting colour only. Not an approved Showcase brand package.",
  },
  linkcheck: {
    status: "starting-data",
    note: "Diagram starting colour only. Not an approved Link Check brand package.",
  },
  launchkit: {
    status: "unresolved",
    note: "Launch Kit owns identity asset packages; none are included here.",
  },
};

/** Named identities with no approved asset or palette data in this repository. */
export const unresolvedBrandIdentities = [
  "Woodhouse",
  "Protocol 11",
  "Bubbles",
  "SHOALSHOT",
  "Fighter",
  "LoftwahFM",
];

/** Which project topic is a brand, and which is only diagram colour. */
export const projectBrand = {
  composer: brandStatus.composer,
  infrastructure: {
    status: "diagram-topic",
    note: "Infrastructure palette describes a diagram topic. It is not a separate approved identity.",
  },
  game: {
    status: "diagram-topic",
    note: "Game design palette describes a diagram topic. It is not a separate approved identity.",
  },
  music: {
    status: "diagram-topic",
    note: "Music / FM palette describes a diagram topic. It is not a separate approved identity.",
  },
  general: {
    status: "neutral",
    note: "Neutral wireframe palette with no brand claim.",
  },
};

function rectangle(id, x, y, width, height, options = {}) {
  return {
    id,
    type: "rectangle",
    x,
    y,
    width,
    height,
    strokeColor: options.stroke ?? INK,
    backgroundColor: options.fill ?? "transparent",
    fillStyle: options.fillStyle ?? "solid",
    strokeWidth: options.strokeWidth ?? 2,
    strokeStyle: "solid",
    roughness: 0,
    roundness: options.roundness === false ? null : { type: 3 },
    opacity: 100,
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

function arrow(id, x, y, width, height, options = {}) {
  return {
    id,
    type: "arrow",
    x,
    y,
    width,
    height,
    points: [
      [0, 0],
      [width, height],
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
    strokeColor: options.stroke ?? LINE,
    strokeWidth: options.strokeWidth ?? 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
  };
}

function chip(id, x, y, label, options = {}) {
  const width = options.width ?? 150;
  const height = options.height ?? 54;
  return [
    {
      ...rectangle(id, x, y, width, height, {
        stroke: options.accent ?? ORANGE,
        fill: options.tint ?? ORANGE_TINT,
        strokeWidth: options.strokeWidth ?? 2,
      }),
      label: {
        text: label,
        fontSize: options.size ?? 15,
        fontFamily: 5,
        strokeColor: options.labelColor ?? INK,
      },
    },
  ];
}

function flow(id, x, y, labels, options = {}) {
  const width = options.width ?? 150;
  const height = options.height ?? 54;
  const gap = options.gap ?? 34;
  const elements = [];
  labels.forEach((label, index) => {
    elements.push(
      ...chip(`${id}-${index + 1}`, x + index * (width + gap), y, label, {
        ...options,
        width,
        height,
      }),
    );
    if (index < labels.length - 1)
      elements.push(
        arrow(
          `${id}-arrow-${index + 1}`,
          x + index * (width + gap) + width,
          y + height / 2,
          gap,
          0,
          { stroke: options.accent ?? ORANGE },
        ),
      );
  });
  return elements;
}

export function appCard(id, x, y, app, options = {}) {
  const width = options.width ?? 240;
  const height = options.height ?? 124;
  return [
    rectangle(id, x, y, width, height, {
      stroke: app.accent,
      fill: app.tint,
    }),
    rectangle(`${id}-bar`, x + 9, y + 12, 5, height - 24, {
      stroke: app.accent,
      fill: app.accent,
      strokeWidth: 1,
      roundness: false,
    }),
    text(`${id}-title`, x + 24, y + 20, app.title, {
      size: options.titleSize ?? 22,
      color: INK,
    }),
    text(`${id}-subtitle`, x + 24, y + 58, app.subtitle, {
      size: 12,
      color: MUTED,
    }),
    text(`${id}-tag`, x + 24, y + height - 28, "PORTFOLIO APP", {
      size: 9,
      color: app.accent,
    }),
  ];
}

function browserFrame(id, x, y, options = {}) {
  const width = options.width ?? 360;
  const height = options.height ?? 210;
  const accent = options.accent ?? ORANGE;
  const elements = [
    rectangle(id, x, y, width, height, { stroke: INK, fill: PAPER }),
    rectangle(`${id}-chrome`, x + 1, y + 1, width - 2, 32, {
      stroke: LINE,
      fill: "#E7E5E4",
      strokeWidth: 1,
      roundness: { type: 3 },
    }),
    rectangle(`${id}-url`, x + 54, y + 9, width - 70, 16, {
      stroke: LINE,
      fill: "#FFFFFF",
      strokeWidth: 1,
    }),
    text(`${id}-url-text`, x + 64, y + 10, options.url ?? "app.example", {
      size: 10,
      color: MUTED,
    }),
  ];
  [0, 1, 2].forEach((index) =>
    elements.push(
      rectangle(`${id}-dot-${index}`, x + 16 + index * 12, y + 14, 6, 6, {
        stroke: index === 0 ? accent : MUTED,
        fill: index === 0 ? accent : MUTED,
        strokeWidth: 1,
        roundness: false,
      }),
    ),
  );
  const rows = options.rows ?? [0.82, 0.64, 0.72, 0.46];
  rows.forEach((fraction, index) =>
    elements.push(
      rectangle(
        `${id}-row-${index}`,
        x + 22,
        y + 56 + index * 28,
        (width - 44) * fraction,
        9,
        {
          stroke: LINE,
          fill: index === 0 ? accent : "#E7E5E4",
          strokeWidth: 1,
          roundness: { type: 3 },
        },
      ),
    ),
  );
  if (options.title)
    elements.push(
      text(`${id}-label`, x, y - 30, options.title, {
        size: 16,
        color: options.labelColor ?? INK,
      }),
    );
  return elements;
}

function phoneFrame(id, x, y, options = {}) {
  const accent = options.accent ?? ORANGE;
  return [
    rectangle(id, x, y, 150, 300, { stroke: INK, fill: PAPER }),
    rectangle(`${id}-screen`, x + 8, y + 28, 134, 264, {
      stroke: LINE,
      fill: "#FFFFFF",
      strokeWidth: 1,
      roundness: false,
    }),
    rectangle(`${id}-notch`, x + 52, y + 8, 46, 12, {
      stroke: INK,
      fill: INK,
      strokeWidth: 1,
    }),
    rectangle(`${id}-hero`, x + 20, y + 46, 110, 52, {
      stroke: accent,
      fill: accent,
      strokeWidth: 1,
    }),
    ...[0, 1, 2, 3].map((index) =>
      rectangle(
        `${id}-row-${index}`,
        x + 20,
        y + 116 + index * 26,
        index === 3 ? 62 : 110,
        9,
        {
          stroke: LINE,
          fill: "#E7E5E4",
          strokeWidth: 1,
        },
      ),
    ),
    rectangle(`${id}-cta`, x + 20, y + 232, 76, 28, {
      stroke: accent,
      fill: accent,
      strokeWidth: 1,
    }),
  ];
}

function checklist(id, x, y, options = {}) {
  const accent = options.accent ?? ORANGE;
  const rows = options.rows ?? [
    "Real owner reviews the source",
    "Data and media restore proven",
    "Exact live source verified",
    "Rollback boundary written down",
    "Owner settings preserved",
  ];
  const elements = [
    rectangle(id, x, y, 300, 250, { stroke: accent, fill: PAPER }),
    text(`${id}-title`, x + 22, y + 18, options.title ?? "Launch checklist", {
      size: 20,
      color: INK,
    }),
  ];
  rows.forEach((row, index) => {
    const top = y + 62 + index * 34;
    elements.push(
      rectangle(`${id}-box-${index}`, x + 22, top + 1, 12, 12, {
        stroke: accent,
        fill: "transparent",
        strokeWidth: 2,
        roundness: false,
      }),
      text(`${id}-row-${index}`, x + 46, top - 2, row, {
        size: 12,
        color: MUTED,
      }),
    );
  });
  return elements;
}

function storageStack(id, x, y, accent = BLUE) {
  const items = [
    ["D1", "Relational data"],
    ["R2", "Media and files"],
    ["KV", "Small shared state"],
    ["Queues", "Retryable work"],
  ];
  const elements = [];
  items.forEach(([name, note], index) => {
    const top = y + index * 62;
    elements.push(
      rectangle(`${id}-${name}`, x, top, 190, 50, {
        stroke: accent,
        fill: BLUE_TINT,
      }),
      text(`${id}-${name}-title`, x + 16, top + 8, name, {
        size: 15,
        color: INK,
      }),
      text(`${id}-${name}-note`, x + 76, top + 10, note, {
        size: 10,
        color: MUTED,
      }),
    );
  });
  return elements;
}

/** Library items, grouped by the collection ids above. */
export const librarySpecs = [
  ...apps.map((app) => ({
    id: `apps-${app.key}`,
    name: app.title,
    description: app.subtitle,
    collection: "apps",
    width: 240,
    height: 124,
    elements: appCard(`apps-${app.key}`, 0, 0, app),
  })),
  {
    id: "composer-pipeline",
    name: "Composer pipeline",
    description: "Brief → setup → init → agent → deploy",
    collection: "composer",
    width: 930,
    height: 84,
    elements: [
      ...flow(
        "composer-pipeline",
        0,
        10,
        ["Brief", "Setup", "Init", "Agent", "Deploy"],
        { width: 150, gap: 30 },
      ),
      text(
        "composer-pipeline-note",
        0,
        78,
        "Owner intent stays separate from agent implementation.",
        { size: 12, color: MUTED },
      ),
    ],
  },
  {
    id: "composer-review",
    name: "Review boundary",
    description: "Propose, review, then deploy separately",
    collection: "composer",
    width: 560,
    height: 176,
    elements: [
      ...chip("composer-review-agent", 0, 0, "Agent proposal", {
        width: 170,
        accent: BLUE,
        tint: BLUE_TINT,
      }),
      ...chip("composer-review-owner", 214, 0, "Owner decision", {
        width: 170,
        accent: ORANGE,
        tint: ORANGE_TINT,
      }),
      ...chip("composer-review-deploy", 428, 0, "Qualified deploy", {
        width: 132,
        accent: GREEN,
        tint: GREEN_TINT,
      }),
      arrow("composer-review-arrow-1", 170, 27, 44, 0, { stroke: BLUE }),
      arrow("composer-review-arrow-2", 384, 27, 44, 0, { stroke: ORANGE }),
      text(
        "composer-review-note",
        0,
        74,
        "Accepting a proposal stores the digest. It does not execute anything.",
        { size: 12, color: MUTED },
      ),
    ],
  },
  {
    id: "infra-runtime",
    name: "Cloudflare runtime",
    description: "Visitor, Access, Worker, data",
    collection: "infrastructure",
    width: 760,
    height: 370,
    elements: [
      ...flow("infra-runtime", 0, 20, ["Browser", "Access", "Worker"], {
        width: 150,
        gap: 34,
        accent: BLUE,
        tint: BLUE_TINT,
      }),
      ...storageStack("infra-storage", 530, 20),
      arrow("infra-runtime-to-data", 492, 47, 38, 40, { stroke: BLUE }),
      text(
        "infra-runtime-note",
        0,
        330,
        "Access protects owner routes. Public routes stay narrow and explicit.",
        { size: 12, color: MUTED },
      ),
    ],
  },
  {
    id: "infra-trust",
    name: "Trust lanes",
    description: "Visitor, owner and agent authority",
    collection: "infrastructure",
    width: 590,
    height: 210,
    elements: [
      rectangle("infra-trust-visitor", 0, 0, 570, 52, {
        stroke: GREEN,
        fill: GREEN_TINT,
      }),
      text("infra-trust-visitor-title", 18, 9, "Visitor", {
        size: 15,
        color: INK,
      }),
      text(
        "infra-trust-visitor-note",
        130,
        11,
        "View published apps · submit an enquiry",
        { size: 12, color: MUTED },
      ),
      rectangle("infra-trust-owner", 0, 68, 570, 52, {
        stroke: ORANGE,
        fill: ORANGE_TINT,
      }),
      text("infra-trust-owner-title", 18, 77, "Owner", {
        size: 15,
        color: INK,
      }),
      text(
        "infra-trust-owner-note",
        130,
        79,
        "Review · approve · publish · revoke",
        { size: 12, color: MUTED },
      ),
      rectangle("infra-trust-agent", 0, 136, 570, 52, {
        stroke: BLUE,
        fill: BLUE_TINT,
      }),
      text("infra-trust-agent-title", 18, 145, "Agent", {
        size: 15,
        color: INK,
      }),
      text(
        "infra-trust-agent-note",
        130,
        147,
        "Propose only · no privileged execution",
        { size: 12, color: MUTED },
      ),
    ],
  },
  {
    id: "game-loop",
    name: "Game loop",
    description: "Play, challenge, reward, progress",
    collection: "games",
    width: 760,
    height: 160,
    elements: [
      ...flow("game-loop", 0, 10, ["Play", "Challenge", "Reward", "Progress"], {
        width: 150,
        gap: 34,
        accent: VIOLET,
        tint: VIOLET_TINT,
      }),
      text(
        "game-loop-note",
        0,
        108,
        "One more round: add the player choice and the stake.",
        { size: 12, color: MUTED },
      ),
    ],
  },
  {
    id: "music-release",
    name: "Release path",
    description: "Create, master, publish, listen",
    collection: "music",
    width: 760,
    height: 210,
    elements: [
      ...flow(
        "music-release",
        0,
        10,
        ["Create", "Master", "Publish", "Listen"],
        { width: 150, gap: 34, accent: GREEN, tint: GREEN_TINT },
      ),
      ...[18, 34, 52, 44, 64, 78, 58, 40, 64, 50, 34, 22].map((height, index) =>
        rectangle(
          `music-wave-${index}`,
          18 + index * 34,
          120 + (80 - height),
          18,
          height,
          {
            stroke: GREEN,
            fill: index % 2 ? GREEN_TINT : GREEN,
            strokeWidth: 1,
          },
        ),
      ),
      text("music-wave-note", 18, 168, "Release master · 24-bit / 48 kHz", {
        size: 10,
        color: MUTED,
      }),
    ],
  },
  {
    id: "general-browser",
    name: "Browser frame",
    description: "A real page wireframe",
    collection: "general",
    width: 360,
    height: 210,
    elements: browserFrame("general-browser", 0, 0),
  },
  {
    id: "general-phone",
    name: "Phone frame",
    description: "Narrow screen with a clear action",
    collection: "general",
    width: 150,
    height: 300,
    elements: phoneFrame("general-phone", 0, 0),
  },
  {
    id: "general-before-after",
    name: "Before / after",
    description: "Two pages, one concrete change",
    collection: "general",
    width: 780,
    height: 240,
    elements: [
      ...browserFrame("general-before", 0, 0, {
        width: 340,
        height: 190,
        title: "Before",
        accent: MUTED,
        url: "before.example",
        rows: [0.36, 0.7, 0.56, 0.32],
      }),
      ...browserFrame("general-after", 410, 0, {
        width: 340,
        height: 190,
        title: "After",
        accent: ORANGE,
        url: "after.example",
        rows: [0.82, 0.64, 0.72, 0.46],
      }),
      arrow("general-before-after-arrow", 352, 95, 46, 0, { stroke: ORANGE }),
    ],
  },
  {
    id: "general-launch",
    name: "Launch checklist",
    description: "Five checks before calling it live",
    collection: "general",
    width: 300,
    height: 250,
    elements: checklist("general-launch", 0, 0),
  },
];

/**
 * Project topics shown in "New content". These are diagram palettes, not
 * claims about a separate product identity; brand state lives above.
 */
export const projects = {
  composer: {
    label: "Composer",
    stroke: ORANGE,
    fill: ORANGE_TINT,
    topic: "App Composer",
  },
  infrastructure: {
    label: "Infrastructure",
    stroke: BLUE,
    fill: BLUE_TINT,
    topic: "Cloudflare runtime",
  },
  game: {
    label: "Game design",
    stroke: VIOLET,
    fill: VIOLET_TINT,
    topic: "Games",
  },
  music: {
    label: "Music / FM",
    stroke: GREEN,
    fill: GREEN_TINT,
    topic: "Music",
  },
  general: {
    label: "General",
    stroke: INK,
    fill: "#F5F5F4",
    topic: "Neutral wireframes",
  },
};

const projectPalettes = Object.fromEntries(
  Object.entries(projects).map(([key, value]) => [
    key,
    { accent: value.stroke, tint: value.fill },
  ]),
);

/** Starting examples shared by the editor toolbar and the MCP adapter. */
export const presetCatalog = {
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
};

function portfolioMap(palette, ink) {
  const elements = [
    text("preset-title", 80, 54, "Portfolio map", { size: 32, color: ink }),
    text(
      "preset-note",
      80,
      104,
      "One owner, independent apps, shared discovery. Rename, move or delete any block.",
      { size: 16, color: ink === INK ? MUTED : "#D4D4D8" },
    ),
    ...chip("preset-owner", 80, 180, "Owner", {
      width: 180,
      accent: palette.accent,
      tint: palette.tint,
    }),
    arrow("preset-owner-arrow", 260, 207, 44, 0, { stroke: palette.accent }),
    ...chip("preset-composer", 304, 180, "App Composer", {
      width: 190,
      accent: palette.accent,
      tint: palette.tint,
    }),
    arrow("preset-apps-arrow", 494, 207, 44, 0, { stroke: palette.accent }),
  ];
  const grid = apps.slice(0, 6);
  grid.forEach((app, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    elements.push(
      ...appCard(
        `preset-app-${app.key}`,
        570 + column * 260,
        120 + row * 146,
        app,
        { width: 240, height: 124, titleSize: 19 },
      ),
    );
  });
  elements.push(
    ...chip("preset-audience", 570, 430, "Audience", {
      width: 180,
      accent: GREEN,
      tint: GREEN_TINT,
    }),
    text(
      "preset-footer",
      80,
      500,
      "Each app keeps its own source, release and data boundary.",
      { size: 12, color: ink === INK ? MUTED : "#D4D4D8" },
    ),
  );
  return elements;
}

function creatorJourney(palette, ink) {
  return [
    text("preset-title", 80, 54, "Creator journey", { size: 32, color: ink }),
    text(
      "preset-note",
      80,
      104,
      "One owner · independent apps · shared discovery",
      { size: 16, color: ink === INK ? MUTED : "#D4D4D8" },
    ),
    ...flow(
      "preset-flow",
      80,
      180,
      ["Creator", "Composer", "Mini-apps", "Audience"],
      { width: 180, gap: 32, accent: palette.accent, tint: palette.tint },
    ),
    ...apps.slice(0, 4).flatMap((app, index) =>
      appCard(`preset-card-${app.key}`, 80 + index * 260, 300, app, {
        width: 240,
        height: 124,
        titleSize: 19,
      }),
    ),
    text(
      "preset-footer",
      80,
      460,
      "Approval, deployment and data ownership stay separate.",
      { size: 12, color: ink === INK ? MUTED : "#D4D4D8" },
    ),
  ];
}

function architecture(palette, ink) {
  const elements = [
    text("preset-title", 80, 54, "Service architecture", {
      size: 32,
      color: ink,
    }),
    text(
      "preset-note",
      80,
      104,
      "Draw the trust boundaries, then connect the real services.",
      { size: 16, color: ink === INK ? MUTED : "#D4D4D8" },
    ),
    ...flow("preset-flow", 80, 180, ["Browser", "Access", "Worker"], {
      width: 170,
      gap: 36,
      accent: palette.accent,
      tint: palette.tint,
    }),
    ...storageStack("preset-storage", 740, 170, palette.accent),
    arrow("preset-data-arrow", 666, 207, 74, 0, { stroke: palette.accent }),
    text(
      "preset-footer",
      80,
      520,
      "Public routes stay narrow. Owner routes stay behind Access.",
      { size: 12, color: ink === INK ? MUTED : "#D4D4D8" },
    ),
  ];
  return elements;
}

function gameLoop(palette, ink) {
  return [
    text("preset-title", 80, 54, "Game loop", { size: 32, color: ink }),
    text(
      "preset-note",
      80,
      104,
      "An editable loop: add the player choices and the stakes.",
      { size: 16, color: ink === INK ? MUTED : "#D4D4D8" },
    ),
    ...flow(
      "preset-flow",
      80,
      180,
      ["Play", "Challenge", "Reward", "One more round"],
      { width: 180, gap: 32, accent: palette.accent, tint: palette.tint },
    ),
    text(
      "preset-footer",
      80,
      300,
      "Progress: unlock, level up, collect, compare.",
      { size: 12, color: ink === INK ? MUTED : "#D4D4D8" },
    ),
  ];
}

function musicRelease(palette, ink) {
  return [
    text("preset-title", 80, 54, "Music release", { size: 32, color: ink }),
    text(
      "preset-note",
      80,
      104,
      "Add the release details, artwork and distribution paths.",
      { size: 16, color: ink === INK ? MUTED : "#D4D4D8" },
    ),
    ...flow("preset-flow", 80, 180, ["Create", "Master", "Publish", "Listen"], {
      width: 180,
      gap: 32,
      accent: palette.accent,
      tint: palette.tint,
    }),
    ...[20, 38, 56, 44, 68, 82, 60, 42, 68, 52, 36, 24].map((height, index) =>
      rectangle(
        `preset-wave-${index}`,
        82 + index * 38,
        330 + (80 - height),
        20,
        height,
        {
          stroke: palette.accent,
          fill: index % 2 ? palette.tint : palette.accent,
          strokeWidth: 1,
        },
      ),
    ),
    text("preset-footer", 80, 440, "Release master · artwork · distribution", {
      size: 12,
      color: ink === INK ? MUTED : "#D4D4D8",
    }),
  ];
}

function beforeAfter(palette, ink) {
  return [
    text("preset-title", 80, 54, "Before / after", { size: 32, color: ink }),
    text(
      "preset-note",
      80,
      104,
      "Show the concrete problem and the resulting experience.",
      { size: 16, color: ink === INK ? MUTED : "#D4D4D8" },
    ),
    ...browserFrame("preset-before", 80, 190, {
      width: 340,
      height: 210,
      title: "Before",
      accent: MUTED,
      url: "before.example",
      labelColor: ink,
      rows: [0.36, 0.7, 0.56, 0.32],
    }),
    ...browserFrame("preset-after", 490, 190, {
      width: 340,
      height: 210,
      title: "After",
      accent: palette.accent,
      url: "after.example",
      labelColor: ink,
      rows: [0.82, 0.64, 0.72, 0.46],
    }),
    arrow("preset-change-arrow", 432, 295, 44, 0, { stroke: palette.accent }),
    text(
      "preset-footer",
      80,
      460,
      "Name the change, the evidence and the owner decision.",
      { size: 12, color: ink === INK ? MUTED : "#D4D4D8" },
    ),
  ];
}

export const presetBuilders = {
  portfolio: portfolioMap,
  journey: creatorJourney,
  architecture,
  game: gameLoop,
  release: musicRelease,
  beforeAfter,
};

export function buildPreset(name, project = "composer", ink = INK) {
  const builder = presetBuilders[name];
  if (!builder) throw new Error("Choose a supported example.");
  const palette = projectPalettes[project] ?? projectPalettes.composer;
  return builder(palette, ink);
}

export function libraryItemNames() {
  return librarySpecs.map((item) => item.name);
}

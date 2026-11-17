export const composerMapSource = "d0322a1c8a6da1c9bad5ebdafd0673e3d7bfc3dc";
export const composerMapDate = "17 November 2026";
export const composerPageDecisionId = "composer-public-page-decision";

const composerPageGroups = [
  {
    id: "start",
    title: "Find or start work",
    pages: [
      ["Browse by task", "/discover"],
      ["App library", "/apps"],
      ["Learn", "/learn"],
      ["Get Ready", "/ready"],
      ["Create an app", "/init"],
    ],
    handoffs: [
      [0, 1],
      [2, 3],
      [3, 4],
    ],
  },
  {
    id: "try",
    title: "Try something before building",
    pages: [
      ["Demos", "/demo"],
      ["Working examples", "/demo/examples"],
      ["Paperwork sample", "/demo/examples/print-shop"],
    ],
    handoffs: [
      [0, 1],
      [1, 2],
    ],
  },
  {
    id: "published",
    title: "Find something already published",
    pages: [
      ["Share artwork", "/share"],
      ["Media Studio films", "/media-studio/films"],
      ["Published stacks", "/studio/published"],
      ["Project stories", "/projects"],
    ],
    handoffs: [],
  },
  {
    id: "reference",
    title: "Look something up or take it away",
    pages: [
      ["Documentation", "/docs"],
      ["Prompt library", "/prompts"],
      ["App contracts", "/catalogue"],
      ["App activity", "/activity"],
    ],
    handoffs: [[0, 1]],
  },
];

const map = (key, name, description, groups, presentation = {}) => ({
  id: `composer-${key}`,
  name,
  description,
  ...presentation,
  groups: groups.map(([id, title, pages, handoffs = []]) => ({
    id,
    title,
    pages,
    handoffs,
  })),
});

const pageMaps = [
  {
    id: "composer-public-page-map",
    name: "Composer public page map",
    description: "Find apps, try a demo, build, and browse published work.",
    groups: composerPageGroups,
  },
  map(
    "build-and-compose",
    "Build and compose",
    "From an idea to a validated brief, editable model and working application.",
    [
      [
        "first",
        "Prepare the tools and choose an app",
        [
          ["Learn", "/learn"],
          ["Get Ready", "/ready"],
          ["Create an app", "/init"],
          ["First app guide", "/jobs/first-app"],
        ],
        [
          [0, 1],
          [1, 2],
        ],
      ],
      [
        "reference",
        "Try a working reference before committing",
        [
          ["Demos", "/demo"],
          ["Connected apps", "/demo/connected-apps"],
          ["Creator Hub", "/creator-hub"],
          ["Versioned blueprints", "/blueprints"],
        ],
      ],
      [
        "shape",
        "Choose what the app should contain",
        [
          ["Decision Explorer", "/explore"],
          ["Content and forms", "/init/content"],
          ["Import a launch kit", "/init/launch-kit"],
          ["Set up Paperwork", "/init/paperwork"],
        ],
      ],
      [
        "platform",
        "Check the supported platform and handoff",
        [
          ["How it works", "/docs/how-it-works"],
          ["Hosting guide", "/guide"],
          ["Cloudflare costs", "/cloudflare"],
          ["Platform teams", "/platform"],
          ["Platform demo", "/platform/demo"],
        ],
        [[3, 4]],
      ],
    ],
  ),
  map(
    "publish-and-operate",
    "Publish and operate",
    "Draft, publish, review and maintain the same owned application.",
    [
      [
        "publication",
        "Compose a stack and find what has gone public",
        [
          ["Creator stacks", "/studio"],
          ["Published stacks", "/studio/published"],
          ["Public artwork", "/share"],
        ],
        [[0, 1]],
      ],
      [
        "owner",
        "Operate the app and check the outcome",
        [
          ["Owner workflow", "/manage"],
          ["App activity", "/activity"],
          ["Release evidence", "/release"],
          ["Operate a live app", "/jobs/operate"],
        ],
      ],
      [
        "review",
        "Read a report or rehearse an incident",
        [
          ["Review a report", "/review"],
          ["Incident replay", "/incident-replay"],
          ["Plugin evidence", "/plugin-trust"],
          ["Release check demo", "/effect"],
          ["Privacy and data", "/privacy"],
        ],
      ],
      [
        "evidence",
        "Find the source or proof for a decision",
        [
          ["Project stories", "/projects"],
          ["Benchmarks", "/benchmarks"],
          ["System diagrams", "/diagrams"],
          ["Architecture", "/architecture"],
        ],
      ],
    ],
  ),
  map(
    "creative-tools",
    "Creative tools and outputs",
    "Which tool owns the work and where to find finished public examples.",
    [
      [
        "film",
        "Make and watch a film",
        [
          ["Media Studio", "/media-studio"],
          ["Build a studio", "/media-studio/tutorial"],
          ["Direct a shot", "/media-studio/direct"],
          ["Watch films", "/media-studio/films"],
        ],
      ],
      [
        "brand",
        "Make a card or an app identity",
        [
          ["Launch Kit", "/launch-kit"],
          ["Example covers", "/demo/examples/signal-and-type"],
          ["Import a launch kit", "/init/launch-kit"],
          ["Share kit workflow", "/jobs/publish"],
        ],
        [[0, 1]],
      ],
      [
        "pdf",
        "Finish and check a document",
        [
          ["Paperwork", "/paperwork"],
          ["Completed example", "/demo/examples/print-shop"],
          ["PDF workflow", "/jobs/pdf"],
        ],
        [[0, 1]],
      ],
      [
        "drawing",
        "Explain work and share the result",
        [
          ["Draw in LDraw", "/ldraw"],
          ["System diagrams", "/diagrams"],
          ["Artwork in Share", "/share"],
          ["Prepare a link", "/jobs/inspect"],
        ],
      ],
    ],
  ),
  map(
    "learning-and-reference",
    "Guides and agent handoffs",
    "Where to learn, pick a prompt, or inspect the maintained reference.",
    [
      [
        "learning",
        "Pick an entry based on what you came to do",
        [
          ["Learn", "/learn"],
          ["Browse by task", "/discover"],
          ["Set up a project", "/setup"],
          ["Get Ready guide", "/ready/guide"],
        ],
      ],
      [
        "agent",
        "Give an agent a bounded job",
        [
          ["Point an agent here", "/agent"],
          ["Prompt library", "/prompts"],
          ["Agent roles", "/roles"],
          ["Agent operations", "/capabilities"],
        ],
      ],
      [
        "docs",
        "Read the reference or take an operating kit",
        [
          ["Documentation", "/docs"],
          ["How it works", "/docs/how-it-works"],
          ["Runbooks", "/resources"],
          ["Operating kit", "/resources/operating-kit"],
        ],
        [
          [0, 1],
          [2, 3],
        ],
      ],
      [
        "ownership",
        "Look up the adoption and operating boundaries",
        [
          ["Hosting guide", "/guide"],
          ["Migration example", "/migration-example"],
          ["Dashboard extension", "/extension"],
          ["Privacy and data", "/privacy"],
        ],
      ],
    ],
  ),
  map(
    "independent-apps",
    "Independent apps and handoffs",
    "Where the independent Composer apps fit and how a real pair works together.",
    [
      [
        "catalogue",
        "Browse shipped tools or inspect their contracts",
        [
          ["App library", "/apps"],
          ["App contracts", "/catalogue"],
          ["Connected apps", "/demo/connected-apps"],
          ["Creator Hub case", "/creator-hub"],
        ],
      ],
      [
        "creator",
        "Publish a profile and manage contributions",
        [
          ["Here / there", "/guestbook/"],
          ["Linkarooie", "/showcase/"],
          ["Creator Hub example", "/demo/examples/creator-hub"],
        ],
      ],
      [
        "tools",
        "Use purpose-built tools independently",
        [
          ["Launch Kit", "/launch-kit"],
          ["Paperwork", "/paperwork"],
          ["LDraw", "/ldraw"],
          ["Media Studio", "/media-studio"],
        ],
      ],
      [
        "specialists",
        "Check a page, verify setup or explore a fictional vault",
        [
          ["Link Check", "https://share.loftwah.com/"],
          ["Hello World", "https://ready.loftwah.com/"],
          ["Carry / forward", "/state"],
          ["Review a report", "/review"],
        ],
      ],
    ],
  ),
];

export const composerMaps = [
  map(
    "purpose",
    "What App Composer is for",
    "Why Composer exists, who stays in control, and what the platform aims to make possible.",
    [
      [
        "why",
        "Why it exists · carry the creator’s decisions all the way to a working result",
        [
          ["Describe an outcome"],
          ["Shape the direction"],
          ["Reuse proven parts"],
          ["Verify the result"],
          ["Keep improving it"],
        ],
        [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4],
        ],
      ],
      [
        "roles",
        "Who does what · the person decides, a chosen agent does the work",
        [
          ["Person sets intent"],
          ["Composer sets it up"],
          ["Agent implements"],
          ["Person reviews"],
          ["Owner keeps control"],
        ],
        [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4],
        ],
      ],
      [
        "today",
        "Working paths today · start with a supported example or tool",
        [
          ["Build an app", "/demo"],
          ["Compose apps", "/demo/connected-apps"],
          ["Make media", "/media-studio"],
          ["Explain with diagrams", "/diagrams"],
        ],
      ],
      [
        "vision",
        "Product direction · wider reuse and coordination are goals",
        [
          ["Games and worlds"],
          ["Media and documents"],
          ["Agent workflows"],
          ["Infrastructure"],
          ["Operations at scale"],
        ],
      ],
    ],
    {
      intro:
        "A chosen agent and reusable tools help turn an idea into a product you own.",
    },
  ),
  map(
    "agent-and-owner",
    "Agent and owner authority",
    "How interest becomes a bounded proposal and how a person retains approval and execution authority.",
    [
      [
        "entry",
        "Start with intent and the agent you already use",
        [
          ["Owner names outcome"],
          ["Point the agent here", "/agent"],
          ["Inspect the project"],
          ["Record evidence"],
        ],
        [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      ],
      [
        "proposal",
        "A scoped proposal gives the owner something concrete to review",
        [
          ["Read selected scope"],
          ["Submit a proposal"],
          ["Owner reviews"],
          ["Accept, return, reject"],
        ],
        [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      ],
      [
        "execution",
        "Execution and verification follow approval as separate steps",
        [
          ["Check exact revision"],
          ["Use authorised action"],
          ["Verify actual outcome"],
          ["Keep the evidence", "/release"],
        ],
        [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      ],
      [
        "boundaries",
        "Where to inspect transports, permissions and the evidence boundary",
        [
          ["Agent capabilities", "/capabilities"],
          ["Agent role packs", "/roles"],
          ["Owner workflow", "/manage"],
          ["System diagrams", "/diagrams"],
        ],
      ],
    ],
  ),
  map(
    "capability-reuse",
    "Reusable capability contracts",
    "How a reusable building block becomes part of a project without absorbing its ownership.",
    [
      [
        "discover",
        "Find an existing app, asset, workflow or versioned starting point",
        [
          ["Working apps", "/apps"],
          ["App contracts", "/catalogue"],
          ["Agent capabilities", "/capabilities"],
          ["Blueprints", "/blueprints"],
        ],
      ],
      [
        "contract",
        "Read the contract before deciding what can be composed",
        [
          ["Purpose and interface"],
          ["Owner and version"],
          ["Dependencies"],
          ["Permissions"],
          ["Real availability"],
        ],
      ],
      [
        "compose",
        "Resolve, configure and verify a supported combination",
        [
          ["Choose a capability"],
          ["Pin the source"],
          ["Configure in Init", "/init"],
          ["Test the handoff"],
          ["Connected pair demo", "/demo/connected-apps"],
        ],
        [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      ],
      [
        "rights",
        "Ownership and permission stay with the originating app or asset",
        [
          ["App owns its records"],
          ["Access follows source"],
          ["Rights travel with art"],
          ["Public review", "/privacy"],
        ],
      ],
    ],
  ),
  map(
    "release-and-runtime",
    "Runtime, release and recovery",
    "The Composer control plane, independent deployments and the checks that support a production claim.",
    [
      [
        "control",
        "Composer provides a public front door, native admin and versioned handoffs",
        [
          ["Public entry", "/"],
          ["Astro and EmDash"],
          ["Composer Worker"],
          ["D1, R2 and KV"],
          ["Architecture", "/architecture"],
        ],
        [
          [1, 2],
          [2, 3],
        ],
      ],
      [
        "apps",
        "Independent apps retain their repositories, resources and releases",
        [
          ["App manifest", "/catalogue"],
          ["Exact source pin"],
          ["Reviewed integration"],
          ["App-owned data"],
          ["Cloudflare guide", "/cloudflare"],
        ],
        [
          [0, 1],
          [1, 2],
        ],
      ],
      [
        "release",
        "Check the exact source and target before calling it shipped",
        [
          ["Reviewed source"],
          ["Build and checks"],
          ["Preview and verify"],
          ["Deploy exact source"],
          ["Check live behaviour", "/release"],
        ],
        [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4],
        ],
      ],
      [
        "recovery",
        "Preview data, operational evidence and recovery need separate checks",
        [
          ["Isolated Preview"],
          ["App activity", "/activity"],
          ["Incident replay", "/incident-replay"],
          ["Backup and restore"],
        ],
      ],
    ],
  ),
  map(
    "creative-pipeline",
    "Creative production and reuse",
    "How owner references become editable media and approved public work.",
    [
      [
        "brief",
        "Start from a brief and the creator’s accepted references",
        [
          ["Creator sets intent"],
          ["Project references"],
          ["Rights and provenance"],
          ["Select a direction"],
        ],
        [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      ],
      [
        "make",
        "Make and inspect outputs in the tool that owns the work",
        [
          ["Media Studio", "/media-studio"],
          ["Launch Kit", "/launch-kit"],
          ["Paperwork", "/paperwork"],
          ["LDraw", "/ldraw"],
        ],
      ],
      [
        "finish",
        "Keep the editable source and review the actual result",
        [
          ["Native project files"],
          ["Rendered export"],
          ["Review and revise"],
          ["Explicit publication"],
        ],
        [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      ],
      [
        "share",
        "Publish each result where the audience will look for it",
        [
          ["Artwork", "/share"],
          ["Films", "/media-studio/films"],
          ["Working examples", "/demo/examples"],
          ["Project stories", "/projects"],
          ["Published stacks", "/studio/published"],
        ],
      ],
    ],
  ),
  map(
    "media-studio-runtime",
    "Media Studio runtime and handoffs",
    "The studio keeps its own projects and media, exposes a scoped handoff, and publishes selected outputs.",
    [
      [
        "entry",
        "Composer can hand off to an independently owned Studio",
        [
          ["Composer guide", "/media-studio"],
          ["Studio handoff", "/media-studio/tutorial"],
          ["Media Studio", "https://media.loftwah.com/"],
          ["Scoped agent access"],
        ],
        [
          [0, 1],
          [1, 2],
        ],
      ],
      [
        "local",
        "Browser tools can edit local media; saved projects use Studio storage",
        [
          ["Local edits and files"],
          ["Studio project"],
          ["D1 metadata"],
          ["R2 media bytes"],
        ],
      ],
      [
        "provider",
        "Provider work follows capability, budget and job checks",
        [
          ["Model catalogue", "https://media.loftwah.com/capabilities.json"],
          ["Estimate and admit"],
          ["Dispatch provider job"],
          ["Save returned media"],
        ],
        [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      ],
      [
        "publish",
        "Review a saved version before producing a public result",
        [
          ["Saved output"],
          ["Private review"],
          ["Explicit publish"],
          ["Public film examples", "/media-studio/films"],
        ],
        [
          [0, 1],
          [1, 2],
        ],
      ],
    ],
    { reference: "Media Studio reference · 34ac6e0 · 17 November 2026" },
  ),
  ...pageMaps,
];

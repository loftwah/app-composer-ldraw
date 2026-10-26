/**
 * Source-verified portfolio architecture models.
 *
 * These are diagram data, not a second schema. `diagrams.mjs` turns each model
 * into real Excalidraw primitives, and the local MCP renderer produces the
 * committed native scenes and previews. Every model records the files and
 * revision it was checked against so a stale diagram can be found later.
 *
 * Keep notes short: native Excalidraw text does not auto-wrap in a fixed card.
 */

export const architectureColumns = ["Surfaces", "Runtime", "Data & services"];

const projectPalette = {
  composer: ["#FC5B05", "#FFE8D9"],
  ldraw: ["#FC5B05", "#FFE8D9"],
  paperwork: ["#C74400", "#FFE8D9"],
  herethere: ["#1E40AF", "#DBEAFE"],
  linkarooie: ["#4D7C0F", "#ECFCCB"],
  linkcheck: ["#047857", "#D1FAE5"],
  carry: ["#0E7490", "#CFFAFE"],
  hello: ["#0F766E", "#CCFBF1"],
  launchkit: ["#6D28D9", "#EDE9FE"],
  assethunter: ["#EA580C", "#FFEDD5"],
  max: ["#111827", "#E5E7EB"],
  protocol11: ["#B91C1C", "#FEE2E2"],
  bubbles: ["#2563EB", "#DBEAFE"],
  shoalshot: ["#B45309", "#FEF3C7"],
  fighter: ["#4338CA", "#E0E7FF"],
  pirates: ["#7C2D12", "#FFEDD5"],
  loftwahfm: ["#DB2777", "#FCE7F3"],
  woodhouse: ["#4D7C0F", "#ECFCCB"],
};

const model = (input) => ({
  ...input,
  accent: projectPalette[input.key]?.[0] ?? "#FC5B05",
  tint: projectPalette[input.key]?.[1] ?? "#FFE8D9",
  columns: architectureColumns,
  layout: "three-column",
});

export const architectureModels = [
  model({
    key: "composer",
    title: "App Composer",
    subtitle: "Owner intent, agent proposal and independent delivery stay separate.",
    sources: [
      "app-composer/package.json",
      "app-composer/wrangler.jsonc",
      "app-composer/src/worker.ts",
      "app-composer/src/pages",
    ],
    facts: [
      "Astro 7, React islands and EmDash 1.0 run in one Cloudflare Worker.",
      "Production, preview and independent apps keep separate D1/R2/KV resources.",
      "Guestbook and Linkarooie are service bindings, not copied data.",
    ],
    nodes: [
      ["visitor", "Visitor", "Public pages, catalogue, demos and share links"],
      ["creator", "Invited creator", "EmDash editor, profile and app configuration"],
      ["agent", "Local agent", "Scoped proposal; no permanent execution authority"],
      ["access", "Cloudflare Access", "Protects owner administration and review routes"],
      ["worker", "Astro + EmDash Worker", "SSR, catalogue, usage and guarded routes"],
      ["preview", "Preview environment", "Separate D1, R2 and KV; no production services"],
      ["d1", "D1 content", "EmDash records, revisions, catalogue and daily counts"],
      ["r2", "R2 media", "Uploaded media and approved public assets"],
      ["bindings", "Service bindings", "Guestbook and Linkarooie APIs plus member service"],
    ],
    links: [
      ["visitor", "worker"],
      ["creator", "access"],
      ["access", "worker"],
      ["agent", "worker"],
      ["worker", "preview"],
      ["worker", "d1"],
      ["worker", "r2"],
      ["worker", "bindings"],
    ],
  }),
  model({
    key: "ldraw",
    title: "LDraw",
    subtitle: "A local portfolio editor with real artwork, editable architecture and a presentation view.",
    sources: [
      "app-composer-ldraw/package.json",
      "app-composer-ldraw/vite.config.mjs",
      "app-composer-ldraw/src/App.tsx",
      "app-composer-ldraw/src/LibraryDialog.tsx",
      "app-composer-ldraw/src/architecture.mjs",
      "app-composer-ldraw/src/compositions.mjs",
      "app-composer-ldraw/scripts/architecture-build.mjs",
      "app-composer-ldraw/scripts/mcp",
    ],
    facts: [
      "React 18 and Vite 8 host the pinned Excalidraw 0.18.1 engine.",
      "The library ships 95 real assets, three 16:9 stages and 18 architecture scenes.",
      "Drawings stay in IndexedDB; presentation and exports stay in the browser.",
      "The local MCP adapter reads and writes one host-selected workspace.",
    ],
    nodes: [
      ["visitor", "Visitor", "Draws, opens native files and exports locally"],
      ["library", "Portfolio library", "Real artwork, architecture scenes and blocks"],
      ["agent", "Local agent", "Host-selected stdio MCP workspace"],
      ["presentation", "Presentation", "Clean fullscreen view of the current scene"],
      ["worker", "Static Cloudflare Worker", "No Worker script or service binding"],
      ["engine", "Excalidraw 0.18.1", "Same editor, renderer and export pipeline"],
      ["cache", "Service worker cache", "Core editor, fonts and reviewed local assets"],
      ["present", "Presentation view", "Zen mode, Fit and exact 16:9 export"],
      ["indexeddb", "IndexedDB draft", "Current save, previous snapshot, revision check"],
      ["files", "Native .excalidraw", "Embedded image bytes and human element IDs"],
      ["renderer", "Local renderer", "Playwright plus the same Excalidraw renderer"],
      ["handoff", "Architecture manifest", "Scene hashes and source revision for consumers"],
    ],
    links: [
      ["visitor", "engine"],
      ["library", "engine"],
      ["presentation", "present"],
      ["engine", "cache"],
      ["engine", "indexeddb"],
      ["engine", "files"],
      ["agent", "files"],
      ["files", "renderer"],
      ["worker", "cache"],
      ["worker", "handoff"],
    ],
  }),
  model({
    key: "paperwork",
    title: "Paperwork",
    subtitle: "PDF fields, ink, signatures and printing never leave the browser.",
    sources: [
      "app-composer-paperwork/package.json",
      "app-composer-paperwork/wrangler.jsonc",
      "app-composer-paperwork/src",
      "app-composer-paperwork/public",
    ],
    facts: [
      "Vite, TypeScript, PDF.js and pdf-lib run entirely in the browser.",
      "The Worker serves static assets only; there is no document backend.",
      "Saved completed PDFs keep original pages and native fields.",
    ],
    nodes: [
      ["visitor", "Visitor", "Opens an ordinary PDF or a fictional sample"],
      ["editor", "Field and ink UI", "Text, checkboxes, drawing, highlight and signature"],
      ["owner", "Saved document", "Completed PDF stays with the visitor"],
      ["worker", "Static Worker", "No database, bucket or document upload"],
      ["pdfjs", "PDF.js viewer", "Renders the original pages and native fields"],
      ["pdflib", "pdf-lib writer", "Writes completed fields, ink and signatures"],
      ["canvas", "Canvas overlay", "Local drawing and transparent signature image"],
      ["download", "Browser download", "Verified completed copy and printing"],
    ],
    links: [
      ["visitor", "editor"],
      ["editor", "pdfjs"],
      ["editor", "pdflib"],
      ["editor", "canvas"],
      ["pdflib", "download"],
      ["worker", "pdfjs"],
      ["download", "owner"],
    ],
  }),
  model({
    key: "herethere",
    title: "Here / there",
    subtitle: "Visitor photographs and postcards pass an explicit owner review.",
    sources: [
      "app-composer-guestbook/wrangler.jsonc",
      "app-composer-guestbook/src/worker.ts",
      "app-composer-guestbook/migrations",
      "app-composer-guestbook/public",
    ],
    facts: [
      "A TypeScript Worker serves the gallery and owner APIs.",
      "D1 holds records; private R2 holds uploaded photos.",
      "The guest postcard path is closed by default and never grants owner access.",
    ],
    nodes: [
      ["visitor", "Visitor", "Browses approved photos and sends a postcard"],
      ["owner", "Owner studio", "Uploads, reviews, hides and deletes"],
      ["publisher", "Publisher", "Approved items are read by Linkarooie"],
      ["worker", "Guestbook Worker", "Public gallery, postcard and owner routes"],
      ["review", "Review boundary", "Pending content is never public"],
      ["studio", "Composer studio link", "Redirect grants no API permission"],
      ["d1", "D1 records", "Photos, postcards, review state and receipts"],
      ["r2", "Private R2", "Original photo bytes and derived views"],
    ],
    links: [
      ["visitor", "worker"],
      ["owner", "studio"],
      ["studio", "worker"],
      ["worker", "review"],
      ["review", "d1"],
      ["review", "r2"],
      ["d1", "publisher"],
      ["r2", "publisher"],
    ],
  }),
  model({
    key: "linkarooie",
    title: "Linkarooie",
    subtitle: "One public profile, app-owned records and approved Guestbook media.",
    sources: [
      "app-composer-showcase/wrangler.jsonc",
      "app-composer-showcase/src/worker.ts",
      "app-composer-showcase/migrations",
      "app-composer-showcase/public",
    ],
    facts: [
      "A TypeScript Worker renders the profile and owner APIs.",
      "D1 owns profile records; a service binding reads Guestbook content.",
      "The accepted curator identity is carried as approved artwork, not redrawn.",
    ],
    nodes: [
      ["visitor", "Profile visitor", "Reads the published handle, links and photos"],
      ["owner", "Owner studio", "Orders links, profile copy and approved photos"],
      ["curator", "Curator artwork", "MP-qualified 8/10 character stays locked"],
      ["worker", "Showcase Worker", "Public profile and guarded owner routes"],
      ["renderer", "Profile renderer", "Links, groups, portrait, banner and sharing"],
      ["provider", "Guestbook provider", "Versioned service binding, not copied records"],
      ["d1", "D1 profile", "Profile, links, ordering and publication state"],
      ["service", "Guestbook service", "Approved items and originals stay app-owned"],
    ],
    links: [
      ["visitor", "worker"],
      ["owner", "worker"],
      ["worker", "renderer"],
      ["renderer", "d1"],
      ["renderer", "provider"],
      ["provider", "service"],
      ["curator", "renderer"],
    ],
  }),
  model({
    key: "linkcheck",
    title: "Link Check",
    subtitle: "A bounded public-page inspection, not a crawler or trusted proxy.",
    sources: [
      "app-composer-linkcheck/wrangler.jsonc",
      "app-composer-linkcheck/src/worker.ts",
      "app-composer-linkcheck/src/public-network.ts",
      "app-composer-linkcheck/README.md",
    ],
    facts: [
      "TypeScript and Effect 4.0.4 run in a Worker with a 100 ms CPU limit.",
      "Dual DNS checks plus public-only fetch reduce SSRF exposure.",
      "There is no database, account or stored target content.",
    ],
    nodes: [
      ["visitor", "Visitor", "Pastes one public HTTPS page"],
      ["report", "Local report", "Readable findings plus JSON or Markdown export"],
      ["worker", "Inspection Worker", "Rate-limited public URL inspection"],
      ["policy", "URL policy", "Rejects private, credential and non-HTTPS targets"],
      ["dns", "DNS preflight", "Checks A and AAAA answers before fetch"],
      ["fetch", "Public-only fetch", "global_fetch_strictly_public routing"],
      ["target", "Public website", "One requested page, no crawl"],
      ["limits", "20 per minute", "Cloudflare rate limit and bounded response sizes"],
    ],
    links: [
      ["visitor", "worker"],
      ["worker", "policy"],
      ["policy", "dns"],
      ["dns", "fetch"],
      ["fetch", "target"],
      ["worker", "limits"],
      ["worker", "report"],
    ],
  }),
  model({
    key: "carry",
    title: "Carry / forward",
    subtitle: "A fictional memory vault that moves as an encrypted local file.",
    sources: [
      "app-composer-state/wrangler.jsonc",
      "app-composer-state/worker.ts",
      "app-composer-state/public",
      "app-composer-state/README.md",
    ],
    facts: [
      "A static Worker serves the browser application; no data binding.",
      "The vault is encrypted locally and exported/imported by the visitor.",
      "Fictional fixtures are mandatory until the separate security gate is proven.",
    ],
    nodes: [
      ["visitor", "Visitor", "Creates, exports, imports and unlocks a local vault"],
      ["disclosure", "Disclosure choice", "Selects exactly which fictional fields travel"],
      ["owner", "Owner boundary", "No real private records are permitted"],
      ["worker", "Static Worker", "No database, bucket, account or vault API"],
      ["crypto", "Web Crypto", "Local encryption and passphrase handling"],
      ["vault", "Encrypted vault", "Portable local file, not a cloud backup"],
      ["profile", "Fictional profile", "Invented assistant memory and characters"],
      ["handoff", "Provider handoff", "Bounded copy; no provider write is implied"],
    ],
    links: [
      ["visitor", "crypto"],
      ["visitor", "disclosure"],
      ["crypto", "vault"],
      ["vault", "profile"],
      ["disclosure", "handoff"],
      ["worker", "crypto"],
      ["owner", "profile"],
    ],
  }),
  model({
    key: "hello",
    title: "Hello World",
    subtitle: "The smallest real release: one page, one origin, no hidden backend.",
    sources: [
      "app-composer-hello/wrangler.jsonc",
      "app-composer-hello/src/worker.ts",
      "app-composer-hello/public",
      "app-composer-hello/README.md",
    ],
    facts: [
      "A TypeScript Worker serves a small configurable public page.",
      "There is no database, upload or runtime account.",
      "Get Ready verifies the deployed origin; Init supplies portable configuration.",
    ],
    nodes: [
      ["visitor", "Visitor", "Opens the deployed greeting"],
      ["owner", "Owner or agent", "Changes the greeting and release configuration"],
      ["ready", "Get Ready", "Verifies the HTTPS origin and first release"],
      ["worker", "Hello Worker", "Static HTML, CSS, image and health route"],
      ["config", "Portable config", "Title, introduction and reader theme"],
      ["assets", "Local assets", "Relay mark, illustration and share art"],
      ["origin", "Public origin", "ready.loftwah.com or the selected installation"],
      ["boundary", "No records", "No login, database or visitor upload"],
    ],
    links: [
      ["visitor", "worker"],
      ["owner", "config"],
      ["config", "worker"],
      ["worker", "assets"],
      ["worker", "origin"],
      ["ready", "origin"],
      ["worker", "boundary"],
    ],
  }),
  model({
    key: "launchkit",
    title: "Launch Kit",
    subtitle: "Local artwork becomes checked icons, install assets and share images.",
    sources: [
      "app-composer-launch-kit/wrangler.jsonc",
      "app-composer-launch-kit/src",
      "app-composer-launch-kit/README.md",
      "app-composer-launch-kit/docs",
    ],
    facts: [
      "A static-assets Worker runs the whole tool with no Worker script.",
      "Source artwork is processed locally with canvas and browser APIs.",
      "The downloaded package is reviewed in Composer or a supported host.",
    ],
    nodes: [
      ["visitor", "Visitor", "Chooses local artwork and a package operation"],
      ["review", "Package review", "Inspects decoded PNGs and exact text layouts"],
      ["host", "Supported host", "Composer Init, static site or EmDash project"],
      ["worker", "Static Worker", "No database, bucket or image service"],
      ["canvas", "Canvas pipeline", "Crops, focal point, icons and masks"],
      ["social", "Social layouts", "Three exact editable text compositions"],
      ["zip", "Checked ZIP", "Portable icons, install assets and share images"],
      ["boundary", "Local only", "Source bytes stay in the browser"],
    ],
    links: [
      ["visitor", "canvas"],
      ["canvas", "social"],
      ["social", "review"],
      ["review", "zip"],
      ["zip", "host"],
      ["worker", "canvas"],
      ["boundary", "zip"],
    ],
  }),
  model({
    key: "assethunter",
    title: "Asset Hunter",
    subtitle: "A rights-aware catalogue of possibilities, not a pile of unlicensed files.",
    sources: [
      "asset-hunter/package.json",
      "asset-hunter/wrangler.jsonc",
      "asset-hunter/src/pages",
      "asset-hunter/docs/BRAND.md",
    ],
    facts: [
      "Astro, React and EmDash run in a Cloudflare Worker with D1 and R2.",
      "Each possibility carries its own technique, build notes and rights statement.",
      "Catalogue APIs expose version, search, board and takedown signals.",
    ],
    nodes: [
      ["visitor", "Visitor", "Searches, filters and opens a possibility"],
      ["curator", "Curator", "Classifies treatments and rights per example"],
      ["board", "Board", "Collects reviewed possibilities for a direction"],
      ["worker", "Asset Hunter Worker", "Astro, EmDash and public catalogue APIs"],
      ["rights", "Rights record", "Per-example origin and reuse status"],
      ["signal", "Signal and takedown", "Bounded reports enter a review path"],
      ["d1", "D1 catalogue", "Possibilities, examples, techniques and rights"],
      ["r2", "R2 media", "Derived previews and approved example media"],
    ],
    links: [
      ["visitor", "worker"],
      ["curator", "worker"],
      ["worker", "d1"],
      ["worker", "r2"],
      ["worker", "rights"],
      ["board", "worker"],
      ["signal", "rights"],
    ],
  }),
  model({
    key: "max",
    title: "MAX",
    subtitle: "A software prototype and device boundary that does not claim a finished walker.",
    sources: [
      "max/apps/web/wrangler.jsonc",
      "max/apps/web/src/pages",
      "max/apps/web/src/server",
      "max/README.md",
    ],
    facts: [
      "Astro 7 runs on a Cloudflare Worker with D1 and R2.",
      "An installable owner PWA, public demo and simulator are separate surfaces.",
      "Waitlist, demo requests, media and email are real services; hardware is not verified.",
    ],
    nodes: [
      ["visitor", "Visitor", "Reads the concept, prototype status and demo"],
      ["owner", "Owner PWA", "Installs the account surface and settings"],
      ["demo", "Virtual MAX", "Browser demo and device simulator"],
      ["worker", "MAX Worker", "Astro pages, APIs, media and email"],
      ["sim", "maxd + protocol", "Device service and shared contracts"],
      ["hardware", "Physical walker", "BOM and field behaviour remain a separate gate"],
      ["d1", "D1", "Waitlist, demo requests and owner records"],
      ["r2", "R2 media", "Approved public media and device assets"],
    ],
    links: [
      ["visitor", "worker"],
      ["owner", "worker"],
      ["worker", "d1"],
      ["worker", "r2"],
      ["demo", "sim"],
      ["sim", "hardware"],
      ["worker", "demo"],
    ],
  }),
  model({
    key: "protocol11",
    title: "Protocol 11",
    subtitle: "A local card table with optional rooms, invitations and persistent platform records.",
    sources: [
      "phase-11/package.json",
      "phase-11/wrangler.jsonc",
      "phase-11/worker/index.ts",
      "phase-11/worker/platform",
      "phase-11/worker/multiplayer",
    ],
    facts: [
      "Vite, React and a plain TypeScript rules engine render the table.",
      "The Worker uses D1 plus GameRoom and Matchmaker Durable Objects.",
      "Resend sends invitations and optional Turnstile gates registration.",
    ],
    nodes: [
      ["player", "Player", "Local table, story and heuristic bots"],
      ["guest", "Guest or account", "Optional identity, career and preferences"],
      ["invite", "Invitation", "Email link into a private room"],
      ["table", "React table", "Cards, guided hand, companions and accessibility"],
      ["engine", "Rules engine", "Deterministic TypeScript protocols and bots"],
      ["worker", "Protocol 11 Worker", "Platform, auth, invitations and room APIs"],
      ["d1", "D1 platform", "Identity, sessions, invitations, matches and careers"],
      ["rooms", "Durable Objects", "GameRoom state and Matchmaker queues"],
      ["email", "Resend + Turnstile", "Invitation delivery and optional bot defence"],
    ],
    links: [
      ["player", "table"],
      ["table", "engine"],
      ["engine", "worker"],
      ["guest", "worker"],
      ["invite", "email"],
      ["worker", "d1"],
      ["worker", "rooms"],
      ["worker", "email"],
    ],
  }),
  model({
    key: "bubbles",
    title: "Bubbles",
    subtitle: "A static game with local saves, authored worlds and no account barrier.",
    sources: [
      "bubbles/package.json",
      "bubbles/vite.config.ts",
      "bubbles/src/app",
      "bubbles/src/scene",
      "bubbles/src/platform",
      "bubbles/src/assets/manifest.json",
    ],
    facts: [
      "Vite, React and Phaser render the game as a static Worker bundle.",
      "Saves and preferences stay in localStorage with recovery checks.",
      "The shared cast, mascots, worlds and achievements are registered assets.",
    ],
    nodes: [
      ["player", "Player", "Title, modes, help and one more round"],
      ["mascot", "Fizz + cast", "Presentation-only characters, never gameplay bubbles"],
      ["help", "Quick Start", "Real captured boards teach aim, match and penalty"],
      ["worker", "Static Worker", "No account, database or game backend"],
      ["shell", "React shell", "Routes, HUD, settings and accessibility"],
      ["phaser", "Phaser scene", "Deterministic board, launcher and scoring"],
      ["storage", "localStorage", "Save, preferences and multi-tab presence"],
      ["assets", "Registered assets", "Worlds, achievements, audio and help captures"],
      ["measure", "Woodhouse signal", "Bounded browser engagement only"],
    ],
    links: [
      ["player", "shell"],
      ["shell", "phaser"],
      ["phaser", "storage"],
      ["phaser", "assets"],
      ["help", "phaser"],
      ["mascot", "shell"],
      ["worker", "shell"],
      ["shell", "measure"],
    ],
  }),
  model({
    key: "shoalshot",
    title: "SHOALSHOT",
    subtitle: "A local-first dive with authored specimens, launchers and a local share card.",
    sources: [
      "shoalshot-release/package.json",
      "shoalshot-release/wrangler.jsonc",
      "shoalshot-release/src",
      "shoalshot-release/assets",
      "shoalshot-release/README.md",
    ],
    facts: [
      "Vite, React, Phaser and Tailwind produce a static Worker game.",
      "Gameplay progress and backups stay in localStorage; nothing is uploaded.",
      "Share results are composed locally as a 1200 by 630 PNG.",
    ],
    nodes: [
      ["diver", "Diver", "Enters the tide, dives and builds a collection"],
      ["summary", "Dive summary", "Share card, caption and local backup"],
      ["worker", "Static Worker", "No account, database or result service"],
      ["shell", "React shell", "Title, Workshop, Collection, Tasks and Settings"],
      ["phaser", "Phaser dive", "Seeded movement, catches and encounters"],
      ["storage", "localStorage", "Current and previous save with recovery"],
      ["art", "Authored tide art", "Specimens, launchers, worlds and achievements"],
      ["share", "Local share image", "1200 by 630 PNG composed in the browser"],
      ["measure", "Woodhouse signal", "Bounded browser engagement only"],
    ],
    links: [
      ["diver", "shell"],
      ["shell", "phaser"],
      ["phaser", "storage"],
      ["phaser", "art"],
      ["shell", "summary"],
      ["summary", "share"],
      ["worker", "shell"],
      ["shell", "measure"],
    ],
  }),
  model({
    key: "fighter",
    title: "LOFTWAH FIGHTER",
    subtitle: "Local battles, a generated roster and a small platform around suggestions.",
    sources: [
      "fighter/wrangler.jsonc",
      "fighter/worker/index.ts",
      "fighter/src/app/App.ts",
      "fighter/public/assets/generated/promotional/manifest.json",
      "fighter/docs/brand-and-site.md",
    ],
    facts: [
      "Vite, React, Phaser and Tailwind render the game in a Worker bundle.",
      "D1 stores platform suggestions; saves and preferences stay local.",
      "Character art has a contract; real-person roster art is excluded here.",
    ],
    nodes: [
      ["player", "Player", "Story, quick fight and tournament"],
      ["profile", "Profile and suggestions", "Local progress plus optional public input"],
      ["worker", "Fighter Worker", "Static game plus /api routes"],
      ["shell", "React shell", "Menus, lineup, HUD and battle receipts"],
      ["phaser", "Phaser battle", "Charge strips, moves and framed-shot choreography"],
      ["storage", "localStorage", "Save slots, preferences and experience state"],
      ["d1", "D1 platform", "Suggestions and bounded release records"],
      ["email", "Resend + cron", "Notification path and scheduled maintenance"],
      ["art", "Character contract", "Authored roster, portraits, tokens and titles"],
    ],
    links: [
      ["player", "shell"],
      ["shell", "phaser"],
      ["phaser", "storage"],
      ["phaser", "art"],
      ["profile", "worker"],
      ["worker", "d1"],
      ["worker", "email"],
      ["worker", "shell"],
    ],
  }),
  model({
    key: "pirates",
    title: "Pirates",
    subtitle: "A source-first reconstruction. The original game is the authority, not a new style.",
    sources: [
      "pirates/package.json",
      "pirates/README.md",
      "pirates/docs/ADR-001-architecture-r1.md",
      "pirates/src",
      "pirates/public/assets/source",
    ],
    facts: [
      "Vite, React, TypeScript and Phaser 3.90 run a 600 by 420 logical game.",
      "The original source/export remains authoritative during parity work.",
      "Third-party source art is reference-only and not cleared for reuse.",
    ],
    nodes: [
      ["player", "Player", "Free Mode, port, sail, encounter and save"],
      ["reference", "Reference source", "Original executable and source remain authority"],
      ["worker", "Static host", "No account, database or parity backend"],
      ["react", "React controls", "Semantic controls around the canvas"],
      ["phaser", "Phaser WebGL", "600 by 420 logical world and input transform"],
      ["domain", "TypeScript domain", "State, economy, battle and source-ID registry"],
      ["save", "mss persistence", "Browser save adapter with resume"],
      ["assets", "Reference assets", "Not cleared for redistribution; excluded from reuse"],
    ],
    links: [
      ["player", "react"],
      ["react", "phaser"],
      ["phaser", "domain"],
      ["domain", "save"],
      ["reference", "domain"],
      ["worker", "react"],
      ["assets", "phaser"],
    ],
  }),
  model({
    key: "loftwahfm",
    title: "LoftwahFM",
    subtitle: "A music catalogue, continuous player and shared game-radio service.",
    sources: [
      "loftwahfm/wrangler.toml",
      "loftwahfm/src/cloudflare-entry.ts",
      "loftwahfm/src/pages",
      "loftwahfm/src/components/player",
      "loftwahfm/docs",
    ],
    facts: [
      "Astro and React run on a Cloudflare Worker with D1, R2 and KV.",
      "R2 stores music and video; D1 owns catalogue and radio records.",
      "Cron stages run radio dispatch and analytics; checkout stays disabled.",
    ],
    nodes: [
      ["listener", "Listener", "Browses releases and plays full tracks"],
      ["game", "Game radio", "Public widget and shared catalogue contract"],
      ["owner", "Owner admin", "Catalogue, radio and business operations"],
      ["worker", "LoftwahFM Worker", "Astro pages, player, radio and business APIs"],
      ["player", "React player", "Continuous playback, queue and media sessions"],
      ["radio", "Radio service", "Editions, cadence and game handoff"],
      ["d1", "D1 catalogue", "Albums, tracks, radio work and business records"],
      ["r2", "R2 audio", "Music, video and cover media"],
      ["kv", "KV session + plays", "Sessions and Analytics Engine play data"],
    ],
    links: [
      ["listener", "worker"],
      ["game", "radio"],
      ["owner", "worker"],
      ["worker", "player"],
      ["worker", "radio"],
      ["worker", "d1"],
      ["worker", "r2"],
      ["worker", "kv"],
    ],
  }),
  model({
    key: "woodhouse",
    title: "Woodhouse",
    subtitle: "Independent projects become a reviewed, dated public record.",
    sources: [
      "woodhouse-new/wrangler.jsonc",
      "woodhouse-new/src/worker.ts",
      "woodhouse-new/src/content",
      "woodhouse-new/src/pages",
      "woodhouse-new/ARCHITECTURE.md",
    ],
    facts: [
      "Astro 7 and EmDash run on a Cloudflare Worker.",
      "D1 stores editorial records; R2 stores media; KV holds cache and sessions.",
      "Preview and production use distinct D1/R2/KV resources.",
    ],
    nodes: [
      ["reader", "Reader", "Projects, dispatches, architecture and editions"],
      ["editor", "Editor", "Reviews and publishes through EmDash"],
      ["agent", "Agent summary", "Bounded machine-readable reception"],
      ["worker", "Woodhouse Worker", "Astro pages, EmDash and public APIs"],
      ["loader", "Worker Loader", "Isolated preview execution"],
      ["cron", "Scheduled work", "Analytics, leaderboards and maintenance"],
      ["d1", "D1 editorial", "Projects, dispatches, evidence and review dates"],
      ["r2", "R2 media", "Approved captures, artwork and share images"],
      ["kv", "KV cache + session", "Public cache and owner sessions"],
    ],
    links: [
      ["reader", "worker"],
      ["editor", "worker"],
      ["worker", "d1"],
      ["worker", "r2"],
      ["worker", "kv"],
      ["worker", "loader"],
      ["cron", "d1"],
      ["agent", "worker"],
    ],
  }),
];

export const architectureProjects = new Map(
  architectureModels.map((entry) => [entry.key, entry]),
);

const NODE_WIDTH = 320;
const NODE_HEIGHT = 78;
const NODE_GAP = 16;
const COLUMN_GAP = 40;
const LEFT = 28;
const TOP = 168;
const HEADER_HEIGHT = 136;

function rect(id, x, y, width, height, options = {}) {
  return {
    id,
    type: "rectangle",
    x,
    y,
    width,
    height,
    strokeColor: options.stroke ?? "#1D2330",
    backgroundColor: options.fill ?? "transparent",
    fillStyle: "solid",
    strokeWidth: options.strokeWidth ?? 1.5,
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
    strokeColor: options.color ?? "#1D2330",
    textAlign: "left",
    verticalAlign: "top",
    opacity: 100,
  };
}

function arrow(id, x1, y1, x2, y2, options = {}) {
  // Excalidraw accepts negative deltas, but keeping the element's top-left at
  // the visual minimum makes native bounds, tests and future transforms
  // simpler. The points still preserve the requested direction.
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
    strokeColor: options.stroke ?? "#FC5B05",
    strokeWidth: options.strokeWidth ?? 1.5,
    strokeStyle: "solid",
    roughness: 0,
    endArrowhead: "arrow",
    startArrowhead: null,
    opacity: 100,
  };
}

/**
 * One architecture model as native primitive skeletons. The same block is
 * inserted from the Library and used to author the committed architecture
 * scene, so there is only one diagram source.
 */
export function architectureBlock(entry, palette = {}) {
  const accent = palette.accent ?? entry.accent ?? "#FC5B05";
  const tint = palette.tint ?? entry.tint ?? "#FFE8D9";
  const ink = "#1D2330";
  const muted = "#6B645C";
  const paper = "#F7F3EA";
  const id = `arch-${entry.key}`;
  const byKey = new Map();
  const elements = [];
  // Nodes are authored in three consecutive groups, one per column. Keeping
  // chunks explicit makes the block's reading order the same as its source.
  const perColumn = Math.ceil(entry.nodes.length / 3);
  const columnNodes = entry.columns.map((_, column) =>
    entry.nodes.slice(column * perColumn, (column + 1) * perColumn),
  );
  const maxNodes = Math.max(...columnNodes.map((nodes) => nodes.length));
  const height = Math.max(
    650,
    TOP + maxNodes * (NODE_HEIGHT + NODE_GAP) + 94,
  );

  elements.push(
    rect(`${id}-field`, 0, 0, 1120, height, {
      stroke: accent,
      fill: paper,
      strokeWidth: 1.5,
    }),
    rect(`${id}-accent`, 0, 0, 8, height, {
      stroke: accent,
      fill: accent,
      strokeWidth: 1,
      roundness: false,
    }),
    text(`${id}-kicker`, 34, 22, "PORTFOLIO ARCHITECTURE", {
      size: 10,
      color: accent,
    }),
    text(`${id}-title`, 34, 42, entry.title, { size: 30, color: ink }),
    text(`${id}-subtitle`, 34, 84, entry.subtitle, { size: 14, color: muted }),
    rect(`${id}-badge`, 930, 28, 164, 48, {
      stroke: accent,
      fill: tint,
      strokeWidth: 1,
    }),
    text(`${id}-badge-label`, 946, 36, "SOURCE-VERIFIED", {
      size: 10,
      color: accent,
    }),
    text(`${id}-badge-date`, 946, 53, entry.reviewed ?? "26 OCT 2026", {
      size: 10,
      color: muted,
    }),
    rect(`${id}-rule`, 34, 118, 1056, 1, {
      stroke: "#D6D3D1",
      fill: "#D6D3D1",
      strokeWidth: 1,
      roundness: false,
    }),
  );

  entry.columns.forEach((column, columnIndex) => {
    const x = LEFT + columnIndex * (NODE_WIDTH + COLUMN_GAP);
    elements.push(
      text(`${id}-heading-${columnIndex}`, x, 132, column.toUpperCase(), {
        size: 10,
        color: accent,
      }),
    );
    const nodes = columnNodes[columnIndex];
    nodes.forEach(([key, label, note], row) => {
      const nodeId = `${id}-${key}`;
      const y = TOP + row * (NODE_HEIGHT + NODE_GAP);
      byKey.set(key, { x, y, width: NODE_WIDTH, height: NODE_HEIGHT });
      elements.push(
        rect(nodeId, x, y, NODE_WIDTH, NODE_HEIGHT, {
          stroke: accent,
          fill: row % 2 ? "#FFFFFF" : tint,
          strokeWidth: 1.25,
        }),
        text(`${nodeId}-title`, x + 14, y + 10, label, {
          size: 15,
          color: ink,
        }),
        text(`${nodeId}-note`, x + 14, y + 36, note, {
          size: 11,
          color: muted,
        }),
      );
    });
  });

  entry.links.forEach(([from, to], index) => {
    const source = byKey.get(from);
    const target = byKey.get(to);
    if (!source || !target) return;
    const sameColumn = Math.abs(source.x - target.x) < 1;
    let x1, y1, x2, y2;
    if (sameColumn) {
      x1 = source.x + source.width / 2;
      y1 = source.y + source.height;
      x2 = target.x + target.width / 2;
      y2 = target.y;
      if (y2 < y1) {
        y1 = source.y;
        y2 = target.y + target.height;
      }
    } else {
      const forward = target.x > source.x;
      x1 = forward ? source.x + source.width : source.x;
      x2 = forward ? target.x : target.x + target.width;
      y1 = source.y + source.height / 2;
      y2 = target.y + target.height / 2;
    }
    elements.push(
      arrow(`${id}-link-${index + 1}`, x1, y1, x2, y2, { stroke: accent }),
    );
  });

  elements.push(
    rect(`${id}-footer-rule`, 34, height - 72, 1056, 1, {
      stroke: "#D6D3D1",
      fill: "#D6D3D1",
      strokeWidth: 1,
      roundness: false,
    }),
    text(
      `${id}-footer`,
      34,
      height - 54,
      "Native Excalidraw scene · source files and revision recorded in the LDraw catalogue",
      { size: 10, color: muted },
    ),
    text(
      `${id}-footer-project`,
      34,
      height - 34,
      `${entry.title} · reviewed ${entry.reviewed ?? "26 OCT 2026"} · edit freely`,
      { size: 10, color: accent },
    ),
  );

  return { id, width: 1120, height, elements };
}

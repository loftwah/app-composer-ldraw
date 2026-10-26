# Loftwah architecture library

Generated 26 October 2026 by `scripts/catalogue.mjs` from `src/architecture.mjs` and `catalogue/architecture.json`. 18 source-verified project architecture scenes ship as native Excalidraw version 2 files with rendered PNG/SVG companions and browser previews.

The diagrams are authored from the source files named below, then rendered by LDraw's own Excalidraw renderer. They are not generated from a plausible-sounding prompt and they are not a second diagram format. Open the native scene in LDraw to edit it; the preview is only an index image.

## Coverage

| Project | Scene | Reviewed | Native scene | Preview | Source revision |
| --- | --- | --- | --- | --- | --- |
| App Composer | App Composer — Owner intent, agent proposal and independent delivery stay separate. | 2026-10-26 | `/architecture/composer/overview.excalidraw` | `/architecture/composer/preview.webp` | `00d0a6cd55021a8f635db60a101ae2e25abd7da3` |
| LDraw | LDraw — A local portfolio editor with real artwork, editable architecture and a presentation view. | 2026-10-26 | `/architecture/ldraw/overview.excalidraw` | `/architecture/ldraw/preview.webp` | `6ef2de9ff0f10e8411d2770b28dafa3244390f19` |
| Paperwork | Paperwork — PDF fields, ink, signatures and printing never leave the browser. | 2026-10-26 | `/architecture/paperwork/overview.excalidraw` | `/architecture/paperwork/preview.webp` | `d01603eb5cd78d5431a8504a5a79011abe7d6b9f` |
| Here / there | Here / there — Visitor photographs and postcards pass an explicit owner review. | 2026-10-26 | `/architecture/herethere/overview.excalidraw` | `/architecture/herethere/preview.webp` | `376129c8b48d29d26e982777084aa241966569c7` |
| Linkarooie | Linkarooie — One public profile, app-owned records and approved Guestbook media. | 2026-10-26 | `/architecture/linkarooie/overview.excalidraw` | `/architecture/linkarooie/preview.webp` | `2f9280d3ae754076174b5527ab15224c918b8580` |
| Link Check | Link Check — A bounded public-page inspection, not a crawler or trusted proxy. | 2026-10-26 | `/architecture/linkcheck/overview.excalidraw` | `/architecture/linkcheck/preview.webp` | `99d01322ca4c53332596b1b24791cf672376f69c` |
| Carry / forward | Carry / forward — A fictional memory vault that moves as an encrypted local file. | 2026-10-26 | `/architecture/carry/overview.excalidraw` | `/architecture/carry/preview.webp` | `f3d279f87ec3ce6b913e5dcd4f4d2a9380997fae` |
| Hello World | Hello World — The smallest real release: one page, one origin, no hidden backend. | 2026-10-26 | `/architecture/hello/overview.excalidraw` | `/architecture/hello/preview.webp` | `8efc6a4fb1d44b78d011b7237917920d7e1c2aef` |
| Launch Kit | Launch Kit — Local artwork becomes checked icons, install assets and share images. | 2026-10-26 | `/architecture/launchkit/overview.excalidraw` | `/architecture/launchkit/preview.webp` | `4e248c0353658569d703db401be226e414c656ef` |
| Asset Hunter | Asset Hunter — A rights-aware catalogue of possibilities, not a pile of unlicensed files. | 2026-10-26 | `/architecture/assethunter/overview.excalidraw` | `/architecture/assethunter/preview.webp` | `e7edea3e2e782ef163248c14e66d8be03c2f9d05` |
| MAX | MAX — A software prototype and device boundary that does not claim a finished walker. | 2026-10-26 | `/architecture/max/overview.excalidraw` | `/architecture/max/preview.webp` | `ac93ce65d1416544c650dacfc859e9af011dbc1a` |
| Protocol 11 | Protocol 11 — A local card table with optional rooms, invitations and persistent platform records. | 2026-10-26 | `/architecture/protocol11/overview.excalidraw` | `/architecture/protocol11/preview.webp` | `4dac378a33d7af9f970cedf92425df355f82c896` |
| Bubbles | Bubbles — A static game with local saves, authored worlds and no account barrier. | 2026-10-26 | `/architecture/bubbles/overview.excalidraw` | `/architecture/bubbles/preview.webp` | `98608579813a47879815bc8eaee0e0058095e009` |
| SHOALSHOT | SHOALSHOT — A local-first dive with authored specimens, launchers and a local share card. | 2026-10-26 | `/architecture/shoalshot/overview.excalidraw` | `/architecture/shoalshot/preview.webp` | `2aa18059bf217e1cfe4eac9762185badef13b53f` |
| LOFTWAH FIGHTER | LOFTWAH FIGHTER — Local battles, a generated roster and a small platform around suggestions. | 2026-10-26 | `/architecture/fighter/overview.excalidraw` | `/architecture/fighter/preview.webp` | `00e4abbb0ae6b7c2e327e3616182acbe204ed12f` |
| Pirates | Pirates — A source-first reconstruction. The original game is the authority, not a new style. | 2026-10-26 | `/architecture/pirates/overview.excalidraw` | `/architecture/pirates/preview.webp` | `7cf87fe215d7ea4b97eca09464ed9be0791897d6` |
| LoftwahFM | LoftwahFM — A music catalogue, continuous player and shared game-radio service. | 2026-10-26 | `/architecture/loftwahfm/overview.excalidraw` | `/architecture/loftwahfm/preview.webp` | `64f53a32cfa3a00856bbd761e5c2c5eee561f8bd` |
| Woodhouse | Woodhouse — Independent projects become a reviewed, dated public record. | 2026-10-26 | `/architecture/woodhouse/overview.excalidraw` | `/architecture/woodhouse/preview.webp` | `a25f6fcba3284541f1c1a7da62fec81daede11fa` |

## Scene records

### App Composer

- Project: App Composer
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/composer/overview.excalidraw` (50 elements), SHA-256 `b33b043f68ee812ea371d676dc57ac9892005bb9c4be656078076bedc5cc3884`
- Preview: `/architecture/composer/preview.webp` (1000×598), SHA-256 `aaa6e04471e62642aea8b7ed4547810bef174356ea33bd77b470d6c3cd2a3b37`
- Owning revision: `00d0a6cd55021a8f635db60a101ae2e25abd7da3`
- Source files: `app-composer/package.json`, `app-composer/wrangler.jsonc`, `app-composer/src/worker.ts`, `app-composer/src/pages`
- Facts:
  - Astro 7, React islands and EmDash 1.0 run in one Cloudflare Worker.
  - Production, preview and independent apps keep separate D1/R2/KV resources.
  - Guestbook and Linkarooie are service bindings, not copied data.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### LDraw

- Project: LDraw
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/ldraw/overview.excalidraw` (61 elements), SHA-256 `5467d41d656d661aca35f6e3227da1bba7b9c971abefbc43af8cebc823ba623d`
- Preview: `/architecture/ldraw/preview.webp` (1000×598), SHA-256 `d6ef5968452cbe9978e84ab69ac0e102cf4192b54d652aff92e26bf7a5461353`
- Owning revision: `6ef2de9ff0f10e8411d2770b28dafa3244390f19`
- Source files: `app-composer-ldraw/package.json`, `app-composer-ldraw/vite.config.mjs`, `app-composer-ldraw/src/App.tsx`, `app-composer-ldraw/src/LibraryDialog.tsx`, `app-composer-ldraw/src/architecture.mjs`, `app-composer-ldraw/src/compositions.mjs`, `app-composer-ldraw/scripts/architecture-build.mjs`, `app-composer-ldraw/scripts/mcp`
- Facts:
  - React 18 and Vite 8 host the pinned Excalidraw 0.18.1 engine.
  - The library ships 95 real assets, three 16:9 stages and 18 architecture scenes.
  - Drawings stay in IndexedDB; presentation and exports stay in the browser.
  - The local MCP adapter reads and writes one host-selected workspace.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### Paperwork

- Project: Paperwork
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/paperwork/overview.excalidraw` (46 elements), SHA-256 `9151971925114b0cbf7e14917e47b888370afd583b0447f6bad99b550b0343bb`
- Preview: `/architecture/paperwork/preview.webp` (1000×598), SHA-256 `06fe0ae31b4967640cf322dc88b5d7fb96b1e7d5679bd588000045a765d49475`
- Owning revision: `d01603eb5cd78d5431a8504a5a79011abe7d6b9f`
- Source files: `app-composer-paperwork/package.json`, `app-composer-paperwork/wrangler.jsonc`, `app-composer-paperwork/src`, `app-composer-paperwork/public`
- Facts:
  - Vite, TypeScript, PDF.js and pdf-lib run entirely in the browser.
  - The Worker serves static assets only; there is no document backend.
  - Saved completed PDFs keep original pages and native fields.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### Here / there

- Project: Here / there
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/herethere/overview.excalidraw` (47 elements), SHA-256 `48189e0fe6a00319330962b9ed11b29083132cd4662cbe20b5297ee8e8b15072`
- Preview: `/architecture/herethere/preview.webp` (1000×598), SHA-256 `e9c7a432ef4fea3babd44f20ca7a7b6d641832e94a2f3aac23882bbccb1c3764`
- Owning revision: `376129c8b48d29d26e982777084aa241966569c7`
- Source files: `app-composer-guestbook/wrangler.jsonc`, `app-composer-guestbook/src/worker.ts`, `app-composer-guestbook/migrations`, `app-composer-guestbook/public`
- Facts:
  - A TypeScript Worker serves the gallery and owner APIs.
  - D1 holds records; private R2 holds uploaded photos.
  - The guest postcard path is closed by default and never grants owner access.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### Linkarooie

- Project: Linkarooie
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/linkarooie/overview.excalidraw` (46 elements), SHA-256 `3bb099ec1a973ad1b808e8f7b6e46177a7a97173a030593e45062574d8f7cabc`
- Preview: `/architecture/linkarooie/preview.webp` (1000×598), SHA-256 `46facaa93078f45a8fab7dd4f47632bf557d298c7cc2008990a48db11e3bb0b8`
- Owning revision: `2f9280d3ae754076174b5527ab15224c918b8580`
- Source files: `app-composer-showcase/wrangler.jsonc`, `app-composer-showcase/src/worker.ts`, `app-composer-showcase/migrations`, `app-composer-showcase/public`
- Facts:
  - A TypeScript Worker renders the profile and owner APIs.
  - D1 owns profile records; a service binding reads Guestbook content.
  - The accepted curator identity is carried as approved artwork, not redrawn.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### Link Check

- Project: Link Check
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/linkcheck/overview.excalidraw` (46 elements), SHA-256 `878ab2cd83afc99f2557257a7c6637617c4ff5fe1fb40b4e761103aab3063265`
- Preview: `/architecture/linkcheck/preview.webp` (1000×598), SHA-256 `a8bfd5e9173047a68fd5ca59ef783f64e9b5cca26b5dcc63b25b4fddfab62c0a`
- Owning revision: `99d01322ca4c53332596b1b24791cf672376f69c`
- Source files: `app-composer-linkcheck/wrangler.jsonc`, `app-composer-linkcheck/src/worker.ts`, `app-composer-linkcheck/src/public-network.ts`, `app-composer-linkcheck/README.md`
- Facts:
  - TypeScript and Effect 4.0.4 run in a Worker with a 100 ms CPU limit.
  - Dual DNS checks plus public-only fetch reduce SSRF exposure.
  - There is no database, account or stored target content.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### Carry / forward

- Project: Carry / forward
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/carry/overview.excalidraw` (46 elements), SHA-256 `eb3808b75b998736140f6179f284b511fd5dd63c1fd3cf51a86e909aee8c1b25`
- Preview: `/architecture/carry/preview.webp` (1000×598), SHA-256 `8f4382e52c228c9c43d7998913d492a44aba930153924ab466a8ff3023bc14da`
- Owning revision: `f3d279f87ec3ce6b913e5dcd4f4d2a9380997fae`
- Source files: `app-composer-state/wrangler.jsonc`, `app-composer-state/worker.ts`, `app-composer-state/public`, `app-composer-state/README.md`
- Facts:
  - A static Worker serves the browser application; no data binding.
  - The vault is encrypted locally and exported/imported by the visitor.
  - Fictional fixtures are mandatory until the separate security gate is proven.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### Hello World

- Project: Hello World
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/hello/overview.excalidraw` (46 elements), SHA-256 `d665e79d168427b5610e1e5acb68eac0b76fd5444f75f76d0d0ca50c41f05ccc`
- Preview: `/architecture/hello/preview.webp` (1000×598), SHA-256 `1e99b3eea50d476333ac09a46354d54cdd9f8d039d7903479a23c0d106036104`
- Owning revision: `8efc6a4fb1d44b78d011b7237917920d7e1c2aef`
- Source files: `app-composer-hello/wrangler.jsonc`, `app-composer-hello/src/worker.ts`, `app-composer-hello/public`, `app-composer-hello/README.md`
- Facts:
  - A TypeScript Worker serves a small configurable public page.
  - There is no database, upload or runtime account.
  - Get Ready verifies the deployed origin; Init supplies portable configuration.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### Launch Kit

- Project: Launch Kit
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/launchkit/overview.excalidraw` (46 elements), SHA-256 `c73ae5d19e3a0f7a28af0111b7bbdad38dd0f865fe4ee585fd6dada1424311ca`
- Preview: `/architecture/launchkit/preview.webp` (1000×598), SHA-256 `aa9b250080022b8cb330997f7e41bb931f568305c8fffff2a2537df00e83c24c`
- Owning revision: `4e248c0353658569d703db401be226e414c656ef`
- Source files: `app-composer-launch-kit/wrangler.jsonc`, `app-composer-launch-kit/src`, `app-composer-launch-kit/README.md`, `app-composer-launch-kit/docs`
- Facts:
  - A static-assets Worker runs the whole tool with no Worker script.
  - Source artwork is processed locally with canvas and browser APIs.
  - The downloaded package is reviewed in Composer or a supported host.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### Asset Hunter

- Project: Asset Hunter
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/assethunter/overview.excalidraw` (46 elements), SHA-256 `b749e7d3df71bb6dff9bf767017844af2a0808dbe1065e3fbd384e86f46eff66`
- Preview: `/architecture/assethunter/preview.webp` (1000×598), SHA-256 `34e2ed6b1b00fe8c0e41808f6822cef7d8b4e17fc0c8434d1df7ac194213557e`
- Owning revision: `e7edea3e2e782ef163248c14e66d8be03c2f9d05`
- Source files: `asset-hunter/package.json`, `asset-hunter/wrangler.jsonc`, `asset-hunter/src/pages`, `asset-hunter/docs/BRAND.md`
- Facts:
  - Astro, React and EmDash run in a Cloudflare Worker with D1 and R2.
  - Each possibility carries its own technique, build notes and rights statement.
  - Catalogue APIs expose version, search, board and takedown signals.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### MAX

- Project: MAX
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/max/overview.excalidraw` (46 elements), SHA-256 `e4e9de24bdecb91240ead015c150db4617dc90f3187d9d49ced586f083554e39`
- Preview: `/architecture/max/preview.webp` (1000×598), SHA-256 `c4892e311789d2c3e56b8e7980c254ff0e8781ad10af1e71d7fd217350c9305a`
- Owning revision: `ac93ce65d1416544c650dacfc859e9af011dbc1a`
- Source files: `max/apps/web/wrangler.jsonc`, `max/apps/web/src/pages`, `max/apps/web/src/server`, `max/README.md`
- Facts:
  - Astro 7 runs on a Cloudflare Worker with D1 and R2.
  - An installable owner PWA, public demo and simulator are separate surfaces.
  - Waitlist, demo requests, media and email are real services; hardware is not verified.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### Protocol 11

- Project: Protocol 11
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/protocol11/overview.excalidraw` (50 elements), SHA-256 `d3d1fb73e64312b44ed42f2498f951b71e7e606d1b567b1d0faf1780ea566fca`
- Preview: `/architecture/protocol11/preview.webp` (1000×598), SHA-256 `94999286d50d37eae8afd048113cc5fee611c43c10c611618d5331290b834602`
- Owning revision: `4dac378a33d7af9f970cedf92425df355f82c896`
- Source files: `phase-11/package.json`, `phase-11/wrangler.jsonc`, `phase-11/worker/index.ts`, `phase-11/worker/platform`, `phase-11/worker/multiplayer`
- Facts:
  - Vite, React and a plain TypeScript rules engine render the table.
  - The Worker uses D1 plus GameRoom and Matchmaker Durable Objects.
  - Resend sends invitations and optional Turnstile gates registration.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### Bubbles

- Project: Bubbles
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/bubbles/overview.excalidraw` (50 elements), SHA-256 `8635a96b630e116529b83079431aef0951f6369f6faf4986dc0f701ebf3939c5`
- Preview: `/architecture/bubbles/preview.webp` (1000×598), SHA-256 `77c72d2d586d1b7645e50208094d923ae70ff84e2fec94a2f533373d20f6b7d4`
- Owning revision: `98608579813a47879815bc8eaee0e0058095e009`
- Source files: `bubbles/package.json`, `bubbles/vite.config.ts`, `bubbles/src/app`, `bubbles/src/scene`, `bubbles/src/platform`, `bubbles/src/assets/manifest.json`
- Facts:
  - Vite, React and Phaser render the game as a static Worker bundle.
  - Saves and preferences stay in localStorage with recovery checks.
  - The shared cast, mascots, worlds and achievements are registered assets.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### SHOALSHOT

- Project: SHOALSHOT
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/shoalshot/overview.excalidraw` (50 elements), SHA-256 `55c0ccadc1c2351baf1b9bb3fa24c414aa13efb445385d5c330102c647e4346c`
- Preview: `/architecture/shoalshot/preview.webp` (1000×598), SHA-256 `c5d86719dd5af5e8db83925fd3405bd2166ad72f72b1e389890b2ae2842d399b`
- Owning revision: `2aa18059bf217e1cfe4eac9762185badef13b53f`
- Source files: `shoalshot-release/package.json`, `shoalshot-release/wrangler.jsonc`, `shoalshot-release/src`, `shoalshot-release/assets`, `shoalshot-release/README.md`
- Facts:
  - Vite, React, Phaser and Tailwind produce a static Worker game.
  - Gameplay progress and backups stay in localStorage; nothing is uploaded.
  - Share results are composed locally as a 1200 by 630 PNG.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### LOFTWAH FIGHTER

- Project: LOFTWAH FIGHTER
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/fighter/overview.excalidraw` (50 elements), SHA-256 `cb2d3a4522ec8a30656d8f45b603a59782d82c71f44cba7d16dc5327d37a2638`
- Preview: `/architecture/fighter/preview.webp` (1000×598), SHA-256 `d782fe56632c1655de2f85401d9000afb637aa95709e5231b2174538ce4a9b8b`
- Owning revision: `00e4abbb0ae6b7c2e327e3616182acbe204ed12f`
- Source files: `fighter/wrangler.jsonc`, `fighter/worker/index.ts`, `fighter/src/app/App.ts`, `fighter/public/assets/generated/promotional/manifest.json`, `fighter/docs/brand-and-site.md`
- Facts:
  - Vite, React, Phaser and Tailwind render the game in a Worker bundle.
  - D1 stores platform suggestions; saves and preferences stay local.
  - Character art has a contract; real-person roster art is excluded here.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### Pirates

- Project: Pirates
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/pirates/overview.excalidraw` (46 elements), SHA-256 `5eeb0347b6c7fd65b70193d428b2774e01e0f991ea6eaddafdd5cc57883f9bed`
- Preview: `/architecture/pirates/preview.webp` (1000×598), SHA-256 `57c66edb03961bfd6fcfe1bac4ae4fe0d95335ea94286cc9fb47da8ec0ba896e`
- Owning revision: `7cf87fe215d7ea4b97eca09464ed9be0791897d6`
- Source files: `pirates/package.json`, `pirates/README.md`, `pirates/docs/ADR-001-architecture-r1.md`, `pirates/src`, `pirates/public/assets/source`
- Facts:
  - Vite, React, TypeScript and Phaser 3.90 run a 600 by 420 logical game.
  - The original source/export remains authoritative during parity work.
  - Third-party source art is reference-only and not cleared for reuse.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### LoftwahFM

- Project: LoftwahFM
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/loftwahfm/overview.excalidraw` (50 elements), SHA-256 `6aea0204980ec6b2ca074333e532fb8dee48d01d91a7bc546aea03998c68d434`
- Preview: `/architecture/loftwahfm/preview.webp` (1000×598), SHA-256 `05b08c604c8488fd4def5dfbc8d651a0541b70410cfb375d394531fb92bfe01d`
- Owning revision: `64f53a32cfa3a00856bbd761e5c2c5eee561f8bd`
- Source files: `loftwahfm/wrangler.toml`, `loftwahfm/src/cloudflare-entry.ts`, `loftwahfm/src/pages`, `loftwahfm/src/components/player`, `loftwahfm/docs`
- Facts:
  - Astro and React run on a Cloudflare Worker with D1, R2 and KV.
  - R2 stores music and video; D1 owns catalogue and radio records.
  - Cron stages run radio dispatch and analytics; checkout stays disabled.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

### Woodhouse

- Project: Woodhouse
- Reviewed: 2026-10-26
- Coverage: source-verified
- Scene: `/architecture/woodhouse/overview.excalidraw` (50 elements), SHA-256 `18d87009491c4d64662124d2d551d992384a7ad1aeb19b10e13a45e7dab2d2c2`
- Preview: `/architecture/woodhouse/preview.webp` (1000×598), SHA-256 `cf9dda15d1506239cd093dec8516594aaada1bb8bacf62ea83780d5de6450fad`
- Owning revision: `a25f6fcba3284541f1c1a7da62fec81daede11fa`
- Source files: `woodhouse-new/wrangler.jsonc`, `woodhouse-new/src/worker.ts`, `woodhouse-new/src/content`, `woodhouse-new/src/pages`, `woodhouse-new/ARCHITECTURE.md`
- Facts:
  - Astro 7 and EmDash run on a Cloudflare Worker.
  - D1 stores editorial records; R2 stores media; KV holds cache and sessions.
  - Preview and production use distinct D1/R2/KV resources.
- Renderer: @excalidraw/excalidraw@0.18.1
- Human review: Source review performed; owner visual/taste review of the rendered composition remains pending.

## Refresh and drift checks

```sh
node scripts/architecture-build.mjs --check
node scripts/architecture-build.mjs --write
node scripts/catalogue.mjs --write
```

`--check` verifies every committed scene and preview against the manifest and reports source revisions when the sibling checkouts are available. `--write` re-renders all scenes through the local MCP adapter and the existing renderer. A scene changes only when an authorised agent has reviewed the relevant source. A stale diagram is a content defect, not a reason to invent a new one.

## Boundaries

- These scenes describe what the maintained source and manifests actually establish. A passing renderer proves bytes and element IDs, not that an architecture is clear or true.
- Hosted private repositories are not read by the public browser. The scenes are reviewed, versioned content that ships with LDraw.
- Cross-project publication remains owned by Composer's diagram atlas and Woodhouse's portfolio edition. LDraw is the editing surface for the selected reviewed scenes; copied outputs must keep their source relationship visible.
- Physical-device and owner acceptance of every diagram remain separate gates.


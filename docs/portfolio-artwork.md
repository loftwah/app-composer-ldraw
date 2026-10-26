# Portfolio artwork in LDraw

Reviewed 26 October 2026. This is the source index for the local artwork inserted from LDraw's **Portfolio library → Portfolio artwork** tab. The same records live in `src/portfolio.mjs`; each image is a committed WebP derivative under `public/portfolio/` with the source path and both SHA-256 hashes recorded.

The artwork is **not** a new universal brand system and does not replace the native Excalidraw library. App Composer orange is not applied to other projects. The native `.excalidrawlib` path stays vector/text-only because Excalidraw library items cannot carry image bytes (`LIBRARY_DISABLED_TYPES`); the custom library embeds images through `api.addFiles` and native image elements.

## Status key

- **approved** — documented owner/MP approval or owner-approved asset manifest.
- **qualified** — documented qualified acceptance, MP-commissioned identity, or owner-approved subset; read the note, not just the badge.
- **documented** — real authored/generated asset with provenance and a clear licence or review record, but no owner art acceptance.
- **agent-selected** — documented image selected by an agent, explicitly not separately owner-approved.
- **current** — current authored/active identity, with no separate approval statement and/or no repository licence.
- **sample** — fictional sample, not a product brand.

## Artwork records

| Project | Artwork | Status | Derivative | Source | Source SHA-256 (first 12) |
| --- | --- | --- | --- | --- | --- |
| App Composer | App Composer mark — Approved merging-block identity | Owner-approved identity (`approved`) | `/portfolio/app-composer-mark.webp` 512×512 | `app-composer/public/brand/composer-icon-20261022b-512.png` | `09d6f06331da…` |
| App Composer | App Composer product card — Make software. Keep it yours. | Approved identity artwork (`approved`) | `/portfolio/app-composer-product.webp` 960×504 | `app-composer/public/brand/campaign/product-og-20261022b.jpg` | `0ed47d3fea06…` |
| Paperwork | Paperwork press — A small victory over office equipment | Agent-selected illustration (`agent-selected`) | `/portfolio/paperwork-press.webp` 900×600 | `app-composer-paperwork/public/artwork/press-20261024.webp` | `0ea784da6bad…` |
| Hello World | Hello relay — First signal past the towers | Documented, MIT asset (`documented`) | `/portfolio/hello-relay.webp` 720×720 | `app-composer-hello/public/brand/hello-art-v4-master.png` | `ff3a1fc06e12…` |
| Here / there | Here / there postcard — A visitor pins a note on the wall | Documented, MIT asset (`documented`) | `/portfolio/here-there-postcard.webp` 720×720 | `app-composer-guestbook/public/brand/herethere-art-v4-master.png` | `070437a52021…` |
| Link Check | Link Check cable — Trace the bad connector | Documented, MIT asset (`documented`) | `/portfolio/link-check-cable.webp` 720×720 | `app-composer-linkcheck/public/brand/linkcheck-art-v4-master.png` | `9fbd648d7881…` |
| Carry / forward | Carry / forward core — Move memory between machines | Documented, MIT asset (`documented`) | `/portfolio/carry-core.webp` 720×720 | `app-composer-state/public/brand/carry-forward-art-v4-master.png` | `e891545d849c…` |
| Linkarooie | Linkarooie curator — Keep the good stuff together | MP-qualified 8/10 (`qualified`) | `/portfolio/linkarooie-curator.webp` 960×503 | `app-composer-showcase/public/brand/linkarooie-curator-20261018-master.png` | `0928056f6e8a…` |
| Bubbles | Bubbles Coin-Op icon — Owner-approved game identity | Owner-approved icon (`approved`) | `/portfolio/bubbles-icon.webp` 512×512 | `bubbles/public/icon-512.png` | `f8918c80e5f7…` |
| Bubbles | Fizz mascot — Presentation-only character | Owner-approved mascot (`approved`) | `/portfolio/bubbles-mascot.webp` 418×418 | `bubbles/public/assets/mascots/fizz-preview.webp` | `ec76934da4aa…` |
| SHOALSHOT | SHOALSHOT emblem — Tide-aperture identity | MP-commissioned identity (`qualified`) | `/portfolio/shoalshot-emblem.webp` 640×640 | `shoalshot-release/assets/ui/brand/shoalshot-emblem-20261012.webp` | `75615d99ba28…` |
| SHOALSHOT | SHOALSHOT ocean card — Wordmark over the shelf | MP-commissioned identity (`qualified`) | `/portfolio/shoalshot-og.webp` 960×504 | `shoalshot-release/assets/og-shoalshot-v5.jpg` | `31bc5ccfd6d7…` |
| Fighter | Fighter charge mark — Cream, acid and tomato on indigo | Current authored identity (`current`) | `/portfolio/fighter-mark.webp` 512×512 | `fighter/public/icons/icon-512.png` | `987759e8a23d…` |
| Fighter | Fighter v5 duo — Loftwah, Pippa and the arena | Active promotional art (`current`) | `/portfolio/fighter-poster.webp` 960×504 | `fighter/public/assets/generated/promotional/loftwah-fighter-v5-duo-2026-10.png` | `be9a5f03fddd…` |
| LoftwahFM | LoftwahFM brand burst — Music, radio, original shows | MP-confirmed identity (`approved`) | `/portfolio/loftwahfm-brand.webp` 960×504 | `loftwahfm/public/og/loftwahfm-brand-burst-20261018.jpg` | `c220886a86af…` |
| LoftwahFM | LoftwahFM wordmark — Original waveform and lettering | MP-confirmed identity (`approved`) | `/portfolio/loftwahfm-logo.webp` 900×231 | `loftwahfm/public/loftwahfm-logo-black-large.png` | `518a37bc3115…` |
| Protocol 11 | Protocol 11 mark — Three fanned cards form 11 | Current authored identity (`current`) | `/portfolio/protocol11-mark.webp` 512×512 | `phase-11/public/brand-mark.svg` | `0ae4f95ec6fd…` |
| Protocol 11 | Protocol 11 table — Friends, cards and a late-night game | Documented, review approved (`documented`) | `/portfolio/protocol11-table.webp` 960×504 | `phase-11/public/og/protocol-11.jpg` | `5c0237a8768f…` |
| Woodhouse | Woodhouse loom — Tensioned-fibre signature | Authored, documented (`documented`) | `/portfolio/woodhouse-loom.webp` 900×675 | `woodhouse-new/public/signature/loom-wide.jpg` | `410e983254aa…` |
| Woodhouse | Woodhouse dossier — A project, in context | Authored, documented (`documented`) | `/portfolio/woodhouse-dossier.webp` 960×504 | `woodhouse-new/public/og/project-dossier-20261025.jpg` | `343597ee016e…` |
| Asset Hunter | Asset Hunter aperture — Find and verify brand assets | MIT, documented (`documented`) | `/portfolio/asset-hunter-mark.webp` 512×512 | `asset-hunter/public/icon-512.png` | `9cfd16ec454c…` |
| Launch Kit | Launch Kit sample — Fictional Night Signal package | Fictional sample, not brand (`sample`) | `/portfolio/launch-kit-sample.webp` 640×640 | `app-composer-launch-kit/public/brand/night-signal-20261023.png` | `5ef0e4184cf6…` |

## Provenance notes

### App Composer mark

- Project: App Composer
- Credit: App Composer · approved 22 Oct 2026
- Source: `app-composer/public/brand/composer-icon-20261022b-512.png`
- Source SHA-256: `09d6f06331da034db955d96111b2de889086fc787366984ee760aacde2f63ad6`
- Derivative: `/portfolio/app-composer-mark.webp` (512×512), SHA-256 `6098dc0a8bdb434173aa1beabd496eea745a7d7bfcf2455d384056c677af802d`
- Status: Owner-approved identity (`approved`)
- Note: Flat orange-and-white merging-block mark, copied from the approved 512 px derivative. Repo MIT; no separate artwork redistribution licence.

### App Composer product card

- Project: App Composer
- Credit: App Composer · approved product card
- Source: `app-composer/public/brand/campaign/product-og-20261022b.jpg`
- Source SHA-256: `0ed47d3fea0628308dec42db8e294bd462c1d82b9092905a5b207df61b31afad`
- Derivative: `/portfolio/app-composer-product.webp` (960×504), SHA-256 `e5d4c956f29e089e14b2040a5536848656f0e4165713c04a7c2c668f1b06743f`
- Status: Approved identity artwork (`approved`)
- Note: Approved flat product card from docs/assets/brand/PROVENANCE.md. Repo MIT.

### Paperwork press

- Project: Paperwork
- Credit: Paperwork · print-shop artwork, 24 Oct 2026
- Source: `app-composer-paperwork/public/artwork/press-20261024.webp`
- Source SHA-256: `0ea784da6badbfd41e197d66b267b01b66fc3838e81e9c5e03044fe55b1652b3`
- Derivative: `/portfolio/paperwork-press.webp` (900×600), SHA-256 `7392084379b8140c33dc21be915e9cee419d6dd5043bfe54ab65b325c04c5a29`
- Status: Agent-selected illustration (`agent-selected`)
- Note: Documented image generation and provenance; DESIGN.md records it as agent-selected, not separately owner-approved. App MIT.

### Hello relay

- Project: Hello World
- Credit: Hello World · relay artwork
- Source: `app-composer-hello/public/brand/hello-art-v4-master.png`
- Source SHA-256: `ff3a1fc06e127d59dc0d2576c243d598b508d1f8893aa606ba992b21beba541a`
- Derivative: `/portfolio/hello-relay.webp` (720×720), SHA-256 `64374482d4ead2cf6fb47986fca764c9d424c30196a00b404311dfb220f54c09`
- Status: Documented, MIT asset (`documented`)
- Note: Documented fal.ai generation under MP authorisation; asset licence MIT.

### Here / there postcard

- Project: Here / there
- Credit: Here / there · postcard artwork
- Source: `app-composer-guestbook/public/brand/herethere-art-v4-master.png`
- Source SHA-256: `070437a52021ec9684637b1a1d7393a4565d4a25b4ec1a81cad6e1e8d5b9a2ff`
- Derivative: `/portfolio/here-there-postcard.webp` (720×720), SHA-256 `6366c3fb95110172ced218688294d55ffd0d59d7eaf81bef351f100399384692`
- Status: Documented, MIT asset (`documented`)
- Note: Documented fal.ai generation; asset licence MIT.

### Link Check cable

- Project: Link Check
- Credit: Link Check · cable artwork
- Source: `app-composer-linkcheck/public/brand/linkcheck-art-v4-master.png`
- Source SHA-256: `9fbd648d78810e28e6ca8de7835bdb828937f52eea07ad783d481c6588a634ce`
- Derivative: `/portfolio/link-check-cable.webp` (720×720), SHA-256 `62b7458bdec4f7c2d7a310352bbbf07e488ffd496aa62180c2b9453605f88fac`
- Status: Documented, MIT asset (`documented`)
- Note: Documented fal.ai generation; asset licence MIT.

### Carry / forward core

- Project: Carry / forward
- Credit: Carry / forward · memory-core artwork
- Source: `app-composer-state/public/brand/carry-forward-art-v4-master.png`
- Source SHA-256: `e891545d849cf58aa73c3f684e8060507d4157fc5983dd2843e47ba65e95bf85`
- Derivative: `/portfolio/carry-core.webp` (720×720), SHA-256 `b6387aab6e7f665ecd612c4ae79df90d2940de04124555bcfcc0e4e40addd71e`
- Status: Documented, MIT asset (`documented`)
- Note: Documented fal.ai generation; asset licence MIT.

### Linkarooie curator

- Project: Linkarooie
- Credit: Linkarooie · curator master
- Source: `app-composer-showcase/public/brand/linkarooie-curator-20261018-master.png`
- Source SHA-256: `0928056f6e8a81bd4ea2e10d4424cc449c021a4f8ed1d471810c1878b4e4b1bc`
- Derivative: `/portfolio/linkarooie-curator.webp` (960×503), SHA-256 `a51a104c8e8d31525808762c3f9690f1ba877060ea352e0f670cb1804085e77e`
- Status: MP-qualified 8/10 (`qualified`)
- Note: MP qualified acceptance 8/10; character, pose, colours and copy locked. App MIT; no separate artwork licence. Do not regenerate or restyle.

### Bubbles Coin-Op icon

- Project: Bubbles
- Credit: Bubbles · Coin-Op icon family
- Source: `bubbles/public/icon-512.png`
- Source SHA-256: `f8918c80e5f7db24b9bfd2c513297304f1aa65a5eb898ce51a33c5b7a9a8b2e0`
- Derivative: `/portfolio/bubbles-icon.webp` (512×512), SHA-256 `75dad7b6d443655ad2938912cf58a024ff904c95789303914d9a199fb37c331e`
- Status: Owner-approved icon (`approved`)
- Note: Owner-approved Coin-Op family in the Bubbles asset manifest. No repository licence recorded; internal portfolio use only.

### Fizz mascot

- Project: Bubbles
- Credit: Bubbles · Fizz mascot roster
- Source: `bubbles/public/assets/mascots/fizz-preview.webp`
- Source SHA-256: `ec76934da4aabacd940c740bd0781bbb891f38ffd03be9fe9ec9120251eaaeda`
- Derivative: `/portfolio/bubbles-mascot.webp` (418×418), SHA-256 `813a8de43d155545b708727efef30b70885006548bc18ce9400938a7e7c3159e`
- Status: Owner-approved mascot (`approved`)
- Note: Owner-approved mascot roster; presentation-only and never a gameplay bubble. No repository licence recorded.

### SHOALSHOT emblem

- Project: SHOALSHOT
- Credit: SHOALSHOT · emblem, 12 Oct 2026
- Source: `shoalshot-release/assets/ui/brand/shoalshot-emblem-20261012.webp`
- Source SHA-256: `75615d99ba28667bf42d657435e559fb0d6306242f9ee43b22a48385ddb99155`
- Derivative: `/portfolio/shoalshot-emblem.webp` (640×640), SHA-256 `5f58e02feeca686b6ff1d9500879c29d09ffe5cbe633bd7cebfa10eeefd2a46d`
- Status: MP-commissioned identity (`qualified`)
- Note: MP explicitly requested AI-generated replacement branding. Exact bytes, not redrawn. No repository licence recorded; internal portfolio use only.

### SHOALSHOT ocean card

- Project: SHOALSHOT
- Credit: SHOALSHOT · brand share artwork
- Source: `shoalshot-release/assets/og-shoalshot-v5.jpg`
- Source SHA-256: `31bc5ccfd6d75df40368c644f57c4b6a3b38d5638ec3b39855c76bca5031ef39`
- Derivative: `/portfolio/shoalshot-og.webp` (960×504), SHA-256 `59006110226d7e7a04436cea6fb7bed9adacabd41a4338b49bf7e106ba067f28`
- Status: MP-commissioned identity (`qualified`)
- Note: Documented fal.ai generation with recorded prompt and inspection; MP-commissioned wordmark. No repository licence recorded.

### Fighter charge mark

- Project: Fighter
- Credit: Fighter · charge-strip icon
- Source: `fighter/public/icons/icon-512.png`
- Source SHA-256: `987759e8a23d475ce5a1506d257d2f33d577b1f8020f9ec9f00699f2a2263a38`
- Derivative: `/portfolio/fighter-mark.webp` (512×512), SHA-256 `c41328a3c4f0f71d4011333d5c024b82d3d537c2b27f9a4263b69ee02cc73854`
- Status: Current authored identity (`current`)
- Note: Authored custom vector identity. No repository licence recorded; not documented as separate owner art approval.

### Fighter v5 duo

- Project: Fighter
- Credit: Fighter · promotional v5, OpenAI image generation
- Source: `fighter/public/assets/generated/promotional/loftwah-fighter-v5-duo-2026-10.png`
- Source SHA-256: `be9a5f03fddd47302d87afa1af4f9957f2f1560c658c6ae64f30d2e2c43c09ad`
- Derivative: `/portfolio/fighter-poster.webp` (960×504), SHA-256 `615657a4169e46c22759ce7e22f25e817377840d51bcde689bd6b29ee1cf7494`
- Status: Active promotional art (`current`)
- Note: Active promotional asset with source, prompt and hashes recorded. No repository licence; active is not the same as documented MP art acceptance. Excludes real-person roster art.

### LoftwahFM brand burst

- Project: LoftwahFM
- Credit: LoftwahFM · brand burst, 18 Oct 2026
- Source: `loftwahfm/public/og/loftwahfm-brand-burst-20261018.jpg`
- Source SHA-256: `c220886a86af4ea2138847a3f7ec64b0f9c71a2e0c7fa34def5f613aaf1de726`
- Derivative: `/portfolio/loftwahfm-brand.webp` (960×504), SHA-256 `bb31a28d407eb698f32c726c7ba3d3c0a9e8a78f20ca62320b2f2221f130a964`
- Status: MP-confirmed identity (`approved`)
- Note: MP confirmed the brand-burst composition and unchanged logo. Generated background with deterministic type. No repository licence; internal portfolio use only.

### LoftwahFM wordmark

- Project: LoftwahFM
- Credit: LoftwahFM · original wordmark
- Source: `loftwahfm/public/loftwahfm-logo-black-large.png`
- Source SHA-256: `518a37bc3115bb607fd86b0916bba980be4be571bf6776ee864751b647382eec`
- Derivative: `/portfolio/loftwahfm-logo.webp` (900×231), SHA-256 `d3bf359985c4c9edd72a25e6c1990e8e12ea5d2841bfc0b79e95db7e46bd687a`
- Status: MP-confirmed identity (`approved`)
- Note: DESIGN.md calls this the unchanged original mark; MP confirmed the identity. No repository licence.

### Protocol 11 mark

- Project: Protocol 11
- Credit: Protocol 11 · current table mark
- Source: `phase-11/public/brand-mark.svg`
- Source SHA-256: `0ae4f95ec6fd6b9fd728a3c85f3bc09d8643e585aeaf76c0eb7b5ff4180642ce`
- Derivative: `/portfolio/protocol11-mark.webp` (512×512), SHA-256 `c51ed4c2a8a8c6b97b8b5d52d09c5be0003b0971ee297fb8e35d701d2a3a2e11`
- Status: Current authored identity (`current`)
- Note: Current authored vector mark, converted to a local raster for image insertion. No repository licence or documented approval statement.

### Protocol 11 table

- Project: Protocol 11
- Credit: Protocol 11 · OG artwork, 11 Oct 2026
- Source: `phase-11/public/og/protocol-11.jpg`
- Source SHA-256: `5c0237a8768fd014abb7cca1c3d82b678ef0330fdad5594bb5bab54f974bc81f`
- Derivative: `/portfolio/protocol11-table.webp` (960×504), SHA-256 `8ca11926a4d56fe30efdbbf02d4dddadeb9845048267843a7673f2d28e7acc16`
- Status: Documented, review approved (`documented`)
- Note: Built-in image generation with independent final review approval; MP subjective art acceptance is explicitly unclaimed. No repository licence.

### Woodhouse loom

- Project: Woodhouse
- Credit: Woodhouse · live canvas capture, 25 Oct 2026
- Source: `woodhouse-new/public/signature/loom-wide.jpg`
- Source SHA-256: `410e983254aa830251fb4b2516f4aadc82adafe46ebc3258a2c5c220e1298d1b`
- Derivative: `/portfolio/woodhouse-loom.webp` (900×675), SHA-256 `a4a6b3b40bf7fce543cda2e676fd88a7881ca873d66de24cf373ddeca88db0a0`
- Status: Authored, documented (`documented`)
- Note: Authored WebGL composition captured from the live signature; no model. Woodhouse MIT. No separate owner approval statement for the mark/art.

### Woodhouse dossier

- Project: Woodhouse
- Credit: Woodhouse · dossier card, 25 Oct 2026
- Source: `woodhouse-new/public/og/project-dossier-20261025.jpg`
- Source SHA-256: `343597ee016e782b589b8cc1cbb545cee6c41839e9ab4c20598c45baafce7547`
- Derivative: `/portfolio/woodhouse-dossier.webp` (960×504), SHA-256 `97ee3ee70f912291c8001574fcfe729d4605ed5cdea2fbe4085e38c63a4b1a63`
- Status: Authored, documented (`documented`)
- Note: Authored composition over the loom signature with provenance. Woodhouse MIT.

### Asset Hunter aperture

- Project: Asset Hunter
- Credit: Asset Hunter · aperture mark
- Source: `asset-hunter/public/icon-512.png`
- Source SHA-256: `9cfd16ec454c681233734976d08bcf2919411fa2862e8357e3ab2b7323a1cc90`
- Derivative: `/portfolio/asset-hunter-mark.webp` (512×512), SHA-256 `cc056f10cb33a6bc4ac60000bb462b3d4fc5c14fc191a5c3993fc0b4783e0753`
- Status: MIT, documented (`documented`)
- Note: Generated one-source-of-truth mark verified by brand checks. MIT. No owner taste approval claimed.

### Launch Kit sample

- Project: Launch Kit
- Credit: Launch Kit · Night Signal sample
- Source: `app-composer-launch-kit/public/brand/night-signal-20261023.png`
- Source SHA-256: `5ef0e4184cf6d20b5ab211b7db80a9ffb96ecf542e716715beeaa2059bc82d01`
- Derivative: `/portfolio/launch-kit-sample.webp` (640×640), SHA-256 `4ba76dcb54d46a7f90607aa103a1d45c6008316932e64119b2754e2a9056790c`
- Status: Fictional sample, not brand (`sample`)
- Note: Agent-selected fictional sample, not MP artistic acceptance and not a Launch Kit logo. App MIT.

## Gaps and boundaries

- **LDraw** has no approved identity mark; the wordmark stays typographic. No artwork is invented here.
- **Launch Kit** has no brand mark. The Night Signal image is a clearly labelled fictional sample, not a Launch Kit identity.
- **Woodhouse** has authored signature/dossier artwork and a favicon, but no documented owner approval of a logo package; the D2 visual treatment was rejected by MP and is not included as artwork.
- **Protocol 11** artpacks and legacy brand JPGs are not bundled: three artpacks have no reliable licence/provenance record. Only the current authored mark (converted locally) and the reviewed OG card are included; MP subjective art acceptance remains unclaimed.
- **Fighter** real-person expanded-roster portraits are deliberately excluded. Only the authored charge mark and the active v5 promotional poster are included, and “active” is not relabelled as owner approval.
- **Game/FM projects** (Bubbles, SHOALSHOT, Fighter, LoftwahFM) have no repository licence recorded. The images are included for internal portfolio diagrams from the owner's public project repositories; that is not a redistribution licence. Do not republish the standalone asset without the owning project's permission.
- **Paperwork** press artwork is documented generation but agent-selected, not separately owner-approved.
- Real UI captures and personal/owner-only media are not copied into this batch. No real signatures, private records or third-party character art are included.

## Insertion and round-trip contract

- The browser fetches the local WebP, converts it to a data URL and calls the native `api.addFiles` path. The inserted scene carries the image bytes, file id, a caption and `customData` provenance. It is saved in native `.excalidraw` v2 files.
- PNG/SVG previews use the same Excalidraw renderer and `api.getFiles()`. The SVG carries the embedded local image; it is not a screenshot.
- All portfolio WebPs are included in the service-worker precache so insertion/export works offline after the app is cached. The existing offline limitation remains: a fresh tab needs the app cache; new fonts may need a connection.
- Removing or hiding a native library item is not part of this change. Built-in vector items keep stable IDs (`ldraw-*`) and the owner's Excalidraw library is untouched.


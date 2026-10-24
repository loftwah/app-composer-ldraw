# Local assets and package provenance

Composer return mark: `public/brand/composer-mark.svg`, byte copy of
`app-composer/public/brand/composer-icon-20261022b.svg`, SHA-256
`f9c66b8c38f38e1c7771ffc9ab5d54274667ccd0f6363ade320653dadd08552a`.
Space Grotesk subset: `public/brand/space.woff2`, copied from Composer's
`space-latin-20261018.woff2`, SHA-256
`61d00a1c57fcd7d4826c7a69cd85b61d15d133d5471d3c9c4731d70193d9f71f`.
The mark is the approved flat Composer identity, used for the return link.

The drawing engine is the npm published `@excalidraw/excalidraw@0.18.1`, MIT.
The lockfile pins integrity. Build copies the package's entire `dist/prod/fonts`
tree to this app's own `excalidraw-assets/fonts`. The published package contains
only font binaries, so distribution notices are retained separately under
`public/licenses`: the exact Excalidraw v0.18.1 MIT notice, font metadata comments
from that source tag, and the named fonts' official upstream license notices.
The asset path is set before editor code loads. No font CDN is required.

Excalidraw 0.18.1 additionally registers its built-in CDN fallback even with a
working local asset path. Chromium reports those fallback registrations as CSP
violations. `scripts/font-assets.mjs` changes only that fallback URL constant to
the same-origin bundled font base during Vite packaging. It fails closed if the
published dev/prod font-manager declaration changes; tests read the actual pinned
modules. Editor behavior and the strict CSP stay intact. Vite copies the exact
package fonts to ignored generated public assets for development and packaging.

LDraw's initial diagram palettes are simple named configuration. Infrastructure,
Game design and Music / FM are diagram topics, not claimed portfolio logos or
approved product brand packages. Launch Kit owns identity asset packages.

Dependency overrides select patched nanoid, lodash-es, KaTeX, sharp and undici.
The editor package itself remains the maintained published version. React 18.3.1
matches the supported peer range of the package and its Radix dependencies.

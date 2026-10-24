import { cp, mkdir } from "node:fs/promises";

export async function copyFontAssets(destination) {
  await mkdir(destination, { recursive: true });
  await cp("node_modules/@excalidraw/excalidraw/dist/prod/fonts", destination, {
    recursive: true,
  });
}

/**
 * Excalidraw 0.18.1 constructs CDN font fallback sources even when its documented
 * local asset override succeeds. Chromium checks those sources against CSP at
 * registration time. Keep that fallback on our same-origin bundled font tree.
 * This only changes one URL constant in the pinned published package; fail a
 * package upgrade whose generated shape changes rather than silently leaking.
 */
export function localizeFontFallback(code) {
  if (!code.includes("ASSETS_FALLBACK_URL")) return null;
  let count = 0;
  const result = code.replace(
    /(["'`]ASSETS_FALLBACK_URL["'`]\s*,\s*)`https:\/\/esm\.sh\/[\s\S]*?\/dist\/prod\/`/g,
    (_, prefix) => {
      count += 1;
      return `${prefix}new URL('/excalidraw-assets/', window.location.origin).href`;
    },
  );
  if (count !== 1)
    throw new Error(
      `Excalidraw 0.18.1 font fallback changed: expected one declaration, found ${count}. Review the pinned package before building.`,
    );
  return result;
}

export function localFontAssetsPlugin() {
  return {
    name: "ldraw-local-excalidraw-fonts",
    enforce: "pre",
    async buildStart() {
      // Vite dev serves public/. Production copies these exact files into dist.
      await copyFontAssets("public/excalidraw-assets/fonts");
    },
    transform(code, id) {
      if (
        !/\/@excalidraw\/excalidraw\/dist\/(prod|dev)\/.*\.js(?:\?|$)/.test(id)
      )
        return null;
      const result = localizeFontFallback(code);
      return result === null ? null : { code: result, map: null };
    },
  };
}

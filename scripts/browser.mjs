import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const contentTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
};
export async function withBrowser(action, options = {}) {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "ldraw-owned-"));
  let context;
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      if (["/_headers", "/_redirects"].includes(pathname))
        throw new Error("Cloudflare control file is not served");
      const root = resolve("dist");
      const file = resolve(
        root,
        `.${pathname === "/" ? "/index.html" : pathname}`,
      );
      if (!file.startsWith(`${root}/`)) throw new Error("Outside asset root");
      const headers = await readFile("dist/_headers", "utf8");
      const csp = headers
        .split("\n")
        .find((line) => line.trim().startsWith("Content-Security-Policy:"))
        ?.trim()
        .slice("Content-Security-Policy:".length)
        .trim();
      response.writeHead(200, {
        "Content-Type":
          contentTypes[extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
        ...(csp ? { "Content-Security-Policy": csp } : {}),
      });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  const cleanup = async () => {
    await context?.close();
    await new Promise((resolve) => server.close(resolve));
    await rm(temporaryRoot, { recursive: true, force: true });
  };
  try {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    context = await chromium.launchPersistentContext(
      join(temporaryRoot, "profile"),
      {
        headless: true,
        viewport: { width: 1440, height: 1000 },
        downloadsPath: join(temporaryRoot, "downloads"),
        serviceWorkers: options.serviceWorkers ?? "allow",
      },
    );
    const browserErrors = [];
    const externalRequests = [];
    context.on("page", (page) =>
      page.on("pageerror", (error) => browserErrors.push(error.message)),
    );
    context.on("request", (request) => {
      if (!request.url().startsWith(origin) && /^https?:/.test(request.url()))
        externalRequests.push(new URL(request.url()).origin);
    });
    const page = await context.newPage();
    await options.beforeNavigate?.({ page, context, origin });
    await page.goto(origin, { waitUntil: "networkidle" });
    await page.waitForFunction(() => Boolean(window.ldraw));
    return await action({
      context,
      page,
      origin,
      temporaryRoot,
      browserErrors,
      externalRequests,
    });
  } finally {
    await cleanup();
  }
}
export async function sceneAndExports(page) {
  return page.evaluate(async () => {
    const current = window.ldraw.readScene();
    const data = {};
    for (const kind of ["png", "svg"]) {
      const bytes = new Uint8Array(
        await (await window.ldraw.exportBlob(kind)).arrayBuffer(),
      );
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      data[kind] = btoa(binary);
    }
    return { ...current, ...data };
  });
}

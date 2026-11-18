import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { createOwnedCleanup } from "./lib/owned-cleanup.mjs";

const contentTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
};
export async function withBrowser(action, options = {}) {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "ldraw-owned-"));
  const assetRoot = resolve(options.appRoot ?? process.cwd(), "dist");
  let context;
  let launch;
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      if (["/_headers", "/_redirects"].includes(pathname))
        throw new Error("Cloudflare control file is not served");
      const root = assetRoot;
      const file = resolve(
        root,
        `.${pathname === "/" ? "/index.html" : pathname}`,
      );
      if (!file.startsWith(`${root}/`)) throw new Error("Outside asset root");
      const headers = await readFile(join(root, "_headers"), "utf8");
      const csp = headers
        .split("\n")
        .find((line) => line.trim().startsWith("Content-Security-Policy:"))
        ?.trim()
        .slice("Content-Security-Policy:".length)
        .trim();
      const body = await readFile(file);
      response.writeHead(200, {
        "Content-Type":
          contentTypes[extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
        ...(csp ? { "Content-Security-Policy": csp } : {}),
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  const closeServer = () =>
    new Promise((done, fail) => {
      server.close((error) =>
        error && error.code !== "ERR_SERVER_NOT_RUNNING" ? fail(error) : done(),
      );
      // Chrome keeps sockets alive; waiting for them would block teardown when
      // the browser could not be closed.
      server.closeAllConnections?.();
    });
  // Every owned resource is attempted even when an earlier step fails, and the
  // first failure is rethrown so normal teardown errors stay visible.
  const cleanup = async () => {
    const failures = [];
    const attempt = async (step) => {
      try {
        await step();
      } catch (error) {
        failures.push(error);
      }
    };
    // A signal can arrive while the browser is still launching. Settle that
    // launch first so its profile is closed and the temp root can be removed.
    if (launch) await attempt(async () => (context = await launch));
    await attempt(() => context?.close());
    await attempt(closeServer);
    await attempt(() => rm(temporaryRoot, { recursive: true, force: true }));
    if (failures.length) throw failures[0];
  };
  // Normal completion and thrown errors keep the proven finally cleanup. A
  // SIGINT/SIGTERM otherwise exits before that finally runs; the same teardown
  // is drained once by the signal handler and the exit code is preserved.
  const owned = createOwnedCleanup(cleanup);
  owned.install();
  try {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    launch = chromium.launchPersistentContext(join(temporaryRoot, "profile"), {
      headless: true,
      chromiumSandbox: false,
      ...(process.env.PLAYWRIGHT_CHROMIUM
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM }
        : {}),
      viewport: { width: 1440, height: 1000 },
      downloadsPath: join(temporaryRoot, "downloads"),
      serviceWorkers: options.serviceWorkers ?? "allow",
      // This module owns SIGINT/SIGTERM teardown. Playwright's default
      // handlers would close the browser and exit before our cleanup ran.
      handleSIGINT: false,
      handleSIGTERM: false,
    });
    context = await launch;
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
    // Keep the signal listeners installed until teardown settles: a signal
    // during cleanup must not restore Node's immediate default exit.
    try {
      await owned.clean();
    } finally {
      owned.uninstall();
    }
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

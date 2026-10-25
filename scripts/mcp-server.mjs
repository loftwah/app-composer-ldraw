#!/usr/bin/env node
/**
 * Stdio entrypoint for the local LDraw MCP adapter.
 *
 *   pnpm mcp --workspace /absolute/drawings [--read-only]
 *
 * stdout carries MCP messages only. Diagnostics are fixed, redacted messages on
 * stderr: no workspace path, scene bytes, credential or stack trace.
 */
import {
  serveStdio,
  StdioServerTransport,
} from "@modelcontextprotocol/server/stdio";
import { createLdrawMcp, launchScope } from "./mcp/server.mjs";
import { createWorkspace } from "./mcp/workspace.mjs";

try {
  const scope = launchScope(process.argv.slice(2));
  // Fail before serving if the host did not select a real authorised root.
  await createWorkspace(scope.workspace);
  serveStdio(() => createLdrawMcp(scope), {
    transport: new StdioServerTransport(process.stdin, process.stdout, {
      maxBufferSize: 65536,
    }),
    onerror: () =>
      process.stderr.write(
        "LDraw MCP transport failed. Inspect the local host privately.\n",
      ),
    maxSubscriptions: 0,
  });
} catch {
  process.stderr.write(
    "LDraw MCP could not start. Use an explicit absolute --workspace containing your drawings (optionally --read-only). Credentials never belong in launch arguments.\n",
  );
  process.exitCode = 1;
}

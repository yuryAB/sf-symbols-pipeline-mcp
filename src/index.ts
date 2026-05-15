#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

const HELP_FLAGS = new Set(["--help", "-h"]);
const VERSION_FLAGS = new Set(["--version", "-v"]);

function printHelp(): void {
  process.stdout.write(`SF Symbols Pipeline MCP

Platform-agnostic MCP server for custom SF Symbols validation and artifact generation.

Usage:
  sf-symbols-pipeline-mcp
  npx -y github:yuryAB/sf-symbols-pipeline-mcp
  npx -y sf-symbols-pipeline-mcp

Environment:
  SF_SYMBOLS_WORKSPACE  Allowed workspace root for SVG inputs and generated files.
                        Defaults to the process current working directory.

Options:
  -h, --help            Show this help text.
  -v, --version         Show the package version.

MCP clients should run this command as a stdio server.
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.some((arg) => HELP_FLAGS.has(arg))) {
    printHelp();
    return;
  }

  if (args.some((arg) => VERSION_FLAGS.has(arg))) {
    process.stdout.write("0.1.0\n");
    return;
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message =
    error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});

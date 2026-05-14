import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPrompts } from "./prompts/index.js";
import { registerResources } from "./resources/index.js";
import { registerTools } from "./tools/index.js";
import { Workspace } from "./workspace.js";

export function createServer(workspace = Workspace.fromEnv()): McpServer {
  const server = new McpServer({
    name: "sf-symbols-pipeline-mcp",
    title: "SF Symbols Pipeline",
    description:
      "MCP server for custom SF Symbols pipeline validation and artifact generation.",
    version: "0.1.0",
    websiteUrl: "https://github.com/yuryAB/sf-symbols-pipeline-mcp",
    icons: [
      {
        src: "https://raw.githubusercontent.com/yuryAB/sf-symbols-pipeline-mcp/main/assets/icon-96.png",
        mimeType: "image/png",
        sizes: ["96x96"],
      },
      {
        src: "https://raw.githubusercontent.com/yuryAB/sf-symbols-pipeline-mcp/main/assets/icon-512.png",
        mimeType: "image/png",
        sizes: ["512x512"],
      },
      {
        src: "https://raw.githubusercontent.com/yuryAB/sf-symbols-pipeline-mcp/main/assets/icon-1024.png",
        mimeType: "image/png",
        sizes: ["1024x1024"],
      },
    ],
  });

  registerResources(server);
  registerPrompts(server);
  registerTools(server, workspace);

  return server;
}

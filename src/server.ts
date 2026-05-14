import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPrompts } from "./prompts/index.js";
import { registerResources } from "./resources/index.js";
import { registerTools } from "./tools/index.js";
import { Workspace } from "./workspace.js";

export function createServer(workspace = Workspace.fromEnv()): McpServer {
  const server = new McpServer({
    name: "sf-symbols-pipeline-mcp",
    version: "0.1.0",
  });

  registerResources(server);
  registerPrompts(server);
  registerTools(server, workspace);

  return server;
}

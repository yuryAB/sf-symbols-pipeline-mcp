import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { checklistResources } from "./checklists.js";
import { guidelineResources } from "./guidelines.js";
import { projectResources } from "./naming.js";

const resources = [
  ...guidelineResources,
  ...checklistResources,
  ...projectResources,
];

export function registerResources(server: McpServer): void {
  for (const resource of resources) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        title: resource.title,
        description: resource.title,
        mimeType: "text/markdown",
      },
      (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: resource.text,
          },
        ],
      }),
    );
  }
}

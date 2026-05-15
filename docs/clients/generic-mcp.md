# Generic MCP Clients

Use this project with any MCP client that can launch a stdio server.

```json
{
  "mcpServers": {
    "sf-symbols-pipeline": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github:yuryAB/sf-symbols-pipeline-mcp"],
      "env": {
        "SF_SYMBOLS_WORKSPACE": "/absolute/path/to/icon-workspace"
      }
    }
  }
}
```

If your client does not support `type`, remove it and keep `command`, `args`, and `env`.

After npm publication, replace the args with:

```json
["-y", "sf-symbols-pipeline-mcp"]
```

This repository currently provides a stdio server. A hosted Streamable HTTP transport can be added later if remote cloud MCP hosting becomes a release goal.

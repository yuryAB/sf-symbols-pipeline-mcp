# Claude Desktop

Claude Desktop can use local MCP servers through `claude_desktop_config.json`. Anthropic also documents remote MCP connectors as a separate mechanism; those are configured through Claude settings and connect from Anthropic cloud infrastructure.

For this project, use the local stdio command configuration:

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

After npm publication, replace the args with:

```json
["-y", "sf-symbols-pipeline-mcp"]
```

Restart Claude Desktop after changing the config.

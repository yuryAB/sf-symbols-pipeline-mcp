# Cursor

Cursor supports MCP servers through JSON config files.

- Project config: `.cursor/mcp.json`
- Global config: `~/.cursor/mcp.json`

Use:

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

If Cursor cannot start the server, check MCP logs and verify that the Cursor process can find `npx`.

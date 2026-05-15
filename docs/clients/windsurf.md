# Windsurf

Windsurf Cascade supports MCP servers through its raw MCP config, usually:

```text
~/.codeium/windsurf/mcp_config.json
```

Use the command and args shape shown in Windsurf's official stdio examples:

```json
{
  "mcpServers": {
    "sf-symbols-pipeline": {
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

Windsurf teams may apply MCP allowlists. The allowlist server id must match `sf-symbols-pipeline` if this key is used.

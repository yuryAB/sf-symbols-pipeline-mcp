# Compatibility Matrix

This project is an MCP server first. Codex Plugin support is optional.

Sources checked:

- MCP official SDK and specification: https://modelcontextprotocol.io/docs/sdk and https://modelcontextprotocol.io/specification/2025-11-25/basic
- MCP TypeScript SDK server docs: https://ts.sdk.modelcontextprotocol.io/documents/server.html
- Claude Code MCP docs: https://docs.claude.com/en/docs/claude-code/mcp
- Claude Desktop local and remote MCP help: https://support.claude.com/en/articles/10949351-getting-started-with-model-context-protocol-mcp-on-claude-for-desktop and https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-integrations-using-remote-mcp
- Cursor MCP docs: https://docs.cursor.com/en/context/mcp
- Windsurf MCP docs: https://docs.windsurf.com/windsurf/cascade/mcp
- Codex Plugin docs: https://developers.openai.com/codex/plugins/build
- npm package docs: https://docs.npmjs.com/cli/v11/configuring-npm/package-json and https://docs.npmjs.com/cli/v11/commands/npm-pack

| Target | Status | Recommendation | Command/config | Limitations | Notes |
| --- | --- | --- | --- | --- | --- |
| Claude Desktop | Supported with config | Use local stdio config in `claude_desktop_config.json` or a Desktop Extension if packaging as MCPB later. | `npx -y github:yuryAB/sf-symbols-pipeline-mcp` | Remote Claude connectors are configured separately and must be reachable from Anthropic cloud infrastructure. | This repo currently ships stdio, not hosted Streamable HTTP. |
| Claude Code | Supported with config | Use `claude mcp add --transport stdio sf-symbols-pipeline -- npx -y github:yuryAB/sf-symbols-pipeline-mcp` or project `.mcp.json`. | See `examples/generic_mcp_config.json`. | Project-scoped configs may require user approval. | Claude Code docs use `.mcp.json` for project scope. |
| Cursor | Supported with config | Use `.cursor/mcp.json` or `~/.cursor/mcp.json`. | See `examples/cursor_mcp_config.json`. | Desktop app environment may not inherit shell PATH. | Cursor supports stdio, SSE, and Streamable HTTP. |
| Windsurf | Supported with config | Edit Cascade raw MCP config, usually `~/.codeium/windsurf/mcp_config.json`. | See `examples/windsurf_mcp_config.json`. | Windsurf has a total enabled tool limit and team allowlist controls. | Official examples use `command` and `args` for stdio. |
| Codex MCP config | Supported with config | Add as a stdio MCP server in Codex. | `npx -y github:yuryAB/sf-symbols-pipeline-mcp` | Codex Plugin is not required. | Keep MCP use independent from plugin use. |
| Other MCP clients | Supported with config | Use a stdio server entry with `command: npx`. | See `examples/generic_mcp_config.json`. | Exact file locations and schema vary by client. | Do not assume clients render icons or prompts the same way. |
| npx from GitHub | Supported | Current primary remote distribution. | `npx -y github:yuryAB/sf-symbols-pipeline-mcp` | `main` can change. GitHub install may be slower than npm. | Pin tags for stable public usage once releases exist. |
| npx from npm | Future | Recommended after public npm publish. | `npx -y sf-symbols-pipeline-mcp` | Requires package publication and name ownership. | `npm view sf-symbols-pipeline-mcp` returned 404 during validation, so the name appears available. |
| npm package dependency | Future | Publish with semver and `files` limited to dist/docs/assets/examples/plugin. | `npm install sf-symbols-pipeline-mcp` | Not published yet. | Root export exposes `createServer` for advanced integrations. |
| Codex Plugin | Supported with config | Optional wrapper in `plugins/codex/`. | Plugin `.mcp.json` points to GitHub `npx`. | Codex-only UX layer. | Does not replace MCP server metadata or npm/GitHub distribution. |
| Codex repo marketplace | Supported | Repo catalog at `.agents/plugins/marketplace.json`. | `codex plugin marketplace add yuryAB/sf-symbols-pipeline-mcp --ref main` | Restart Codex after install/update. | If using sparse checkout, include both `.agents/plugins` and `plugins/codex`. |
| Official Codex Plugin Directory | Future | Do not claim availability. | Not available for this repo yet. | Official docs say self-serve public plugin publishing is coming soon. | Use repo marketplace for now. |
| Plugin Directory official MCP listings | Unknown / verify with client docs | Treat separately from npm/GitHub distribution. | N/A | No submission is implemented here. | This repo does not publish to an official MCP registry. |
| @ mention / alias | Unknown / verify with client docs | Use natural language and the installed plugin or skill name. | Ask for "SF Symbols Pipeline" or use tool names. | No documented `alias` field was found in Codex plugin manifest docs. | Do not add an invented `alias` field. |

## Metadata boundaries

`McpServer` metadata describes the MCP implementation for compatible clients. It includes `name`, `title`, `description`, `websiteUrl`, and `icons`.

Codex Plugin metadata is separate. `displayName`, `shortDescription`, `longDescription`, `brandColor`, `composerIcon`, and `logo` belong to `plugins/codex/.codex-plugin/plugin.json`.

One metadata layer does not automatically replace the other. Other MCP clients may ignore Codex Plugin metadata, and some MCP clients may ignore visual MCP metadata.

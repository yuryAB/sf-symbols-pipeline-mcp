# Publishing and Distribution

The primary distribution target is a public, agent-agnostic MCP server. Codex Plugin distribution is optional and secondary.

## Current GitHub distribution

Current command:

```bash
npx -y github:yuryAB/sf-symbols-pipeline-mcp
```

This works well before npm publication because users do not need to clone the repository. The tradeoff is that GitHub installs from a branch or ref, so `main` can change under users unless they pin a tag.

Recommended stable GitHub command after the first release tag:

```bash
npx -y github:yuryAB/sf-symbols-pipeline-mcp#v0.1.0
```

## Future npm distribution

npm is recommended for public MCP distribution once the package is ready because it gives users a shorter command, semver, registry caching, predictable package contents, and standard client configuration.

Future command:

```bash
npx -y sf-symbols-pipeline-mcp
```

Do not publish automatically from this repo change. Before publishing, verify package ownership and run the validation checklist below.

## npm readiness

The package includes:

- `bin.sf-symbols-pipeline-mcp` pointing at `dist/index.js`
- `type: "module"`
- `main`, `types`, and `exports`
- `files` allowlist for distribution artifacts and docs
- `engines.node >=20`
- MIT license and repository metadata
- `prepare` build for GitHub installs
- executable shebang validation for the generated bin

## Release checklist

```bash
npm install
npm run build
npm test
npm pack --dry-run
npx -y github:yuryAB/sf-symbols-pipeline-mcp --help
```

Check the tarball output from `npm pack --dry-run` and confirm it includes `dist/`, `assets/`, `docs/`, `examples/`, `plugins/codex/`, `README.md`, and `LICENSE`.

## Publish commands

Only run these when you intentionally want to publish:

```bash
npm login
npm version patch
npm publish --access public
```

For prereleases:

```bash
npm version prerelease --preid beta
npm publish --tag beta --access public
```

## GitHub releases and tags

Use Git tags for users who install from GitHub:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Document tag-pinned `npx` commands in release notes. Avoid breaking `main` for users who still follow the branch.

## When to switch docs from GitHub to npm

Switch the primary docs from:

```bash
npx -y github:yuryAB/sf-symbols-pipeline-mcp
```

to:

```bash
npx -y sf-symbols-pipeline-mcp
```

after:

- npm package is published successfully.
- `npm pack --dry-run` has been inspected.
- `npx -y sf-symbols-pipeline-mcp --help` works from a clean environment.
- Claude Desktop, Cursor, Windsurf, and Codex examples have been tested with the npm command.
- GitHub release notes explain the migration.

Keep GitHub instructions as an alternative for users who want to pin a repository tag.

## Avoiding broken users

- Use semver.
- Prefer patch/minor releases for compatible changes.
- Reserve major versions for breaking tool inputs, output schemas, or runtime requirements.
- Keep old tool names stable when possible.
- Add new tools rather than renaming existing tools.
- Pin docs to tags or npm versions for stable installation.
- Keep `SF_SYMBOLS_WORKSPACE` behavior stable.

## Codex Plugin and marketplace

The optional Codex Plugin lives at `plugins/codex/` and points to the same MCP server command. It is not the primary distribution method.

The repo marketplace lives at `.agents/plugins/marketplace.json`. Users can add this repository as a Codex marketplace:

```bash
codex plugin marketplace add yuryAB/sf-symbols-pipeline-mcp --ref main
```

For sparse checkout, include both marketplace metadata and the plugin folder:

```bash
codex plugin marketplace add yuryAB/sf-symbols-pipeline-mcp --ref main --sparse .agents/plugins --sparse plugins/codex
```

The official Codex Plugin Directory is not used here. Current Codex docs state public self-serve plugin publishing is coming soon.

## GitHub vs npm

GitHub `npx` is good for pre-release distribution and direct repository testing. npm is better for stable public usage because it gives package versions, install caching, shorter commands, and clearer compatibility with MCP client docs.

# sf-symbols-pipeline-mcp

MCP server for a custom SF Symbols pipeline.

This server helps agents create, validate, document, and prepare custom SF Symbols for iOS app workflows using any SVG-capable vector editor, the SF Symbols app, Xcode asset catalogs, SwiftUI, and UIKit.

## What This MCP Does

- Exposes reusable SF Symbols pipeline resources and checklists.
- Helps agents choose or set up a vector editor before drawing.
- Points agents to official Apple SF Symbols resources and template-export guidance.
- Provides workflow prompts for creating, auditing, and preparing symbol families.
- Validates exported SVGs with practical preflight checks.
- Inspects SVG groups, paths, names, fills, strokes, and heuristic path structure.
- Compares Ultralight-S, Regular-S, and Black-S variable-template sources.
- Generates annotation plans, Draw/Variable Draw guide plans, import checklists, Xcode asset scaffolds, and Swift snippets.

## What This MCP Does Not Do

- It does not replace editor-specific MCPs or design tools.
- It does not operate Figma, Illustrator, Sketch, Affinity Designer, Inkscape, or other vector editors directly.
- It does not replace the Apple SF Symbols app.
- It does not claim full Apple template validation.
- It does not apply final SF Symbols annotations automatically.
- It does not upload files, run telemetry, execute arbitrary shell commands, or access files outside the configured workspace.

## Vector Editor Relationship

Use whichever SVG-capable vector editor the agent can reliably operate: Figma, Illustrator, Sketch, Affinity Designer, Inkscape, or another tool that preserves SVG paths and layer structure. This MCP can guide editor selection with `resolve_design_environment`, but it does not inspect the host agent's tools by itself. Pass available editor/tool hints when possible.

Treat the selected vector editor as a drawing surface. The SF Symbols app remains the authority for template export, import, validation, annotation, preview, and final export.

## Install

Use directly from GitHub:

```bash
npx -y github:yuryAB/sf-symbols-pipeline-mcp
```

Or clone and install locally:

```bash
npm install
```

## Build

```bash
npm run build
```

## Local Usage

Run the server over stdio:

```bash
npm run build
node dist/index.js
```

For development:

```bash
npm run dev
```

The server uses `SF_SYMBOLS_WORKSPACE` as the allowed root for all tool file reads and writes:

```bash
SF_SYMBOLS_WORKSPACE=/absolute/path/to/icon-workspace node dist/index.js
```

If `SF_SYMBOLS_WORKSPACE` is missing, the server defaults to the current working directory. Every file path is normalized and checked so tools cannot escape the workspace with `../` or absolute paths outside the root.

## Test With MCP Inspector

```bash
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

To use a separate icon workspace:

```bash
SF_SYMBOLS_WORKSPACE=/absolute/path/to/icon-workspace npx @modelcontextprotocol/inspector node dist/index.js
```

## Add To Codex

Add an MCP server in Codex with this command:

```bash
npx -y github:yuryAB/sf-symbols-pipeline-mcp
```

If you cloned the repository locally, use:

```bash
node /absolute/path/to/sf-symbols-pipeline-mcp/dist/index.js
```

Optional environment variable:

```bash
SF_SYMBOLS_WORKSPACE=/absolute/path/to/icon-workspace
```

`SF_SYMBOLS_WORKSPACE` should point to the folder that contains exported SVGs, reports, and generated Xcode/Swift artifacts. If it is missing, the server uses the process current working directory.

## Use From MCP Inspector

Run from GitHub:

```bash
SF_SYMBOLS_WORKSPACE=/absolute/path/to/icon-workspace \
npx @modelcontextprotocol/inspector npx -y github:yuryAB/sf-symbols-pipeline-mcp
```

Run from a local clone:

```bash
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

## Example Workflow

1. Run `resolve_design_environment` to choose the vector editor/tooling and get official Apple links.
2. Use the SF Symbols app to export the template for the closest base symbol.
3. Create or edit the symbol design in the selected SVG-capable vector editor.
4. Export the SVG from the selected vector editor.
5. Run `validate_svg_template`.
6. Run `inspect_svg_geometry`.
7. If using variable templates, run `compare_variable_sources`.
8. Run `generate_annotation_plan`.
9. If using Draw/Variable Draw, run `generate_draw_guide_plan`.
10. Run `generate_import_checklist`.
11. Import the SVG into the SF Symbols app.
12. Validate the template in the SF Symbols app.
13. Apply rendering/animation annotations manually or semi-manually.
14. Export final symbol from SF Symbols app.
15. Run `create_xcassets_symbol_set` when an asset catalog or Xcode integration is needed.
16. Run `generate_swift_usage`.
17. Test in Xcode previews/device.

## Resources

- `sf-symbols://guidelines/custom-symbols`
- `sf-symbols://guidelines/vector-editor-to-sf-symbols`
- `sf-symbols://guidelines/figma-to-sf-symbols`
- `sf-symbols://guidelines/path-compatibility`
- `sf-symbols://guidelines/rendering-modes`
- `sf-symbols://guidelines/animation-readiness`
- `sf-symbols://guidelines/draw-and-variable-draw`
- `sf-symbols://guidelines/xcode-import`
- `sf-symbols://resources/apple-official-links`
- `sf-symbols://checklists/import-ready`
- `sf-symbols://checklists/animation-ready`
- `sf-symbols://checklists/qa`
- `sf-symbols://project/naming-conventions`
- `sf-symbols://project/output-structure`

## Prompts

- `create_custom_symbol`: create a structured workflow from brief to import.
- `audit_custom_symbol`: validate, inspect, and plan fixes for an exported SVG.
- `prepare_draw_animation`: plan Draw or Variable Draw preparation.
- `prepare_magic_replace_family`: plan a replace-friendly symbol family.
- `generate_icon_family`: plan coherent naming, structure, rendering, and animation for a family.

## Tool Reference

### `resolve_design_environment`

Returns structured guidance for the agent before drawing: recommended vector editor, confidence, next steps, setup instructions, official Apple links, and warnings.

Inputs include `symbolName`, optional `userRequestedEditor`, optional `availableAgentTools`, optional `platform`, and optional `needsSetupHelp`.

The tool assumes the normal path is macOS with SF Symbols already installed. It does not inspect installed MCPs or local apps automatically. If the user did not specify an editor, the calling agent should pass known tools/connectors or use the output to choose an available SVG-capable editor.

### `create_symbol_brief`

Creates a normalized brief from user intent. Optionally writes `brief.md` and `brief.json`.

### `validate_svg_template`

Validates an exported SVG with practical SF Symbols readiness heuristics:

- file exists and is SVG
- XML parses safely
- no raster `<image>` tags
- no live text
- detects filters, gradients, strokes, missing `viewBox`, missing groups, missing IDs, generic IDs, and likely open paths

Optionally writes `validation-report.json` and `validation-report.md`.

### `inspect_svg_geometry`

Returns a readable structural map of groups and paths, including ids, labels, parent groups, command counts, estimated point counts, fill/stroke flags, and likely closed-path status. Optionally writes `geometry-report.json` and `geometry-report.md`.

### `compare_variable_sources`

Compares Ultralight-S, Regular-S, and Black-S SVG sources. It checks path counts, likely path order, estimated point counts, fill/stroke consistency, command signatures, and group structure. Point checks are heuristic and reported as `pointCountLikelyMatches`.

Optionally writes `variable-compatibility-report.json` and `variable-compatibility-report.md`.

### `generate_annotation_plan`

Generates a human/agent-readable SF Symbols app annotation plan for monochrome, hierarchical, palette, and multicolor rendering. It includes layer separation, clear-behind/overlap notes, and warnings. Optionally writes `annotation-plan.md` and `annotation-plan.json`.

### `generate_draw_guide_plan`

Generates a Draw/Variable Draw guide point plan, including participating layers, static layers, attachments, Regular-first workflow, and variable-template reminders. Optionally writes `draw-guide-plan.md` and `draw-guide-plan.json`.

### `generate_magic_replace_plan`

Generates a structure plan for related symbols that should transition well with replace effects. Optionally writes `magic-replace-plan.md` and `magic-replace-plan.json`.

### `create_xcassets_symbol_set`

Creates:

```text
Assets.xcassets/
  <symbolName>.symbolset/
    Contents.json
    <symbolName>.svg
```

The SVG is copied only when `sourceSvgPath` is provided. Existing files are not overwritten unless `overwrite: true` is passed. The generated `Contents.json` is intentionally conservative; verify/import in Xcode.

### `generate_swift_usage`

Generates SwiftUI and UIKit snippets. SwiftUI examples use `Image("symbolName")`, not `Image(systemName:)`. UIKit examples use `UIImage(named:)`, not system-name loading.

Optionally writes:

- `SwiftUsage.md`
- `SymbolUsageExamples.swift`
- `SymbolAnimationPreview.swift`

### `generate_import_checklist`

Generates a final import/testing checklist covering vector-editor export, SVG sanity, SF Symbols app validation, rendering annotations, draw annotations, Xcode import, SwiftUI usage, animation tests, accessibility, light/dark mode, and QA sign-off.

Optionally writes `import-checklist.md` and `import-checklist.json`.

## Security Notes

- No network dependency at runtime.
- No arbitrary shell execution from MCP tool inputs.
- No `eval`.
- No telemetry.
- No auto-uploading.
- No secret exposure.
- All file reads and writes are limited to `SF_SYMBOLS_WORKSPACE` or the process current working directory if the env var is not set.
- Existing generated files are not overwritten unless a tool explicitly supports and receives `overwrite: true`.

## Known Limitations

- SVG validation is a practical v1 preflight, not a complete SF Symbols validator.
- Path point counts are estimated from SVG path command data.
- The server cannot verify final SF Symbols app annotations unless future file formats expose that data and support validation.
- Swift symbol effect snippets are starter examples; verify exact API availability and spelling in your target Xcode SDK.
- Xcode asset scaffolds are conservative and should be verified in Xcode.

## Roadmap

- Optional editor-specific adapters where they add value.
- Richer path compatibility checks.
- Automatic SVG normalization.
- SF Symbols app automation if feasible.
- Xcode project integration.
- Generated Swift previews.
- Icon family visual reports.

## Development

```bash
npm install
npm run build
npm test
npm run lint
npm run format
```

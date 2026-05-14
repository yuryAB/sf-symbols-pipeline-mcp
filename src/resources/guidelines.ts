export type StaticResource = {
  uri: string;
  name: string;
  title: string;
  text: string;
};

export const guidelineResources: StaticResource[] = [
  {
    uri: "sf-symbols://guidelines/custom-symbols",
    name: "custom-symbols-guidelines",
    title: "Custom SF Symbols Guidelines",
    text: `# Custom SF Symbols Guidelines

A custom SF Symbol is not a generic SVG. It should begin from an official SF Symbols template whenever possible and should preserve symbol semantics throughout editing.

Use Figma as a vector editor, not as the final source of truth. The SF Symbols app remains responsible for import, validation, annotations, previews, and final export. Xcode asset catalogs are the final app delivery mechanism.

Core rules:
- Preserve semantic layer names and path order.
- Prefer closed filled paths.
- Convert live strokes to outlined paths before final export.
- Avoid open paths, raster images, masks with fragile output, filters, blur, shadows, and manual gradients.
- Validate in the SF Symbols app before treating the symbol as ready.
`,
  },
  {
    uri: "sf-symbols://guidelines/figma-to-sf-symbols",
    name: "figma-to-sf-symbols-guidelines",
    title: "Figma To SF Symbols Workflow",
    text: `# Figma To SF Symbols Workflow

Use the official Figma MCP for Figma operations. This server works with exported SVG files, JSON manifests, and local project folders.

Recommended flow:
- Start from an official SF Symbols template or a close base symbol.
- Draw Regular-S first.
- Keep layers named by semantic part, not by visual accident.
- Export SVG from Figma.
- Run validation and geometry inspection here.
- Import into the SF Symbols app for template validation and annotation.
- Export the final symbol from the SF Symbols app.
- Add the final SVG to an Xcode asset catalog.
`,
  },
  {
    uri: "sf-symbols://guidelines/path-compatibility",
    name: "path-compatibility-guidelines",
    title: "Path Compatibility Guidelines",
    text: `# Path Compatibility Guidelines

Path compatibility matters most for variable templates and animation readiness.

Rules:
- Prefer closed filled paths.
- Convert live strokes to outlined paths before final export.
- Avoid open paths in final SVG.
- Preserve path order.
- Preserve semantic layer names.
- Keep corresponding paths structurally compatible across weights.

Variable template rules:
- Prefer a variable template when multiple weights/scales matter.
- Draw Regular-S first.
- Duplicate Regular-S to Ultralight-S and Black-S.
- Adjust by moving existing points.
- Do not add or remove points independently across weights.
- Keep path count equal.
- Keep path order equal.
- Keep corresponding path point counts equal.
`,
  },
  {
    uri: "sf-symbols://guidelines/rendering-modes",
    name: "rendering-modes-guidelines",
    title: "Rendering Modes Guidelines",
    text: `# Rendering Modes Guidelines

Plan custom symbols for:
- Monochrome
- Hierarchical
- Palette
- Multicolor

This MCP can generate annotation plans, but it must not claim annotations are already applied unless a file format actually contains them and they were validated.

Use monochrome as the baseline. For hierarchical, group primary, secondary, and tertiary layers by semantic importance. For palette, plan foregroundStyle mapping. For multicolor, keep colors intentional, sparse, and readable in light/dark and high-contrast environments.
`,
  },
  {
    uri: "sf-symbols://guidelines/animation-readiness",
    name: "animation-readiness-guidelines",
    title: "Animation Readiness Guidelines",
    text: `# Animation Readiness Guidelines

Symbol effects fall into three categories:

1. Whole-symbol effects:
- bounce
- pulse
- scale
- appear
- disappear

2. Layer-sensitive effects:
- variableColor
- replace
- rotate
- wiggle
- breathe

3. Annotation-heavy effects:
- draw
- variableDraw

Layer-sensitive effects benefit from stable, named, semantically separated layers. Draw and Variable Draw require guide point planning and final application/validation in the SF Symbols app.
`,
  },
  {
    uri: "sf-symbols://guidelines/draw-and-variable-draw",
    name: "draw-and-variable-draw-guidelines",
    title: "Draw And Variable Draw Guidelines",
    text: `# Draw And Variable Draw Guidelines

For Draw and Variable Draw, this MCP generates a guide point plan only. Final guide points must be applied and validated in the SF Symbols app.

Recommended workflow:
- Annotate Regular first.
- Decide whether the draw behavior is whole-symbol, by-layer, or individual.
- Identify static layers, drawn layers, attachments, details, badges, and progress elements.
- Place guide points in the intended visual order.
- Verify Ultralight and Black guide point order.
- Test Draw and Variable Draw behavior in the SF Symbols app and Xcode previews.
`,
  },
  {
    uri: "sf-symbols://guidelines/xcode-import",
    name: "xcode-import-guidelines",
    title: "Xcode Import Guidelines",
    text: `# Xcode Import Guidelines

Xcode asset catalogs are the final delivery mechanism for custom symbols in an iOS app.

Rules:
- Import the final SVG exported from the SF Symbols app.
- Use Image("symbolName") in SwiftUI for custom asset catalog symbols.
- Do not use Image(systemName:) for custom symbols.
- Use asset-based UIImage loading in UIKit, not systemName loading.
- Verify rendering modes, symbol effects, accessibility contrast, light/dark mode, and device behavior.
`,
  },
];

import type { StaticResource } from "./guidelines.js";

export const checklistResources: StaticResource[] = [
  {
    uri: "sf-symbols://checklists/import-ready",
    name: "import-ready-checklist",
    title: "Import Ready Checklist",
    text: `# Import Ready Checklist

- Exported SVG is based on an SF Symbols template.
- No raster images are present.
- No live artwork text is present; SF Symbols template metadata text remains inside Notes only.
- Live strokes are outlined.
- Paths are preferably closed and filled.
- No fragile filters, shadows, blur, masks, or manual gradients are required.
- Semantic layer names and path order are preserved.
- Rendering annotations are planned.
- SF Symbols app import and template validation are complete.
- Final SF Symbols app export is ready for Xcode.
- Final SVG passes validate_svg_template with stage: "sf-symbol-template-svg".
`,
  },
  {
    uri: "sf-symbols://checklists/animation-ready",
    name: "animation-ready-checklist",
    title: "Animation Ready Checklist",
    text: `# Animation Ready Checklist

- Whole-symbol effects have been previewed.
- Layer-sensitive effects keep stable named layers.
- Replace families preserve shared base layers and order.
- Draw and Variable Draw guide point plans are complete.
- Regular annotations are verified first.
- Ultralight and Black guide point order is verified when variable templates are used.
- Symbol effects are tested in SwiftUI previews and on device where possible.
`,
  },
  {
    uri: "sf-symbols://checklists/qa",
    name: "qa-checklist",
    title: "QA Checklist",
    text: `# QA Checklist

- Symbol is legible at small sizes.
- Monochrome, hierarchical, palette, and multicolor behavior match intent.
- Light mode, dark mode, high contrast, and accessibility sizes are checked.
- Xcode asset catalog import succeeds.
- SwiftUI uses Image("symbolName").
- UIKit uses asset-based UIImage loading.
- Animation targets behave acceptably.
- Human designer or engineer signs off after SF Symbols app validation.
`,
  },
];

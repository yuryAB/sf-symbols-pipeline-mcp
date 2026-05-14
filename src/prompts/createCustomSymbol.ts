import { z } from "zod";
import {
  AnimationTargetsArraySchema,
  RenderingModesArraySchema,
  SymbolNameSchema,
  VisualStyleSchema,
} from "../schemas/common.js";

export const CreateCustomSymbolPromptSchema = z.object({
  symbolName: SymbolNameSchema,
  semanticIntent: z.string().min(1),
  appContext: z.string().min(1).optional(),
  baseSymbolCandidate: z.string().min(1).optional(),
  visualStyle: VisualStyleSchema.optional(),
  renderingModes: RenderingModesArraySchema,
  animationTargets: AnimationTargetsArraySchema,
  minimumOS: z.string().min(1).optional(),
});

export type CreateCustomSymbolPromptInput = z.infer<
  typeof CreateCustomSymbolPromptSchema
>;

export function createCustomSymbolPrompt(
  input: CreateCustomSymbolPromptInput,
): string {
  return `Create a custom SF Symbol named "${input.symbolName}".

Intent: ${input.semanticIntent}
App context: ${input.appContext ?? "Not provided"}
Base SF Symbol candidate: ${input.baseSymbolCandidate ?? "Choose a close official SF Symbol template if possible"}
Visual style: ${input.visualStyle ?? "Match the base symbol and app context"}
Rendering modes: ${(input.renderingModes ?? ["monochrome", "hierarchical", "palette"]).join(", ")}
Animation targets: ${(input.animationTargets ?? []).join(", ") || "None specified"}
Minimum OS: ${input.minimumOS ?? "Not specified"}

Workflow:
1. Create a normalized symbol brief with create_symbol_brief.
2. Choose an official SF Symbols template/base strategy before drawing.
3. Use the official Figma MCP only for Figma drawing/editing.
4. Preserve semantic layer names and path order while editing.
5. Export SVG from Figma.
6. Run validate_svg_template and inspect_svg_geometry on the exported SVG.
7. If using variable templates, compare Ultralight-S, Regular-S, and Black-S sources with compare_variable_sources.
8. Generate an annotation plan for requested rendering modes.
9. Generate a Draw/Variable Draw guide plan if draw or variableDraw is requested.
10. Generate an import checklist.
11. Import and validate in the SF Symbols app.
12. Apply rendering and animation annotations in the SF Symbols app; do not claim they are applied until validated there.
13. Export the final symbol from the SF Symbols app.
14. Prepare the Xcode asset catalog and Swift examples.

Important constraints:
- Treat this as an SF Symbols template pipeline, not generic SVG creation.
- Prefer closed filled paths and outlined strokes.
- Avoid raster images, live text, filters, blur, shadows, fragile masks, and manual gradients.
- Use Xcode asset catalogs as the app delivery mechanism.`;
}

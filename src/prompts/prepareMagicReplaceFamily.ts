import { z } from "zod";

export const PrepareMagicReplaceFamilyPromptSchema = z.object({
  familyName: z.string().min(1),
  symbolNames: z.array(z.string().min(1)).min(2),
  sharedBaseLayerDescription: z.string().min(1),
});

export type PrepareMagicReplaceFamilyPromptInput = z.infer<
  typeof PrepareMagicReplaceFamilyPromptSchema
>;

export function prepareMagicReplaceFamilyPrompt(
  input: PrepareMagicReplaceFamilyPromptInput,
): string {
  return `Prepare the "${input.familyName}" custom symbol family for replace transitions.

Symbols:
${input.symbolNames.map((name) => `- ${name}`).join("\n")}

Shared base layer description:
${input.sharedBaseLayerDescription}

Workflow:
1. Define the shared enclosure/base layers that should stay present across all symbols.
2. Keep stable path names and path order across the family.
3. Identify state-specific layers and avoid renaming shared layers.
4. Use generate_magic_replace_plan before drawing variants.
5. Validate each exported SVG independently.
6. Test replace behavior in SwiftUI with symbolEffect(.replace) or contentTransition(.symbolEffect(.replace)) where appropriate.

The goal is better continuity, not a guarantee that every transition will be perfect. Final behavior must be tested in Xcode.`;
}

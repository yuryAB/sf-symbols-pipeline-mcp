import { z } from "zod";
import {
  AnimationTargetsArraySchema,
  OutputDirSchema,
  RenderingModesArraySchema,
  SymbolNameSchema,
  VisualStyleSchema,
} from "./common.js";

export const CreateSymbolBriefInputSchema = z.object({
  symbolName: SymbolNameSchema,
  semanticIntent: z.string().min(1),
  appContext: z.string().min(1).optional(),
  baseSymbolCandidate: z.string().min(1).optional(),
  visualStyle: VisualStyleSchema.optional(),
  renderingModes: RenderingModesArraySchema,
  animationTargets: AnimationTargetsArraySchema,
  minimumOS: z.string().min(1).optional(),
  outputDir: OutputDirSchema,
});

export type CreateSymbolBriefInput = z.infer<
  typeof CreateSymbolBriefInputSchema
>;

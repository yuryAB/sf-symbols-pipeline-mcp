import { z } from "zod";
import {
  AnimationTargetsArraySchema,
  OutputDirSchema,
  RenderingModesArraySchema,
  SymbolNameSchema,
  WorkspacePathSchema,
} from "./common.js";

export const CreateXcassetsSymbolSetInputSchema = z.object({
  symbolName: SymbolNameSchema,
  sourceSvgPath: WorkspacePathSchema.optional(),
  outputDir: WorkspacePathSchema,
  overwrite: z.boolean().optional(),
});

export const GenerateSwiftUsageInputSchema = z.object({
  symbolName: SymbolNameSchema,
  renderingModes: RenderingModesArraySchema,
  animationTargets: AnimationTargetsArraySchema,
  minimumOS: z.string().min(1).optional(),
  outputDir: OutputDirSchema,
});

export const GenerateImportChecklistInputSchema = z.object({
  symbolName: SymbolNameSchema,
  renderingModes: z.array(z.string().min(1)).min(1).optional(),
  animationTargets: z.array(z.string().min(1)).min(1).optional(),
  includesDraw: z.boolean().optional(),
  includesVariableTemplate: z.boolean().optional(),
  outputDir: OutputDirSchema,
});

export type CreateXcassetsSymbolSetInput = z.infer<
  typeof CreateXcassetsSymbolSetInputSchema
>;
export type GenerateSwiftUsageInput = z.infer<
  typeof GenerateSwiftUsageInputSchema
>;
export type GenerateImportChecklistInput = z.infer<
  typeof GenerateImportChecklistInputSchema
>;

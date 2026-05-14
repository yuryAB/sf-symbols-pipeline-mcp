import { z } from "zod";
import { OutputDirSchema, WorkspacePathSchema } from "./common.js";

export const ValidateSvgTemplateInputSchema = z.object({
  svgPath: WorkspacePathSchema,
  expectedSymbolName: z.string().min(1).optional(),
  strict: z.boolean().optional(),
  outputDir: OutputDirSchema,
});

export const InspectSvgGeometryInputSchema = z.object({
  svgPath: WorkspacePathSchema,
  outputDir: OutputDirSchema,
});

export const CompareVariableSourcesInputSchema = z.object({
  ultralightSvgPath: WorkspacePathSchema,
  regularSvgPath: WorkspacePathSchema,
  blackSvgPath: WorkspacePathSchema,
  outputDir: OutputDirSchema,
});

export type ValidateSvgTemplateInput = z.infer<
  typeof ValidateSvgTemplateInputSchema
>;
export type InspectSvgGeometryInput = z.infer<
  typeof InspectSvgGeometryInputSchema
>;
export type CompareVariableSourcesInput = z.infer<
  typeof CompareVariableSourcesInputSchema
>;

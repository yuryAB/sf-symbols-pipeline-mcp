import { z } from "zod";

export const RenderingModeSchema = z.enum([
  "monochrome",
  "hierarchical",
  "palette",
  "multicolor",
]);

export const AnimationTargetSchema = z.enum([
  "bounce",
  "pulse",
  "scale",
  "appear",
  "disappear",
  "variableColor",
  "replace",
  "draw",
  "variableDraw",
  "rotate",
  "wiggle",
  "breathe",
]);

export const VisualStyleSchema = z.enum(["outline", "fill", "mixed"]);

export const SymbolNameSchema = z.string().min(1).max(120);

export const WorkspacePathSchema = z.string().min(1);

export const OutputDirSchema = z.string().min(1).optional();

export const RenderingModesArraySchema = z
  .array(RenderingModeSchema)
  .min(1)
  .optional();

export const AnimationTargetsArraySchema = z
  .array(AnimationTargetSchema)
  .min(1)
  .optional();

export type RenderingMode = z.infer<typeof RenderingModeSchema>;
export type AnimationTarget = z.infer<typeof AnimationTargetSchema>;
export type VisualStyle = z.infer<typeof VisualStyleSchema>;

export const renderingModeLabels: Record<RenderingMode, string> = {
  monochrome: "Monochrome",
  hierarchical: "Hierarchical",
  palette: "Palette",
  multicolor: "Multicolor",
};

export const animationCategoryByTarget: Record<AnimationTarget, string> = {
  bounce: "Whole-symbol",
  pulse: "Whole-symbol",
  scale: "Whole-symbol",
  appear: "Whole-symbol",
  disappear: "Whole-symbol",
  variableColor: "Layer-sensitive",
  replace: "Layer-sensitive",
  rotate: "Layer-sensitive",
  wiggle: "Layer-sensitive",
  breathe: "Layer-sensitive",
  draw: "Annotation-heavy",
  variableDraw: "Annotation-heavy",
};

export const DEFAULT_RENDERING_MODES: RenderingMode[] = [
  "monochrome",
  "hierarchical",
  "palette",
];

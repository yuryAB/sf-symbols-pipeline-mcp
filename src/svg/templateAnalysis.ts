import { Workspace } from "../workspace.js";
import {
  elementLabel,
  flattenSvgElements,
  getAttr,
  parseSvgDocument,
  type SvgDocument,
  type SvgElement,
} from "./parseSvg.js";
import {
  analyzePathData,
  attrsHaveFill,
  attrsHaveStroke,
  styleOrAttr,
} from "./pathAnalysis.js";

export type GeometryGroup = {
  id?: string;
  label?: string;
  depth: number;
  childCount: number;
};

export type GeometryPath = {
  id?: string;
  label?: string;
  index: number;
  parentGroup?: string;
  commandCount?: number;
  estimatedPointCount?: number;
  commandTypes?: string[];
  hasStroke: boolean;
  hasFill: boolean;
  isProbablyClosed?: boolean;
};

export type GeometryReport = {
  groups: GeometryGroup[];
  paths: GeometryPath[];
  warnings: string[];
};

export type SvgStats = {
  pathCount: number;
  groupCount: number;
  hasViewBox: boolean;
  hasImages: boolean;
  hasText: boolean;
  hasFilters: boolean;
  hasGradients: boolean;
  hasStrokes: boolean;
};

export type ValidationStage = "artwork-svg" | "sf-symbol-template-svg";

export type ValidateTemplateOptions = {
  expectedSymbolName?: string;
  strict?: boolean;
  stage?: ValidationStage;
  targetGlyph?: string;
  requiresVariableTemplate?: boolean;
};

export type TemplateTextSummary = {
  id?: string;
  text?: string;
  parentGroups: string[];
};

export type SfSymbolTemplateReport = {
  targetGlyph: string;
  requiredGroups: Record<"Notes" | "Guides" | "Symbols", boolean>;
  metadata: {
    hasTemplateVersion: boolean;
    templateVersion?: string;
    hasDescriptiveName: boolean;
    descriptiveName?: string;
  };
  guides: {
    required: string[];
    present: string[];
    missing: string[];
  };
  margins: {
    targetGlyph: string;
    required: string[];
    present: string[];
    missing: string[];
  };
  glyphs: {
    targetGlyph: string;
    required: string[];
    present: string[];
    missing: string[];
    pathCounts: Record<string, number>;
    variableRequired: boolean;
  };
  text: {
    allowedInNotes: TemplateTextSummary[];
    disallowedOutsideNotes: TemplateTextSummary[];
  };
};

export type ValidationReport = {
  stage: ValidationStage;
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: SvgStats;
  template?: SfSymbolTemplateReport;
  writtenFiles?: string[];
};

const DEFAULT_VALIDATION_STAGE: ValidationStage = "artwork-svg";
const DEFAULT_TARGET_GLYPH = "Regular-M";
const REQUIRED_TEMPLATE_GROUPS = ["Notes", "Guides", "Symbols"] as const;
const REQUIRED_GUIDES = [
  "Baseline-S",
  "Baseline-M",
  "Baseline-L",
  "Capline-S",
  "Capline-M",
  "Capline-L",
];
const VARIABLE_TEMPLATE_GLYPHS = ["Ultralight-S", "Regular-S", "Black-S"];

export async function parseSvgFromWorkspace(
  workspace: Workspace,
  svgPath: string,
): Promise<SvgDocument> {
  if (!svgPath.toLowerCase().endsWith(".svg")) {
    throw new Error("Expected an .svg file path.");
  }

  const svgText = await workspace.readText(svgPath);
  return parseSvgDocument(svgText, svgPath);
}

export function inspectGeometry(document: SvgDocument): GeometryReport {
  const groups: GeometryGroup[] = [];
  const paths: GeometryPath[] = [];
  const warnings: string[] = [];

  const visit = (
    node: SvgElement,
    depth: number,
    parentGroup?: string,
  ): void => {
    const name = node.name.toLowerCase();
    const id = node.attrs.id;
    const label = elementLabel(node);
    const groupName = label || id;

    if (name === "g") {
      groups.push({
        id,
        label,
        depth,
        childCount: node.children.length,
      });
    }

    if (name === "path") {
      const pathAnalysis = analyzePathData(node.attrs.d);
      const hasStroke = attrsHaveStroke(node.attrs);
      const hasFill = attrsHaveFill(node.attrs);

      paths.push({
        id,
        label,
        index: paths.length,
        parentGroup,
        commandCount: pathAnalysis.commandCount,
        estimatedPointCount: pathAnalysis.estimatedPointCount,
        commandTypes: pathAnalysis.commandTypes,
        hasStroke,
        hasFill,
        isProbablyClosed: pathAnalysis.isProbablyClosed,
      });
    }

    const nextParentGroup =
      name === "g" ? groupName || parentGroup : parentGroup;
    for (const child of node.children) {
      visit(child, depth + 1, nextParentGroup);
    }
  };

  visit(document.root, 0);

  if (paths.length === 0) {
    warnings.push("No <path> elements were found.");
  }

  if (groups.length === 0) {
    warnings.push(
      "No groups were found; SF Symbols layer semantics may be lost.",
    );
  }

  return { groups, paths, warnings };
}

export function validateTemplateHeuristics(
  document: SvgDocument,
  options: ValidateTemplateOptions = {},
): ValidationReport {
  const stage = options.stage ?? DEFAULT_VALIDATION_STAGE;
  const strict = options.strict ?? false;
  const elements = flattenSvgElements(document.root);
  const geometry = inspectGeometry(document);
  const rootAttrs = document.root.attrs;
  const warnings = [...geometry.warnings];
  const errors: string[] = [];
  let template: SfSymbolTemplateReport | undefined;

  const stats: SvgStats = {
    pathCount: geometry.paths.length,
    groupCount: geometry.groups.length,
    hasViewBox: Boolean(rootAttrs.viewBox),
    hasImages: elements.some(
      (element) => element.name.toLowerCase() === "image",
    ),
    hasText: elements.some((element) =>
      ["text", "tspan", "textpath"].includes(element.name.toLowerCase()),
    ),
    hasFilters: elements.some(hasFilterSignal),
    hasGradients: elements.some((element) =>
      ["lineargradient", "radialgradient", "meshgradient"].includes(
        element.name.toLowerCase(),
      ),
    ),
    hasStrokes: geometry.paths.some((path) => path.hasStroke),
  };

  if (stats.hasImages) {
    errors.push(
      "Raster <image> elements are not allowed in a custom symbol SVG.",
    );
  }

  if (stats.hasText && stage === "artwork-svg") {
    errors.push(
      "Live text elements are not allowed; convert text to outlined paths.",
    );
  }

  if (stats.pathCount === 0) {
    errors.push("The SVG does not contain any paths.");
  }

  const strictIssuesAreErrors = strict || stage === "sf-symbol-template-svg";

  if (stats.hasFilters) {
    const message =
      "Filters, blurs, shadows, and filter references are fragile in SF Symbols templates.";
    pushStrictIssue(strictIssuesAreErrors, errors, warnings, message);
  }

  if (stats.hasGradients) {
    const message =
      "Gradients were found. Prefer rendering annotations over manual gradients in the template SVG.";
    pushStrictIssue(strictIssuesAreErrors, errors, warnings, message);
  }

  if (stats.hasStrokes) {
    const message =
      "Live strokes were found. Convert strokes to outlined filled paths before final export.";
    pushStrictIssue(strictIssuesAreErrors, errors, warnings, message);
  }

  if (!stats.hasViewBox) {
    const message = "The SVG is missing a viewBox.";
    pushStrictIssue(strictIssuesAreErrors, errors, warnings, message);
  }

  const openPaths = geometry.paths.filter(
    (path) => path.isProbablyClosed === false,
  );
  if (openPaths.length > 0) {
    warnings.push(
      `Heuristic: ${openPaths.length} path(s) do not end with Z/z and may be open.`,
    );
  }

  const missingPathNames = geometry.paths.filter(
    (path) => !path.id && !path.label,
  );
  if (missingPathNames.length > 0) {
    warnings.push(
      `Heuristic: ${missingPathNames.length} path(s) are missing ids or labels. Preserve semantic layer names when possible.`,
    );
  }

  const meaninglessNames = geometry.paths.filter((path) =>
    isMeaninglessName(path.id || path.label),
  );
  if (meaninglessNames.length > 0) {
    warnings.push(
      "Heuristic: some path ids look generic, such as path1/path2. Rename important layers semantically.",
    );
  }

  if (stats.pathCount < 2) {
    warnings.push(
      "Heuristic: very low path count may indicate a generic SVG rather than an SF Symbols template export.",
    );
  }

  if (!hasTemplateLikeGroupName(geometry.groups)) {
    warnings.push(
      "Heuristic: expected SF Symbols-style template groups were not detected. Start from an official template whenever possible.",
    );
  }

  if (
    options.expectedSymbolName &&
    !document.sourcePath?.includes(options.expectedSymbolName)
  ) {
    warnings.push(
      `Expected symbol name "${options.expectedSymbolName}" was not found in the SVG file path.`,
    );
  }

  if (stage === "sf-symbol-template-svg") {
    const templateResult = analyzeSfSymbolTemplate(document, {
      targetGlyph: options.targetGlyph ?? DEFAULT_TARGET_GLYPH,
      requiresVariableTemplate: options.requiresVariableTemplate ?? false,
    });
    template = templateResult.report;
    errors.push(...templateResult.errors);
  }

  return {
    stage,
    passed: errors.length === 0,
    errors,
    warnings,
    stats,
    ...(template ? { template } : {}),
  };
}

type TextElementContext = {
  element: SvgElement;
  parentGroups: string[];
};

type SfSymbolTemplateAnalysis = {
  report: SfSymbolTemplateReport;
  errors: string[];
};

function analyzeSfSymbolTemplate(
  document: SvgDocument,
  input: {
    targetGlyph: string;
    requiresVariableTemplate: boolean;
  },
): SfSymbolTemplateAnalysis {
  const errors: string[] = [];
  const notesGroup = findNamedGroup(document.root, "Notes");
  const guidesGroup = findNamedGroup(document.root, "Guides");
  const symbolsGroup = findNamedGroup(document.root, "Symbols");
  const requiredGroups = {
    Notes: Boolean(notesGroup),
    Guides: Boolean(guidesGroup),
    Symbols: Boolean(symbolsGroup),
  };

  for (const group of REQUIRED_TEMPLATE_GROUPS) {
    if (!requiredGroups[group]) {
      errors.push(`missing ${group} group`);
    }
  }

  const textContexts = collectTextContexts(document.root);
  const allowedText = textContexts.filter((context) =>
    hasParentGroup(context, "Notes"),
  );
  const disallowedText = textContexts.filter(
    (context) => !hasParentGroup(context, "Notes"),
  );

  if (disallowedText.length > 0) {
    errors.push(
      "Live text outside Notes is not allowed; convert artwork text to outlined paths.",
    );
  }

  const templateVersion = allowedText.find((context) =>
    elementMatchesIdentifier(context.element, "template-version"),
  );
  const descriptiveName = allowedText.find((context) =>
    elementMatchesIdentifier(context.element, "descriptive-name"),
  );

  if (!templateVersion) {
    errors.push("missing template-version");
  } else if (
    !/^Template v\.\d+(?:\.\d+)*$/i.test(templateVersion.element.text ?? "")
  ) {
    errors.push("invalid template-version; expected Template v.x.x");
  }

  const presentGuides = guidesGroup
    ? REQUIRED_GUIDES.filter((guide) => hasElementNamed(guidesGroup, guide))
    : [];
  const missingGuides = REQUIRED_GUIDES.filter(
    (guide) => !presentGuides.includes(guide),
  );

  for (const guide of missingGuides) {
    errors.push(`missing ${guide}`);
  }

  const requiredMargins = [
    `left-margin-${input.targetGlyph}`,
    `right-margin-${input.targetGlyph}`,
  ];
  const presentMargins = guidesGroup
    ? requiredMargins.filter((margin) => hasElementNamed(guidesGroup, margin))
    : [];
  const missingMargins = requiredMargins.filter(
    (margin) => !presentMargins.includes(margin),
  );

  for (const margin of missingMargins) {
    errors.push(`missing ${margin}`);
  }

  const requiredGlyphs = uniqueValues([
    input.targetGlyph,
    ...(input.requiresVariableTemplate ? VARIABLE_TEMPLATE_GLYPHS : []),
  ]);
  const presentGlyphs: string[] = [];
  const missingGlyphs: string[] = [];
  const pathCounts: Record<string, number> = {};

  for (const glyph of requiredGlyphs) {
    const glyphGroup = symbolsGroup
      ? findNamedGroup(symbolsGroup, glyph)
      : undefined;
    const pathCount = glyphGroup ? countDescendantPaths(glyphGroup) : 0;
    pathCounts[glyph] = pathCount;

    if (!glyphGroup) {
      missingGlyphs.push(glyph);
      errors.push(`missing glyph for ${glyph}`);
      continue;
    }

    if (pathCount === 0) {
      missingGlyphs.push(glyph);
      errors.push(`missing glyph paths for ${glyph}`);
      continue;
    }

    presentGlyphs.push(glyph);
  }

  return {
    report: {
      targetGlyph: input.targetGlyph,
      requiredGroups,
      metadata: {
        hasTemplateVersion: Boolean(templateVersion),
        ...(templateVersion?.element.text
          ? { templateVersion: templateVersion.element.text }
          : {}),
        hasDescriptiveName: Boolean(descriptiveName),
        ...(descriptiveName?.element.text
          ? { descriptiveName: descriptiveName.element.text }
          : {}),
      },
      guides: {
        required: REQUIRED_GUIDES,
        present: presentGuides,
        missing: missingGuides,
      },
      margins: {
        targetGlyph: input.targetGlyph,
        required: requiredMargins,
        present: presentMargins,
        missing: missingMargins,
      },
      glyphs: {
        targetGlyph: input.targetGlyph,
        required: requiredGlyphs,
        present: presentGlyphs,
        missing: missingGlyphs,
        pathCounts,
        variableRequired: input.requiresVariableTemplate,
      },
      text: {
        allowedInNotes: allowedText.map(textSummary),
        disallowedOutsideNotes: disallowedText.map(textSummary),
      },
    },
    errors,
  };
}

function collectTextContexts(root: SvgElement): TextElementContext[] {
  const contexts: TextElementContext[] = [];

  const visit = (node: SvgElement, parentGroups: string[]): void => {
    const name = node.name.toLowerCase();

    if (["text", "tspan", "textpath"].includes(name)) {
      contexts.push({ element: node, parentGroups });
    }

    const groupName = name === "g" ? elementIdentifier(node) : undefined;
    const nextParentGroups = groupName
      ? [...parentGroups, groupName]
      : parentGroups;

    for (const child of node.children) {
      visit(child, nextParentGroups);
    }
  };

  visit(root, []);
  return contexts;
}

function hasParentGroup(
  context: TextElementContext,
  groupName: string,
): boolean {
  return context.parentGroups.some(
    (parentGroup) => parentGroup.toLowerCase() === groupName.toLowerCase(),
  );
}

function textSummary(context: TextElementContext): TemplateTextSummary {
  return {
    ...(elementIdentifier(context.element)
      ? { id: elementIdentifier(context.element) }
      : {}),
    ...(context.element.text ? { text: context.element.text } : {}),
    parentGroups: context.parentGroups,
  };
}

function findNamedGroup(
  root: SvgElement,
  groupName: string,
): SvgElement | undefined {
  return flattenSvgElements(root).find(
    (element) =>
      element.name.toLowerCase() === "g" &&
      elementMatchesIdentifier(element, groupName),
  );
}

function hasElementNamed(root: SvgElement, elementName: string): boolean {
  return flattenSvgElements(root).some((element) =>
    elementMatchesIdentifier(element, elementName),
  );
}

function elementMatchesIdentifier(
  element: SvgElement,
  expectedIdentifier: string,
): boolean {
  const expected = expectedIdentifier.toLowerCase();
  return [element.attrs.id, elementLabel(element)]
    .filter(Boolean)
    .some((identifier) => identifier?.toLowerCase() === expected);
}

function elementIdentifier(element: SvgElement): string | undefined {
  return element.attrs.id || elementLabel(element);
}

function countDescendantPaths(root: SvgElement): number {
  return flattenSvgElements(root).filter(
    (element) =>
      element.name.toLowerCase() === "path" &&
      typeof element.attrs.d === "string" &&
      element.attrs.d.trim().length > 0,
  ).length;
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values)];
}

function hasFilterSignal(element: SvgElement): boolean {
  const name = element.name.toLowerCase();
  if (
    name === "filter" ||
    name === "fegaussianblur" ||
    name === "fedropshadow"
  ) {
    return true;
  }

  const filter = getAttr(element.attrs, ["filter"]);
  if (filter) {
    return true;
  }

  const style = element.attrs.style;
  return Boolean(style && /filter\s*:|blur\s*\(|drop-shadow\s*\(/i.test(style));
}

function pushStrictIssue(
  strict: boolean,
  errors: string[],
  warnings: string[],
  message: string,
): void {
  if (strict) {
    errors.push(message);
    return;
  }

  warnings.push(message);
}

function hasTemplateLikeGroupName(groups: GeometryGroup[]): boolean {
  const groupNames = groups
    .map((group) => `${group.id ?? ""} ${group.label ?? ""}`.trim())
    .filter(Boolean);

  if (groupNames.length === 0) {
    return false;
  }

  return groupNames.some((name) =>
    /(regular|ultralight|black|small|large|symbols?|template|layers?)/i.test(
      name,
    ),
  );
}

function isMeaninglessName(name?: string): boolean {
  return Boolean(name && /^(path|shape|group|layer)[-_ ]?\d*$/i.test(name));
}

export function pathIdentity(path: GeometryPath): string {
  return path.label || path.id || `index:${path.index}`;
}

export function pathCommandSignature(path: GeometryPath): string {
  return path.commandTypes?.join("") ?? "";
}

export function groupSignature(groups: GeometryGroup[]): string {
  return groups
    .map(
      (group) =>
        `${group.depth}:${group.label || group.id || "unnamed"}:${group.childCount}`,
    )
    .join("|");
}

export function fillStrokeSignature(path: GeometryPath): string {
  return `${path.hasFill ? "fill" : "nofill"}:${path.hasStroke ? "stroke" : "nostroke"}`;
}

export function findStyleProperty(
  attrs: Record<string, string>,
  property: string,
): string | undefined {
  return styleOrAttr(attrs, property);
}

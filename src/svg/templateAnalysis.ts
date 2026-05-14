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

export type ValidationReport = {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: SvgStats;
  writtenFiles?: string[];
};

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
  expectedSymbolName?: string,
  strict = false,
): ValidationReport {
  const elements = flattenSvgElements(document.root);
  const geometry = inspectGeometry(document);
  const rootAttrs = document.root.attrs;
  const warnings = [...geometry.warnings];
  const errors: string[] = [];

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

  if (stats.hasText) {
    errors.push(
      "Live text elements are not allowed; convert text to outlined paths.",
    );
  }

  if (stats.pathCount === 0) {
    errors.push("The SVG does not contain any paths.");
  }

  if (stats.hasFilters) {
    const message =
      "Filters, blurs, shadows, and filter references are fragile in SF Symbols templates.";
    pushStrictIssue(strict, errors, warnings, message);
  }

  if (stats.hasGradients) {
    const message =
      "Gradients were found. Prefer rendering annotations over manual gradients in the template SVG.";
    pushStrictIssue(strict, errors, warnings, message);
  }

  if (stats.hasStrokes) {
    const message =
      "Live strokes were found. Convert strokes to outlined filled paths before final export.";
    pushStrictIssue(strict, errors, warnings, message);
  }

  if (!stats.hasViewBox) {
    const message = "The SVG is missing a viewBox.";
    pushStrictIssue(strict, errors, warnings, message);
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
    expectedSymbolName &&
    !document.sourcePath?.includes(expectedSymbolName)
  ) {
    warnings.push(
      `Expected symbol name "${expectedSymbolName}" was not found in the SVG file path.`,
    );
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    stats,
  };
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

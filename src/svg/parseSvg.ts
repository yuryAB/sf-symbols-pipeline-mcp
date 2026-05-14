import { XMLParser, XMLValidator } from "fast-xml-parser";

export type SvgAttributes = Record<string, string>;

export type SvgElement = {
  name: string;
  attrs: SvgAttributes;
  children: SvgElement[];
};

export type SvgDocument = {
  root: SvgElement;
  sourcePath?: string;
};

export class SvgParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SvgParseError";
  }
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  allowBooleanAttributes: true,
  preserveOrder: true,
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: false,
});

export function parseSvgDocument(
  svgText: string,
  sourcePath?: string,
): SvgDocument {
  if (/<!DOCTYPE/i.test(svgText) || /<!ENTITY/i.test(svgText)) {
    throw new SvgParseError("SVG contains a DOCTYPE or ENTITY declaration.");
  }

  const validation = XMLValidator.validate(svgText, {
    allowBooleanAttributes: true,
  });

  if (validation !== true) {
    throw new SvgParseError(
      `Invalid XML/SVG: ${validation.err.msg} at line ${validation.err.line}`,
    );
  }

  const parsed = parser.parse(svgText) as unknown;
  const nodes = orderedNodesToElements(parsed);
  const root = nodes.find((node) => node.name.toLowerCase() === "svg");

  if (!root) {
    throw new SvgParseError(
      "File is XML, but no <svg> root element was found.",
    );
  }

  return { root, sourcePath };
}

export function flattenSvgElements(root: SvgElement): SvgElement[] {
  const elements: SvgElement[] = [];

  const visit = (node: SvgElement) => {
    elements.push(node);
    for (const child of node.children) {
      visit(child);
    }
  };

  visit(root);
  return elements;
}

export function getAttr(
  attrs: SvgAttributes,
  names: string[],
): string | undefined {
  for (const name of names) {
    const value = attrs[name];
    if (value !== undefined && value !== null && String(value).length > 0) {
      return String(value);
    }
  }

  return undefined;
}

export function elementLabel(element: SvgElement): string | undefined {
  return getAttr(element.attrs, [
    "inkscape:label",
    "label",
    "aria-label",
    "data-name",
    "name",
  ]);
}

function orderedNodesToElements(value: unknown): SvgElement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const elements: SvgElement[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const attrs = normalizeAttrs(record[":@"]);

    for (const [key, childValue] of Object.entries(record)) {
      if (key === ":@" || key === "#text" || key === "?xml") {
        continue;
      }

      elements.push({
        name: key,
        attrs,
        children: orderedNodesToElements(childValue),
      });
    }
  }

  return elements;
}

function normalizeAttrs(value: unknown): SvgAttributes {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, attrValue]) => [
      key,
      String(attrValue),
    ]),
  );
}

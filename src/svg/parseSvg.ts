import { XMLParser, XMLValidator } from "fast-xml-parser";

export type SvgAttributes = Record<string, string>;

export type SvgElement = {
  name: string;
  attrs: SvgAttributes;
  children: SvgElement[];
  text?: string;
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
  if (/<!ENTITY/i.test(svgText)) {
    throw new SvgParseError("SVG contains an ENTITY declaration.");
  }

  const safeSvgText = stripSafeSvgDoctype(svgText);

  const validation = XMLValidator.validate(safeSvgText, {
    allowBooleanAttributes: true,
  });

  if (validation !== true) {
    throw new SvgParseError(
      `Invalid XML/SVG: ${validation.err.msg} at line ${validation.err.line}`,
    );
  }

  const parsed = parser.parse(safeSvgText) as unknown;
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
      if (
        key === ":@" ||
        key === "#text" ||
        key === "#comment" ||
        key === "?xml"
      ) {
        continue;
      }

      const text = orderedNodeText(childValue);
      elements.push({
        name: key,
        attrs,
        children: orderedNodesToElements(childValue),
        ...(text ? { text } : {}),
      });
    }
  }

  return elements;
}

function orderedNodeText(value: unknown): string | undefined {
  const parts: string[] = [];

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const child of node) {
        visit(child);
      }
      return;
    }

    if (!node || typeof node !== "object") {
      return;
    }

    for (const [key, childValue] of Object.entries(
      node as Record<string, unknown>,
    )) {
      if (key === "#text") {
        parts.push(String(childValue));
        continue;
      }

      if (key === ":@" || key === "#comment" || key === "?xml") {
        continue;
      }

      visit(childValue);
    }
  };

  visit(value);

  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : undefined;
}

const SAFE_SVG_DOCTYPE =
  /<!DOCTYPE\s+svg\s+(?:PUBLIC\s+"-\/\/W3C\/\/DTD SVG 1\.1\/\/EN"\s+"http:\/\/www\.w3\.org\/Graphics\/SVG\/1\.1\/DTD\/svg11\.dtd"|SYSTEM\s+"http:\/\/www\.w3\.org\/Graphics\/SVG\/1\.1\/DTD\/svg11\.dtd")\s*>/gi;

function stripSafeSvgDoctype(svgText: string): string {
  const doctypeMatches = svgText.match(/<!DOCTYPE[\s\S]*?>/gi);
  if (!doctypeMatches) {
    return svgText;
  }

  for (const doctype of doctypeMatches) {
    if (!doctype.match(SAFE_SVG_DOCTYPE)) {
      throw new SvgParseError(
        "SVG contains an unsupported DOCTYPE declaration.",
      );
    }
  }

  return svgText.replace(SAFE_SVG_DOCTYPE, "");
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

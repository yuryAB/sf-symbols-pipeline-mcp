import type { SvgAttributes } from "./parseSvg.js";

export type PathCommandAnalysis = {
  commandCount: number;
  commandTypes: string[];
  estimatedPointCount: number;
  isProbablyClosed: boolean;
};

const COMMAND_RE = /^[AaCcHhLlMmQqSsTtVvZz]$/;
const TOKEN_RE =
  /[AaCcHhLlMmQqSsTtVvZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;

const PARAMS_BY_COMMAND: Record<string, number> = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0,
};

const POINTS_BY_COMMAND: Record<string, number> = {
  M: 1,
  L: 1,
  H: 1,
  V: 1,
  C: 3,
  S: 2,
  Q: 2,
  T: 1,
  A: 1,
  Z: 0,
};

export function analyzePathData(d?: string): PathCommandAnalysis {
  if (!d) {
    return {
      commandCount: 0,
      commandTypes: [],
      estimatedPointCount: 0,
      isProbablyClosed: false,
    };
  }

  const tokens = d.match(TOKEN_RE) ?? [];
  const commandTypes: string[] = [];
  let estimatedPointCount = 0;
  let currentCommand: string | undefined;
  let numberBuffer: string[] = [];

  const flush = () => {
    if (!currentCommand) {
      numberBuffer = [];
      return;
    }

    const command = currentCommand.toUpperCase();
    const paramCount = PARAMS_BY_COMMAND[command] ?? 0;

    if (paramCount === 0) {
      commandTypes.push(command);
      numberBuffer = [];
      return;
    }

    const repetitions = Math.max(
      1,
      Math.floor(numberBuffer.length / paramCount),
    );
    for (let index = 0; index < repetitions; index += 1) {
      const expandedCommand = command === "M" && index > 0 ? "L" : command;
      commandTypes.push(expandedCommand);
      estimatedPointCount += POINTS_BY_COMMAND[expandedCommand] ?? 0;
    }

    numberBuffer = [];
  };

  for (const token of tokens) {
    if (COMMAND_RE.test(token)) {
      flush();
      currentCommand = token;
      if (token.toUpperCase() === "Z") {
        flush();
        currentCommand = undefined;
      }
      continue;
    }

    numberBuffer.push(token);
  }

  flush();

  return {
    commandCount: commandTypes.length,
    commandTypes,
    estimatedPointCount,
    isProbablyClosed: /[Zz]\s*$/.test(d.trim()),
  };
}

export function attrsHaveStroke(attrs: SvgAttributes): boolean {
  const stroke = styleOrAttr(attrs, "stroke");
  if (!stroke) {
    return false;
  }

  const normalized = stroke.trim().toLowerCase();
  return (
    normalized !== "none" &&
    normalized !== "transparent" &&
    normalized !== "0" &&
    !normalized.endsWith("opacity:0")
  );
}

export function attrsHaveFill(attrs: SvgAttributes): boolean {
  const fill = styleOrAttr(attrs, "fill");
  if (!fill) {
    return true;
  }

  return fill.trim().toLowerCase() !== "none";
}

export function styleOrAttr(
  attrs: SvgAttributes,
  property: string,
): string | undefined {
  if (attrs[property]) {
    return attrs[property];
  }

  const style = attrs.style;
  if (!style) {
    return undefined;
  }

  const match = style.match(new RegExp(`${property}\\s*:\\s*([^;]+)`, "i"));
  return match?.[1]?.trim();
}

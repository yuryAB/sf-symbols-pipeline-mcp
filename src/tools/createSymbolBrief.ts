import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  animationCategoryByTarget,
  DEFAULT_RENDERING_MODES,
} from "../schemas/common.js";
import {
  CreateSymbolBriefInputSchema,
  type CreateSymbolBriefInput,
} from "../schemas/symbolBrief.js";
import { bulletList, reportMarkdown } from "../output/markdown.js";
import { writeJsonArtifact, writeMarkdownArtifact } from "../output/writers.js";
import type { Workspace } from "../workspace.js";
import { safeTool, toolSuccess } from "./result.js";

export type SymbolBriefOutput = {
  symbolName: string;
  normalizedName: string;
  briefMarkdown: string;
  briefJson: Record<string, unknown>;
  recommendedWorkflow: string[];
  warnings: string[];
  writtenFiles?: string[];
};

export function normalizeSymbolName(symbolName: string): string {
  return symbolName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\./, "")
    .replace(/\.$/, "");
}

export async function createSymbolBrief(
  workspace: Workspace,
  input: CreateSymbolBriefInput,
): Promise<SymbolBriefOutput> {
  const normalizedName = normalizeSymbolName(input.symbolName);
  const renderingModes = input.renderingModes ?? DEFAULT_RENDERING_MODES;
  const animationTargets = input.animationTargets ?? [];
  const warnings: string[] = [];

  if (normalizedName !== input.symbolName) {
    warnings.push(
      `Symbol name was normalized from "${input.symbolName}" to "${normalizedName}".`,
    );
  }

  if (!input.baseSymbolCandidate) {
    warnings.push(
      "No base SF Symbol candidate was provided. Choose a close official template before drawing.",
    );
  }

  if (
    animationTargets.includes("draw") ||
    animationTargets.includes("variableDraw")
  ) {
    warnings.push(
      "Draw and Variable Draw require guide point annotations in the SF Symbols app.",
    );
  }

  const recommendedWorkflow = [
    "Start from an official SF Symbols template or a close base symbol.",
    "Use the official Figma MCP for drawing/editing only.",
    "Export SVG from Figma.",
    "Run validate_svg_template and inspect_svg_geometry.",
    "Generate annotation and import plans.",
    "Import, annotate, preview, and validate in the SF Symbols app.",
    "Export the final symbol from the SF Symbols app.",
    "Prepare Xcode asset catalog and Swift usage examples.",
  ];

  const briefJson = {
    symbolName: input.symbolName,
    normalizedName,
    semanticIntent: input.semanticIntent,
    appContext: input.appContext,
    baseSymbolCandidate: input.baseSymbolCandidate,
    visualStyle: input.visualStyle ?? "outline",
    renderingModes,
    animationTargets,
    animationCategories: Object.fromEntries(
      animationTargets.map((target) => [
        target,
        animationCategoryByTarget[target],
      ]),
    ),
    minimumOS: input.minimumOS,
    principles: [
      "A custom SF Symbol is not a generic SVG.",
      "Use Figma as a vector editor, not the final source of truth.",
      "Use the SF Symbols app for import, validation, annotations, previews, and final export.",
      "Use an Xcode asset catalog as the final app delivery mechanism.",
    ],
  };

  const briefMarkdown = reportMarkdown(
    `Symbol Brief: ${normalizedName}`,
    input.semanticIntent,
    [
      {
        title: "Context",
        body: bulletList([
          `App context: ${input.appContext ?? "Not provided"}`,
          `Base candidate: ${input.baseSymbolCandidate ?? "Choose a close official symbol"}`,
          `Visual style: ${input.visualStyle ?? "outline"}`,
          `Minimum OS: ${input.minimumOS ?? "Not specified"}`,
        ]),
      },
      {
        title: "Rendering And Animation",
        body: bulletList([
          `Rendering modes: ${renderingModes.join(", ")}`,
          `Animation targets: ${animationTargets.join(", ") || "None specified"}`,
        ]),
      },
      {
        title: "Recommended Workflow",
        body: bulletList(recommendedWorkflow),
      },
      {
        title: "Warnings",
        body: bulletList(warnings),
      },
    ],
  );

  const output: SymbolBriefOutput = {
    symbolName: input.symbolName,
    normalizedName,
    briefMarkdown,
    briefJson,
    recommendedWorkflow,
    warnings,
  };

  if (input.outputDir) {
    output.writtenFiles = [
      await writeMarkdownArtifact(
        workspace,
        input.outputDir,
        "brief.md",
        briefMarkdown,
      ),
      await writeJsonArtifact(
        workspace,
        input.outputDir,
        "brief.json",
        briefJson,
      ),
    ];
  }

  return output;
}

export function registerCreateSymbolBriefTool(
  server: McpServer,
  workspace: Workspace,
): void {
  server.registerTool(
    "create_symbol_brief",
    {
      title: "Create Symbol Brief",
      description:
        "Create a normalized custom SF Symbol brief from user intent.",
      inputSchema: CreateSymbolBriefInputSchema,
    },
    (args) =>
      safeTool(async () => {
        const result = await createSymbolBrief(workspace, args);
        return toolSuccess(
          result,
          `Created symbol brief for ${result.normalizedName}.`,
        );
      }),
  );
}

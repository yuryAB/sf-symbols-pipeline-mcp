import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { bulletList, fencedJson, reportMarkdown } from "../output/markdown.js";
import { writeJsonArtifact, writeMarkdownArtifact } from "../output/writers.js";
import {
  ValidateSvgTemplateInputSchema,
  type ValidateSvgTemplateInput,
} from "../schemas/validation.js";
import type { Workspace } from "../workspace.js";
import {
  parseSvgFromWorkspace,
  validateTemplateHeuristics,
  type ValidationReport,
} from "../svg/templateAnalysis.js";
import { safeTool, toolSuccess } from "./result.js";

const EMPTY_STATS = {
  pathCount: 0,
  groupCount: 0,
  hasViewBox: false,
  hasImages: false,
  hasText: false,
  hasFilters: false,
  hasGradients: false,
  hasStrokes: false,
};

export async function runValidateSvgTemplate(
  workspace: Workspace,
  input: ValidateSvgTemplateInput,
): Promise<ValidationReport> {
  let report: ValidationReport;

  try {
    const document = await parseSvgFromWorkspace(workspace, input.svgPath);
    report = validateTemplateHeuristics(
      document,
      input.expectedSymbolName,
      input.strict ?? false,
    );
  } catch (error) {
    report = {
      passed: false,
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: [],
      stats: EMPTY_STATS,
    };
  }

  if (input.outputDir) {
    const markdown = validationReportMarkdown(input.svgPath, report);
    report.writtenFiles = [
      await writeJsonArtifact(
        workspace,
        input.outputDir,
        "validation-report.json",
        report,
      ),
      await writeMarkdownArtifact(
        workspace,
        input.outputDir,
        "validation-report.md",
        markdown,
      ),
    ];
  }

  return report;
}

export function validationReportMarkdown(
  svgPath: string,
  report: ValidationReport,
): string {
  return reportMarkdown(
    `SVG Validation Report: ${svgPath}`,
    `Passed: ${report.passed ? "yes" : "no"}`,
    [
      { title: "Errors", body: bulletList(report.errors) },
      { title: "Warnings", body: bulletList(report.warnings) },
      { title: "Stats", body: fencedJson(report.stats) },
    ],
  );
}

export function registerValidateSvgTemplateTool(
  server: McpServer,
  workspace: Workspace,
): void {
  server.registerTool(
    "validate_svg_template",
    {
      title: "Validate SVG Template",
      description:
        "Validate an exported SVG against custom SF Symbols readiness heuristics.",
      inputSchema: ValidateSvgTemplateInputSchema,
    },
    (args) =>
      safeTool(async () => {
        const result = await runValidateSvgTemplate(workspace, args);
        return toolSuccess(
          result,
          `SVG validation ${result.passed ? "passed" : "found issues"} with ${result.errors.length} error(s) and ${result.warnings.length} warning(s).`,
        );
      }),
  );
}

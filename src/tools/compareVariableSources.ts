import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { bulletList, fencedJson, reportMarkdown } from "../output/markdown.js";
import { writeJsonArtifact, writeMarkdownArtifact } from "../output/writers.js";
import {
  CompareVariableSourcesInputSchema,
  type CompareVariableSourcesInput,
} from "../schemas/validation.js";
import type { Workspace } from "../workspace.js";
import {
  compareVariableSources,
  type VariableCompatibilityReport,
} from "../svg/compatibility.js";
import { safeTool, toolSuccess } from "./result.js";

export async function runCompareVariableSources(
  workspace: Workspace,
  input: CompareVariableSourcesInput,
): Promise<VariableCompatibilityReport> {
  const report = await compareVariableSources(workspace, input);

  if (input.outputDir) {
    const markdown = reportMarkdown(
      "Variable Source Compatibility Report",
      `Passed: ${report.passed ? "yes" : "no"}. Point compatibility is heuristic.`,
      [
        { title: "Errors", body: bulletList(report.errors) },
        { title: "Warnings", body: bulletList(report.warnings) },
        { title: "Compatibility", body: fencedJson(report.compatibility) },
        { title: "Diffs", body: fencedJson(report.diffs) },
      ],
    );

    report.writtenFiles = [
      await writeJsonArtifact(
        workspace,
        input.outputDir,
        "variable-compatibility-report.json",
        report,
      ),
      await writeMarkdownArtifact(
        workspace,
        input.outputDir,
        "variable-compatibility-report.md",
        markdown,
      ),
    ];
  }

  return report;
}

export function registerCompareVariableSourcesTool(
  server: McpServer,
  workspace: Workspace,
): void {
  server.registerTool(
    "compare_variable_sources",
    {
      title: "Compare Variable Sources",
      description:
        "Compare Ultralight-S, Regular-S, and Black-S SVG sources using conservative heuristics.",
      inputSchema: CompareVariableSourcesInputSchema,
    },
    (args) =>
      safeTool(async () => {
        const result = await runCompareVariableSources(workspace, args);
        return toolSuccess(
          result,
          `Variable source comparison ${result.passed ? "passed" : "found issues"}.`,
        );
      }),
  );
}

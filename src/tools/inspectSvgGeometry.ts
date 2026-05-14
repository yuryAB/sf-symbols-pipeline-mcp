import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fencedJson, reportMarkdown } from "../output/markdown.js";
import { writeJsonArtifact, writeMarkdownArtifact } from "../output/writers.js";
import {
  InspectSvgGeometryInputSchema,
  type InspectSvgGeometryInput,
} from "../schemas/validation.js";
import type { Workspace } from "../workspace.js";
import {
  inspectGeometry,
  parseSvgFromWorkspace,
  type GeometryReport,
} from "../svg/templateAnalysis.js";
import { safeTool, toolSuccess } from "./result.js";

export async function runInspectSvgGeometry(
  workspace: Workspace,
  input: InspectSvgGeometryInput,
): Promise<GeometryReport & { writtenFiles?: string[] }> {
  const document = await parseSvgFromWorkspace(workspace, input.svgPath);
  const report = inspectGeometry(document) as GeometryReport & {
    writtenFiles?: string[];
  };

  if (input.outputDir) {
    const markdown = reportMarkdown(
      `SVG Geometry Report: ${input.svgPath}`,
      `${report.paths.length} path(s), ${report.groups.length} group(s).`,
      [
        { title: "Groups", body: fencedJson(report.groups) },
        { title: "Paths", body: fencedJson(report.paths) },
        {
          title: "Warnings",
          body: report.warnings.map((w) => `- ${w}`).join("\n") || "- None",
        },
      ],
    );

    report.writtenFiles = [
      await writeJsonArtifact(
        workspace,
        input.outputDir,
        "geometry-report.json",
        report,
      ),
      await writeMarkdownArtifact(
        workspace,
        input.outputDir,
        "geometry-report.md",
        markdown,
      ),
    ];
  }

  return report;
}

export function registerInspectSvgGeometryTool(
  server: McpServer,
  workspace: Workspace,
): void {
  server.registerTool(
    "inspect_svg_geometry",
    {
      title: "Inspect SVG Geometry",
      description: "Return a structural map of groups and paths in an SVG.",
      inputSchema: InspectSvgGeometryInputSchema,
    },
    (args) =>
      safeTool(async () => {
        const result = await runInspectSvgGeometry(workspace, args);
        return toolSuccess(
          result,
          `Inspected SVG geometry: ${result.paths.length} path(s), ${result.groups.length} group(s).`,
        );
      }),
  );
}

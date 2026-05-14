import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Workspace } from "../workspace.js";
import { registerCompareVariableSourcesTool } from "./compareVariableSources.js";
import { registerCreateSymbolBriefTool } from "./createSymbolBrief.js";
import { registerCreateXcassetsSymbolSetTool } from "./createXcassetsSymbolSet.js";
import { registerGenerateAnnotationPlanTool } from "./generateAnnotationPlan.js";
import { registerGenerateDrawGuidePlanTool } from "./generateDrawGuidePlan.js";
import { registerGenerateImportChecklistTool } from "./generateImportChecklist.js";
import { registerGenerateMagicReplacePlanTool } from "./generateMagicReplacePlan.js";
import { registerGenerateSwiftUsageTool } from "./generateSwiftUsage.js";
import { registerInspectSvgGeometryTool } from "./inspectSvgGeometry.js";
import { registerValidateSvgTemplateTool } from "./validateSvgTemplate.js";

export function registerTools(server: McpServer, workspace: Workspace): void {
  registerCreateSymbolBriefTool(server, workspace);
  registerValidateSvgTemplateTool(server, workspace);
  registerInspectSvgGeometryTool(server, workspace);
  registerCompareVariableSourcesTool(server, workspace);
  registerGenerateAnnotationPlanTool(server, workspace);
  registerGenerateDrawGuidePlanTool(server, workspace);
  registerGenerateMagicReplacePlanTool(server, workspace);
  registerCreateXcassetsSymbolSetTool(server, workspace);
  registerGenerateSwiftUsageTool(server, workspace);
  registerGenerateImportChecklistTool(server, workspace);
}

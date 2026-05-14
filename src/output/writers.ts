import path from "node:path";
import { Workspace, type WriteFileOptions } from "../workspace.js";
import { toPrettyJson } from "./json.js";

export async function writeJsonArtifact(
  workspace: Workspace,
  outputDir: string,
  filename: string,
  value: unknown,
  options: WriteFileOptions = {},
): Promise<string> {
  return workspace.writeText(
    path.join(outputDir, filename),
    toPrettyJson(value),
    options,
  );
}

export async function writeMarkdownArtifact(
  workspace: Workspace,
  outputDir: string,
  filename: string,
  markdown: string,
  options: WriteFileOptions = {},
): Promise<string> {
  return workspace.writeText(path.join(outputDir, filename), markdown, options);
}

export async function writeArtifacts(
  workspace: Workspace,
  outputDir: string,
  artifacts: Array<{ filename: string; content: string }>,
  options: WriteFileOptions = {},
): Promise<string[]> {
  const writtenFiles: string[] = [];

  for (const artifact of artifacts) {
    writtenFiles.push(
      await workspace.writeText(
        path.join(outputDir, artifact.filename),
        artifact.content,
        options,
      ),
    );
  }

  return writtenFiles;
}

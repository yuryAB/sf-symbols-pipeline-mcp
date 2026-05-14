import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCompareVariableSources } from "../src/tools/compareVariableSources.js";
import { Workspace } from "../src/workspace.js";

async function tempWorkspace(): Promise<{
  workspace: Workspace;
  root: string;
}> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sf-symbols-compare-"));
  return { workspace: new Workspace(root), root };
}

async function writeFixture(
  root: string,
  name: string,
  pathCount: number,
): Promise<void> {
  const paths = Array.from(
    { length: pathCount },
    (_, index) =>
      `<path id="part-${index}" d="M${index} ${index} L9 1 L9 9 Z" />`,
  ).join("");

  await fs.writeFile(
    path.join(root, name),
    `<svg viewBox="0 0 10 10"><g id="Regular-S">${paths}</g></svg>`,
    "utf8",
  );
}

describe("compare_variable_sources", () => {
  it("detects mismatched path counts", async () => {
    const { workspace, root } = await tempWorkspace();
    await writeFixture(root, "ultralight.svg", 1);
    await writeFixture(root, "regular.svg", 2);
    await writeFixture(root, "black.svg", 1);

    const report = await runCompareVariableSources(workspace, {
      ultralightSvgPath: "ultralight.svg",
      regularSvgPath: "regular.svg",
      blackSvgPath: "black.svg",
    });

    expect(report.passed).toBe(false);
    expect(report.compatibility.pathCountMatches).toBe(false);
    expect(report.errors.join(" ")).toMatch(/Path counts differ/);
  });
});

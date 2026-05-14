import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { writeMarkdownArtifact } from "../src/output/writers.js";
import { Workspace } from "../src/workspace.js";

async function tempWorkspace(): Promise<Workspace> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sf-symbols-ws-"));
  return new Workspace(root);
}

describe("Workspace", () => {
  it("prevents escaping the workspace with parent segments", async () => {
    const workspace = await tempWorkspace();

    expect(() => workspace.resolvePath("../outside.svg")).toThrow(
      /escapes SF Symbols workspace/,
    );
  });

  it("prevents escaping the workspace with absolute paths", async () => {
    const workspace = await tempWorkspace();

    expect(() => workspace.resolvePath("/tmp/outside.svg")).toThrow(
      /escapes SF Symbols workspace/,
    );
  });

  it("refuses to overwrite writer output unless allowed", async () => {
    const workspace = await tempWorkspace();

    await writeMarkdownArtifact(workspace, "reports", "report.md", "one");

    await expect(
      writeMarkdownArtifact(workspace, "reports", "report.md", "two"),
    ).rejects.toThrow(/Refusing to overwrite/);

    await expect(
      writeMarkdownArtifact(workspace, "reports", "report.md", "two", {
        overwrite: true,
      }),
    ).resolves.toContain("report.md");
  });
});

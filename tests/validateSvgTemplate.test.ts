import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runValidateSvgTemplate } from "../src/tools/validateSvgTemplate.js";
import { Workspace } from "../src/workspace.js";

async function tempWorkspace(): Promise<{
  workspace: Workspace;
  root: string;
}> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sf-symbols-validate-"));
  return { workspace: new Workspace(root), root };
}

async function writeFixture(
  root: string,
  name: string,
  svg: string,
): Promise<void> {
  await fs.writeFile(path.join(root, name), svg, "utf8");
}

describe("validate_svg_template", () => {
  it("reports raster images as errors", async () => {
    const { workspace, root } = await tempWorkspace();
    await writeFixture(
      root,
      "image.svg",
      `<svg viewBox="0 0 10 10"><image href="photo.png" /></svg>`,
    );

    const report = await runValidateSvgTemplate(workspace, {
      svgPath: "image.svg",
    });

    expect(report.passed).toBe(false);
    expect(report.stats.hasImages).toBe(true);
    expect(report.errors.join(" ")).toMatch(/Raster/);
  });

  it("reports live text as errors", async () => {
    const { workspace, root } = await tempWorkspace();
    await writeFixture(
      root,
      "text.svg",
      `<svg viewBox="0 0 10 10"><text>Hello</text></svg>`,
    );

    const report = await runValidateSvgTemplate(workspace, {
      svgPath: "text.svg",
    });

    expect(report.passed).toBe(false);
    expect(report.stats.hasText).toBe(true);
    expect(report.errors.join(" ")).toMatch(/Live text/);
  });

  it("warns for filters and strokes", async () => {
    const { workspace, root } = await tempWorkspace();
    await writeFixture(
      root,
      "filter-stroke.svg",
      `<svg viewBox="0 0 10 10"><defs><filter id="shadow"><feDropShadow /></filter></defs><g id="Regular-S"><path id="outline" d="M1 1 L9 1 L9 9 Z" stroke="black" fill="none" filter="url(#shadow)" /></g></svg>`,
    );

    const report = await runValidateSvgTemplate(workspace, {
      svgPath: "filter-stroke.svg",
    });

    expect(report.stats.hasFilters).toBe(true);
    expect(report.stats.hasStrokes).toBe(true);
    expect(report.warnings.join(" ")).toMatch(/Filters/);
    expect(report.warnings.join(" ")).toMatch(/Live strokes/);
  });

  it("writes validation reports inside the workspace", async () => {
    const { workspace, root } = await tempWorkspace();
    await writeFixture(
      root,
      "ok.svg",
      `<svg viewBox="0 0 10 10"><g id="Regular-S"><path id="box" d="M1 1 L9 1 L9 9 L1 9 Z" /></g></svg>`,
    );

    const report = await runValidateSvgTemplate(workspace, {
      svgPath: "ok.svg",
      outputDir: "reports",
    });

    expect(report.writtenFiles).toHaveLength(2);
    await expect(
      fs.access(path.join(root, "reports", "validation-report.json")),
    ).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(root, "reports", "validation-report.md")),
    ).resolves.toBeUndefined();
  });
});

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

function finalTemplateSvg(overrides: { body?: string } = {}): string {
  return `<svg viewBox="0 0 3300 2200">
  <g id="Notes">
    <text id="template-version">Template v.7.0</text>
    <text id="descriptive-name">Generated from valid.symbol</text>
  </g>
  <g id="Guides">
    <line id="Baseline-S" x1="0" x2="1" y1="0" y2="0"/>
    <line id="Baseline-M" x1="0" x2="1" y1="0" y2="0"/>
    <line id="Baseline-L" x1="0" x2="1" y1="0" y2="0"/>
    <line id="Capline-S" x1="0" x2="1" y1="0" y2="0"/>
    <line id="Capline-M" x1="0" x2="1" y1="0" y2="0"/>
    <line id="Capline-L" x1="0" x2="1" y1="0" y2="0"/>
    <line id="left-margin-Regular-M" x1="0" x2="0" y1="0" y2="1"/>
    <line id="right-margin-Regular-M" x1="1" x2="1" y1="0" y2="1"/>
  </g>
  <g id="Symbols">
    <g id="Regular-M">
      <path id="Regular-M.valid.layer" d="M1 1 L9 1 L9 9 Z"/>
    </g>
  </g>
  ${overrides.body ?? ""}
</svg>`;
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

  it("accepts Notes metadata text in final SF Symbols template validation", async () => {
    const { workspace, root } = await tempWorkspace();
    await writeFixture(root, "valid.symbol.svg", finalTemplateSvg());

    const report = await runValidateSvgTemplate(workspace, {
      svgPath: "valid.symbol.svg",
      stage: "sf-symbol-template-svg",
    });

    expect(report.passed).toBe(true);
    expect(report.stage).toBe("sf-symbol-template-svg");
    expect(report.template?.metadata.templateVersion).toBe("Template v.7.0");
    expect(report.template?.metadata.descriptiveName).toBe(
      "Generated from valid.symbol",
    );
    expect(report.template?.text.disallowedOutsideNotes).toHaveLength(0);
  });

  it.each([
    [
      "template-version",
      finalTemplateSvg().replace(
        '<text id="template-version">Template v.7.0</text>',
        "",
      ),
      /missing template-version/,
    ],
    [
      "Notes",
      finalTemplateSvg().replace('id="Notes"', 'id="Other"'),
      /missing Notes group/,
    ],
    [
      "Guides",
      finalTemplateSvg().replace('id="Guides"', 'id="Other"'),
      /missing Guides group/,
    ],
    [
      "Symbols",
      finalTemplateSvg().replace('id="Symbols"', 'id="Other"'),
      /missing Symbols group/,
    ],
    [
      "Baseline-L",
      finalTemplateSvg().replace('id="Baseline-L"', 'id="Other"'),
      /missing Baseline-L/,
    ],
    [
      "Capline-L",
      finalTemplateSvg().replace('id="Capline-L"', 'id="Other"'),
      /missing Capline-L/,
    ],
    [
      "left margin",
      finalTemplateSvg().replace('id="left-margin-Regular-M"', 'id="Other"'),
      /missing left-margin-Regular-M/,
    ],
    [
      "right margin",
      finalTemplateSvg().replace('id="right-margin-Regular-M"', 'id="Other"'),
      /missing right-margin-Regular-M/,
    ],
    [
      "target glyph",
      finalTemplateSvg().replace('id="Regular-M"', 'id="Other"'),
      /missing glyph for Regular-M/,
    ],
    [
      "target glyph paths",
      finalTemplateSvg().replace(
        '<path id="Regular-M.valid.layer" d="M1 1 L9 1 L9 9 Z"/>',
        "",
      ),
      /missing glyph paths for Regular-M/,
    ],
    [
      "text outside Notes",
      finalTemplateSvg({ body: '<text id="artwork-label">Bad</text>' }),
      /Live text outside Notes/,
    ],
  ])(
    "reports final template blocker for missing %s",
    async (_name, svg, error) => {
      const { workspace, root } = await tempWorkspace();
      await writeFixture(root, "broken.svg", svg);

      const report = await runValidateSvgTemplate(workspace, {
        svgPath: "broken.svg",
        stage: "sf-symbol-template-svg",
      });

      expect(report.passed).toBe(false);
      expect(report.errors.join(" ")).toMatch(error);
    },
  );

  it("requires variable glyphs only when requested", async () => {
    const { workspace, root } = await tempWorkspace();
    await writeFixture(root, "valid.symbol.svg", finalTemplateSvg());

    const defaultReport = await runValidateSvgTemplate(workspace, {
      svgPath: "valid.symbol.svg",
      stage: "sf-symbol-template-svg",
    });
    const variableReport = await runValidateSvgTemplate(workspace, {
      svgPath: "valid.symbol.svg",
      stage: "sf-symbol-template-svg",
      requiresVariableTemplate: true,
    });

    expect(defaultReport.passed).toBe(true);
    expect(variableReport.passed).toBe(false);
    expect(variableReport.errors.join(" ")).toMatch(
      /missing glyph for Ultralight-S/,
    );
    expect(variableReport.errors.join(" ")).toMatch(
      /missing glyph for Black-S/,
    );
  });

  it("accepts safe SVG 1.1 DOCTYPE exports and rejects ENTITY declarations", async () => {
    const { workspace, root } = await tempWorkspace();
    await writeFixture(
      root,
      "doctype.svg",
      `<!DOCTYPE svg
PUBLIC "-//W3C//DTD SVG 1.1//EN"
       "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${finalTemplateSvg()}`,
    );
    await writeFixture(
      root,
      "entity.svg",
      `<!DOCTYPE svg [<!ENTITY unsafe "bad">]>${finalTemplateSvg()}`,
    );

    const doctypeReport = await runValidateSvgTemplate(workspace, {
      svgPath: "doctype.svg",
      stage: "sf-symbol-template-svg",
    });
    const entityReport = await runValidateSvgTemplate(workspace, {
      svgPath: "entity.svg",
      stage: "sf-symbol-template-svg",
    });

    expect(doctypeReport.passed).toBe(true);
    expect(entityReport.passed).toBe(false);
    expect(entityReport.errors.join(" ")).toMatch(/ENTITY/);
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

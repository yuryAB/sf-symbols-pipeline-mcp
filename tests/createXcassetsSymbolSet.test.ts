import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createXcassetsSymbolSet } from "../src/tools/createXcassetsSymbolSet.js";
import { Workspace } from "../src/workspace.js";

async function tempWorkspace(): Promise<{
  workspace: Workspace;
  root: string;
}> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sf-symbols-xcassets-"));
  return { workspace: new Workspace(root), root };
}

async function writeFixture(
  root: string,
  name: string,
  svg: string,
): Promise<void> {
  await fs.writeFile(path.join(root, name), svg, "utf8");
}

function finalTemplateSvg(overrides: { symbolBody?: string } = {}): string {
  return `<svg viewBox="0 0 3300 2200">
  <g id="Notes">
    <text id="template-version">Template v.7.0</text>
    <text id="descriptive-name">Generated from mark.test</text>
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
    ${overrides.symbolBody ?? '<g id="Regular-M"><path id="Regular-M.layer" d="M1 1 L9 1 L9 9 Z"/></g>'}
  </g>
</svg>`;
}

describe("create_xcassets_symbol_set", () => {
  it("fails invalid source SVGs before writing partial symbolset files", async () => {
    const { workspace, root } = await tempWorkspace();
    await writeFixture(
      root,
      "broken.svg",
      finalTemplateSvg({ symbolBody: '<g id="Other"></g>' }),
    );

    await expect(
      createXcassetsSymbolSet(workspace, {
        symbolName: "mark.test",
        sourceSvgPath: "broken.svg",
        outputDir: "out",
      }),
    ).rejects.toThrow(/missing glyph for Regular-M/);

    await expect(
      fs.access(
        path.join(
          root,
          "out",
          "Assets.xcassets",
          "mark.test.symbolset",
          "Contents.json",
        ),
      ),
    ).rejects.toBeTruthy();
  });

  it("writes Contents.json and SVG when source passes final template validation", async () => {
    const { workspace, root } = await tempWorkspace();
    await writeFixture(root, "valid.svg", finalTemplateSvg());

    const result = await createXcassetsSymbolSet(workspace, {
      symbolName: "mark.test",
      sourceSvgPath: "valid.svg",
      outputDir: "out",
    });

    expect(result.writtenFiles).toHaveLength(2);
    await expect(
      fs.access(
        path.join(
          root,
          "out",
          "Assets.xcassets",
          "mark.test.symbolset",
          "Contents.json",
        ),
      ),
    ).resolves.toBeUndefined();
    await expect(
      fs.access(
        path.join(
          root,
          "out",
          "Assets.xcassets",
          "mark.test.symbolset",
          "mark.test.svg",
        ),
      ),
    ).resolves.toBeUndefined();
  });

  it("keeps no-source scaffolding behavior with a warning", async () => {
    const { workspace, root } = await tempWorkspace();

    const result = await createXcassetsSymbolSet(workspace, {
      symbolName: "mark.test",
      outputDir: "out",
    });

    expect(result.writtenFiles).toHaveLength(1);
    expect(result.copiedSvgPath).toBeUndefined();
    expect(result.warnings.join(" ")).toMatch(/No source SVG was copied/);
    await expect(
      fs.access(
        path.join(
          root,
          "out",
          "Assets.xcassets",
          "mark.test.symbolset",
          "Contents.json",
        ),
      ),
    ).resolves.toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { resolveDesignEnvironment } from "../src/tools/resolveDesignEnvironment.js";

describe("resolve_design_environment", () => {
  it("uses the explicit editor when provided", () => {
    const result = resolveDesignEnvironment({
      symbolName: "marquei.calendar.confirmed",
      userRequestedEditor: "Sketch",
      availableAgentTools: ["Figma MCP"],
    });

    expect(result.recommendedEditor.id).toBe("sketch");
    expect(result.recommendedEditor.name).toBe("Sketch");
    expect(result.recommendedEditor.confidence).toBe("high");
  });

  it("recommends a known vector editor from available agent tools", () => {
    const result = resolveDesignEnvironment({
      symbolName: "marquei.calendar.confirmed",
      availableAgentTools: ["github", "Adobe Illustrator automation"],
    });

    expect(result.recommendedEditor.id).toBe("illustrator");
    expect(result.recommendedEditor.name).toBe("Adobe Illustrator");
    expect(result.recommendedEditor.confidence).toBe("medium");
  });

  it("falls back to a generic SVG vector editor from generic tool hints", () => {
    const result = resolveDesignEnvironment({
      symbolName: "marquei.calendar.confirmed",
      availableAgentTools: ["svg path drawing tool"],
    });

    expect(result.recommendedEditor.id).toBe("generic-svg-vector-editor");
    expect(result.recommendedEditor.confidence).toBe("medium");
  });

  it("asks for user choice or setup help when no editor is clear", () => {
    const result = resolveDesignEnvironment({
      symbolName: "marquei.calendar.confirmed",
    });

    expect(result.recommendedEditor.id).toBe("needs-user-or-setup");
    expect(result.recommendedEditor.confidence).toBe("low");
    expect(result.setupInstructions.join(" ")).toMatch(/choose or install/);
    expect(result.warnings.join(" ")).toMatch(/ask the user/);
  });

  it("always includes official Apple links and template export guidance", () => {
    const result = resolveDesignEnvironment({
      symbolName: "marquei.calendar.confirmed",
      userRequestedEditor: "Figma",
    });

    expect(result.appleOfficialLinks.map((link) => link.url)).toContain(
      "https://developer.apple.com/sf-symbols/",
    );
    expect(result.appleOfficialLinks.map((link) => link.url)).toContain(
      "https://developer.apple.com/design/human-interface-guidelines/sf-symbols",
    );
    expect(result.appleOfficialLinks.map((link) => link.url)).toContain(
      "https://developer.apple.com/documentation/uikit/creating-custom-symbol-images-for-your-app",
    );
    expect(result.setupInstructions.join(" ")).toMatch(
      /export the template for the selected base symbol/,
    );
  });
});

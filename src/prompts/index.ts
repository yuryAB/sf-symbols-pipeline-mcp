import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AuditCustomSymbolPromptSchema,
  auditCustomSymbolPrompt,
} from "./auditCustomSymbol.js";
import {
  CreateCustomSymbolPromptSchema,
  createCustomSymbolPrompt,
} from "./createCustomSymbol.js";
import {
  GenerateIconFamilyPromptSchema,
  generateIconFamilyPrompt,
} from "./generateIconFamily.js";
import {
  PrepareDrawAnimationPromptSchema,
  prepareDrawAnimationPrompt,
} from "./prepareDrawAnimation.js";
import {
  PrepareMagicReplaceFamilyPromptSchema,
  prepareMagicReplaceFamilyPrompt,
} from "./prepareMagicReplaceFamily.js";

type PromptTextFactory<T> = (input: T) => string;

function promptResult(text: string) {
  return {
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text,
        },
      },
    ],
  };
}

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "create_custom_symbol",
    {
      title: "Create Custom Symbol",
      description: "Workflow prompt for creating a custom SF Symbol.",
      argsSchema: CreateCustomSymbolPromptSchema.shape,
    },
    (args) => promptResult(createCustomSymbolPrompt(args)),
  );

  server.registerPrompt(
    "audit_custom_symbol",
    {
      title: "Audit Custom Symbol",
      description:
        "Workflow prompt for auditing an exported custom symbol SVG.",
      argsSchema: AuditCustomSymbolPromptSchema.shape,
    },
    (args) => promptResult(auditCustomSymbolPrompt(args)),
  );

  server.registerPrompt(
    "prepare_draw_animation",
    {
      title: "Prepare Draw Animation",
      description: "Workflow prompt for Draw and Variable Draw preparation.",
      argsSchema: PrepareDrawAnimationPromptSchema.shape,
    },
    (args) => promptResult(prepareDrawAnimationPrompt(args)),
  );

  server.registerPrompt(
    "prepare_magic_replace_family",
    {
      title: "Prepare Magic Replace Family",
      description: "Workflow prompt for replace-friendly symbol families.",
      argsSchema: PrepareMagicReplaceFamilyPromptSchema.shape,
    },
    (args) => promptResult(prepareMagicReplaceFamilyPrompt(args)),
  );

  server.registerPrompt(
    "generate_icon_family",
    {
      title: "Generate Icon Family",
      description: "Workflow prompt for planning a coherent icon family.",
      argsSchema: GenerateIconFamilyPromptSchema.shape,
    },
    (args) => promptResult(generateIconFamilyPrompt(args)),
  );
}

export type { PromptTextFactory };

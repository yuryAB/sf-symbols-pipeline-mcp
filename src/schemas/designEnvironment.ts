import { z } from "zod";
import { SymbolNameSchema } from "./common.js";

export const ResolveDesignEnvironmentInputSchema = z.object({
  symbolName: SymbolNameSchema,
  userRequestedEditor: z.string().min(1).optional(),
  availableAgentTools: z.array(z.string().min(1)).optional(),
  platform: z.string().min(1).optional(),
  needsSetupHelp: z.boolean().optional(),
});

export type ResolveDesignEnvironmentInput = z.infer<
  typeof ResolveDesignEnvironmentInputSchema
>;

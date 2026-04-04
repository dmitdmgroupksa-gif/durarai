// Narrow plugin-sdk surface for the bundled diffs plugin.
// Keep this list additive and scoped to the bundled diffs surface.

export { definePluginEntry } from "./plugin-entry.js";
export type { DurarConfig } from "../config/config.js";
export { resolvePreferredDurarTmpDir } from "../infra/tmp-durar-dir.js";
export type {
  AnyAgentTool,
  DurarPluginApi,
  DurarPluginConfigSchema,
  DurarPluginToolContext,
  PluginLogger,
} from "../plugins/types.js";

import type { DurarConfig } from "./config.js";

export function ensurePluginAllowlisted(cfg: DurarConfig, pluginId: string): DurarConfig {
  const allow = cfg.plugins?.allow;
  if (!Array.isArray(allow) || allow.includes(pluginId)) {
    return cfg;
  }
  return {
    ...cfg,
    plugins: {
      ...cfg.plugins,
      allow: [...allow, pluginId],
    },
  };
}

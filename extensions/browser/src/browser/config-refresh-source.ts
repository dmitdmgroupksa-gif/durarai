import { createConfigIO, getRuntimeConfigSnapshot, type DurarConfig } from "../config/config.js";

export function loadBrowserConfigForRuntimeRefresh(): DurarConfig {
  return getRuntimeConfigSnapshot() ?? createConfigIO().loadConfig();
}

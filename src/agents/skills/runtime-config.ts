import { getRuntimeConfigSnapshot, type DurarConfig } from "../../config/config.js";

export function resolveSkillRuntimeConfig(config?: DurarConfig): DurarConfig | undefined {
  return getRuntimeConfigSnapshot() ?? config;
}

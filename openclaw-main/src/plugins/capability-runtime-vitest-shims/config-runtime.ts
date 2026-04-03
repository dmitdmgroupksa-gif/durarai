import { resolveActiveTalkProviderConfig } from "../../config/talk.js";
import type { DurarConfig } from "../../config/types.js";

export { resolveActiveTalkProviderConfig };

export function getRuntimeConfigSnapshot(): DurarConfig | null {
  return null;
}

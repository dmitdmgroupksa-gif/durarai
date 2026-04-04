import type { DurarConfig } from "../../config/types.js";

export type DirectoryConfigParams = {
  cfg: DurarConfig;
  accountId?: string | null;
  query?: string | null;
  limit?: number | null;
};

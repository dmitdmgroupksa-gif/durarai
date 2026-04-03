import { existsSync } from "node:fs";
import path from "node:path";
import type { DurarConfig } from "../../../config/config.js";
import { resolveBundledPluginWorkspaceSourcePath } from "../../../plugins/bundled-plugin-metadata.js";
import { resolveBundledPluginInstallCommandHint } from "../../../plugins/bundled-sources.js";

export function resolveConfiguredAcpBackendId(cfg: DurarConfig): string {
  return cfg.acp?.backend?.trim() || "acpx";
}

export function resolveAcpInstallCommandHint(cfg: DurarConfig): string {
  const configured = cfg.acp?.runtime?.installCommand?.trim();
  if (configured) {
    return configured;
  }
  const workspaceDir = process.cwd();
  const backendId = resolveConfiguredAcpBackendId(cfg).toLowerCase();
  if (backendId === "acpx") {
    const workspaceLocalPath = resolveBundledPluginWorkspaceSourcePath({
      rootDir: workspaceDir,
      pluginId: backendId,
    });
    if (workspaceLocalPath && existsSync(workspaceLocalPath)) {
      return `Durar plugins install ${workspaceLocalPath}`;
    }
    const bundledInstallHint = resolveBundledPluginInstallCommandHint({
      pluginId: backendId,
      workspaceDir,
    });
    if (bundledInstallHint) {
      const localPath = bundledInstallHint.replace(/^Durar plugins install /u, "");
      const resolvedLocalPath = path.resolve(localPath);
      const relativeToWorkspace = path.relative(workspaceDir, resolvedLocalPath);
      const belongsToWorkspace =
        relativeToWorkspace.length === 0 ||
        (!relativeToWorkspace.startsWith("..") && !path.isAbsolute(relativeToWorkspace));
      if (belongsToWorkspace && existsSync(resolvedLocalPath)) {
        return bundledInstallHint;
      }
    }
    return "Durar plugins install acpx";
  }
  return `Install and enable the plugin that provides ACP backend "${backendId}".`;
}

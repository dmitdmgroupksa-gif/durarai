import { getExecApprovalReplyMetadata } from "Durar/plugin-sdk/approval-runtime";
import { resolveApprovalApprovers } from "Durar/plugin-sdk/approval-runtime";
import type { DurarConfig } from "Durar/plugin-sdk/config-runtime";
import type { DiscordExecApprovalConfig } from "Durar/plugin-sdk/config-runtime";
import type { ReplyPayload } from "Durar/plugin-sdk/reply-runtime";
import { resolveDiscordAccount } from "./accounts.js";
import { parseDiscordTarget } from "./targets.js";

function normalizeDiscordApproverId(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const target = parseDiscordTarget(trimmed);
    return target?.kind === "user" ? target.id : undefined;
  } catch {
    return undefined;
  }
}

function resolveDiscordOwnerApprovers(cfg: DurarConfig): string[] {
  const ownerAllowFrom = cfg.commands?.ownerAllowFrom;
  if (!Array.isArray(ownerAllowFrom) || ownerAllowFrom.length === 0) {
    return [];
  }
  return resolveApprovalApprovers({
    explicit: ownerAllowFrom,
    normalizeApprover: (value) => normalizeDiscordApproverId(String(value)),
  });
}

export function getDiscordExecApprovalApprovers(params: {
  cfg: DurarConfig;
  accountId?: string | null;
  configOverride?: DiscordExecApprovalConfig | null;
}): string[] {
  return resolveApprovalApprovers({
    explicit:
      params.configOverride?.approvers ??
      resolveDiscordAccount(params).config.execApprovals?.approvers ??
      resolveDiscordOwnerApprovers(params.cfg),
    normalizeApprover: (value) => normalizeDiscordApproverId(String(value)),
  });
}

export function isDiscordExecApprovalClientEnabled(params: {
  cfg: DurarConfig;
  accountId?: string | null;
  configOverride?: DiscordExecApprovalConfig | null;
}): boolean {
  const config = params.configOverride ?? resolveDiscordAccount(params).config.execApprovals;
  return Boolean(
    config?.enabled &&
    getDiscordExecApprovalApprovers({
      cfg: params.cfg,
      accountId: params.accountId,
      configOverride: params.configOverride,
    }).length > 0,
  );
}

export function isDiscordExecApprovalApprover(params: {
  cfg: DurarConfig;
  accountId?: string | null;
  senderId?: string | null;
  configOverride?: DiscordExecApprovalConfig | null;
}): boolean {
  const senderId = params.senderId?.trim();
  if (!senderId) {
    return false;
  }
  return getDiscordExecApprovalApprovers({
    cfg: params.cfg,
    accountId: params.accountId,
    configOverride: params.configOverride,
  }).includes(senderId);
}

export function shouldSuppressLocalDiscordExecApprovalPrompt(params: {
  cfg: DurarConfig;
  accountId?: string | null;
  payload: ReplyPayload;
}): boolean {
  return (
    isDiscordExecApprovalClientEnabled(params) &&
    getExecApprovalReplyMetadata(params.payload) !== null
  );
}

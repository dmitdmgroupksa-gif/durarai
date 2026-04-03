import { resolveChannelGroupRequireMention } from "Durar/plugin-sdk/channel-policy";
import type { DurarConfig } from "Durar/plugin-sdk/core";

type GoogleChatGroupContext = {
  cfg: DurarConfig;
  accountId?: string | null;
  groupId?: string | null;
};

export function resolveGoogleChatGroupRequireMention(params: GoogleChatGroupContext): boolean {
  return resolveChannelGroupRequireMention({
    cfg: params.cfg,
    channel: "googlechat",
    groupId: params.groupId,
    accountId: params.accountId,
  });
}

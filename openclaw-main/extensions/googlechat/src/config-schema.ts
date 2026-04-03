import {
  buildChannelConfigSchema,
  GoogleChatConfigSchema,
} from "Durar/plugin-sdk/channel-config-schema";

export const GoogleChatChannelConfigSchema = buildChannelConfigSchema(GoogleChatConfigSchema);

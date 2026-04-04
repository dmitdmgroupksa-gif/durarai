export type { ChannelPlugin, DurarPluginApi, PluginRuntime } from "Durar/plugin-sdk/core";
export type { DurarConfig } from "Durar/plugin-sdk/config-runtime";
export type {
  DurarPluginService,
  DurarPluginServiceContext,
  PluginLogger,
} from "Durar/plugin-sdk/core";
export type { ResolvedQQBotAccount, QQBotAccountConfig } from "./src/types.js";
export { getQQBotRuntime, setQQBotRuntime } from "./src/runtime.js";

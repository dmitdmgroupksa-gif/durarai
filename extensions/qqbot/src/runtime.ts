import type { PluginRuntime } from "Durar/plugin-sdk/core";
import { createPluginRuntimeStore } from "Durar/plugin-sdk/runtime-store";

const { setRuntime: setQQBotRuntime, getRuntime: getQQBotRuntime } =
  createPluginRuntimeStore<PluginRuntime>("QQBot runtime not initialized");
export { getQQBotRuntime, setQQBotRuntime };

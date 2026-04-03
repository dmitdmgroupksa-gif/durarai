import type { PluginRuntime } from "Durar/plugin-sdk/core";
import { createPluginRuntimeStore } from "Durar/plugin-sdk/runtime-store";

const {
  setRuntime: setSlackRuntime,
  clearRuntime: clearSlackRuntime,
  getRuntime: getSlackRuntime,
} = createPluginRuntimeStore<PluginRuntime>("Slack runtime not initialized");
export { clearSlackRuntime, getSlackRuntime, setSlackRuntime };

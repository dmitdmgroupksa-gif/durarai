import type { PluginRuntime } from "Durar/plugin-sdk/plugin-runtime";
import { createPluginRuntimeStore } from "Durar/plugin-sdk/runtime-store";

const { setRuntime: setTlonRuntime, getRuntime: getTlonRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Tlon runtime not initialized");
export { getTlonRuntime, setTlonRuntime };

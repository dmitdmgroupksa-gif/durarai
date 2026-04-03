import type { DurarConfig } from "../config/config.js";
import type { PluginRuntime } from "./runtime/types.js";
import type { DurarPluginApi, PluginLogger } from "./types.js";

export type BuildPluginApiParams = {
  id: string;
  name: string;
  version?: string;
  description?: string;
  source: string;
  rootDir?: string;
  registrationMode: DurarPluginApi["registrationMode"];
  config: DurarConfig;
  pluginConfig?: Record<string, unknown>;
  runtime: PluginRuntime;
  logger: PluginLogger;
  resolvePath: (input: string) => string;
  handlers?: Partial<
    Pick<
      DurarPluginApi,
      | "registerTool"
      | "registerHook"
      | "registerHttpRoute"
      | "registerChannel"
      | "registerGatewayMethod"
      | "registerCli"
      | "registerService"
      | "registerCliBackend"
      | "registerProvider"
      | "registerSpeechProvider"
      | "registerMediaUnderstandingProvider"
      | "registerImageGenerationProvider"
      | "registerWebFetchProvider"
      | "registerWebSearchProvider"
      | "registerInteractiveHandler"
      | "onConversationBindingResolved"
      | "registerCommand"
      | "registerContextEngine"
      | "registerMemoryPromptSection"
      | "registerMemoryFlushPlan"
      | "registerMemoryRuntime"
      | "registerMemoryEmbeddingProvider"
      | "on"
    >
  >;
};

const noopRegisterTool: DurarPluginApi["registerTool"] = () => {};
const noopRegisterHook: DurarPluginApi["registerHook"] = () => {};
const noopRegisterHttpRoute: DurarPluginApi["registerHttpRoute"] = () => {};
const noopRegisterChannel: DurarPluginApi["registerChannel"] = () => {};
const noopRegisterGatewayMethod: DurarPluginApi["registerGatewayMethod"] = () => {};
const noopRegisterCli: DurarPluginApi["registerCli"] = () => {};
const noopRegisterService: DurarPluginApi["registerService"] = () => {};
const noopRegisterCliBackend: DurarPluginApi["registerCliBackend"] = () => {};
const noopRegisterProvider: DurarPluginApi["registerProvider"] = () => {};
const noopRegisterSpeechProvider: DurarPluginApi["registerSpeechProvider"] = () => {};
const noopRegisterMediaUnderstandingProvider: DurarPluginApi["registerMediaUnderstandingProvider"] =
  () => {};
const noopRegisterImageGenerationProvider: DurarPluginApi["registerImageGenerationProvider"] =
  () => {};
const noopRegisterWebFetchProvider: DurarPluginApi["registerWebFetchProvider"] = () => {};
const noopRegisterWebSearchProvider: DurarPluginApi["registerWebSearchProvider"] = () => {};
const noopRegisterInteractiveHandler: DurarPluginApi["registerInteractiveHandler"] = () => {};
const noopOnConversationBindingResolved: DurarPluginApi["onConversationBindingResolved"] =
  () => {};
const noopRegisterCommand: DurarPluginApi["registerCommand"] = () => {};
const noopRegisterContextEngine: DurarPluginApi["registerContextEngine"] = () => {};
const noopRegisterMemoryPromptSection: DurarPluginApi["registerMemoryPromptSection"] = () => {};
const noopRegisterMemoryFlushPlan: DurarPluginApi["registerMemoryFlushPlan"] = () => {};
const noopRegisterMemoryRuntime: DurarPluginApi["registerMemoryRuntime"] = () => {};
const noopRegisterMemoryEmbeddingProvider: DurarPluginApi["registerMemoryEmbeddingProvider"] =
  () => {};
const noopOn: DurarPluginApi["on"] = () => {};

export function buildPluginApi(params: BuildPluginApiParams): DurarPluginApi {
  const handlers = params.handlers ?? {};
  return {
    id: params.id,
    name: params.name,
    version: params.version,
    description: params.description,
    source: params.source,
    rootDir: params.rootDir,
    registrationMode: params.registrationMode,
    config: params.config,
    pluginConfig: params.pluginConfig,
    runtime: params.runtime,
    logger: params.logger,
    registerTool: handlers.registerTool ?? noopRegisterTool,
    registerHook: handlers.registerHook ?? noopRegisterHook,
    registerHttpRoute: handlers.registerHttpRoute ?? noopRegisterHttpRoute,
    registerChannel: handlers.registerChannel ?? noopRegisterChannel,
    registerGatewayMethod: handlers.registerGatewayMethod ?? noopRegisterGatewayMethod,
    registerCli: handlers.registerCli ?? noopRegisterCli,
    registerService: handlers.registerService ?? noopRegisterService,
    registerCliBackend: handlers.registerCliBackend ?? noopRegisterCliBackend,
    registerProvider: handlers.registerProvider ?? noopRegisterProvider,
    registerSpeechProvider: handlers.registerSpeechProvider ?? noopRegisterSpeechProvider,
    registerMediaUnderstandingProvider:
      handlers.registerMediaUnderstandingProvider ?? noopRegisterMediaUnderstandingProvider,
    registerImageGenerationProvider:
      handlers.registerImageGenerationProvider ?? noopRegisterImageGenerationProvider,
    registerWebFetchProvider: handlers.registerWebFetchProvider ?? noopRegisterWebFetchProvider,
    registerWebSearchProvider: handlers.registerWebSearchProvider ?? noopRegisterWebSearchProvider,
    registerInteractiveHandler:
      handlers.registerInteractiveHandler ?? noopRegisterInteractiveHandler,
    onConversationBindingResolved:
      handlers.onConversationBindingResolved ?? noopOnConversationBindingResolved,
    registerCommand: handlers.registerCommand ?? noopRegisterCommand,
    registerContextEngine: handlers.registerContextEngine ?? noopRegisterContextEngine,
    registerMemoryPromptSection:
      handlers.registerMemoryPromptSection ?? noopRegisterMemoryPromptSection,
    registerMemoryFlushPlan: handlers.registerMemoryFlushPlan ?? noopRegisterMemoryFlushPlan,
    registerMemoryRuntime: handlers.registerMemoryRuntime ?? noopRegisterMemoryRuntime,
    registerMemoryEmbeddingProvider:
      handlers.registerMemoryEmbeddingProvider ?? noopRegisterMemoryEmbeddingProvider,
    resolvePath: params.resolvePath,
    on: handlers.on ?? noopOn,
  };
}

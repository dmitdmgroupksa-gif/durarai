import type { OpenClawConfig } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
import { fetchWithTimeout } from "../utils/fetch-timeout.js";
import type { WizardPrompter } from "./prompts.js";

const OLLAMA_DEFAULT_BASE_URL = "http://127.0.0.1:11434";
const OLLAMA_DOWNLOAD_URL = "https://ollama.com/download";
const OLLAMA_PROBE_TIMEOUT_MS = 5000;
const OLLAMA_PULL_TIMEOUT_MS = 5 * 60 * 1000;
const OLLAMA_SUGGESTED_MODELS = ["glm-4.7-flash", "llama3.2", "qwen2.5:3b"];

type OllamaTagModel = {
  name: string;
};

type OllamaTagsResponse = {
  models?: OllamaTagModel[];
};

export type OllamaSetupResult =
  | { status: "configured"; config: OpenClawConfig; model: string }
  | { status: "skipped" };

async function probeOllama(
  baseUrl: string = OLLAMA_DEFAULT_BASE_URL,
): Promise<{ reachable: boolean; models: string[] }> {
  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/api/tags`,
      { method: "GET" },
      OLLAMA_PROBE_TIMEOUT_MS,
    );
    if (!res.ok) {
      return { reachable: false, models: [] };
    }
    const data = (await res.json()) as OllamaTagsResponse;
    const models = (data.models ?? [])
      .filter((m): m is OllamaTagModel => Boolean(m.name))
      .map((m) => m.name);
    return { reachable: true, models };
  } catch {
    return { reachable: false, models: [] };
  }
}

function buildOllamaModelDefinition(modelId: string) {
  const contextWindow = 128000;
  const maxTokens = 8192;
  const isReasoning = /r1|reasoning|think|reason/i.test(modelId);
  return {
    id: modelId,
    name: modelId,
    reasoning: isReasoning,
    input: ["text"] as Array<"text">,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow,
    maxTokens,
  };
}

function applyOllamaProviderConfig(
  cfg: OpenClawConfig,
  baseUrl: string,
  modelNames: string[],
): OpenClawConfig {
  return {
    ...cfg,
    models: {
      ...cfg.models,
      mode: cfg.models?.mode ?? "merge",
      providers: {
        ...cfg.models?.providers,
        ollama: {
          baseUrl,
          api: "ollama",
          apiKey: "OLLAMA_API_KEY",
          models: modelNames.map((name) => buildOllamaModelDefinition(name)),
        },
      },
    },
  };
}

function applyPrimaryModel(cfg: OpenClawConfig, modelRef: string): OpenClawConfig {
  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        model: {
          ...(typeof cfg.agents?.defaults?.model === "object"
            ? cfg.agents.defaults.model
            : undefined),
          primary: modelRef,
        },
      },
    },
  };
}

async function pullOllamaModel(
  baseUrl: string,
  modelName: string,
  prompter: WizardPrompter,
): Promise<boolean> {
  const spinner = prompter.progress(`Downloading ${modelName}...`);
  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/api/pull`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modelName }),
      },
      OLLAMA_PULL_TIMEOUT_MS,
    );
    if (!res.ok) {
      spinner.stop(`Failed to download ${modelName} (HTTP ${res.status})`);
      return false;
    }
    if (!res.body) {
      spinner.stop(`Failed to download ${modelName} (no response body)`);
      return false;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const layers = new Map<string, { total: number; completed: number }>();

    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        try {
          const chunk = JSON.parse(trimmed) as {
            status?: string;
            total?: number;
            completed?: number;
            error?: string;
          };
          if (chunk.error) {
            spinner.stop(`Download failed: ${chunk.error}`);
            return false;
          }
          if (chunk.status && chunk.total && chunk.completed !== undefined) {
            layers.set(chunk.status, { total: chunk.total, completed: chunk.completed });
            let totalSum = 0;
            let completedSum = 0;
            for (const layer of layers.values()) {
              totalSum += layer.total;
              completedSum += layer.completed;
            }
            const percent = totalSum > 0 ? Math.round((completedSum / totalSum) * 100) : 0;
            spinner.update(`Downloading ${modelName} - ${chunk.status} - ${percent}%`);
          } else if (chunk.status) {
            spinner.update(`Downloading ${modelName} - ${chunk.status}`);
          }
        } catch {
          // Ignore malformed streaming lines from Ollama.
        }
      }
    }
    spinner.stop(`Downloaded ${modelName}`);
    return true;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    spinner.stop(`Failed to download ${modelName}: ${reason}`);
    return false;
  }
}

async function waitForOllama(
  prompter: WizardPrompter,
  maxAttempts: number = 60,
): Promise<boolean> {
  const spinner = prompter.progress("Waiting for Ollama to start...");
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const probe = await probeOllama();
    if (probe.reachable) {
      spinner.stop("Ollama is running!");
      return true;
    }
    if (i % 10 === 9) {
      spinner.update(`Still waiting... (${Math.floor((i + 1) * 2)}s)`);
    }
  }
  spinner.stop("Timed out waiting for Ollama");
  return false;
}

export async function setupOllama(params: {
  config: OpenClawConfig;
  prompter: WizardPrompter;
  runtime: RuntimeEnv;
  openUrl: (url: string) => Promise<void>;
}): Promise<OllamaSetupResult> {
  const { config, prompter, openUrl } = params;

  let probe = await probeOllama();

  if (!probe.reachable) {
    await prompter.note(
      [
        "Ollama is not running on this machine.",
        "",
        "Ollama lets you run AI models locally for free.",
      ].join("\n"),
      "Ollama not found",
    );

    const installChoice = await prompter.select({
      message: "What would you like to do?",
      options: [
        {
          value: "download",
          label: "Download Ollama",
          hint: "Opens ollama.com/download",
        },
        {
          value: "skip",
          label: "Skip Ollama",
          hint: "Choose a different provider",
        },
      ],
    });

    if (installChoice === "skip") {
      return { status: "skipped" };
    }

    await openUrl(OLLAMA_DOWNLOAD_URL);
    await prompter.note(
      [
        "Download page opened. After installing Ollama:",
        "1. Start the Ollama application",
        "2. Confirm below and we'll continue automatically",
      ].join("\n"),
      "Install Ollama",
    );

    const confirmed = await prompter.confirm({
      message: "Is Ollama installed and running?",
      initialValue: false,
    });

    if (!confirmed) {
      return { status: "skipped" };
    }

    const started = await waitForOllama(prompter);
    if (!started) {
      await prompter.note(
        [
          "Could not detect Ollama. Make sure it's running and try again.",
          `Default URL: ${OLLAMA_DEFAULT_BASE_URL}`,
        ].join("\n"),
        "Ollama not detected",
      );
      return { status: "skipped" };
    }

    probe = await probeOllama();
  }

  const existingModels = probe.models;

  if (existingModels.length === 0) {
    await prompter.note(
      [
        "Ollama is running but no models are downloaded.",
        "",
        "You need at least one model to use with DurarAI.",
      ].join("\n"),
      "No models found",
    );
  }

  const suggestedOptions = OLLAMA_SUGGESTED_MODELS.map((model) => ({
    value: model,
    label: model,
    hint: existingModels.includes(model) ? "already downloaded" : "will be downloaded",
  }));

  const existingOptions = existingModels
    .filter((m) => !OLLAMA_SUGGESTED_MODELS.includes(m))
    .map((model) => ({
      value: model,
      label: model,
      hint: "already downloaded",
    }));

  const selectedModel = await prompter.select({
    message: "Choose a model to use with DurarAI",
    options: [...suggestedOptions, ...existingOptions],
    initialValue:
      OLLAMA_SUGGESTED_MODELS.find((m) => existingModels.includes(m)) ??
      OLLAMA_SUGGESTED_MODELS[0],
  });

  const needsPull = !existingModels.includes(selectedModel);
  if (needsPull) {
    const pulled = await pullOllamaModel(OLLAMA_DEFAULT_BASE_URL, selectedModel, prompter);
    if (!pulled) {
      params.runtime.error(`Failed to download ${selectedModel}.`);
      return { status: "skipped" };
    }
  }

  const allModels = [...new Set([...existingModels, selectedModel])];
  const modelRef = `ollama/${selectedModel}`;
  let nextConfig = applyOllamaProviderConfig(config, OLLAMA_DEFAULT_BASE_URL, allModels);
  nextConfig = applyPrimaryModel(nextConfig, modelRef);

  await prompter.note(
    [
      `Ollama detected at ${OLLAMA_DEFAULT_BASE_URL}`,
      `Models: ${allModels.join(", ")}`,
      `Default model: ${modelRef}`,
    ].join("\n"),
    "Ollama configured",
  );

  return { status: "configured", config: nextConfig, model: modelRef };
}

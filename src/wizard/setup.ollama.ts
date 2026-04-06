import type { OpenClawConfig } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
import { fetchWithTimeout } from "../utils/fetch-timeout.js";
import type { WizardPrompter } from "./prompts.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const OLLAMA_DEFAULT_BASE_URL = "http://127.0.0.1:11434";
const OLLAMA_DOWNLOAD_URL = "https://ollama.com/download";
const OLLAMA_WINDOWS_INSTALLER_URL =
  "https://ollama.com/download/OllamaSetup.exe";
const OLLAMA_PROBE_TIMEOUT_MS = 5000;
const OLLAMA_PULL_TIMEOUT_MS = 5 * 60 * 1000;
const OLLAMA_INSTALL_TIMEOUT_MS = 5 * 60 * 1000;
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
  maxAttempts: number = 90,
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

async function installOllamaViaWinget(
  prompter: WizardPrompter,
): Promise<{ ok: boolean; error?: string }> {
  const spinner = prompter.progress("Installing Ollama via winget...");
  try {
    const { stdout, stderr } = await execFileAsync(
      "winget",
      ["install", "--id", "Ollama.Ollama", "--silent", "--accept-package-agreements", "--accept-source-agreements"],
      { timeout: OLLAMA_INSTALL_TIMEOUT_MS, shell: true },
    );
    spinner.stop("Ollama installed via winget");
    if (stderr && stderr.toLowerCase().includes("error")) {
      return { ok: false, error: stderr };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ENOENT") || msg.includes("not recognized")) {
      spinner.stop("winget not available");
      return { ok: false, error: "winget not found" };
    }
    spinner.stop(`winget install failed: ${msg}`);
    return { ok: false, error: msg };
  }
}

async function installOllamaViaInstaller(
  prompter: WizardPrompter,
  openUrl: (url: string) => Promise<void>,
): Promise<{ ok: boolean; error?: string }> {
  const spinner = prompter.progress("Downloading Ollama installer...");
  try {
    const res = await fetchWithTimeout(
      OLLAMA_WINDOWS_INSTALLER_URL,
      { method: "GET" },
      60000,
    );
    if (!res.ok) {
      spinner.stop(`Failed to download installer (HTTP ${res.status})`);
      return { ok: false, error: `HTTP ${res.status}` };
    }
    if (!res.body) {
      spinner.stop("No response body from download");
      return { ok: false, error: "no body" };
    }

    const os = await import("node:os");
    const path = await import("node:path");
    const fs = await import("node:fs/promises");
    const tmpDir = os.tmpdir();
    const installerPath = path.join(tmpDir, "OllamaSetup.exe");

    const fileStream = await import("node:fs");
    const writeStream = fileStream.createWriteStream(installerPath);
    const reader = res.body.getReader();

    let downloaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      writeStream.write(value);
      downloaded += value.length;
      spinner.update(`Downloading Ollama... ${(downloaded / (1024 * 1024)).toFixed(1)} MB`);
    }
    writeStream.end();
    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    spinner.stop("Installer downloaded, running silent install...");

    await execFileAsync(installerPath, ["/SILENT", "/NORESTART"], {
      timeout: OLLAMA_INSTALL_TIMEOUT_MS,
      shell: true,
    });

    try {
      await fs.unlink(installerPath);
    } catch {
      // ignore cleanup errors
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    spinner.stop(`Installer failed: ${msg}`);
    return { ok: false, error: msg };
  }
}

async function installOllama(params: {
  prompter: WizardPrompter;
  runtime: RuntimeEnv;
  openUrl: (url: string) => Promise<void>;
}): Promise<{ ok: boolean }> {
  const { prompter, runtime, openUrl } = params;

  const platform = process.platform;

  if (platform === "win32") {
    const wingetResult = await installOllamaViaWinget(prompter);
    if (wingetResult.ok) {
      return { ok: true };
    }

    await prompter.note(
      [
        `winget install failed: ${wingetResult.error}`,
        "Trying direct installer download...",
      ].join("\n"),
      "winget fallback",
    );

    const installerResult = await installOllamaViaInstaller(prompter, openUrl);
    if (installerResult.ok) {
      return { ok: true };
    }

    await prompter.note(
      [
        `Installer download failed: ${installerResult.error}`,
        "",
        "Please install Ollama manually:",
        `1. Open ${OLLAMA_DOWNLOAD_URL}`,
        "2. Download and run the Windows installer",
        "3. Come back here after installation",
      ].join("\n"),
      "Manual install required",
    );

    await openUrl(OLLAMA_DOWNLOAD_URL);
    return { ok: false };
  }

  if (platform === "darwin") {
    await prompter.note(
      [
        "Auto-install is not yet supported on macOS.",
        "",
        "Please install Ollama manually:",
        `1. Open ${OLLAMA_DOWNLOAD_URL}`,
        "2. Download and install Ollama",
        "3. Come back here after installation",
      ].join("\n"),
      "Manual install required",
    );

    await openUrl(OLLAMA_DOWNLOAD_URL);
    return { ok: false };
  }

  if (platform === "linux") {
    const spinner = prompter.progress("Installing Ollama...");
    try {
      await execFileAsync(
        "sh",
        ["-c", "curl -fsSL https://ollama.com/install.sh | sh"],
        {
          timeout: OLLAMA_INSTALL_TIMEOUT_MS,
        },
      );
      spinner.stop("Ollama installed via install script");
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      spinner.stop(`Install script failed: ${msg}`);
      await prompter.note(
        [
          "Auto-install failed. Please install manually:",
          "curl -fsSL https://ollama.com/install.sh | sh",
        ].join("\n"),
        "Manual install required",
      );
      return { ok: false };
    }
  }

  await prompter.note(
    [
      `Auto-install not supported on ${platform}.`,
      `Please visit ${OLLAMA_DOWNLOAD_URL}`,
    ].join("\n"),
    "Unsupported platform",
  );
  return { ok: false };
}

export async function setupOllama(params: {
  config: OpenClawConfig;
  prompter: WizardPrompter;
  runtime: RuntimeEnv;
  openUrl: (url: string) => Promise<void>;
}): Promise<OllamaSetupResult> {
  const { config, prompter, runtime, openUrl } = params;

  let probe = await probeOllama();

  if (!probe.reachable) {
    const installChoice = await prompter.select({
      message: "Ollama is not installed. Install it now?",
      options: [
        {
          value: "install",
          label: "Yes, install Ollama",
          hint: "Automatic install for your system",
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

    const installResult = await installOllama({ prompter, runtime, openUrl });

    if (!installResult.ok) {
      const retryChoice = await prompter.confirm({
        message: "Is Ollama installed now? (we'll check automatically)",
        initialValue: false,
      });

      if (!retryChoice) {
        return { status: "skipped" };
      }
    }

    const started = await waitForOllama(prompter);
    if (!started) {
      await prompter.note(
        [
          "Could not detect Ollama starting up.",
          "Make sure the Ollama application is running.",
          `Default URL: ${OLLAMA_DEFAULT_BASE_URL}`,
        ].join("\n"),
        "Ollama not detected",
      );
      return { status: "skipped" };
    }

    probe = await probeOllama();
    if (!probe.reachable) {
      await prompter.note(
        "Ollama is running but returned no response.",
        "Ollama error",
      );
      return { status: "skipped" };
    }
  }

  const existingModels = probe.models;

  if (existingModels.length === 0) {
    await prompter.note(
      [
        "Ollama is running but no models are downloaded.",
        "",
        "We'll download a model for you automatically.",
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
      runtime.error(`Failed to download ${selectedModel}.`);
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

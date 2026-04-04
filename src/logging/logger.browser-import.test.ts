import { afterEach, describe, expect, it, vi } from "vitest";

type LoggerModule = typeof import("./logger.js");

const originalGetBuiltinModule = (
  process as NodeJS.Process & { getBuiltinModule?: (id: string) => unknown }
).getBuiltinModule;

async function importBrowserSafeLogger(params?: {
  resolvePreferredDurarTmpDir?: ReturnType<typeof vi.fn>;
}): Promise<{
  module: LoggerModule;
  resolvePreferredDurarTmpDir: ReturnType<typeof vi.fn>;
}> {
  vi.resetModules();
  const resolvePreferredDurarTmpDir =
    params?.resolvePreferredDurarTmpDir ??
    vi.fn(() => {
      throw new Error("resolvePreferredDurarTmpDir should not run during browser-safe import");
    });

  vi.doMock("../infra/tmp-Durar-dir.js", async () => {
    const actual = await vi.importActual<typeof import("../infra/tmp-Durar-dir.js")>(
      "../infra/tmp-Durar-dir.js",
    );
    return {
      ...actual,
      resolvePreferredDurarTmpDir,
    };
  });

  Object.defineProperty(process, "getBuiltinModule", {
    configurable: true,
    value: undefined,
  });

  const module = await import("./logger.js");
  return { module, resolvePreferredDurarTmpDir };
}

describe("logging/logger browser-safe import", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("../infra/tmp-Durar-dir.js");
    Object.defineProperty(process, "getBuiltinModule", {
      configurable: true,
      value: originalGetBuiltinModule,
    });
  });

  it("does not resolve the preferred temp dir at import time when node fs is unavailable", async () => {
    const { module, resolvePreferredDurarTmpDir } = await importBrowserSafeLogger();

    expect(resolvePreferredDurarTmpDir).not.toHaveBeenCalled();
    expect(module.DEFAULT_LOG_DIR).toBe("/tmp/Durar");
    expect(module.DEFAULT_LOG_FILE).toBe("/tmp/Durar/Durar.log");
  });

  it("disables file logging when imported in a browser-like environment", async () => {
    const { module, resolvePreferredDurarTmpDir } = await importBrowserSafeLogger();

    expect(module.getResolvedLoggerSettings()).toMatchObject({
      level: "silent",
      file: "/tmp/Durar/Durar.log",
    });
    expect(module.isFileLogLevelEnabled("info")).toBe(false);
    expect(() => module.getLogger().info("browser-safe")).not.toThrow();
    expect(resolvePreferredDurarTmpDir).not.toHaveBeenCalled();
  });
});

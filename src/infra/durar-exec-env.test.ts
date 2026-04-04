import { describe, expect, it } from "vitest";
import {
  ensureDurarExecMarkerOnProcess,
  markDurarExecEnv,
  Durar_CLI_ENV_VALUE,
  Durar_CLI_ENV_VAR,
} from "./durar-exec-env.js";

describe("markDurarExecEnv", () => {
  it("returns a cloned env object with the exec marker set", () => {
    const env = { PATH: "/usr/bin", Durar_CLI: "0" };
    const marked = markDurarExecEnv(env);

    expect(marked).toEqual({
      PATH: "/usr/bin",
      Durar_CLI: Durar_CLI_ENV_VALUE,
    });
    expect(marked).not.toBe(env);
    expect(env.Durar_CLI).toBe("0");
  });
});

describe("ensureDurarExecMarkerOnProcess", () => {
  it.each([
    {
      name: "mutates and returns the provided process env",
      env: { PATH: "/usr/bin" } as NodeJS.ProcessEnv,
    },
    {
      name: "overwrites an existing marker on the provided process env",
      env: { PATH: "/usr/bin", [Durar_CLI_ENV_VAR]: "0" } as NodeJS.ProcessEnv,
    },
  ])("$name", ({ env }) => {
    expect(ensureDurarExecMarkerOnProcess(env)).toBe(env);
    expect(env[Durar_CLI_ENV_VAR]).toBe(Durar_CLI_ENV_VALUE);
  });

  it("defaults to mutating process.env when no env object is provided", () => {
    const previous = process.env[Durar_CLI_ENV_VAR];
    delete process.env[Durar_CLI_ENV_VAR];

    try {
      expect(ensureDurarExecMarkerOnProcess()).toBe(process.env);
      expect(process.env[Durar_CLI_ENV_VAR]).toBe(Durar_CLI_ENV_VALUE);
    } finally {
      if (previous === undefined) {
        delete process.env[Durar_CLI_ENV_VAR];
      } else {
        process.env[Durar_CLI_ENV_VAR] = previous;
      }
    }
  });
});

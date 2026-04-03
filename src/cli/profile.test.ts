import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "Durar",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "Durar", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("leaves gateway --dev for subcommands after leading root options", () => {
    const res = parseCliProfileArgs([
      "node",
      "Durar",
      "--no-color",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual([
      "node",
      "Durar",
      "--no-color",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "Durar", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "Durar", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "Durar", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "Durar", "status"]);
  });

  it("parses interleaved --profile after the command token", () => {
    const res = parseCliProfileArgs(["node", "Durar", "status", "--profile", "work", "--deep"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "Durar", "status", "--deep"]);
  });

  it("parses interleaved --dev after the command token", () => {
    const res = parseCliProfileArgs(["node", "Durar", "status", "--dev"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "Durar", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "Durar", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "Durar", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "Durar", "--profile", "work", "--dev", "status"]],
    ["interleaved after command", ["node", "Durar", "status", "--profile", "work", "--dev"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".Durar-dev");
    expect(env.Durar_PROFILE).toBe("dev");
    expect(env.Durar_STATE_DIR).toBe(expectedStateDir);
    expect(env.Durar_CONFIG_PATH).toBe(path.join(expectedStateDir, "Durar.json"));
    expect(env.Durar_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      Durar_STATE_DIR: "/custom",
      Durar_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.Durar_STATE_DIR).toBe("/custom");
    expect(env.Durar_GATEWAY_PORT).toBe("19099");
    expect(env.Durar_CONFIG_PATH).toBe(path.join("/custom", "Durar.json"));
  });

  it("uses Durar_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      Durar_HOME: "/srv/Durar-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/Durar-home");
    expect(env.Durar_STATE_DIR).toBe(path.join(resolvedHome, ".Durar-work"));
    expect(env.Durar_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".Durar-work", "Durar.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "Durar doctor --fix",
      env: {},
      expected: "Durar doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "Durar doctor --fix",
      env: { Durar_PROFILE: "default" },
      expected: "Durar doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "Durar doctor --fix",
      env: { Durar_PROFILE: "Default" },
      expected: "Durar doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "Durar doctor --fix",
      env: { Durar_PROFILE: "bad profile" },
      expected: "Durar doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "Durar --profile work doctor --fix",
      env: { Durar_PROFILE: "work" },
      expected: "Durar --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "Durar --dev doctor",
      env: { Durar_PROFILE: "dev" },
      expected: "Durar --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("Durar doctor --fix", { Durar_PROFILE: "work" })).toBe(
      "Durar --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("Durar doctor --fix", { Durar_PROFILE: "  jbDurar  " })).toBe(
      "Durar --profile jbDurar doctor --fix",
    );
  });

  it("handles command with no args after Durar", () => {
    expect(formatCliCommand("Durar", { Durar_PROFILE: "test" })).toBe(
      "Durar --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm Durar doctor", { Durar_PROFILE: "work" })).toBe(
      "pnpm Durar --profile work doctor",
    );
  });

  it("inserts --container when a container hint is set", () => {
    expect(
      formatCliCommand("Durar gateway status --deep", { Durar_CONTAINER_HINT: "demo" }),
    ).toBe("Durar --container demo gateway status --deep");
  });

  it("preserves both --container and --profile hints", () => {
    expect(
      formatCliCommand("Durar doctor", {
        Durar_CONTAINER_HINT: "demo",
        Durar_PROFILE: "work",
      }),
    ).toBe("Durar --container demo doctor");
  });

  it("does not prepend --container for update commands", () => {
    expect(formatCliCommand("Durar update", { Durar_CONTAINER_HINT: "demo" })).toBe(
      "Durar update",
    );
    expect(
      formatCliCommand("pnpm Durar update --channel beta", { Durar_CONTAINER_HINT: "demo" }),
    ).toBe("pnpm Durar update --channel beta");
  });
});

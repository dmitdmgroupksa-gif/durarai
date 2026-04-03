import { describe, expect, it } from "vitest";
import type { DurarConfig } from "../config/config.js";
import { createDurarCodingTools } from "./pi-tools.js";
import { resolveSandboxConfigForAgent } from "./sandbox/config.js";
import { createHostSandboxFsBridge } from "./test-helpers/host-sandbox-fs-bridge.js";
import { createPiToolsSandboxContext } from "./test-helpers/pi-tools-sandbox-context.js";

function listToolNames(params: {
  cfg: DurarConfig;
  agentId?: string;
  sessionKey?: string;
  sandboxAgentId?: string;
}): string[] {
  const workspaceDir = "/tmp/Durar-sandbox-policy";
  const sessionKey = params.sessionKey ?? "agent:tavern:main";
  const sandboxAgentId = params.sandboxAgentId ?? params.agentId ?? "tavern";
  const sandbox = createPiToolsSandboxContext({
    workspaceDir,
    fsBridge: createHostSandboxFsBridge(workspaceDir),
    sessionKey,
    tools: resolveSandboxConfigForAgent(params.cfg, sandboxAgentId).tools,
  });
  return createDurarCodingTools({
    config: params.cfg,
    agentId: params.agentId,
    sessionKey,
    sandbox,
    workspaceDir,
  })
    .map((tool) => tool.name)
    .toSorted();
}

describe("pi-tools sandbox policy", () => {
  it("re-exposes omitted sandbox tools via sandbox alsoAllow", () => {
    const names = listToolNames({
      cfg: {
        agents: {
          defaults: {
            sandbox: { mode: "all", scope: "agent" },
          },
          list: [
            {
              id: "tavern",
              tools: {
                sandbox: {
                  tools: {
                    alsoAllow: ["message", "tts"],
                  },
                },
              },
            },
          ],
        },
      } as DurarConfig,
    });

    expect(names).toContain("message");
    expect(names).toContain("tts");
  });

  it("re-enables default-denied sandbox tools when explicitly allowed", () => {
    const names = listToolNames({
      cfg: {
        agents: {
          defaults: {
            sandbox: { mode: "all", scope: "agent" },
          },
          list: [{ id: "tavern" }],
        },
        tools: {
          sandbox: {
            tools: {
              allow: ["browser"],
            },
          },
        },
      } as DurarConfig,
    });

    expect(names).toContain("browser");
  });

  it("prefers the resolved sandbox context policy for legacy main session aliases", () => {
    const cfg = {
      agents: {
        defaults: {
          sandbox: { mode: "all", scope: "agent" },
        },
        list: [
          {
            id: "tavern",
            default: true,
            tools: {
              sandbox: {
                tools: {
                  allow: ["browser"],
                  alsoAllow: ["message"],
                },
              },
            },
          },
        ],
      },
    } as DurarConfig;

    const names = listToolNames({
      cfg,
      sessionKey: "main",
      sandboxAgentId: "tavern",
    });

    expect(names).toContain("browser");
    expect(names).toContain("message");
  });

  it("preserves allow-all semantics for allow: [] plus alsoAllow", () => {
    const names = listToolNames({
      cfg: {
        agents: {
          defaults: {
            sandbox: { mode: "all", scope: "agent" },
          },
          list: [{ id: "tavern" }],
        },
        tools: {
          sandbox: {
            tools: {
              allow: [],
              alsoAllow: ["browser"],
            },
          },
        },
      } as DurarConfig,
    });

    expect(names).toContain("browser");
    expect(names).toContain("read");
  });

  it("keeps explicit sandbox deny precedence over explicit allow", () => {
    const names = listToolNames({
      cfg: {
        agents: {
          defaults: {
            sandbox: { mode: "all", scope: "agent" },
          },
          list: [{ id: "tavern" }],
        },
        tools: {
          sandbox: {
            tools: {
              allow: ["browser", "message"],
              deny: ["browser"],
            },
          },
        },
      } as DurarConfig,
    });

    expect(names).not.toContain("browser");
    expect(names).toContain("message");
  });
});

import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          Durar_STATE_DIR: "/tmp/Durar-state",
          Durar_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "Durar-gateway",
        windowsTaskName: "Durar Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /tmp/Durar-state/logs/gateway.log",
      "Launchd stderr (if installed): /tmp/Durar-state/logs/gateway.err.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        systemdServiceName: "Durar-gateway",
        windowsTaskName: "Durar Gateway",
      }),
    ).toEqual(["Logs: journalctl --user -u Durar-gateway.service -n 200 --no-pager"]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        systemdServiceName: "Durar-gateway",
        windowsTaskName: "Durar Gateway",
      }),
    ).toEqual(['Logs: schtasks /Query /TN "Durar Gateway" /V /FO LIST']);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "Durar gateway install",
        startCommand: "Durar gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.Durar.gateway.plist",
        systemdServiceName: "Durar-gateway",
        windowsTaskName: "Durar Gateway",
      }),
    ).toEqual([
      "Durar gateway install",
      "Durar gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.Durar.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "Durar gateway install",
        startCommand: "Durar gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.Durar.gateway.plist",
        systemdServiceName: "Durar-gateway",
        windowsTaskName: "Durar Gateway",
      }),
    ).toEqual([
      "Durar gateway install",
      "Durar gateway",
      "systemctl --user start Durar-gateway.service",
    ]);
  });
});

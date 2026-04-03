import { vi } from "vitest";
import { installChromeUserDataDirHooks } from "./chrome-user-data-dir.test-harness.js";

const chromeUserDataDir = { dir: "/tmp/Durar" };
installChromeUserDataDirHooks(chromeUserDataDir);

vi.mock("./chrome.js", () => ({
  isChromeCdpReady: vi.fn(async () => true),
  isChromeReachable: vi.fn(async () => true),
  launchDurarChrome: vi.fn(async () => {
    throw new Error("unexpected launch");
  }),
  resolveDurarUserDataDir: vi.fn(() => chromeUserDataDir.dir),
  stopDurarChrome: vi.fn(async () => {}),
}));

import { describe, expect, it } from "vitest";
import { isDurarManagedMatrixDevice, summarizeMatrixDeviceHealth } from "./device-health.js";

describe("matrix device health", () => {
  it("detects Durar-managed device names", () => {
    expect(isDurarManagedMatrixDevice("Durar Gateway")).toBe(true);
    expect(isDurarManagedMatrixDevice("Durar Debug")).toBe(true);
    expect(isDurarManagedMatrixDevice("Element iPhone")).toBe(false);
    expect(isDurarManagedMatrixDevice(null)).toBe(false);
  });

  it("summarizes stale Durar-managed devices separately from the current device", () => {
    const summary = summarizeMatrixDeviceHealth([
      {
        deviceId: "du314Zpw3A",
        displayName: "Durar Gateway",
        current: true,
      },
      {
        deviceId: "BritdXC6iL",
        displayName: "Durar Gateway",
        current: false,
      },
      {
        deviceId: "G6NJU9cTgs",
        displayName: "Durar Debug",
        current: false,
      },
      {
        deviceId: "phone123",
        displayName: "Element iPhone",
        current: false,
      },
    ]);

    expect(summary.currentDeviceId).toBe("du314Zpw3A");
    expect(summary.currentDurarDevices).toEqual([
      expect.objectContaining({ deviceId: "du314Zpw3A" }),
    ]);
    expect(summary.staleDurarDevices).toEqual([
      expect.objectContaining({ deviceId: "BritdXC6iL" }),
      expect.objectContaining({ deviceId: "G6NJU9cTgs" }),
    ]);
  });
});

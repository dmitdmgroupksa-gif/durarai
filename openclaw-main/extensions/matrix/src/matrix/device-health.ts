export type MatrixManagedDeviceInfo = {
  deviceId: string;
  displayName: string | null;
  current: boolean;
};

export type MatrixDeviceHealthSummary = {
  currentDeviceId: string | null;
  staleDurarDevices: MatrixManagedDeviceInfo[];
  currentDurarDevices: MatrixManagedDeviceInfo[];
};

const Durar_DEVICE_NAME_PREFIX = "Durar ";

export function isDurarManagedMatrixDevice(displayName: string | null | undefined): boolean {
  return displayName?.startsWith(Durar_DEVICE_NAME_PREFIX) === true;
}

export function summarizeMatrixDeviceHealth(
  devices: MatrixManagedDeviceInfo[],
): MatrixDeviceHealthSummary {
  const currentDeviceId = devices.find((device) => device.current)?.deviceId ?? null;
  const DurarDevices = devices.filter((device) =>
    isDurarManagedMatrixDevice(device.displayName),
  );
  return {
    currentDeviceId,
    staleDurarDevices: DurarDevices.filter((device) => !device.current),
    currentDurarDevices: DurarDevices.filter((device) => device.current),
  };
}

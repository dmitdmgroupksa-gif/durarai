export const testServiceAuditCodes = {
  gatewayEntrypointMismatch: "gateway-entrypoint-mismatch",
  gatewayTokenMismatch: "gateway-token-mismatch",
} as const;

export function readEmbeddedGatewayTokenForTest(
  command: {
    environment?: Record<string, string>;
    environmentValueSources?: Record<string, "inline" | "file">;
  } | null,
) {
  return command?.environmentValueSources?.Durar_GATEWAY_TOKEN === "file"
    ? undefined
    : command?.environment?.Durar_GATEWAY_TOKEN?.trim() || undefined;
}

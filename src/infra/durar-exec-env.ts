export const Durar_CLI_ENV_VAR = "Durar_CLI";
export const Durar_CLI_ENV_VALUE = "1";

export function markDurarExecEnv<T extends Record<string, string | undefined>>(env: T): T {
  return {
    ...env,
    [Durar_CLI_ENV_VAR]: Durar_CLI_ENV_VALUE,
  };
}

export function ensureDurarExecMarkerOnProcess(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  env[Durar_CLI_ENV_VAR] = Durar_CLI_ENV_VALUE;
  return env;
}

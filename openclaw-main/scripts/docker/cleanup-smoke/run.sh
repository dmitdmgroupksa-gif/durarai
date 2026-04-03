#!/usr/bin/env bash
set -euo pipefail

cd /repo

export Durar_STATE_DIR="/tmp/Durar-test"
export Durar_CONFIG_PATH="${Durar_STATE_DIR}/Durar.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${Durar_STATE_DIR}/credentials"
mkdir -p "${Durar_STATE_DIR}/agents/main/sessions"
echo '{}' >"${Durar_CONFIG_PATH}"
echo 'creds' >"${Durar_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${Durar_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm Durar reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${Durar_CONFIG_PATH}"
test ! -d "${Durar_STATE_DIR}/credentials"
test ! -d "${Durar_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${Durar_STATE_DIR}/credentials"
echo '{}' >"${Durar_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm Durar uninstall --state --yes --non-interactive

test ! -d "${Durar_STATE_DIR}"

echo "OK"

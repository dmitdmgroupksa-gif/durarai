---
summary: "Uninstall Durar completely (CLI, service, state, workspace)"
read_when:
  - You want to remove Durar from a machine
  - The gateway service is still running after uninstall
title: "Uninstall"
---

# Uninstall

Two paths:

- **Easy path** if `Durar` is still installed.
- **Manual service removal** if the CLI is gone but the service is still running.

## Easy path (CLI still installed)

Recommended: use the built-in uninstaller:

```bash
Durar uninstall
```

Non-interactive (automation / npx):

```bash
Durar uninstall --all --yes --non-interactive
npx -y Durar uninstall --all --yes --non-interactive
```

Manual steps (same result):

1. Stop the gateway service:

```bash
Durar gateway stop
```

2. Uninstall the gateway service (launchd/systemd/schtasks):

```bash
Durar gateway uninstall
```

3. Delete state + config:

```bash
rm -rf "${Durar_STATE_DIR:-$HOME/.Durar}"
```

If you set `Durar_CONFIG_PATH` to a custom location outside the state dir, delete that file too.

4. Delete your workspace (optional, removes agent files):

```bash
rm -rf ~/.Durar/workspace
```

5. Remove the CLI install (pick the one you used):

```bash
npm rm -g Durar
pnpm remove -g Durar
bun remove -g Durar
```

6. If you installed the macOS app:

```bash
rm -rf /Applications/Durar.app
```

Notes:

- If you used profiles (`--profile` / `Durar_PROFILE`), repeat step 3 for each state dir (defaults are `~/.Durar-<profile>`).
- In remote mode, the state dir lives on the **gateway host**, so run steps 1-4 there too.

## Manual service removal (CLI not installed)

Use this if the gateway service keeps running but `Durar` is missing.

### macOS (launchd)

Default label is `ai.Durar.gateway` (or `ai.Durar.<profile>`; legacy `com.Durar.*` may still exist):

```bash
launchctl bootout gui/$UID/ai.Durar.gateway
rm -f ~/Library/LaunchAgents/ai.Durar.gateway.plist
```

If you used a profile, replace the label and plist name with `ai.Durar.<profile>`. Remove any legacy `com.Durar.*` plists if present.

### Linux (systemd user unit)

Default unit name is `Durar-gateway.service` (or `Durar-gateway-<profile>.service`):

```bash
systemctl --user disable --now Durar-gateway.service
rm -f ~/.config/systemd/user/Durar-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Default task name is `Durar Gateway` (or `Durar Gateway (<profile>)`).
The task script lives under your state dir.

```powershell
schtasks /Delete /F /TN "Durar Gateway"
Remove-Item -Force "$env:USERPROFILE\.Durar\gateway.cmd"
```

If you used a profile, delete the matching task name and `~\.Durar-<profile>\gateway.cmd`.

## Normal install vs source checkout

### Normal install (install.sh / npm / pnpm / bun)

If you used `https://Durar.ai/install.sh` or `install.ps1`, the CLI was installed with `npm install -g Durar@latest`.
Remove it with `npm rm -g Durar` (or `pnpm remove -g` / `bun remove -g` if you installed that way).

### Source checkout (git clone)

If you run from a repo checkout (`git clone` + `Durar ...` / `bun run Durar ...`):

1. Uninstall the gateway service **before** deleting the repo (use the easy path above or manual service removal).
2. Delete the repo directory.
3. Remove state + workspace as shown above.

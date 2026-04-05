---
summary: "CLI reference for `Durar browser` (lifecycle, profiles, tabs, actions, state, and debugging)"
read_when:
  - You use `Durar browser` and want examples for common tasks
  - You want to control a browser running on another machine via a node host
  - You want to attach to your local signed-in Chrome via Chrome MCP
title: "browser"
---

# `Durar browser`

Manage Durar's browser control surface and run browser actions (lifecycle, profiles, tabs, snapshots, screenshots, navigation, input, state emulation, and debugging).

Related:

- Browser tool + API: [Browser tool](/tools/browser)

## Common flags

- `--url <gatewayWsUrl>`: Gateway WebSocket URL (defaults to config).
- `--token <token>`: Gateway token (if required).
- `--timeout <ms>`: request timeout (ms).
- `--expect-final`: wait for a final Gateway response.
- `--browser-profile <name>`: choose a browser profile (default from config).
- `--json`: machine-readable output (where supported).

## Quick start (local)

```bash
Durar browser profiles
Durar browser --browser-profile Durar start
Durar browser --browser-profile Durar open https://example.com
Durar browser --browser-profile Durar snapshot
```

## Lifecycle

```bash
Durar browser status
Durar browser start
Durar browser stop
Durar browser --browser-profile Durar reset-profile
```

Notes:

- For `attachOnly` and remote CDP profiles, `Durar browser stop` closes the
  active control session and clears temporary emulation overrides even when
  Durar did not launch the browser process itself.
- For local managed profiles, `Durar browser stop` stops the spawned browser
  process.

## If the command is missing

If `Durar browser` is an unknown command, check `plugins.allow` in
`~/.Durar/Durar.json`.

When `plugins.allow` is present, the bundled browser plugin must be listed
explicitly:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` does not restore the CLI subcommand when the plugin
allowlist excludes `browser`.

Related: [Browser tool](/tools/browser#missing-browser-command-or-tool)

## Profiles

Profiles are named browser routing configs. In practice:

- `Durar`: launches or attaches to a dedicated Durar-managed Chrome instance (isolated user data dir).
- `user`: controls your existing signed-in Chrome session via Chrome DevTools MCP.
- custom CDP profiles: point at a local or remote CDP endpoint.

```bash
Durar browser profiles
Durar browser create-profile --name work --color "#FF5A36"
Durar browser create-profile --name chrome-live --driver existing-session
Durar browser create-profile --name remote --cdp-url https://browser-host.example.com
Durar browser delete-profile --name work
```

Use a specific profile:

```bash
Durar browser --browser-profile work tabs
```

## Tabs

```bash
Durar browser tabs
Durar browser tab new
Durar browser tab select 2
Durar browser tab close 2
Durar browser open https://docs.Durar.ai
Durar browser focus <targetId>
Durar browser close <targetId>
```

## Snapshot / screenshot / actions

Snapshot:

```bash
Durar browser snapshot
```

Screenshot:

```bash
Durar browser screenshot
Durar browser screenshot --full-page
Durar browser screenshot --ref e12
```

Notes:

- `--full-page` is for page captures only; it cannot be combined with `--ref`
  or `--element`.
- `existing-session` / `user` profiles support page screenshots and `--ref`
  screenshots from snapshot output, but not CSS `--element` screenshots.

Navigate/click/type (ref-based UI automation):

```bash
Durar browser navigate https://example.com
Durar browser click <ref>
Durar browser type <ref> "hello"
Durar browser press Enter
Durar browser hover <ref>
Durar browser scrollintoview <ref>
Durar browser drag <startRef> <endRef>
Durar browser select <ref> OptionA OptionB
Durar browser fill --fields '[{"ref":"1","value":"Ada"}]'
Durar browser wait --text "Done"
Durar browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

File + dialog helpers:

```bash
Durar browser upload /tmp/Durar/uploads/file.pdf --ref <ref>
Durar browser waitfordownload
Durar browser download <ref> report.pdf
Durar browser dialog --accept
```

## State and storage

Viewport + emulation:

```bash
Durar browser resize 1280 720
Durar browser set viewport 1280 720
Durar browser set offline on
Durar browser set media dark
Durar browser set timezone Europe/London
Durar browser set locale en-GB
Durar browser set geo 51.5074 -0.1278 --accuracy 25
Durar browser set device "iPhone 14"
Durar browser set headers '{"x-test":"1"}'
Durar browser set credentials myuser mypass
```

Cookies + storage:

```bash
Durar browser cookies
Durar browser cookies set session abc123 --url https://example.com
Durar browser cookies clear
Durar browser storage local get
Durar browser storage local set token abc123
Durar browser storage session clear
```

## Debugging

```bash
Durar browser console --level error
Durar browser pdf
Durar browser responsebody "**/api"
Durar browser highlight <ref>
Durar browser errors --clear
Durar browser requests --filter api
Durar browser trace start
Durar browser trace stop --out trace.zip
```

## Existing Chrome via MCP

Use the built-in `user` profile, or create your own `existing-session` profile:

```bash
Durar browser --browser-profile user tabs
Durar browser create-profile --name chrome-live --driver existing-session
Durar browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
Durar browser --browser-profile chrome-live tabs
```

This path is host-only. For Docker, headless servers, Browserless, or other remote setups, use a CDP profile instead.

Current existing-session limits:

- snapshot-driven actions use refs, not CSS selectors
- `click` is left-click only
- `type` does not support `slowly=true`
- `press` does not support `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, and `evaluate` reject
  per-call timeout overrides
- `select` supports one value only
- `wait --load networkidle` is not supported
- file uploads require `--ref` / `--input-ref`, do not support CSS
  `--element`, and currently support one file at a time
- dialog hooks do not support `--timeout`
- screenshots support page captures and `--ref`, but not CSS `--element`
- `responsebody`, download interception, PDF export, and batch actions still
  require a managed browser or raw CDP profile

## Remote browser control (node host proxy)

If the Gateway runs on a different machine than the browser, run a **node host** on the machine that has Chrome/Brave/Edge/Chromium. The Gateway will proxy browser actions to that node (no separate browser control server required).

Use `gateway.nodes.browser.mode` to control auto-routing and `gateway.nodes.browser.node` to pin a specific node if multiple are connected.

Security + remote setup: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)

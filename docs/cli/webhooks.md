---
summary: "CLI reference for `Durar webhooks` (webhook helpers + Gmail Pub/Sub)"
read_when:
  - You want to wire Gmail Pub/Sub events into Durar
  - You want webhook helper commands
title: "webhooks"
---

# `Durar webhooks`

Webhook helpers and integrations (Gmail Pub/Sub, webhook helpers).

Related:

- Webhooks: [Webhooks](/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
Durar webhooks gmail setup --account you@example.com
Durar webhooks gmail run
```

### `webhooks gmail setup`

Configure Gmail watch, Pub/Sub, and Durar webhook delivery.

Required:

- `--account <email>`

Options:

- `--project <id>`
- `--topic <name>`
- `--subscription <name>`
- `--label <label>`
- `--hook-url <url>`
- `--hook-token <token>`
- `--push-token <token>`
- `--bind <host>`
- `--port <port>`
- `--path <path>`
- `--include-body`
- `--max-bytes <n>`
- `--renew-minutes <n>`
- `--tailscale <funnel|serve|off>`
- `--tailscale-path <path>`
- `--tailscale-target <target>`
- `--push-endpoint <url>`
- `--json`

Examples:

```bash
Durar webhooks gmail setup --account you@example.com
Durar webhooks gmail setup --account you@example.com --project my-gcp-project --json
Durar webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

Run `gog watch serve` plus the watch auto-renew loop.

Options:

- `--account <email>`
- `--topic <topic>`
- `--subscription <name>`
- `--label <label>`
- `--hook-url <url>`
- `--hook-token <token>`
- `--push-token <token>`
- `--bind <host>`
- `--port <port>`
- `--path <path>`
- `--include-body`
- `--max-bytes <n>`
- `--renew-minutes <n>`
- `--tailscale <funnel|serve|off>`
- `--tailscale-path <path>`
- `--tailscale-target <target>`

Example:

```bash
Durar webhooks gmail run --account you@example.com
```

See [Gmail Pub/Sub documentation](/automation/cron-jobs#gmail-pubsub-integration) for the end-to-end setup flow and operational details.

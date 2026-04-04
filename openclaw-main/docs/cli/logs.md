---
summary: "CLI reference for `Durar logs` (tail gateway logs via RPC)"
read_when:
  - You need to tail Gateway logs remotely (without SSH)
  - You want JSON log lines for tooling
title: "logs"
---

# `Durar logs`

Tail Gateway file logs over RPC (works in remote mode).

Related:

- Logging overview: [Logging](/logging)

## Examples

```bash
Durar logs
Durar logs --follow
Durar logs --json
Durar logs --limit 500
Durar logs --local-time
Durar logs --follow --local-time
```

Use `--local-time` to render timestamps in your local timezone.

---
summary: "CLI reference for `Durar uninstall` (remove gateway service + local data)"
read_when:
  - You want to remove the gateway service and/or local state
  - You want a dry-run first
title: "uninstall"
---

# `Durar uninstall`

Uninstall the gateway service + local data (CLI remains).

```bash
Durar backup create
Durar uninstall
Durar uninstall --all --yes
Durar uninstall --dry-run
```

Run `Durar backup create` first if you want a restorable snapshot before removing state or workspaces.

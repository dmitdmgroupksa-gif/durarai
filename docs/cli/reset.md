---
summary: "CLI reference for `Durar reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `Durar reset`

Reset local config/state (keeps the CLI installed).

```bash
Durar backup create
Durar reset
Durar reset --dry-run
Durar reset --scope config+creds+sessions --yes --non-interactive
```

Run `Durar backup create` first if you want a restorable snapshot before removing local state.

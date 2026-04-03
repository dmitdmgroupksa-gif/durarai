---
summary: "CLI reference for `Durar flows` commands"
read_when:
  - You want to list, inspect, or cancel TaskFlow flows from the CLI
  - You encounter Durar flows in release notes or docs
title: "flows"
---

# `Durar flows`

Inspect and manage [TaskFlow](/automation/taskflow) flows from the command line.

## Commands

### `flows list`

```bash
Durar flows list [--json]
```

List active and recent flows with status and sync mode.

### `flows show`

```bash
Durar flows show <lookup>
```

Show details for a specific flow by flow id or lookup key, including state, revision history, and associated tasks.

### `flows cancel`

```bash
Durar flows cancel <lookup>
```

Cancel a running flow and its active tasks.

## Related

- [TaskFlow](/automation/taskflow) — flow orchestration overview
- [Background Tasks](/automation/tasks) — the detached work ledger
- [CLI reference](/cli/index) — full command tree

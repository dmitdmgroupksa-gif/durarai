---
summary: "TaskFlow flow orchestration layer above background tasks"
read_when:
  - You want to understand how TaskFlow relates to background tasks
  - You encounter TaskFlow or Durar flows in release notes or docs
  - You want to inspect or manage durable flow state
title: "TaskFlow"
---

# TaskFlow

TaskFlow is the flow orchestration substrate that sits above [background tasks](/automation/tasks). It manages durable multi-step flows with their own state, revision tracking, and sync semantics while individual tasks remain the unit of detached work.

## Sync modes

TaskFlow supports two sync modes:

- **Managed** — TaskFlow owns the lifecycle end-to-end, creating and driving tasks as flow steps progress.
- **Mirrored** — TaskFlow observes externally created tasks and keeps flow state in sync without taking ownership of task creation.

## Durable state and revision tracking

Each flow persists its own state and tracks revisions so progress survives gateway restarts. Revision tracking enables conflict detection when multiple sources attempt to advance the same flow.

## CLI commands

```bash
# List active and recent flows
Durar flows list

# Show details for a specific flow
Durar flows show <lookup>

# Cancel a running flow
Durar flows cancel <lookup>
```

- `Durar flows list` — shows tracked flows with status and sync mode
- `Durar flows show <lookup>` — inspect one flow by flow id or lookup key
- `Durar flows cancel <lookup>` — cancel a running flow and its active tasks

## How flows relate to tasks

Flows coordinate tasks, not replace them. A single flow may drive multiple background tasks over its lifetime. Use `Durar tasks` to inspect individual task records and `Durar flows` to inspect the orchestrating flow.

## Related

- [Background Tasks](/automation/tasks) — the detached work ledger that flows coordinate
- [CLI: flows](/cli/flows) — CLI command reference for `Durar flows`
- [Automation Overview](/automation) — all automation mechanisms at a glance
- [Cron Jobs](/automation/cron-jobs) — scheduled jobs that may feed into flows

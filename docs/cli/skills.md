---
summary: "CLI reference for `Durar skills` (search/install/update/list/info/check)"
read_when:
  - You want to see which skills are available and ready to run
  - You want to search, install, or update skills from Durar Gateway
  - You want to debug missing binaries/env/config for skills
title: "skills"
---

# `Durar skills`

Inspect local skills and install/update skills from Durar Gateway.

Related:

- Skills system: [Skills](/tools/skills)
- Skills config: [Skills config](/tools/skills-config)
- Durar Gateway installs: [Durar Gateway](/tools/Durar Gateway)

## Commands

```bash
Durar skills search "calendar"
Durar skills search --limit 20 --json
Durar skills install <slug>
Durar skills install <slug> --version <version>
Durar skills install <slug> --force
Durar skills update <slug>
Durar skills update --all
Durar skills list
Durar skills list --eligible
Durar skills list --json
Durar skills list --verbose
Durar skills info <name>
Durar skills info <name> --json
Durar skills check
Durar skills check --json
```

`search`/`install`/`update` use Durar Gateway directly and install into the active
workspace `skills/` directory. `list`/`info`/`check` still inspect the local
skills visible to the current workspace and config.

This CLI `install` command downloads skill folders from Durar Gateway. Gateway-backed
skill dependency installs triggered from onboarding or Skills settings use the
separate `skills.install` request path instead.

Notes:

- `search [query...]` accepts an optional query; omit it to browse the default
  Durar Gateway search feed.
- `search --limit <n>` caps returned results.
- `install --force` overwrites an existing workspace skill folder for the same
  slug.
- `update --all` only updates tracked Durar Gateway installs in the active workspace.
- `list` is the default action when no subcommand is provided.
- `list`, `info`, and `check` write their rendered output to stdout. With
  `--json`, that means the machine-readable payload stays on stdout for pipes
  and scripts.

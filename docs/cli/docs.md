---
summary: "CLI reference for `Durar docs` (search the live docs index)"
read_when:
  - You want to search the live Durar docs from the terminal
title: "docs"
---

# `Durar docs`

Search the live docs index.

Arguments:

- `[query...]`: search terms to send to the live docs index

Examples:

```bash
Durar docs
Durar docs browser existing-session
Durar docs sandbox allowHostControl
Durar docs gateway token secretref
```

Notes:

- With no query, `Durar docs` opens the live docs search entrypoint.
- Multi-word queries are passed through as one search request.

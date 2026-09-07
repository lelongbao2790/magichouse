---
description: Spawn the reviewer agent to review current branch changes
---

Spawn the reviewer subagent to perform a full review of current branch changes.

Use the Agent tool with subagent_type "reviewer" and this exact prompt:

"Review current branch changes. Run `git diff main...HEAD` to see what changed, then perform a full review across all four passes (TypeScript & React quality, test coverage, security, performance) and return the structured PASS/WARN/FAIL report."

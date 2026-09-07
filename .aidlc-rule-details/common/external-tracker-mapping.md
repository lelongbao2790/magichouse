# External Tracker Mapping (Optional, Non-Core)

## Status

**This is not an AI-DLC stage.** No rule file in this framework requires generating a tracker map,
and no stage is blocked on it. This document exists only to describe a reusable pattern, so that if
a user asks "also map these stories/tasks to our tracker (Jira, Linear, Azure DevOps, GitHub
Issues, ...)", the AI has a consistent, documented way to do it instead of inventing an ad hoc
format each time.

## When To Use

Only on explicit user request — e.g. "create tickets for these stories and track the mapping" or
"I've already created tickets, here's the mapping, save it for later." Never generate this
proactively as part of a normal stage completion.

## Pattern

Create `aidlc-docs/{initiative-slug}/tracker-map.md`:

```markdown
# Tracker Map — [initiative-slug]

**Tracker**: [Jira / Linear / Azure DevOps / GitHub Issues / other]
**Last updated**: [ISO timestamp]

## Stories
| Story ID | Title | Ticket Key | Status |
|---|---|---|---|
| [US-x] | [title] | [TICKET-123] | [Open/In Progress/Done] |

## Tasks / Sub-tasks
| Task ID | Title | Ticket Key | Unit | Status |
|---|---|---|---|---|
| [US-x.n] | [title] | [TICKET-124] | [unit-name] | [Open/In Progress/Done] |
```

## Rules

- **No tracker-specific logic is built into the core framework.** This file format is
  tracker-agnostic — it just links an AI-DLC ID to whatever key the external system uses.
- **Never invent ticket keys.** Only record ticket keys the user provides or that were created via
  an explicit, user-approved action (e.g. an actual API call the user asked for).
- If the user wants AI-DLC to actively create tickets (not just record a mapping), that is a
  separate, explicitly-scoped integration task outside this framework's core — treat it the same as
  any other cross-cutting extension: confirm scope with the user before writing any integration
  code.

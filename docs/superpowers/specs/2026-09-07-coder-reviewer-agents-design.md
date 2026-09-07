# Coder & Reviewer Agents Design

**Date:** 2026-09-07  
**Status:** Approved  
**Project:** magichouse (Next.js 16 + TypeScript + React 19 + Tailwind CSS v4 + Supabase)

---

## Overview

Two Claude Code agents — `coder` and `reviewer` — that can be invoked manually via slash commands or spawned programmatically by aidlc, worktrees, or any other agent via the `Agent` tool.

---

## File Structure

```
.claude/
  agents/
    coder.md       ← subagent definition
    reviewer.md    ← subagent definition
  commands/
    coder.md       ← /coder slash command
    reviewer.md    ← /reviewer slash command
```

---

## Invocation Paths

| Entry point | Who uses it | What happens |
|---|---|---|
| `/coder <task>` | Developer, manually | Spawns coder agent → coder invokes reviewer → report |
| `/reviewer` | Developer, manually | Spawns reviewer agent on `git diff main...HEAD` → structured report |
| `Agent(subagent_type: "coder")` | aidlc, worktrees, other agents | Same chain as `/coder` |
| `Agent(subagent_type: "reviewer")` | coder agent (automatic) | Reviewer pass after lint+test pass |

---

## Coder Agent

### Identity

A specialist for this project's stack. Knows the conventions well enough that callers only need to describe *what* to build — not *how* to build it in this codebase.

### Stack Conventions Enforced

- **Next.js 16 App Router** — files in `app/`, layouts, server vs client component boundaries
- **TypeScript** — no `any`, explicit return types on all exported functions
- **Tailwind CSS v4** — utility classes only, no inline styles
- **shadcn/ui** — components from `components/ui/`, composition via `cn()` from `lib/utils`
- **Supabase** — `@supabase/ssr` client from `lib/supabase/`, never raw `fetch` for DB calls
- **Forms** — React Hook Form + Zod for all user input
- **Tests** — Vitest for unit tests, Playwright for e2e

### Execution Steps

1. Read task description; explore relevant files with Glob/Grep before writing anything
2. Write or edit code following conventions above
3. Run `pnpm lint` — fix all errors before continuing
4. Run `pnpm test` — fix broken tests, add new tests for new logic
5. Spawn reviewer agent with a summary of what changed and why
6. Surface reviewer report back to the caller

### Tools

`Read`, `Edit`, `Write`, `Glob`, `Grep`, `Bash` (pnpm commands), `Agent` (to spawn reviewer)

---

## Reviewer Agent

### Input

A summary of what changed — provided by the coder agent, or derived from `git diff main...HEAD` for manual `/reviewer` invocations.

### Review Passes (in order)

#### 1. TypeScript & React Quality
- No `any`; props and return types explicit on exported items
- Server vs client component boundaries correct (`"use client"` only where required)
- No logic in layout files; hooks follow Rules of Hooks

#### 2. Test Coverage
- New logic has Vitest unit tests
- New user-facing flows have or update Playwright e2e tests
- No tests deleted without replacement

#### 3. Security
- No unguarded `dangerouslySetInnerHTML`
- Supabase RLS assumptions validated — no client-side auth bypasses
- No secrets or `.env` values hardcoded in source
- User input validated with Zod before use

#### 4. Performance
- No unnecessary `"use client"` pushing components client-side without reason
- No missing `key` props; expensive operations memoized with `useMemo`/`useCallback`
- Large imports that should be lazy use `next/dynamic`

### Output Format

Structured report with three sections:

```
## PASS
- [list of areas that look good]

## WARN  (non-blocking, should be addressed)
- [list of concerns]

## FAIL  (must be fixed before completion)
- [list of blockers with file:line references]
```

If any `FAIL` items exist, the coder agent fixes them and re-runs from step 2 (edit → lint → test → review). Maximum 2 fix-and-retry cycles; if `FAIL` items remain after 2 cycles, the agent surfaces them to the caller and stops.

### Tools

`Read`, `Glob`, `Grep`, `Bash` (for `git diff`, `pnpm lint` if needed)

---

## Slash Commands

### `/coder <task description>`

Accepts a free-text task description. Instructs the main Claude session to call `Agent(subagent_type: "coder", prompt: "<task>")`. Returns the final reviewer report plus a summary of what was built.

### `/reviewer`

No arguments required. Instructs the main Claude session to call `Agent(subagent_type: "reviewer", prompt: "Review current branch changes via git diff main...HEAD")`. Returns the structured PASS/WARN/FAIL report.

---

## Non-Goals

- This design does not modify the existing aidlc rule files — aidlc calls these agents as-is via the `Agent` tool
- The reviewer does not auto-push or create PRs — it reports only
- The coder does not manage branches or worktrees — the caller handles that

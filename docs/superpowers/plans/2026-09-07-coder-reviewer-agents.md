# Coder & Reviewer Agents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `.claude/agents/coder.md` and `.claude/agents/reviewer.md` subagent definitions plus `/coder` and `/reviewer` slash commands so coding work can be delegated to a stack-aware coder agent that auto-invokes a full reviewer after every change.

**Architecture:** Four markdown files — two agent definitions (`.claude/agents/`) that Claude Code loads as subagents, and two slash commands (`.claude/commands/`) as thin manual entry points that spawn those subagents. The coder agent always invokes the reviewer agent as its final step; the reviewer returns a structured PASS/WARN/FAIL report.

**Tech Stack:** Claude Code agent markdown format (YAML frontmatter + system prompt body), Next.js 16, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase SSR, Vitest, Playwright, pnpm

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create dir | `.claude/agents/` | Container for subagent definitions |
| Create | `.claude/agents/reviewer.md` | Reviewer subagent system prompt + tool restrictions |
| Create | `.claude/agents/coder.md` | Coder subagent system prompt + tool list |
| Create | `.claude/commands/reviewer.md` | `/reviewer` slash command |
| Create | `.claude/commands/coder.md` | `/coder` slash command |

> Create reviewer before coder — the coder agent references it by name.

---

### Task 1: Create reviewer agent

**Files:**
- Create: `.claude/agents/reviewer.md`

- [ ] **Step 1: Create `.claude/agents/` directory**

```powershell
New-Item -ItemType Directory -Force .claude/agents
```

Expected: directory created (or already exists — both fine).

- [ ] **Step 2: Write `.claude/agents/reviewer.md`**

Create the file with exactly this content:

```markdown
---
name: reviewer
description: Code reviewer for magichouse. Performs full quality, test coverage, security, and performance review. Returns a structured PASS/WARN/FAIL report. Use after coding tasks or manually via /reviewer.
tools:
  - Read
  - Glob
  - Grep
  - Bash
---

You are a code reviewer for the magichouse project (Next.js 16 + TypeScript + React 19 + Tailwind CSS v4 + Supabase).

## Input

You will receive either:
- A summary of changes from the coder agent (what changed and why, with file paths)
- A request to review current branch changes — in this case run `git diff main...HEAD` to see what changed

## Review Passes

Run all four passes on every changed file. Do not skip passes.

### 1. TypeScript & React Quality
- No `any` type; props and return types must be explicit on all exported items
- Server vs client component boundary is correct — `"use client"` only where DOM APIs or hooks require it
- No business logic in layout files (`app/**/layout.tsx`)
- Hooks follow Rules of Hooks (no conditional calls, no calls outside components/hooks)

### 2. Test Coverage
- New logic has Vitest unit tests in a `*.test.ts` or `*.test.tsx` file co-located with the source
- New user-facing flows have or update Playwright e2e tests under `automation_tests/`
- No test file deleted without a replacement

### 3. Security
- No unguarded `dangerouslySetInnerHTML` — must be paired with sanitization
- Supabase calls respect RLS — no client-side logic that assumes data blocked by RLS is inaccessible
- No secrets, API keys, or `.env` values hardcoded in source files
- All user input validated with Zod before use

### 4. Performance
- No `"use client"` added without a clear reason (DOM API, event handler, hook)
- No missing `key` props on list renders
- Expensive computations inside render wrapped in `useMemo` or `useCallback`
- Large third-party imports not needed at page load use `next/dynamic`

## Output Format

Always output a report in exactly this structure:

```
## PASS
- [each area that looks good, one bullet per area]

## WARN
(non-blocking — should be addressed but does not block completion)
- [concern with file:line reference]

## FAIL
(must be fixed before this work is considered complete)
- [blocker with file:line reference and what specifically must change]
```

If there are no items in a section, write `- none`.
```

- [ ] **Step 3: Verify file exists and frontmatter is readable**

```powershell
Get-Content .claude/agents/reviewer.md -TotalCount 10
```

Expected: first 10 lines show `---`, `name: reviewer`, `description: ...`, `tools:` list, `---`.

- [ ] **Step 4: Commit**

```powershell
git add .claude/agents/reviewer.md
git commit -m "feat: add reviewer subagent definition"
```

---

### Task 2: Create coder agent

**Files:**
- Create: `.claude/agents/coder.md`

- [ ] **Step 1: Write `.claude/agents/coder.md`**

Create the file with exactly this content:

```markdown
---
name: coder
description: Full-stack Next.js/TypeScript specialist for magichouse. Use when implementing features, fixing bugs, or building new functionality. Writes code following project conventions, runs lint and tests, then invokes the reviewer agent automatically.
tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - Bash
  - Agent
---

You are a full-stack specialist for the magichouse project.

## Stack Conventions

Follow these conventions exactly. Do not deviate.

- **Next.js 16 App Router** — all routes under `app/`, server components by default, `"use client"` only when DOM APIs or hooks require it
- **TypeScript** — no `any`, explicit return types on all exported functions and components
- **Tailwind CSS v4** — utility classes only, no inline styles, no CSS modules
- **shadcn/ui** — UI components live in `components/ui/`, compose them using `cn()` from `lib/utils`
- **Supabase** — use the `@supabase/ssr` client from `lib/supabase/`, never use raw `fetch` for database calls
- **Forms** — React Hook Form + Zod for all user input; define the Zod schema first and infer the TypeScript type from it
- **Unit tests** — Vitest; test files co-located with source as `*.test.ts` / `*.test.tsx`
- **E2e tests** — Playwright; test files under `automation_tests/`
- **Package manager** — pnpm (`pnpm lint`, `pnpm test`, `pnpm build`)

## Execution Steps

Follow in order. Do not skip steps.

### Step 1 — Explore
Read the task. Use Glob and Grep to find relevant existing files before writing anything. Understand how similar things are already done in this codebase.

### Step 2 — Write code
Write or edit code following the stack conventions above. Add Vitest unit tests for all new logic co-located with the source file. Add or update Playwright tests for new user-facing flows.

### Step 3 — Lint
Run:
```
pnpm lint
```
Fix every error before continuing. Do not proceed with lint errors.

### Step 4 — Test
Run:
```
pnpm test
```
Fix any failing tests. New logic must have tests. Do not proceed with test failures.

### Step 5 — Invoke reviewer
Spawn the reviewer agent using the Agent tool:

```
Agent(
  subagent_type: "reviewer",
  description: "Review code changes",
  prompt: "Review the following changes: [summarize what you changed and why, include file paths and a brief description of each change]"
)
```

### Step 6 — Handle reviewer output

- **FAIL items present:** Fix them, then repeat from Step 3. Maximum 2 fix-and-retry cycles.
- **2 cycles done and FAIL items remain:** Surface the unresolved FAIL items to the caller and stop.
- **Only PASS and/or WARN:** Report success. Include the reviewer's full PASS/WARN/FAIL report in your response.
```

- [ ] **Step 2: Verify file exists and frontmatter is readable**

```powershell
Get-Content .claude/agents/coder.md -TotalCount 12
```

Expected: first 12 lines show `---`, `name: coder`, `description: ...`, `tools:` list including `Agent`, `---`.

- [ ] **Step 3: Commit**

```powershell
git add .claude/agents/coder.md
git commit -m "feat: add coder subagent definition"
```

---

### Task 3: Create /reviewer slash command

**Files:**
- Create: `.claude/commands/reviewer.md`

- [ ] **Step 1: Write `.claude/commands/reviewer.md`**

Create the file with exactly this content:

```markdown
---
description: Spawn the reviewer agent to review current branch changes
---

Spawn the reviewer subagent to perform a full review of current branch changes.

Use the Agent tool with subagent_type "reviewer" and this exact prompt:

"Review current branch changes. Run `git diff main...HEAD` to see what changed, then perform a full review across all four passes (TypeScript & React quality, test coverage, security, performance) and return the structured PASS/WARN/FAIL report."
```

- [ ] **Step 2: Verify**

```powershell
Get-Content .claude/commands/reviewer.md
```

Expected: frontmatter with `description`, then the spawn instruction.

- [ ] **Step 3: Commit**

```powershell
git add .claude/commands/reviewer.md
git commit -m "feat: add /reviewer slash command"
```

---

### Task 4: Create /coder slash command

**Files:**
- Create: `.claude/commands/coder.md`

- [ ] **Step 1: Write `.claude/commands/coder.md`**

Create the file with exactly this content:

```markdown
---
description: Spawn the coder agent to implement a feature or fix. Usage: /coder <task description>
---

Spawn the coder subagent to implement the following task.

Use the Agent tool with subagent_type "coder" and pass the full task description as the prompt:

Task: $ARGUMENTS
```

- [ ] **Step 2: Verify**

```powershell
Get-Content .claude/commands/coder.md
```

Expected: frontmatter with `description`, then the spawn instruction containing `$ARGUMENTS`.

- [ ] **Step 3: Commit**

```powershell
git add .claude/commands/coder.md
git commit -m "feat: add /coder slash command"
```

---

### Task 5: Smoke test

**Files:** none (read-only verification)

- [ ] **Step 1: Verify all four files exist**

```powershell
Get-ChildItem .claude/agents/; Get-ChildItem .claude/commands/
```

Expected output includes: `coder.md`, `reviewer.md` under `agents/`; `aidlc.md`, `coder.md`, `reviewer.md` under `commands/`.

- [ ] **Step 2: Verify agent frontmatter names match what the coder agent references**

```powershell
Select-String -Path .claude/agents/reviewer.md -Pattern "^name:"
Select-String -Path .claude/agents/coder.md -Pattern "^name:"
```

Expected:
```
.claude/agents/reviewer.md:2:name: reviewer
.claude/agents/coder.md:2:name: coder
```

- [ ] **Step 3: Verify coder references reviewer by correct subagent_type**

```powershell
Select-String -Path .claude/agents/coder.md -Pattern "reviewer"
```

Expected: at least one match showing `subagent_type: "reviewer"` in Step 5 of the coder prompt.

- [ ] **Step 4: Confirm git log shows all four commits**

```powershell
git log --oneline -5
```

Expected: four recent commits — `feat: add /coder slash command`, `feat: add /reviewer slash command`, `feat: add coder subagent definition`, `feat: add reviewer subagent definition`.

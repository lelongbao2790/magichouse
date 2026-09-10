---
name: openspec-document-learnings
description: Documents implementation patterns, operational mechanics, gotchas, or conventions in CLAUDE.md (this project's AI-instructions file) so future AI iterations and developers avoid pitfalls. Scans for learnings in current change context and conversation, or accepts direct input.
compatibility: Requires openspec CLI.
allowed-tools: Read Write Glob Bash
---

# Document Learnings

Add an implementation pattern, operational learning, gotcha, or convention to CLAUDE.md so future AI iterations (and developers) avoid the same pitfalls.

## Workflow

### 1. Scan for Learnings

Look for learnings in these sources:

**Active change context** (if one exists):
```bash
openspec list --json
```

If a change is active, read its artifacts:
- `openspec/changes/<name>/design.md` - Look for technical details, gotchas mentioned
- `openspec/changes/<name>/tasks.md` - Look for completed tasks with non-obvious solutions

**Conversation context:**
- Non-obvious solutions discovered ("it turns out...", "the trick is...")
- Workarounds implemented ("had to do X because...")
- Unexpected behavior encountered ("surprisingly...", "gotcha:")
- Patterns established ("we should always...", "convention:")
- Debugging insights ("the issue was actually...")

**Detection signals:**
- "gotcha" or "gotchas"
- "learned that..."
- "turns out..."
- "the trick is..."
- "non-obvious"
- "convention:" or "established that..."
- "workaround" or "workarounds"

### 2. Present Found Learnings

**If learnings found:**

```
Looking for implementation learnings...

Found in current context:
1. [conversation] The API rate limits are per-endpoint, not global
2. [design.md] Cache invalidation requires manual trigger after bulk updates
3. [tasks] Build fails silently if env vars are missing

Which learning would you like to document?
```

**If no learnings found:**

Ask clarifying questions:
- **What happened?** What problem did you encounter?
- **What's the fix?** What pattern or workaround solved it?
- **Where does it apply?** Specific file, module, or codebase-wide?
- **What type?** Is this about how to build/run/validate the project (operational) or how to write correct code (implementation)?

**Section routing:**
- Operational → `Build & Run` or `Validation`
- Implementation → `Implementation Patterns`, `[Module Name]`, or `Gotchas`

### 3. Read Current CLAUDE.md

`CLAUDE.md` exists in the project root (it documents the AI-DLC workflow). Read it for:
- Existing sections (to find the right place)
- Duplicate or conflicting patterns
- Current formatting style

Learnings go in a dedicated `## Learnings` area (with the sub-sections below) appended to `CLAUDE.md` — **preserve the existing AI-DLC content**, don't overwrite it. Also cross-check `docs/PROJECT_GUIDE.md` and `docs/DEVELOPMENT_WORKFLOW.md` so a "learning" that's already documented there isn't duplicated.

### 4. Add the Learning

Add a concise entry in the appropriate section. Create a new section if needed.

**Format:**
```markdown
## [Section Name]

- **[Topic]**: [Pattern or rule]. [Brief rationale if not obvious].
```

**Examples of implementation entries:**
- **Redis**: Always call `await client.connect()` before cache operations. Connection is lazy.
- **React hooks**: Use `useCallback` for event handlers passed to child components to prevent re-renders.
- **API pagination**: `/api/users` returns max 100 results. Use `?cursor=` for pagination.
- **Testing**: Mock the Supabase client with `vi.mock`, not per-call. Unit tests live in `automation_tests/unit/`.

**Examples of operational entries:**
- **Build**: `pnpm build` — Next.js production build (`next build --webpack`)
- **Tests**: `pnpm test:coverage` — runs Vitest with a v8 coverage report
- **Dev server**: `pnpm dev` requires `.env.local` with the Supabase keys (see `.env.local.example`)
- **Validation order**: Run lint before tests; lint is faster and catches syntax errors

### 5. Confirm

Tell the user what was added and where. Offer to stage for commit.

```
✅ Added to CLAUDE.md under "Gotchas":
- **Redis**: Always call `await client.connect()` before operations. Connection is lazy.

Stage for commit? (y/n)
```

## Learnings Section Structure

Append this block to `CLAUDE.md` (below the existing AI-DLC content) the first time a learning is recorded, then add to it:

```markdown
## Learnings

> Patterns and conventions discovered while working in this codebase.

## Build & Run

- [Build commands and prerequisites]

## Validation

- **Tests**: `pnpm test` (Vitest) / `pnpm test:e2e` (Playwright)
- **Typecheck**: `pnpm exec tsc --noEmit`
- **Lint**: `pnpm lint` (ESLint)

## Implementation Patterns

- [Codebase-wide patterns]

## [Module/Feature Name]

- [Module-specific patterns]

## Gotchas

- [Common pitfalls and their solutions]
```

## Instructions

### Always Do
- Scan for learnings before asking
- Keep entries concise (one line if possible)
- Include rationale when not obvious
- Group related patterns together
- Preserve existing content and formatting
- Note related change if one is active

### Ask First
- If the learning contradicts an existing pattern
- If unsure which section it belongs in
- If context is ambiguous between multiple learnings

### Never Do
- Add vague entries like "be careful with X"
- Duplicate existing patterns
- Add implementation details that belong in code comments
- Auto-add without user confirmation

## Examples

**User:** Redis needs explicit connect

**Agent:** What specifically happened? Did you get a connection error?

**User:** Yeah, operations failed silently until I added await client.connect()

**Agent:**
✅ Added to CLAUDE.md under "Gotchas":
- **Redis**: Always call `await client.connect()` before operations. Connection is lazy and operations fail silently without it.

---

**User:** The PR webhook payload doesn't include reviewer comments, need separate API call

**Agent:**
✅ Added to CLAUDE.md under "GitHub Integration":
- **PR webhooks**: Payload excludes reviewer comments. Fetch separately via `GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews`.

---

**User:** Tests fail if you don't run migrations first

**Agent:**
✅ Added to CLAUDE.md under "Validation":
- **Tests**: `automation_tests/api/*` need `SUPABASE_SERVICE_ROLE_KEY` in the env. Pure unit tests under `automation_tests/unit/` mock Supabase and need nothing.

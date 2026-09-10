---
name: openspec-adr
description: Write an Architecture Decision Record (ADR). Scans for decisions in current change context and conversation, or accepts direct input. Use when documenting architectural decisions.
compatibility: Requires openspec CLI.
allowed-tools: Read Write Glob Bash
---

# Document ADR

Write an Architecture Decision Record following MADR format.

## Workflow

### 1. Scan for Decisions

Look for architectural decisions in these sources:

**Active change context** (if one exists):
```bash
openspec list --json
```

If a change is active, read its artifacts:
- `openspec/changes/<name>/design.md` - Look for "Decisions" section
- `openspec/changes/<name>/proposal.md` - Look for technology choices
- `openspec/changes/<name>/tasks.md` - Look for decision-related tasks

**Conversation context:**
- Technology selections ("using X", "chose Y over Z")
- Architecture patterns discussed
- Trade-off discussions ("X vs Y", "pros/cons")
- Problem-solution pairs

**Detection signals:**
- "decided to use..."
- "chose X because..."
- "went with X over Y"
- "the approach is..."
- Comparisons between options
- Explicit `[ADR]` markers

### 2. Present Found Decisions

**If decisions found:**

```
Looking for architectural decisions...

Found in current context:
1. [design.md] Chose Redis over Memcached for distributed caching
2. [conversation] Decided to use WebSockets for real-time updates
3. [tasks] Selected PostgreSQL for primary data store

Which decision would you like to document?
1. Redis caching decision
2. WebSocket decision
3. PostgreSQL decision
4. All of the above (create multiple ADRs)
5. Something else (describe it)
```

**If no decisions found:**

```
I didn't find explicit architectural decisions in the current context.

What decision would you like to document?

I'll need:
- What problem or question led to this decision?
- What options did you consider?
- What did you choose and why?
```

### 3. Gather Details

For the selected decision, ensure you have:
- **Title**: Short, descriptive (e.g., "Use Redis for distributed caching")
- **Context**: What problem are we solving? What constraints apply?
- **Decision**: What did we decide?
- **Alternatives**: What other options were considered? Why rejected?
- **Consequences**: Positive and negative outcomes

If any are missing from context, ask the user.

### 4. Determine ADR Number

Check `docs/adr/README.md` for the index table:
```bash
cat docs/adr/README.md 2>/dev/null || echo "No index yet"
```

Find the highest NNNN, use NNNN+1. Start with 0001 if none exist (0000 is reserved for the format ADR).

### 5. Create the ADR

Path: `docs/adr/NNNN-slugified-title.md`

Use template from `template.md` in this skill folder:
- Status: `Proposed`
- Date: today's date (YYYY-MM-DD)
- Fill all sections
- Keep content concise and scannable

### 6. Update the Index

Add a row to the index table in `docs/adr/README.md`:

```markdown
| [NNNN](NNNN-slug.md) | Title | Proposed | YYYY-MM-DD |
```

### 7. Report Results

```
## ADR Created

**File:** docs/adr/0003-use-redis-for-caching.md
**Status:** Proposed
**Decision:** Use Redis for distributed caching over Memcached

### Summary
Redis was chosen for distributed caching because of its richer data
structure support and built-in persistence options. Trade-off: slightly
more operational complexity than Memcached.

Updated index: docs/adr/README.md

Stage for commit? (y/n)
```

If user says yes, stage the files:
```bash
git add docs/adr/NNNN-slug.md docs/adr/README.md
```

## Instructions

### Always Do
- Scan for decisions before asking
- Use next sequential ADR number
- Use kebab-case for filenames: `NNNN-short-title.md`
- Set status to `Proposed`
- Update the README.md index
- Keep entries concise and scannable
- Note related change if one is active

### Ask First
- If a decision might supersede an existing ADR
- If context is ambiguous between multiple decisions
- For missing details (alternatives, consequences)

### Never Do
- Skip the alternatives section—document why they were rejected
- Use vague consequences—be specific about trade-offs
- Create duplicate ADRs for the same decision
- Auto-create without user confirmation

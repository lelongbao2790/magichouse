---
name: fix-bug-fanout-implement
description: Investigate a bug using fan-out/fan-in, then implement with user approval at each step.
---
# Fix Bug — Jira Images + MCP First + Fan-Out/Fan-In + Gated + Bilingual Export

This is a strict gated workflow.

DO NOT skip steps.
DO NOT implement before approval.

---

## Approval Keywords

yes / y / ok / approve / proceed / continue / go ahead

If not approved → STOP.

---

# Input

## Jira ticket link or key

{{JIRA_INPUT}}

---

# STEP 0 — Fetch Jira Ticket + Optional Images

When user provides Jira link or ticket key, FIRST call MCP tool:

`jira-tools.get_jira_ticket_with_images`

Input:

{
  "jira_input": "{{JIRA_INPUT}}"
}

Use returned data:

- key
- summary
- description
- comments
- issueType
- status
- priority
- imageFiles (optional)

If MCP tool fails:

→ Use Atlassian MCP text-only ticket fetch.

Add note:

> Note: Screenshot data not available. Analysis is based on ticket text, comments, project context, and code context.

---

## Image Handling Rules

Images are OPTIONAL and used ONLY as reference.

If `imageFiles` exists:

- Use screenshots to:
  - confirm UI labels
  - identify page/screen
  - validate page structure
  - improve reproduction steps
  - confirm actual vs expected behavior
  - support UI / context / API / data fan-out investigation

Prefer screenshot labels only when clearly visible.

If `imageFiles` is empty, missing, or unclear:

- DO NOT reduce analysis quality
- Continue using:
  - ticket description
  - comments
  - project context
  - domain knowledge
  - MCP code context

Critical rules:

- NEVER depend entirely on screenshots
- NEVER invent details from unclear images
- NEVER skip step detail because images are missing
- ALWAYS generate detailed analysis and steps
- If screenshots conflict with ticket text, mention the conflict

---

# STEP 1 — Project Context

Read (skip any that are missing, mention it in the analysis):

- `CLAUDE.md` mandatory
- `docs/PROJECT_GUIDE.md` — directory map, architecture, data flow
- `docs/DEVELOPMENT_WORKFLOW.md` — branching, commits, review rules
- `.github/docs/05_TESTING_GUIDE.md` — how tests are structured
- `docs/analysis/bug-memory.md` — prior resolved-bug notes, if it exists
- `aidlc-docs/` / `features-requirement/` — any doc for the ticket's feature area

Do NOT scan the entire codebase.

---

# STEP 1A — Call magichouse_mcp

Call:

`magichouse_mcp.get_relevant_files`

Input:

{
  "title": "<ticket key> - <ticket summary>",
  "description": "<ticket description + relevant comments + useful screenshot observations>"
}

Screenshot observations should include only clearly visible/relevant details:

- screen/page name
- labels/buttons/tabs
- table columns
- incorrect visible value
- expected vs actual UI state

Use the returned file paths as the primary source for:

- primary area detection (infer from file paths — `components/`, `contexts/`, `app/api/`, `lib/`, `supabase/`, `data/`)
- relevant files to read
- likely flow
- related modules

After receiving the file list, read each relevant file directly using the Read tool.

Rules:

- Do NOT scan before calling magichouse_mcp
- Do NOT ignore magichouse_mcp results
- Do NOT search broadly outside the returned file list unless it is clearly incomplete

---

# STEP 1B — Targeted Fan-Out

Only investigate:

1. MCP returned files
2. direct execution path
3. similar working implementation, if mentioned
4. prior bug memory (`docs/analysis/bug-memory.md`)

Fan-out areas:

## UI / Component Layer

- page (`app/`) / component (`components/`)
- visible behavior
- label / display mismatch (also check `data/` translations)
- screenshot-confirmed UI state, if available

## State / Context Layer

- React context (`contexts/coin-context`, `language-context`, `theme-context`)
- `localStorage` persistence / hydration
- props / hook wiring

## API Route Layer

- `app/api/**/route.ts` handler logic
- request parsing / validation / auth check (`ADMIN_EMAILS`, Supabase session)
- response shape / mapping

## Data Layer

- Supabase query / filter condition (`lib/`, client in `lib/supabase`)
- RLS policy (`supabase/migrations/`)
- seed vs admin-created data mismatch (`source_key`), status/type mismatch

## Correct Implementation Reference

- similar component or flow that works correctly
- existing pattern to follow

Rules:

- Stop early if root cause is clear
- No full codebase scan
- No blind multi-layer fan-out
- Prefer MCP files

---

# STEP 1C — Fan-In

Compare findings.

Identify:

- strongest root cause
- weaker rejected hypotheses
- minimal safe fix
- impacted files
- risk/regression areas

---

# STEP 1 OUTPUT

## Step 1 — Analysis

### magichouse_mcp Used

Yes / No

### Jira Ticket

- Key:
- Summary:
- Issue Type:
- Status:
- Priority:

### Screenshot Reference

State one:

- Screenshots were available and used as reference
- Screenshots were not available
- Screenshots were unclear

If screenshots were useful, summarize only relevant visible observations.

### Primary Area

Directory / layer that owns the fix (e.g. `contexts/coin-context.tsx`, `app/api/admin/subjects/route.ts`).

### Related Areas

Only if needed. Include reason / data flow (e.g. a component consuming this context, an API route feeding this page).

### Key Files

Only files from magichouse_mcp or direct path.

### Likely Flow

...

### Step to Reproduce

1. ...
2. ...
3. ...

Expected:
...

Actual:
...

Mark inferred steps clearly.

### Fan-Out Findings

- UI / Component:
- State / Context:
- API Route:
- Data (Supabase):
- Correct implementation:
- Bug memory:

### Fan-In Decision

...

### Root Cause

...

### Rejected Hypotheses

...

### Proposed Fix

...

### Risks

...

### Confidence

Low / Medium / High

---

# STEP 1.5 — Export Analysis Before Implement

Create 2 files:

`docs/analysis/<TICKET-ID>-analysis-en.md`

`docs/analysis/<TICKET-ID>-analysis-vi.md`

---

## EN Version

Include:

- Ticket
- Screenshot reference
- Context
- Step to reproduce
- Root cause
- Fan-out findings
- Fan-in decision
- Fix proposal
- Risks
- Confidence

---

## VI Version

Same content, translated to Vietnamese.

---

# AFTER EXPORT

Ask:

"Analysis exported. Approve implementation? (yes/no)"

STOP HERE.

DO NOT continue unless user explicitly approves.

---

# STEP 2 — Implement

ONLY RUN IF USER APPROVES STEP 1.5.

Rules:

- Minimal change only
- Follow repo patterns
- No refactor
- No unrelated edits
- Prefer MCP returned files
- Modify only necessary files

---

# STEP 2 OUTPUT

## Step 2 — Implementation

### Files Changed

...

### Summary

...

### Why Safe

...

---

# AFTER STEP 2

Ask:

"Implementation done. Approve verification & final export? (yes/no)"

STOP HERE.

DO NOT continue unless user explicitly approves.

---

# STEP 3 — Verify + Memory + Final Export

ONLY RUN IF USER APPROVES STEP 2.

---

## Verification

Perform what is possible:

- `pnpm lint`
- `pnpm test` (vitest) — run the targeted test file/pattern first, then the suite
- `pnpm test:e2e` (Playwright) if the fix touches a user-visible flow
- `pnpm build` if the change could affect the build
- targeted scenario validation / logic path check
- regression focus review

If a command cannot be run, explain why and provide manual verification steps (see `MANUAL-TEST-CHECKLIST.md`).

---

## Memory Update

Update:

`docs/analysis/bug-memory.md`

Format:

[RESOLVED YYYY-MM-DD] <TICKET-ID>

- Root cause:
- Fix:
- Files:
- Risk:
- Verification:

---

## Final Export Update

Update BOTH files:

`docs/analysis/<TICKET-ID>-analysis-en.md`

`docs/analysis/<TICKET-ID>-analysis-vi.md`

Add:

## Fix Implementation

## Verification

## Final Status

---

# STEP 3 OUTPUT

## Step 3 — Final

### Verification

...

### Regression

...

### Memory Updated

Yes / No

### Documents Updated

- EN:
- VI:

### Status

Done / Blocked

---

# STRICT RULES

- NEVER skip Jira fetch
- NEVER skip magichouse_mcp
- NEVER implement before approval
- NEVER scan the full codebase
- ALWAYS use screenshots only as reference
- ALWAYS continue normally if screenshots are missing
- ALWAYS export before implement
- ALWAYS bilingual export
- ALWAYS update documents after fix
- ALWAYS stop after each gated step
---
name: analyze-jira
description: Analyze a Jira bug in two gated phases. First explain the customer report using Jira text and optional screenshots, then ask approval before calling magichouse_mcp for root cause analysis.
---

# Analyze Bug — Jira First + Screenshot Understanding + Gated MCP Root Cause

You are a senior engineer analyzing a bug in the Magic House codebase (Next.js / React 19 / TypeScript / Supabase / Tailwind / Radix UI).

This is a **two-phase gated workflow**.

Do not call `magichouse_mcp.get_relevant_files` until the user approves continuing.

---

# Input

## Jira ticket link or key

{{JIRA_INPUT}}

---

# Approval Keywords

Only continue to root-cause analysis if the user replies with one of:

- yes
- y
- ok
- approve
- proceed
- continue
- go ahead
- tiếp tục
- làm tiếp
- phân tích tiếp

If the user does not approve, stop and export only the Phase 1 report.

---

# Phase 1 — Fetch Jira Ticket + Optional Images

When the user provides a Jira link or ticket key, FIRST call MCP tool:

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
- imageFiles

If this tool fails, fall back to Atlassian MCP text-only ticket fetch.

When fallback is used, add this note:

> Note: Screenshot data not available. This analysis is based on ticket text, comments, and system behavior inference.

---

# Screenshot / Image Handling Rule

Images are OPTIONAL and must be used ONLY as reference.

If `imageFiles` exists, use screenshots to improve accuracy of:

- UI labels
- page names
- visible fields
- button names
- tab names
- table columns
- current vs expected UI state
- step-to-reproduce wording
- suspected affected screen or module

Do NOT depend entirely on screenshots.

Do NOT invent information from unclear screenshots.

If screenshots conflict with ticket text, mention the conflict.

---

# Phase 1 Output — Customer Report Understanding

Before reading project context or calling magichouse_mcp, produce this section first.

## Jira ticket summary

- Key:
- Summary:
- Issue Type:
- Status:
- Priority:

## Customer report meaning

Explain in English:

- What bug is the customer reporting?
- Which part of the system is affected?
- What does the customer expect, according to the ticket?
- What is currently wrong with the system?
- Does this look like a UI/component issue, React context/state issue, Supabase data issue, API route issue, auth/permission issue, or logic issue?

## Screenshot reference

State one:

- Screenshots used as reference
- No screenshots available
- Screenshots unclear

If screenshots are used, summarize only relevant observations:

- Screen/page visible:
- Field/button/table/label involved:
- Actual visible behavior:
- Expected visible behavior if clear:

## Simplified explanation

Explain the bug in simple English, suitable for PM/QA/non-technical reader.
Rewrite the explanation to be easier to understand:

- Use very simple English
- Avoid technical terms (e.g. logic, cross-currency, mapping)
- Replace with simple words like: "grabbed the wrong one", "applied to the wrong record", "leaked into", "not kept separate"
- Keep sentences short (1–2 lines max)
- Make it understandable in under 5 seconds

If still complex, rewrite again simpler.
Example style:

> In simple terms: the customer is saying that when they do step A, the system should show/create/update B, but instead it currently shows/creates/updates C, or does nothing at all.

## Initial reproduction understanding

Based only on Jira text, comments, and screenshots.

1. ...
2. ...
3. ...

Expected:
...

Actual:
...

Mark inferred steps clearly:

> Inferred from ticket/screenshot:

## Initial suspected area

Do NOT claim root cause yet.

Only give high-level suspected area, for example:

- likely component render / display / mapping (`components/`, `app/`)
- likely React context or localStorage state (`contexts/`)
- likely API route logic (`app/api/`)
- likely Supabase query / RLS / seed-data mismatch (`lib/`, `supabase/`)
- likely translation / static-data issue (`data/`)
- unclear until project context is checked

## Missing / unclear information

List gaps, such as:

- missing exact role/user
- missing environment
- missing expected value
- screenshot unclear
- no acceptance criteria
- unclear whether issue is reproducible consistently

---

# Phase 1 Gate

After producing Phase 1 output, ask:

> Would you like me to continue by calling project context + magichouse_mcp to find the root cause and a recommended fix?

Then STOP.

Do not continue unless the user approves.

---

# If User Does NOT Continue

Export Phase 1 report only.

Create file:

`docs/analysis/<ticket_key>_analysis.md`

The report must be in English.

Include:

# <ticket_key> - Ticket Understanding Report

## Jira ticket summary

## Customer report meaning

## Screenshot reference

## Simplified explanation

## Initial reproduction understanding

## Initial suspected area

## Missing / unclear information

## Note

> Root cause analysis was not performed because magichouse_mcp was not called.

Then stop.

---

# If User Approves Continue

Only after approval, continue to Phase 2.

---

# Phase 2 — Read Project Context

Read these files in order (skip any that are missing, mention it later):

1. `CLAUDE.md`
2. `docs/PROJECT_GUIDE.md` — identity, directory map, architecture, data flow
3. `docs/DEVELOPMENT_WORKFLOW.md` — branching, commits, review rules
4. `.github/docs/01_PROJECT_GUIDE.md` and `.github/docs/05_TESTING_GUIDE.md`
5. `README` / `MANUAL-TEST-CHECKLIST.md`
6. `aidlc-docs/` and `features-requirement/` — any doc matching the ticket's feature area
7. `supabase/migrations/` and `supabase/seed.sql` — if the bug touches data

Do not scan the whole codebase.

---

# Phase 3 — Locate the Affected Area

Use:

- Jira summary
- Jira description
- Jira comments
- screenshot observations
- Phase 1 understanding
- project context from Phase 2

Map the symptom to a directory (see `docs/PROJECT_GUIDE.md` §2):

| Symptom | Likely area |
|---------|-------------|
| Wrong text / layout / interaction on screen | `components/<feature>/`, `app/` |
| Coins, language, or theme behaving wrong / not persisting | `contexts/` (`coin-context`, `language-context`, `theme-context`) + `localStorage` |
| Quiz / subject content wrong or missing | `supabase/migrations/`, `supabase/seed.sql`, `app/api/` (subject content APIs), `lib/` |
| Admin content edits not working | `app/api/admin/`, `ADMIN_EMAILS` env, RLS policies |
| Stickers / translations wrong | `data/` |
| Auth / login | `lib/` Supabase client, `contexts/`, middleware |

Screenshots only help confirm which screen/component. They must not override stronger source-code evidence.

---

# Phase 4 — Call magichouse_mcp

Call:

`magichouse_mcp.get_relevant_files`

Input:

{
  "title": "<Jira summary>",
  "description": "<Jira description + relevant comments + screenshot observations + Phase 1 understanding + affected area>"
}

Use the returned file paths as the primary list of files to investigate.

Read the relevant files directly using the Read tool after receiving the paths.

Do NOT search broadly outside the returned file list.

If the file list is incomplete, explicitly say what is missing.

---

# Phase 5 — Produce Final Technical Analysis

Use only:

- Jira data
- comments
- screenshot references
- Phase 1 understanding
- project context
- magichouse_mcp file list + file contents read directly

Do NOT write code.

---

# Final Output

## Jira ticket summary

- Key:
- Summary:
- Issue Type:
- Status:
- Priority:

## Customer report meaning

Summarize what the customer reported in English.

## Screenshot reference

State one:

- Screenshots used as reference
- No screenshots available
- Screenshots unclear

If used, summarize relevant observations.

## Primary area

Directory / layer most likely owning the fix + reason (e.g. `contexts/coin-context.tsx`, `app/api/admin/subjects/route.ts`).

## Related areas

Only if needed, with justification (e.g. a component consuming a context, an API route feeding a page).

## Likely flow

Example:

`app/<route>/page.tsx → components/<feature>/*.tsx → contexts/*.tsx → lib/supabase/* → Supabase`

or

`components/*.tsx → fetch('/api/...') → app/api/.../route.ts → Supabase`

## Relevant files / components / modules

Only from magichouse_mcp response.

## Step to reproduce

Rules:

- Use screenshot labels if clear
- Use ticket text as main source
- Do not reduce detail if no images
- Mark inferred steps if needed

Format:

1. ...
2. ...
3. ...

Expected:
...

Actual:
...

## Likely root cause

Based on evidence.

If uncertain, say clearly.

## Risks / regression areas

Mention impacted flows.

Reference hotpaths if relevant.

## Recommended fix direction

What to change and where.

No code.

## Missing / uncertain information

List gaps:

- unclear screenshot
- missing AC
- missing role/env
- incomplete MCP context
- uncertain area ownership

---

# Export Final Report

After final analysis, create this file:

`docs/analysis/<ticket_key>_analysis.md`

The report must be in English.

Use this structure:

# <ticket_key> - Bug Analysis Report

## 1. Jira ticket summary

## 2. Customer report meaning

## 3. Screenshot reference

## 4. Simplified explanation

## 5. Step to reproduce

## 6. Primary area

## 7. Related areas

## 8. Likely technical flow

## 9. Relevant files / classes / modules

## 10. Likely root cause

## 11. Risks / regression areas

## 12. Recommended fix direction

## 13. Missing / uncertain information

---

# Critical Rules

- Do not call magichouse_mcp before user approval.
- Do not read project context before Phase 1 output.
- Do not scan the whole codebase.
- Do not write code.
- Do not commit.
- Do not push.
- Do not modify source files.
- Always export report to `docs/analysis/<ticket_key>_analysis.md`.
- If user stops after Phase 1, export Phase 1 report only.
- If user continues, export full final analysis report.
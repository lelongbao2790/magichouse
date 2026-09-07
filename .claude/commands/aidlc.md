---
description: Start or resume an AI-DLC (AI-Driven Development Life Cycle) engagement in this repo
---

# /aidlc

You are activating **AI-DLC**, a rule-driven, adaptive software development workflow. All of its
rules live under `.aidlc-rule-details/` in this repo's root. This command is the entry point —
follow it exactly, then hand off to the rule files themselves.

## On invocation

1. **Load the mandatory common rules now, in full**, before doing anything else:
   - `.aidlc-rule-details/common/process-overview.md` (the three-phase lifecycle map)
   - `.aidlc-rule-details/common/terminology.md` (glossary — use these terms consistently)
   - `.aidlc-rule-details/common/depth-levels.md` (adaptive detail-level concept)
   - `.aidlc-rule-details/common/question-format-guide.md` (**critical**: all questions to the user
     go in dedicated `.md` files with lettered `[Answer]:` tags — never inline in chat)
   - `.aidlc-rule-details/common/session-continuity.md` (resume detection, HANDOVER.md mandate)
   - `.aidlc-rule-details/common/error-handling.md`
   - `.aidlc-rule-details/common/overconfidence-prevention.md` (when in doubt, ask — don't assume)
   - `.aidlc-rule-details/common/content-validation.md` and
     `.aidlc-rule-details/common/ascii-diagram-standards.md` (validate any diagram before writing it)
   - `.aidlc-rule-details/common/workflow-changes.md` (mid-workflow change handling, for later)

2. **Scan for extensions**: find every `*.opt-in.md` file under `.aidlc-rule-details/extensions/**`
   and load it (just the opt-in file, not the full rules file yet — the full file loads later only
   if the user opts in, per each opt-in file's naming convention).

3. **Display the welcome message** from `.aidlc-rule-details/common/welcome-message.md` — but only
   the first time in a NEW initiative (see step 4). Skip it when resuming an existing initiative;
   use the "Welcome back" prompt from `session-continuity.md` instead.

4. **Proceed to `.aidlc-rule-details/inception/workspace-detection.md`** and follow it from Step 0.
   This determines whether the request continues an existing `aidlc-docs/{initiative-slug}/`
   initiative or starts a new one, then drives the rest of the workflow (Requirements Analysis →
   ... → Build and Test) per `process-overview.md`.

## Ground rules for the whole engagement

- Every question to the user goes in a dedicated question file — never inline chat (see
  `question-format-guide.md`).
- Never write application code under `aidlc-docs/` — only documentation lives there (see
  `code-generation.md`'s Code Location Rules once you reach that stage).
- Keep `aidlc-state.md` and `HANDOVER.md` in sync at every stage transition (see
  `session-continuity.md`).
- If the user asks to map generated stories/tasks to an external tracker (Jira, Linear, etc.), see
  `.aidlc-rule-details/common/external-tracker-mapping.md` — this is optional and only happens on
  explicit request.

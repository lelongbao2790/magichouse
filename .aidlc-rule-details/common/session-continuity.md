# Session Continuity Templates

## Welcome Back Prompt Template
When a user returns to continue work on an existing AI-DLC project, present this prompt:

```markdown
**Welcome back! I can see you have an existing AI-DLC project in progress.**

Based on your aidlc-state.md, here's your current status:
- **Project**: [project-name]
- **Current Phase**: [INCEPTION/CONSTRUCTION/OPERATIONS]
- **Current Stage**: [Stage Name]
- **Last Completed**: [Last completed step]
- **Next Step**: [Next step to work on]

**What would you like to work on today?**

A) Continue where you left off ([Next step description])

B) Review a previous stage ([Show available stages])

[Answer]: 
```

## MANDATORY: Session Continuity Instructions
1. **Always read aidlc-state.md first** when detecting existing project
2. **Parse current status** from the workflow file to populate the prompt
3. **MANDATORY: Load Previous Stage Artifacts** - Before resuming any stage, automatically read all relevant artifacts from previous stages:
   - **Reverse Engineering**: Read architecture.md, code-structure.md, api-documentation.md
   - **Requirements Analysis**: Read requirements.md, requirement-verification-questions.md
   - **User Stories**: Read stories.md, personas.md, story-generation-plan.md
   - **Application Design**: Read application-design artifacts (components.md, component-methods.md, services.md)
   - **Design (Units)**: Read unit-of-work.md, unit-of-work-dependency.md, unit-of-work-story-map.md
   - **Per-Unit Design**: Per-unit artifacts live under `aidlc-docs/{initiative-slug}/construction/{unit-name}/` in
     `functional-design/`, `nfr-requirements/`, `nfr-design/`, and `infrastructure-design/`
     subdirectories. On resume, determine the in-progress unit from `aidlc-state.md` and load that
     unit's design artifacts, plus the design artifacts of any units it depends on (per
     `unit-of-work-dependency.md`). The exact files in each subdirectory are enumerated by the
     corresponding construction stage rules.
   - **Code Stages**: Read all code files, plans, AND all previous artifacts
4. **Smart Context Loading by Stage**:
   - **Early Stages (Workspace Detection, Reverse Engineering)**: Load workspace analysis
   - **Requirements/Stories**: Load reverse engineering + requirements artifacts
   - **Design Stages**: Load requirements + stories + architecture + design artifacts
   - **Code Stages**: Load ALL artifacts + existing code files
5. **Adapt options** based on architectural choice and current phase
6. **Show specific next steps** rather than generic descriptions
7. **Log the continuity prompt** in audit.md with timestamp
8. **Context Summary**: After loading artifacts, provide brief summary of what was loaded for user awareness
9. **Asking questions**: ALWAYS ask clarification or user feedback questions by placing them in .md files. DO NOT place the multiple-choice questions in-line in the chat session.

## MANDATORY: HANDOVER.md

Every time `aidlc-state.md` is created or updated, `aidlc-docs/{initiative-slug}/HANDOVER.md` MUST
also be created or updated in the same step. Both files track the same underlying progress, for two
different readers:
- **`aidlc-state.md`**: machine-oriented state for the AI to parse on resume (checkboxes, stage
  names, structured status fields)
- **`HANDOVER.md`**: human-oriented briefing for a person (a different operator, a teammate, or the
  same user much later) to skim and understand where things stand without reading every artifact

### HANDOVER.md Template
```markdown
# Handover — [initiative-slug]

**Last updated**: [ISO timestamp]

## Where things stand
[1-3 sentences: current phase/stage, and what is blocking or what's next]

## What this initiative is
[1-2 sentence plain-language summary of the goal, no jargon]

## Stage history
| Stage | Status | Notes |
|---|---|---|
| [Stage name] | [Completed/Skipped/In Progress] | [Brief note, e.g. depth level or rationale] |

## Key decisions made
| Decision | Answer | Where |
|---|---|---|
| [Decision topic] | [What was chosen] | [Stage/artifact it came from] |

## Open items
- [Anything pending, blocked, or needing follow-up]

## Artifact map
[Short tree view of aidlc-docs/[initiative-slug]/ showing what exists so far]

## Gotchas for the next operator
- [Anything non-obvious that would save the next person time]
```

### To Resume From HANDOVER.md
To resume with an AI assistant: open this repo, state that you are continuing the AI-DLC workflow
for this initiative, and point it at `aidlc-docs/{initiative-slug}/HANDOVER.md` (or just
`aidlc-docs/{initiative-slug}/`, since `aidlc-state.md` remains the authoritative machine-readable
source — HANDOVER.md is a convenience layer on top of it, not a replacement).

## Error Handling
If artifacts are missing or corrupted during session resumption, see [error-handling.md](error-handling.md) for guidance on recovery procedures. 
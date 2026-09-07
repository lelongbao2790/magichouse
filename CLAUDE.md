# magichouse

This project uses **AI-DLC** (AI-Driven Development Life Cycle) for structured development workflows.

The rule engine is in `.aidlc-rule-details/` — the AI reads and follows these rules directly.

## Quick Start

Run `/aidlc` to begin. Describe what you want to build and the AI will guide you through the workflow.

To resume a previous session, run `/aidlc` again — it detects existing state in `aidlc-docs/` automatically.

## How it works

Three phases, executed adaptively:

- **INCEPTION** — Workspace Detection → Requirements Analysis → User Stories → Workflow Planning → Design
- **CONSTRUCTION** — per unit: Functional Design → NFR → Code Generation → Build and Test
- **OPERATIONS** — placeholder for future deployment/monitoring

All artifacts are saved under `aidlc-docs/{initiative-slug}/`.

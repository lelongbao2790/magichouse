# AIDLC Workflow Guide
## How the AI-Driven Development Lifecycle Works — Plain English

---

## What Is AIDLC?

AIDLC (AI-Driven Development Lifecycle) is a structured process where an AI assistant guides you
through building a software feature step by step. Instead of writing code immediately, the AI
first helps you think clearly about **what to build**, then **how to build it**, then **builds it**,
and finally **tests it**.

Think of it like building a house:
- You don't pick up a hammer on day one.
- First you draw the floor plan, choose the materials, get permits, then build.

---

## Full Workflow Diagram

```
  START
    |
    v
+----------------------------------+
|   PHASE 1: INCEPTION             |  "What are we building and why?"
+----------------------------------+
    |
    |  [AUTO] Workspace Detection
    |        AI reads your project files
    |        Decides: new project (greenfield) or existing project (brownfield)
    |
    v
    |  [APPROVE] Reverse Engineering          <- only for existing projects
    |        AI reads ALL your code
    |        Produces 8 documents explaining what your app does
    |        You review → APPROVE to continue
    |
    v
    |  [ANSWER QUESTIONS] Requirements Analysis
    |        AI asks you what the feature should do
    |        You answer 10-13 questions
    |        AI writes a requirements document (FR + NFR list)
    |
    v
    |  [OPTIONAL] QA Gate
    |        You can ask for a formal review checkpoint
    |        Workflow STOPS until you explicitly approve
    |        You can add/change requirements before approving
    |
    v
    |  [APPROVE] Workflow Planning
    |        AI decides which stages to run vs skip
    |        Shows you the plan before doing anything
    |        You can override the plan
    |
    v
+----------------------------------+
|   PHASE 2: CONSTRUCTION          |  "How exactly will we build it?"
+----------------------------------+
    |
    |  [APPROVE] Functional Design
    |        AI designs the data structures and business logic
    |        No code yet — just design documents
    |        You review → APPROVE or ask for changes
    |
    v
    |  [ANSWER + APPROVE] NFR Requirements
    |        NFR = Non-Functional Requirements (testing, performance, security)
    |        AI asks 1-3 tool/tech choice questions
    |        You answer → AI writes the requirements
    |        You APPROVE to continue
    |
    v
    |  [APPROVE] NFR Design
    |        AI designs HOW the non-functional requirements will be implemented
    |        e.g. exactly how tests will be structured
    |        You review → APPROVE or ask for changes
    |
    v
    |  [APPROVE PLAN, then AUTO] Code Generation
    |        Part 1: AI writes a step-by-step plan (no code yet)
    |        You APPROVE the plan
    |        Part 2: AI executes the plan and writes all the code
    |        You review → APPROVE or ask for changes
    |
    v
    |  [APPROVE] Build and Test
    |        AI writes build instructions and test instructions
    |        Runs the tests automatically
    |        You review the results → APPROVE to finish
    |
    v
+----------------------------------+
|   PHASE 3: OPERATIONS            |  "How do we deploy and monitor it?"
+----------------------------------+
    |        (Placeholder — not yet implemented)
    v
  DONE
```

---

## Stage-by-Stage Breakdown

### PHASE 1 — INCEPTION

---

#### Stage 1: Workspace Detection
**What it does**: The AI scans your project folder to understand what kind of project you have.

**Your action**: Nothing — fully automatic.

**Why**: The AI needs to know whether it is starting from scratch (greenfield) or working
with an existing app (brownfield). For brownfield projects, it adds a Reverse Engineering
step before asking about the feature. For greenfield, it skips straight to requirements.

**Output**: `aidlc-docs/aidlc-state.md` (state tracking file created)

---

#### Stage 2: Reverse Engineering *(brownfield only)*
**What it does**: The AI reads every file in your project and produces 8 documents explaining
your existing system — the business logic, the architecture, the component list, the tech stack,
the code quality, and more.

**Your action**: **APPROVE** → type something like "go ahead" or "approve and continue"

**Why**: Before adding anything new, the AI needs to understand what already exists so that
new code fits naturally into the existing style and structure. Without this step, the AI would
write code that conflicts with your existing patterns.

**Output**:
- `aidlc-docs/inception/reverse-engineering/business-overview.md`
- `aidlc-docs/inception/reverse-engineering/architecture.md`
- `aidlc-docs/inception/reverse-engineering/code-structure.md`
- `aidlc-docs/inception/reverse-engineering/technology-stack.md`
- *(+ 4 more documents)*

---

#### Stage 3: Requirements Analysis
**What it does**: The AI asks you a series of questions to capture exactly what the new
feature should do. After you answer, it produces a formal requirements document.

**Your action**: **ANSWER QUESTIONS** — the AI presents numbered questions with multiple
choice options (A/B/C/D). You fill in your answers.

**Questions asked in this project and WHY each was asked**:

| # | Question | Why Asked |
|---|---|---|
| 1 | What grades does the feature cover? | To know how many tabs and categories to create |
| 2 | Addition — what number range? | Business rule: defines valid operands and whether results can exceed 100 |
| 3 | Subtraction — can result be negative? | Business rule: must decide if larger-minus-smaller ordering is enforced |
| 4 | Times table — which multipliers? | Business rule: defines the difficulty level (2–9 tables vs full 1–12) |
| 5 | How many questions per session? | Determines quiz length and session structure |
| 6 | How many coins rewarded? | Needs to match the coin reward system already in the app |
| 7 | Should wrong answers show the correct one? | UX decision: immediate feedback vs. no feedback |
| 8 | Should students be able to retry? | UX decision: affects quiz flow and `disabled` state in the UI |
| 9 | What languages are needed? | Determines if translation keys need to be added |
| 10 | Should questions be multiple choice? | Architecture decision: determines if `QuizModal` needs changes |
| E1 | Do you want Security testing? | Extension opt-in: adds security rules to all later stages |
| E2 | Do you want Resiliency patterns? | Extension opt-in: adds retry/fallback design rules |
| E3 | Do you want Property-Based Testing? | Extension opt-in: adds automated PBT rules (fast-check) |

**Output**: `aidlc-docs/inception/requirements/requirements.md` (13 functional + 5 non-functional requirements)

---

#### Optional: QA Gate
**What it does**: A formal checkpoint where the workflow **completely stops** until a named
reviewer approves. No next stage runs until the gate is cleared.

**Why you might use it**: You want a second set of eyes on requirements before any design
or code is created. Changes are cheap at this stage — much cheaper than after code is written.

**In this project**: You acted as QA reviewer, asked two questions:
1. *"What happens if a student enters an invalid value?"* → Added FR-12 (multiple-choice only, no invalid input possible)
2. *"Can the student retry an incorrect answer?"* → Added FR-13 (no retry, correct answer shown)

**Your action**: **APPROVE GATE** — explicitly say "approve the QA gate" or similar.

**Output**: `aidlc-docs/inception/requirements/qa-approval-gate.md` (status: APPROVED)

---

#### Stage 4: Workflow Planning
**What it does**: The AI looks at your requirements and decides which construction stages
are needed vs. which can be safely skipped. It shows you a visual plan before doing anything.

**Your action**: **APPROVE** — or request changes to the plan.

**Why**: Not every feature needs every stage. For example, a simple bug fix has no need for
Application Design or User Stories. Skipping unnecessary stages saves time.

**Decisions made for this project**:

| Stage | Decision | Reason |
|---|---|---|
| User Stories | SKIP | Single developer, no team handoff needed |
| Application Design | SKIP | Modifying one existing file, not designing new components |
| Units Generation | SKIP | Only one unit of work (Grade2MathFeature) |
| Infrastructure Design | SKIP | Pure client-side, no cloud resources needed |

**Output**: `aidlc-docs/inception/plans/execution-plan.md`

---

### PHASE 2 — CONSTRUCTION

---

#### Stage 5: Functional Design
**What it does**: The AI designs the business logic in detail — data types, function signatures,
algorithms, and rules — **without writing actual code yet**. Think of it as a detailed blueprint.

**Your action**: **APPROVE** or ask for changes.

**Why**: Catching a design mistake here is free. Catching the same mistake after code is
written means rewriting code. The design documents also serve as the specification the AI
follows when writing code later.

**Output**:
- `functional-design/business-logic-model.md` — 5 functions with input/output specs
- `functional-design/business-rules.md` — 25 rules (e.g. "operands must be in [1,100]")
- `functional-design/domain-entities.md` — new TypeScript types defined
- `functional-design/frontend-components.md` — exactly which UI pieces change and how

---

#### Stage 6: NFR Requirements
**What it does**: NFR = Non-Functional Requirements. These are requirements about **how**
the system behaves, not **what** it does. Examples: how fast it must be, how it is tested,
how secure it is.

**Your action**: **ANSWER QUESTIONS** (1 question in this project), then **APPROVE**.

**Question asked and WHY**:

| Question | Why Asked |
|---|---|
| Which test runner to use — Vitest or Jest? | Property-Based Testing (PBT) requires a test runner. The project had none installed. Vitest was recommended because it works with Next.js 16 and modern JavaScript without extra configuration. Jest requires more setup with this tech stack. |

**Output**:
- `nfr-requirements/nfr-requirements.md` — 5 active NFRs (testing, consistency, synchronous, test IDs, translation keys)
- `nfr-requirements/tech-stack-decisions.md` — records which tools were chosen and why

---

#### Stage 7: NFR Design
**What it does**: Takes the NFR requirements and turns them into a concrete design. For this
project, that meant designing exactly how each test would be structured — what test inputs to
use, what properties to check, and how to reproduce a failing test.

**Your action**: **APPROVE** or ask for changes.

**Why**: The test design is as important as the code design. A poorly designed test can give
you false confidence — it passes even when the code is wrong. Designing the tests before
writing them ensures they actually verify what they claim to verify.

**Output**:
- `nfr-design/nfr-design-patterns.md` — exact `fc.Arbitrary` (input generator) definitions for each function; all property assertions listed
- `nfr-design/logical-components.md` — where test files live, how they are structured, how to reproduce a failure using the seed number

---

#### Stage 8: Code Generation
**What it does**: The AI actually writes the code. This happens in two parts:

- **Part 1 (Plan)**: The AI writes a numbered checklist of every file it will touch and every
  change it will make. No code is written yet.
- **Part 2 (Generate)**: After you approve the plan, the AI executes each step one by one,
  checking off each item as it goes.

**Your action**: **APPROVE THE PLAN** (Part 1), then the AI runs automatically (Part 2),
then **APPROVE THE CODE** (after reviewing the result).

**Why two steps?**: The plan lets you catch "wait, don't touch that file" or "you forgot X"
before any code is written. It also gives you a clear record of what changed and why.

**Files changed in this project**:

| File | What Changed |
|---|---|
| `components/learning-zone.tsx` | Added Grade 2 tab, 3 categories, 5 generator functions, 3 question lists |
| `data/translations.ts` | Added Vietnamese + English labels for all new Grade 2 content |
| `package.json` | Added 4 testing packages + 3 test scripts |
| `vitest.config.ts` | Created — tells Vitest how to run tests for this project |
| `__tests__/learning-zone.pbt.test.ts` | Created — 24 property-based tests |
| `__tests__/learning-zone.test.ts` | Created — 14 boundary/example tests |

---

#### Stage 9: Build and Test
**What it does**: The AI writes instructions for how to build and test the project, then
actually runs the automated tests.

**Your action**: **APPROVE** (after reviewing the test results).

**Test results for this project**:
```
✓ 24 PBT tests (property-based — 100 random inputs each = 2,400 checks)
✓ 14 example tests (specific known values)
─────────────────────────────────────────
✓ 38 / 38 tests passed
```

One test bug was found and fixed during this stage: the test for "smallest product 2×1=2"
was matching `"2 × 10"` because `"2 × 1"` is a substring of `"2 × 10"`. Fixed by using
exact string matching instead.

**Output**:
- `build-and-test/build-instructions.md` — how to run `npm install`, lint, build
- `build-and-test/unit-test-instructions.md` — how to run tests and reproduce failures
- `build-and-test/integration-test-instructions.md` — 6-step manual checklist
- `build-and-test/build-and-test-summary.md` — full results and requirements traceability

---

### PHASE 3 — OPERATIONS *(Placeholder)*

**What it is meant to be**: Deployment planning, monitoring setup, incident response, rollout
strategy, production readiness checklist.

**Current status**: Not yet implemented in AIDLC. The folder exists in the structure but
contains no files — this is by design. For this project, deployment is handled automatically
by Vercel when you push to GitHub, so no manual operations steps are needed anyway.

---

## Approve / Reject / Input — Quick Reference

| Action | When to use | How to do it |
|---|---|---|
| **Approve** | You are happy with what the AI produced and want to move forward | Type "approve", "approve and continue", or similar |
| **Request Changes** | Something is wrong or missing in the AI's output | Describe what needs to change — the AI will update and ask again |
| **Answer Questions** | The AI has presented a question file with `[Answer]:` tags | Type your answers (e.g. "Done" after filling in letters) |
| **Add Requirements** | You want to add something the AI missed | State what to add — the AI updates the requirements document before proceeding |
| **Create a QA Gate** | You want the workflow to pause for review | Ask explicitly: "Create a QA gate — I am the reviewer" |

---

## Why This Process Instead of Just Asking the AI to Write Code?

| Direct prompt | AIDLC |
|---|---|
| AI guesses what you want | AI asks until it knows exactly what you want |
| Requirements often missed | Requirements written down before any code |
| Hard to review a wall of code | Each stage is reviewed separately |
| Test coverage is an afterthought | Tests are designed before code is written |
| No audit trail | Every decision and approval is logged in `audit.md` |
| Hard to resume after a break | `aidlc-state.md` tracks exactly where you are |

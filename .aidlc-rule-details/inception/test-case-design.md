# Test Case Design

**Purpose**: Define every test scenario before code is written. This step acts as a
QA/PM gate — all test cases are reviewed and approved during INCEPTION so that
Code Generation knows exactly what automated and manual tests to produce.

**Execute when**: The initiative includes any user-facing behaviour, API changes, or
business-logic changes. Always execute for feature additions and enhancements.

**Skip when**: Pure internal refactoring with no user-facing or API surface changes,
and the team explicitly confirms no new test coverage is needed.

**Placed after**: Requirements Analysis (and User Stories if executed)
**Placed before**: Workflow Planning

---

## Step 1: Extract Coverage Areas from Requirements

Read:
- `aidlc-docs/{initiative-slug}/inception/requirements/requirements.md`
- `aidlc-docs/{initiative-slug}/inception/requirements/requirement-verification-questions.md` (answers)
- Reverse engineering artifacts if brownfield (for existing user flows to protect)

Identify and list:
- Every **acceptance criterion** that has an observable UI or API outcome
- Every **API endpoint** added or changed
- Every **business rule** that can produce a wrong result if broken
- Every existing flow that could **regress** due to this change

This list becomes the raw input for the QA questions.

---

## Step 2: Generate QA Clarifying Questions

**MANDATORY**: Create `aidlc-docs/{initiative-slug}/inception/test-cases/test-case-questions.md`
using the question-format-guide.md rules (lettered options, [Answer]: tags, dedicated file).

Questions MUST cover all of the areas below. Write them in plain language — avoid
technical jargon like "regression suite" or "E2E harness". Frame them as a QA lead
or PM would ask a developer.

### Required question areas

**Area 1 — Critical user paths**
Ask which user flows are the most important to verify automatically after every push.
Example: "Which of these new screens or actions MUST be verified by an automated
browser test? Select all that apply."
Provide one option per acceptance criterion identified in Step 1.

**Area 2 — Edge cases and error paths**
Ask what can go wrong and whether those failure modes should be tested.
Example: "Should we add automated tests for these error conditions?"
Options: login failure, invalid input, empty states, boundary values, etc.

**Area 3 — Manual-only scenarios**
Ask which scenarios cannot or should not be automated — things a developer must
check personally after each deployment.
Example: "Which of these are too complex to automate and should remain on a manual
checklist for the developer to check after pushing to main?"
Options: multi-device layout, real payment flow, email delivery, third-party OAuth, etc.

**Area 4 — Browser / device scope for E2E**
Ask which browsers and devices the automated E2E tests should target.
Options: Chrome only / Chrome + Firefox / Chrome + Firefox + Safari / Mobile viewport too.

**Area 5 — Data and authentication preconditions**
Ask what state the test account or test data must be in before tests run.
Example: "Do any of the new automated tests require a specific player coin balance,
unlocked stickers, or a particular quiz history?"

**Area 6 — Regression boundary**
Ask which existing flows must keep working after this change.
Example: "Which existing features must we explicitly re-verify after this change
to confirm nothing broke?"

### ⛔ GATE: Await user answers
Do NOT proceed to Step 3 until every question in `test-case-questions.md` is answered.
Present the question file path and STOP.

---

## Step 3: Generate Test Case Design Document

**PREREQUISITE**: All question answers received and analysed for ambiguity.

Create `aidlc-docs/{initiative-slug}/inception/test-cases/test-case-design.md`:

```markdown
# Test Case Design — {initiative-slug}

**Status**: Awaiting QA/PM approval
**Last updated**: {ISO timestamp}

## Coverage Summary

| Type | Count | Source |
|---|---|---|
| Automated E2E (TC-E) | {n} | Playwright |
| Manual Verification (TC-M) | {n} | Developer checklist |
| **Total** | {n} | |

---

## Automated E2E Test Cases (TC-E)

These cases will be generated as Playwright spec files in `automation_tests/e2e/`.
They run automatically in CI on every push to main.

### TC-E{n} | {Plain-English title that describes what the user does and what should happen}

**Preconditions**: {What must be true before the test starts — logged in, data state, etc.}
**Browser scope**: {Which browsers — from Area 4 answer}
**Steps**:
1. {First action}
2. {Second action}
**Expected result**: {What the user sees or what the system does}
**Assertions**: {Specific data-testid attributes or network calls to verify}
**data-testid(s) needed**: {List any new testid attributes the component must expose}

[Repeat for each E2E test case]

---

## Manual Verification Test Cases (TC-M)

These cases appear in `MANUAL-TEST-CHECKLIST.md` at the repo root.
A developer must work through this checklist after every push to main before
marking the deploy as complete.

### TC-M{n} | {Plain-English title}

**When to verify**: After pushing to main; before closing the PR or deploy ticket
**Preconditions**: {App running, logged in, specific data state}
**Steps**:
1. {First action}
2. {Second action}
**Expected result**: {What to see or measure}
**What to specifically check**: {Exact UI element, value, log output, or behaviour
that a developer must look at to confirm this works}

[Repeat for each manual test case]

---

## Regression Guard

The following existing flows must be re-verified after this change:

| Flow | Type | How to verify |
|---|---|---|
| {Existing flow name} | Automated / Manual | {Which test covers it or what to check} |

---

## data-testid Attribute Requirements

List every new `data-testid` attribute that the E2E test cases depend on.
Code Generation MUST add these attributes to the generated components.

| Attribute | Element | Used by |
|---|---|---|
| {testid value} | {Component and element type} | {TC-E number} |
```

---

## Step 4: QA/PM Approval Gate

Present the completed `test-case-design.md` for review. Ask the user to:
- Confirm all critical flows are covered
- Add or remove test cases
- Adjust manual vs automated split

Do NOT proceed to Workflow Planning until the user explicitly approves.

```markdown
> **📋 REVIEW REQUIRED:**
> Please examine the test case design at:
> `aidlc-docs/{initiative-slug}/inception/test-cases/test-case-design.md`
>
> As QA/PM, confirm:
> - ✅ All acceptance criteria are covered by at least one TC-E or TC-M
> - ✅ The manual checklist contains everything that cannot be automated
> - ✅ The data-testid list is complete (Code Generation will add these to components)

> **🚀 WHAT'S NEXT?**
>
> 🔧 **Request Changes** — Add, remove, or reclassify test cases
> ✅ **Approve & Continue** — Proceed to Workflow Planning
```

---

## Step 5: Post-Approval Actions

After approval:

1. Update `test-case-design.md` status from "Awaiting QA/PM approval" → "Approved"

2. Update `aidlc-docs/{initiative-slug}/aidlc-state.md`:
```markdown
- [x] Test Case Design — Completed {timestamp}
  - TC-E count: {n}
  - TC-M count: {n}
  - Approved by user
```

3. Log in `audit.md`:
```markdown
## Test Case Design — Approved
**Timestamp**: {ISO timestamp}
**TC-E cases**: {n}
**TC-M cases**: {n}
**User response**: "{exact user response}"
```

4. Record the approved file path in `aidlc-state.md` under a `## Test Scope` section
   so Code Generation and Build and Test can read it:
```markdown
## Test Scope
- **Test Case Design file**: aidlc-docs/{initiative-slug}/inception/test-cases/test-case-design.md
- **TC-E count**: {n}
- **TC-M count**: {n}
```

---

## Rules for Writing Test Cases

**TC-E (Automated) rules:**
- Write the title as a sentence describing user action + expected result: "Grade 2 tab shows Math, Vietnamese, English cards" — not "Verify tab render"
- Keep steps short — 2–5 steps per case; split long flows into multiple cases
- Every step must be achievable by Playwright `click`, `fill`, `waitFor`, `getByTestId`
- Every assertion must be observable in the DOM (visible element, network call, URL)
- If a step requires a `data-testid` that doesn't exist yet, add it to the "data-testid Attribute Requirements" table — Code Generation will add it

**TC-M (Manual) rules:**
- Must be something Playwright genuinely cannot automate (real email, native OS dialog, third-party OAuth, physical device, subjective visual check)
- "What to specifically check" must be concrete — not "verify it works" but "the coin counter in the top-right must increase by 5–30 coins"
- Include the exact URL or navigation path the developer should go to

**Numbering:**
- TC-E cases: TC-E001, TC-E002, … (sequential within the initiative)
- TC-M cases: TC-M001, TC-M002, … (sequential within the initiative)
- Numbers do not reset between units of work
- Existing test cases from prior initiatives keep their original numbers; new ones continue from the highest existing number

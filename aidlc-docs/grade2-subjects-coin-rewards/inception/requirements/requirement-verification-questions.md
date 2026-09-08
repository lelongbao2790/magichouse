# Requirement Verification Questions

Please answer the following questions by filling in the letter choice after each `[Answer]:` tag.
If none of the options match your needs, choose the last option (Other) and describe your preference after the tag.
Let me know when you're done.

---

## Question 1
How should the Grade 2 subject navigation work in the UI?

Currently, Grade 2 shows 3 flat category cards (Addition, Subtraction, Times Table) directly in the tab panel.
With subjects added, there are two possible navigation patterns:

A) Two-level navigation — Grade 2 tab shows 3 subject cards (Math, Vietnamese, English). Clicking "Math" drills into a sub-view showing Addition, Subtraction, Times Table cards. Back button returns to the subject list.

B) Expanded flat layout — Grade 2 tab shows all items: a "Math" header/section, then Addition/Subtraction/Times Table cards under it, followed by Vietnamese and English cards (no drill-down, everything visible at once).

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
What difficulty level should be assigned to each Grade 2 practice?

The requirement says coins depend on difficulty (Easy / Medium / Hard), but does not specify which practice maps to which level.

A) Addition = Easy, Subtraction = Medium, Times Table = Hard

B) All three Math practices (Addition, Subtraction, Times Table) = Medium; Vietnamese and English = Easy

C) Difficulty is per-question, not per-practice — each question should randomly be assigned Easy, Medium, or Hard

D) Other (please describe after [Answer]: tag below — e.g., specify exactly which practice maps to which level)

[Answer]: C

---

## Question 3
What should Vietnamese and English subjects show for Grade 2 (since their content is described as "to be added separately")?

A) Show an empty subject card that opens to a "Coming Soon" placeholder screen when clicked

B) Show the subject card as disabled/greyed-out with a "Coming Soon" label — clicking does nothing

C) Reuse the same Vietnamese and English quiz content that already exists in Grade 1

D) Other (please describe after [Answer]: tag below)

[Answer]: D you think and random the question and answer for two part Vietnamese and English for grade 2

---

## Question 4
The requirement specifies that Hard difficulty rewards 10–30 coins randomly — the same range as Medium. Is this intentional?

A) Yes — Medium and Hard intentionally have the same coin range (10–30 random)

B) No — Hard should reward more coins than Medium. Please use 20–50 coins for Hard.

C) Other (please describe after [Answer]: tag below — e.g., specify different ranges)

[Answer]: A

---

## Question 5
For Easy difficulty, the requirement says "10 coins or less." What should the exact Easy coin reward be?

A) Fixed 10 coins (same as the current default — no change for Easy)

B) Fixed 5 coins

C) Random between 5 and 10 coins

D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 6
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 7
Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)**. It steers requirements, design, and code toward fault tolerance, high availability, observability, and recoverability.

**What this extension is NOT.** It does not make your workload production-ready or certify availability targets — it is a starting point that scaffolds good resiliency decisions early.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 8
Should property-based testing (PBT) rules be enforced for this project?

The project already uses fast-check for property-based tests on question generators. This extension would enforce PBT rules for the new coin calculation logic.

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions (e.g., the coin calculation function)

C) No — skip all PBT rules

X) Other (please describe after [Answer]: tag below)

[Answer]: B

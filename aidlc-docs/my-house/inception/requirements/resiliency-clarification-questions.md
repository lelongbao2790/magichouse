# Resiliency Baseline — Required Clarification Questions

You opted into the **Resiliency Baseline** extension for `my-house`. That extension's rules
explicitly forbid the AI from assuming answers to these questions — they must come from you, even
though this is a small Next.js + Vercel + Supabase hobby app, not an enterprise cloud workload
with its own infrastructure. Several "N/A" / lowest-tier options exist below precisely for a
project at this scale — pick whichever genuinely fits, not whichever sounds most rigorous.

Please fill in each `[Answer]:` tag and let me know when done.

---

## Question 1 — RTO/RPO Goals and Disaster Recovery Strategy

What are your Recovery Time Objective (RTO) and Recovery Point Objective (RPO) goals for this app? (Context: this is a Vercel-hosted Next.js app on a single hosted Supabase Postgres instance — there is no existing multi-region or IaC setup.)

A) RPO/RTO: Hours — Backup & Restore strategy. Lowest cost. Suitable for non-critical workloads.

B) RPO/RTO: 10s of minutes — Pilot Light strategy.

C) RPO/RTO: Minutes — Warm Standby strategy.

D) RPO/RTO: Near real-time — Multi-site Active/Active strategy.

E) N/A — Single-region deployment is acceptable, no cross-region DR needed; rely on Supabase's own managed-Postgres durability/backups. *(Likely fit for this project's scale)*

X) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 2 — Change Management Process

How should production changes for `my-house` be governed?

A) Use our existing organizational change management process — name the tool/process.

B) No formal process exists yet — propose a lightweight change management process (change record + approval + rollback note) for the team to adopt.

C) N/A — this workload is exempt from formal change management (personal/family project, no external users depending on an SLA). *(Likely fit for this project's scale)*

X) Other (describe after [Answer]: tag below)

[Answer]:A

---

## Question 3 — CI/CD and Deployment Tooling

What CI/CD tooling and deployment process should this workload use?

A) Use our existing pipeline — GitHub Actions runs tests/lint on push/PR (see `.github/workflows/ci.yml`); Vercel auto-deploys from the connected Git branch on merge. *(Matches what's already in the repo)*

B) No pipeline exists — propose a new CI/CD pipeline definition.

X) Other (describe after [Answer]: tag below)

[Answer]:A

---

## Question 4 — Rollback Mechanism

How should a failed production deployment be rolled back?

A) Redeploy previous version — for this project, that means using Vercel's built-in "Instant Rollback" to a prior deployment (no custom tooling needed). *(Matches Vercel's built-in capability)*

B) Blue/green swap back to the previous environment

C) Canary auto-rollback on health/metric regression

D) Database-aware rollback required (schema/data migration reversal) — flag for explicit design (relevant here since this feature adds new tables/migrations)

E) Use our organization's existing rollback procedure — provide reference

X) Other (describe after [Answer]: tag below)

[Answer]:A

---

## Question 5 — Deployment Style

What deployment strategy is acceptable for this workload's risk profile?

A) Direct / in-place — this is effectively what Vercel does today (new deployment replaces the live one atomically); acceptable for a non-critical, low-traffic kids' app. *(Matches current setup)*

B) Rolling (gradual instance replacement)

C) Blue/green (zero-downtime cutover, higher cost)

D) Canary (progressive traffic shift with automated rollback)

X) Other (describe after [Answer]: tag below)

[Answer]:A

---

## Question 6 — Regional Topology

Does this workload require multi-region deployment, or is single-region sufficient?

A) Single-region — Vercel's edge network serves static/cached content globally already; the Supabase Postgres instance itself is single-region. No custom multi-zone/multi-region setup exists or is being proposed. *(Matches current setup and Question 1's likely answer)*

B) Multi-region active-passive

C) Multi-region active-active

X) Other (describe after [Answer]: tag below)

[Answer]:A

---

## Question 7 — Incident Response Process

How are production incidents handled for this workload today?

A) Use our existing incident response process — name/describe it.

B) No formal process exists — propose a lightweight incident response note (e.g., "check Vercel deployment logs + Supabase logs, roll back via Vercel dashboard") for future reference. *(Likely fit for this project's scale)*

X) Other (describe after [Answer]: tag below)

[Answer]:A

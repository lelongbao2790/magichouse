# NFR Design Plan — U1: house-schema-and-service

**Status**: Awaiting user answer
**Last updated**: 2026-09-13

---

## Purpose

Incorporate U1's NFR requirements into design patterns and logical components. Per
`execution-plan.md`, NFR Design runs for **U1 only** (not U2) specifically to satisfy the
Resiliency Baseline extension's mandatory RESILIENCY-14 question, which the extension's own
rule requires be asked at NFR Design rather than assumed. U2's NFR Design is explicitly skipped
— it will reference this unit's answer rather than re-asking.

---

## Mandatory Question (RESILIENCY-14 — extension-mandated, not optional)

### Question: Resiliency Testing Approach

How will resiliency mechanisms (failover, recovery) be validated?

A) Use our existing DR testing / game day / chaos engineering practice — provide the reference.
   AI-DLC will document test scenarios that fit it.

B) No practice exists — AI-DLC should propose a DR testing schedule and chaos experiment plan
   for adoption. *(Likely fit given this project's scale and the R1-R7 answers already given at
   Requirements Analysis, which described a lightweight, informal posture throughout — but not
   marked "Recommended" since this is the extension's own mandated question, not one AI-DLC is
   framing a default for)*

C) Defer to the Operations phase — capture test scenarios now, execute during Operations.

X) Other (describe after [Answer]: tag below)

[Answer]:B

---

## Other NFR Design Categories — Resolved, No Question Needed

Per `nfr-design.md`'s mandatory category evaluation, each is assessed explicitly below; none
surfaces a genuine open decision beyond the RESILIENCY-14 question above.

- **Resilience Patterns** (fault tolerance, retry): No retry logic anywhere in this codebase
  today (client calls use simple try/catch with silent fallback, e.g. `coin-context.tsx`'s
  `.catch(() => {})`); this matches the already-accepted RESILIENCY-10 "partially compliant"
  posture and Q2a=A's silent-fallback test-scope decision. U1 introduces no new pattern here.
- **Scalability Patterns**: Vercel serverless auto-scaling by platform default — no custom
  pattern (matches RESILIENCY-09: N/A, unchanged).
- **Performance Patterns**: Indexing strategy already decided in NFR Requirements
  (`tech-stack-decisions.md`); no additional pattern (caching, batching) needed at this scale.
- **Security Patterns**: Already fully specified as concrete business rules in
  `business-rules.md` (auth checks, RLS, Zod validation, SQL-level guards) — nothing left at
  the "pattern" level that isn't already a concrete rule.
- **Logical Components** (queues, caches, circuit breakers): None — matches the existing
  codebase's complete absence of any such component anywhere, for any feature, at this scale.

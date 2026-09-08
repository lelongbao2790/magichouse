# NFR Requirements Plan — coin-rewards-difficulty

## Unit Context
- **Unit**: coin-rewards-difficulty
- **Functional Design**: Complete
- **PBT Extension**: Partial opt-in (Q8=B) — pure functions only

## Question Assessment

All NFR categories evaluated. No user questions needed — all decisions pre-determined:

- **Scalability**: Not applicable — client-side pure functions, no load or growth concerns
- **Performance**: Not applicable — `calculateSessionCoins` is O(n) called once per quiz; negligible cost
- **Availability**: Not applicable — no new services, endpoints, or infrastructure added
- **Security**: Not applicable — no auth, data access, or user-input paths changed
- **Tech Stack**: Pre-determined — Vitest (existing) + fast-check (existing) for PBT; TypeScript strict types
- **Reliability**: Defensive default covered in BR-3 (empty array → 'easy'); no additional error paths
- **Maintainability**: PBT scope defined by Q8=B; TypeScript `Difficulty` union type enforces correctness at compile time
- **Usability**: Badge rendering covered in Functional Design (frontend-components.md)

## Artifacts to Generate

- [x] `nfr-requirements/nfr-requirements.md`
- [x] `nfr-requirements/tech-stack-decisions.md`

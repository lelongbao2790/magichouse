# Tech Stack Decisions — Grade2MathFeature

## Decision 1: PBT Framework — fast-check

| Field | Value |
|---|---|
| **Decision** | Use `fast-check` as the property-based testing framework |
| **Rule** | PBT-09 (mandatory framework selection) |
| **Version** | `fast-check` v3.x (latest stable) |
| **Language** | TypeScript (native support, no additional types package needed) |
| **Rationale** | Only TypeScript/JavaScript PBT framework with full support for: custom generators (Arbitrary API), automatic shrinking, seed-based reproducibility, and native integration with Vitest. Actively maintained, used widely in the TS ecosystem. |
| **Capabilities verified** | ✅ Custom generators (Arbitrary/fc.integer, fc.constantFrom, etc.) |
| | ✅ Automatic shrinking of failing cases |
| | ✅ Seed-based reproducibility (`fc.assert` with `{ seed, verbose }`) |
| | ✅ Native Vitest integration (no adapter needed — `fc.assert` works inside any `test()` block) |
| **New dependency** | `"fast-check": "^3.22.0"` → `devDependencies` in `package.json` |

---

## Decision 2: Test Runner — Vitest

| Field | Value |
|---|---|
| **Decision** | Use Vitest as the test runner |
| **Selected by** | User (Q1 answer A) |
| **Version** | `vitest` latest stable (`^3.x`) |
| **Rationale** | Native ESM support with zero configuration for Next.js 16 (which uses ESM by default). Significantly faster than Jest for TypeScript projects. No need for Babel transforms or `jest.config.js` module shims. Compatible with `fast-check` out of the box. |
| **New dependencies** | `"vitest": "^3.0.0"` → `devDependencies` |
| | `"@vitest/coverage-v8": "^3.0.0"` → `devDependencies` (for coverage reports) |
| **Config file** | `vitest.config.ts` — to be created at workspace root |

### Vitest Configuration (to be generated at Code Generation)

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
```

**Note on `@` alias**: The project uses `@/` path aliases (e.g., `@/contexts/coin-context`). The Vitest config must replicate the `tsconfig.json` path alias so imports resolve correctly in tests.

### Test Script Additions to package.json

```json
"scripts": {
  "test":         "vitest run",
  "test:watch":   "vitest",
  "test:coverage": "vitest run --coverage"
}
```

---

## Decision 3: PBT Seed Logging Strategy

| Field | Value |
|---|---|
| **Rule** | PBT-08 (shrinking and reproducibility) |
| **Decision** | Use `fast-check`'s built-in verbose seed logging on failure |
| **Implementation** | Pass `{ verbose: true }` to `fc.assert()` in all PBT tests — on failure, fast-check prints the seed and shrunk minimal counter-example to the test output |
| **CI integration** | Vitest's `--reporter=verbose` flag combined with fast-check's verbose output satisfies PBT-08 seed logging requirements |
| **Fixed seed** | Not used in CI — random seed per run is preferred to maximise coverage over time; failing seed is captured from verbose output |

---

## Complete New Dev Dependency List

| Package | Version | Purpose |
|---|---|---|
| `fast-check` | `^3.22.0` | Property-based testing framework (PBT-09) |
| `vitest` | `^3.0.0` | Test runner |
| `@vitest/coverage-v8` | `^3.0.0` | Coverage reporting |
| `@vitejs/plugin-react` | `^4.0.0` | React JSX transform for Vitest |

**Total new packages**: 4 dev dependencies.  
**No new production dependencies.**  
**No changes to existing dependencies.**

---

## PBT-09 Compliance Summary

| Verification Criterion | Status |
|---|---|
| PBT framework selected and documented | ✅ fast-check v3.x |
| Framework included in project dependencies | ✅ Added to devDependencies |
| Supports custom generators | ✅ fc.integer, fc.constantFrom, fc.tuple, Arbitrary API |
| Supports automatic shrinking | ✅ Built-in, enabled by default |
| Supports seed-based reproducibility | ✅ `{ seed, verbose }` in fc.assert |
| Integrates with test runner | ✅ Vitest — no adapter needed |
| Multiple languages covered | ✅ TypeScript only — one framework sufficient |

**PBT-09: COMPLIANT — no blocking findings.**

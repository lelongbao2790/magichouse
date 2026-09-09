import { describe, test, expect } from "vitest"
import { isAdminEmail } from "@/lib/admin-auth"

describe("isAdminEmail", () => {
  const csv = "you@example.com, Teammate@Example.com ,  boss@corp.io"

  test("TC-U122 | exact match returns true", () => {
    expect(isAdminEmail("you@example.com", csv)).toBe(true)
  })

  test("TC-U123 | case-insensitive on both sides", () => {
    expect(isAdminEmail("YOU@EXAMPLE.COM", csv)).toBe(true)
    expect(isAdminEmail("teammate@example.com", csv)).toBe(true)
  })

  test("TC-U124 | surrounding whitespace on the input and the entries is ignored", () => {
    expect(isAdminEmail("  boss@corp.io  ", csv)).toBe(true)
  })

  test("TC-U125 | an email not in the list returns false", () => {
    expect(isAdminEmail("stranger@example.com", csv)).toBe(false)
  })

  test("TC-U126 | undefined / empty / whitespace allowlist -> false (fail closed)", () => {
    expect(isAdminEmail("you@example.com", undefined)).toBe(false)
    expect(isAdminEmail("you@example.com", "")).toBe(false)
    expect(isAdminEmail("you@example.com", "   ")).toBe(false)
  })

  test("TC-U127 | null / undefined / empty email -> false", () => {
    expect(isAdminEmail(null, csv)).toBe(false)
    expect(isAdminEmail(undefined, csv)).toBe(false)
    expect(isAdminEmail("", csv)).toBe(false)
  })

  test("TC-U128 | trailing comma / blank entries are tolerated", () => {
    expect(isAdminEmail("a@b.com", "a@b.com,,")).toBe(true)
  })
})

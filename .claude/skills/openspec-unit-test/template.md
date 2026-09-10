# Unit Tests: {{module_or_feature}}

## Source

- **Change**: {{change_name}} (if applicable)
- **Spec scenarios covered**: list scenario names from specs

## Test File(s)

| Test File | Module Under Test | Covers |
|-----------|-------------------|--------|
| `automation_tests/unit/<feature>.test.ts` | `lib/...` / `contexts/...` / `components/...` | Functions/scenarios tested |

## Test Cases

### Scenario: {{scenario_name_from_spec}}

```
GIVEN {{precondition}}
WHEN  {{action}}
THEN  {{expected_outcome}}
```

**Test block**: `it('<scenario name>')`
**Setup/Fixtures**: describe any test data, mocks (`vi.mock`), or context Providers needed
**Assertions**: list key assertions

### Scenario: {{next_scenario}}

...

## Coverage Notes

- Edge cases covered: list
- Error paths covered: list
- Not covered (with rationale): list anything intentionally skipped

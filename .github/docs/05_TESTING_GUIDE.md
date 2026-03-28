# 🧪 Testing Standards & Quality Assurance

> **GitHub Copilot Context Instruction:** > 1. Identify the testing framework used in this project (e.g., xUnit, NUnit, Jest, Go Test, PyTest).
> 2. Identify the mocking library (e.g., Moq, NSubstitute, GoMock, Testdouble).
> 3. Generate unit tests that follow the AAA (Arrange, Act, Assert) pattern and the naming conventions defined below.

## 1. Testing Philosophy
- **Test Behavior, Not Implementation:** Focus on what the code does, not how it does it internally.
- **Independence:** Each test must be independent. No shared state between tests.
- **Fast & Reliable:** Unit tests should not connect to real databases or external APIs. Use Mocks/Stubs.

## 2. Naming Convention
We use the **MethodName_StateUnderTest_ExpectedBehavior** pattern.
- *Example (C#):* `Withdraw_InvalidAmount_ShouldThrowException`
- *Example (Go):* `TestWithdraw_InvalidAmount_ReturnsError`

## 3. The AAA Pattern
Every test should be clearly divided into three sections:
1. **Arrange:** Set up the objects, mocks, and data needed for the test.
2. **Act:** Execute the specific method or action being tested.
3. **Assert:** Verify that the outcome matches expectations.

## 4. Coverage Requirements
- **Core Business Logic (Domain):** 100% Coverage.
- **Services/Use Cases:** >80% Coverage.
- **Infrastructure/API:** Integration tests for critical paths only.

## 5. Mocking Guidelines
- **Mock Interfaces, Not Classes:** Only mock what we own or stable abstractions.
- **Verify Interactions:** Ensure that critical dependency methods (e.g., `Save()`, `SendEmail()`) were called exactly once.

## 6. How to Generate Tests with Copilot
When asking Copilot to write tests, use this prompt structure:
*"@workspace Write unit tests for the service [FileName] following the standards in **05-TESTING_STANDARDS.md**. Use [Testing Framework] and [Mocking Library]. Ensure all edge cases are covered."*

---
*Remember: Untested code is broken code. Always run the full test suite before pushing your branch.*
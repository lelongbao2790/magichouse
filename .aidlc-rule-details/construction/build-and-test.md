# Build and Test

**Purpose**: Build all units and execute comprehensive testing strategy

## Prerequisites
- Code Generation must be complete for all units
- All code artifacts must be generated
- Project is ready for build and testing

---

## Step 1: Analyze Testing Requirements

Analyze the project to determine appropriate testing strategy:
- **Unit tests**: Already generated per unit during code generation
- **Integration tests**: Test interactions between units/services
- **Performance tests**: Load, stress, and scalability testing
- **End-to-end tests**: Complete user workflows
- **Contract tests**: API contract validation between services
- **Security tests**: Vulnerability scanning, penetration testing

**MANDATORY — Existing Test Infrastructure Check**:

Read `aidlc-docs/{initiative-slug}/aidlc-state.md` for the `## Test Scope` entry recorded during Requirements Analysis. Then scan the project's test directories to confirm what actually exists.

**Rules**:
- Any test folder that **contains real test files** (not just `.gitkeep`) MUST be included in the test plan. Do not skip it.
- Any test folder that was **selected by the user in Requirements Analysis** MUST receive new tests covering the feature's behavior — even if that folder currently has no files.
- A test type is only N/A when: (a) the folder does not exist AND (b) the user did not select it in Requirements Analysis.
- Do not skip E2E or API tests solely because "only unit tests were written during code generation" — if the user chose them, generate the test files now.

---

## Step 2: Install Dependencies (Mandatory — Run Before Any Build or Test)

Before generating build instructions or running any commands, **always install dependencies first**. This is required because code generation in the previous stage may have added new packages to `package.json` that are not yet installed in `node_modules`.

**Detect ALL lockfiles present and run install for each:**

```bash
# pnpm — check for pnpm-lock.yaml
pnpm install

# npm — check for package-lock.json
npm install

# yarn — check for yarn.lock
yarn install

# bun — check for bun.lock or bun.lockb
bun install
```

**Rules:**
- Always run install regardless of whether you believe packages changed — it is idempotent and safe.
- **A project may have multiple lockfiles** (e.g. `pnpm-lock.yaml` for local dev AND `bun.lock` for CI). Run install for **every** package manager whose lockfile exists in the repo root. Updating only one lockfile will cause the other CI job to fail with a frozen-lockfile error.
- Never use `--frozen-lockfile` / `--immutable` flags here — new packages from code generation must be written to the lockfile.
- After all installs succeed, commit **all** updated lockfiles and `package.json` before proceeding.
- If a postinstall script is blocked (e.g. `bun pm untrusted`), run `bun pm trust <package>` to approve it so the lockfile records the approval.
- If install fails (e.g. a missing peer dep or registry error), stop and report the error to the user before continuing.

---

## Step 3: Generate Build Instructions

Create `aidlc-docs/{initiative-slug}/construction/build-and-test/build-instructions.md`:

```markdown
# Build Instructions

## Prerequisites
- **Build Tool**: [Tool name and version]
- **Dependencies**: [List all required dependencies]
- **Environment Variables**: [List required env vars]
- **System Requirements**: [OS, memory, disk space]

## Build Steps

### 1. Install Dependencies
\`\`\`bash
[Command to install dependencies]
# Example: npm install, mvn dependency:resolve, pip install -r requirements.txt
\`\`\`

### 2. Configure Environment
\`\`\`bash
[Commands to set up environment]
# Example: export variables, configure credentials
\`\`\`

### 3. Build All Units
\`\`\`bash
[Command to build all units]
# Example: mvn clean install, npm run build, brazil-build
\`\`\`

### 4. Verify Build Success
- **Expected Output**: [Describe successful build output]
- **Build Artifacts**: [List generated artifacts and locations]
- **Common Warnings**: [Note any acceptable warnings]

## Troubleshooting

### Build Fails with Dependency Errors
- **Cause**: [Common causes]
- **Solution**: [Step-by-step fix]

### Build Fails with Compilation Errors
- **Cause**: [Common causes]
- **Solution**: [Step-by-step fix]
```

---

## Step 4: Generate Unit Test Execution Instructions

Create `aidlc-docs/{initiative-slug}/construction/build-and-test/unit-test-instructions.md`:

```markdown
# Unit Test Execution

## Run Unit Tests

### 1. Execute All Unit Tests
\`\`\`bash
[Command to run all unit tests]
# Example: mvn test, npm test, pytest tests/unit
\`\`\`

### 2. Review Test Results
- **Expected**: [X] tests pass, 0 failures
- **Test Coverage**: [Expected coverage percentage]
- **Test Report Location**: [Path to test reports]

### 3. Fix Failing Tests
If tests fail:
1. Review test output in [location]
2. Identify failing test cases
3. Fix code issues
4. Rerun tests until all pass
```

---

## Step 5: Generate Integration Test Instructions

Create `aidlc-docs/{initiative-slug}/construction/build-and-test/integration-test-instructions.md`:

```markdown
# Integration Test Instructions

## Purpose
Test interactions between units/services to ensure they work together correctly.

## Test Scenarios

### Scenario 1: [Unit A] → [Unit B] Integration
- **Description**: [What is being tested]
- **Setup**: [Required test environment setup]
- **Test Steps**: [Step-by-step test execution]
- **Expected Results**: [What should happen]
- **Cleanup**: [How to clean up after test]

### Scenario 2: [Unit B] → [Unit C] Integration
[Similar structure]

## Setup Integration Test Environment

### 1. Start Required Services
\`\`\`bash
[Commands to start services]
# Example: docker-compose up, start test database
\`\`\`

### 2. Configure Service Endpoints
\`\`\`bash
[Commands to configure endpoints]
# Example: export API_URL=http://localhost:8080
\`\`\`

## Run Integration Tests

### 1. Execute Integration Test Suite
\`\`\`bash
[Command to run integration tests]
# Example: mvn integration-test, npm run test:integration
\`\`\`

### 2. Verify Service Interactions
- **Test Scenarios**: [List key integration test scenarios]
- **Expected Results**: [Describe expected outcomes]
- **Logs Location**: [Where to check logs]

### 3. Cleanup
\`\`\`bash
[Commands to clean up test environment]
# Example: docker-compose down, stop test services
\`\`\`
```

---

## Step 6: Generate Performance Test Instructions (If Applicable)

Create `aidlc-docs/{initiative-slug}/construction/build-and-test/performance-test-instructions.md`:

```markdown
# Performance Test Instructions

## Purpose
Validate system performance under load to ensure it meets requirements.

## Performance Requirements
- **Response Time**: < [X]ms for [Y]% of requests
- **Throughput**: [X] requests/second
- **Concurrent Users**: Support [X] concurrent users
- **Error Rate**: < [X]%

## Setup Performance Test Environment

### 1. Prepare Test Environment
\`\`\`bash
[Commands to set up performance testing]
# Example: scale services, configure load balancers
\`\`\`

### 2. Configure Test Parameters
- **Test Duration**: [X] minutes
- **Ramp-up Time**: [X] seconds
- **Virtual Users**: [X] users

## Run Performance Tests

### 1. Execute Load Tests
\`\`\`bash
[Command to run load tests]
# Example: jmeter -n -t test.jmx, k6 run script.js
\`\`\`

### 2. Execute Stress Tests
\`\`\`bash
[Command to run stress tests]
# Example: gradually increase load until failure
\`\`\`

### 3. Analyze Performance Results
- **Response Time**: [Actual vs Expected]
- **Throughput**: [Actual vs Expected]
- **Error Rate**: [Actual vs Expected]
- **Bottlenecks**: [Identified bottlenecks]
- **Results Location**: [Path to performance reports]

## Performance Optimization

If performance doesn't meet requirements:
1. Identify bottlenecks from test results
2. Optimize code/queries/configurations
3. Rerun tests to validate improvements
```

---

## Step 7: Generate Additional Test Instructions (As Needed)

Based on project requirements and the `## Test Scope` recorded in `aidlc-state.md`, generate additional test instruction files.

### API Tests
**Generate when**: the project has an API test folder (e.g., `automation_tests/api/`) OR the user selected API tests in Requirements Analysis.

Create `aidlc-docs/{initiative-slug}/construction/build-and-test/api-test-instructions.md`:

```markdown
# API Test Instructions

## Purpose
Validate API route contracts — accepted inputs, rejected inputs, and response shapes.
These tests run via the unit test runner (no live server required).

## Run API Tests
\`\`\`bash
[Command — same runner as unit tests, e.g.: bun run test]
# API tests live in automation_tests/api/ and are included in the vitest glob
\`\`\`

## Test Files
- [List each api test file and what route it covers]

## What is covered
- [List valid input variants tested per route]
- [List rejection cases tested per route]

## Expected result
- **Total tests**: [X]
- **All pass**: yes
\`\`\`
```

### Security Tests
Create `aidlc-docs/{initiative-slug}/construction/build-and-test/security-test-instructions.md`:
- Vulnerability scanning
- Dependency security checks
- Authentication/authorization testing
- Input validation testing

### End-to-End Tests
Create `aidlc-docs/{initiative-slug}/construction/build-and-test/e2e-test-instructions.md`:
- Complete user workflow testing
- Cross-service scenarios
- UI testing (if applicable)

### Contract Tests (Microservices only)
Create `aidlc-docs/{initiative-slug}/construction/build-and-test/contract-test-instructions.md` **only** when the project has multiple services that communicate with each other:
- Consumer-driven contract testing
- Inter-service schema validation

---

## Step 8: Generate Test Summary

Create `aidlc-docs/{initiative-slug}/construction/build-and-test/build-and-test-summary.md`:

```markdown
# Build and Test Summary

## Build Status
- **Build Tool**: [Tool name]
- **Build Status**: [Success/Failed]
- **Build Artifacts**: [List artifacts]
- **Build Time**: [Duration]

## Test Execution Summary

### Unit Tests
- **Total Tests**: [X]
- **Passed**: [X]
- **Failed**: [X]
- **Coverage**: [X]%
- **Status**: [Pass/Fail]

### Integration Tests
- **Test Scenarios**: [X]
- **Passed**: [X]
- **Failed**: [X]
- **Status**: [Pass/Fail]

### Performance Tests
- **Response Time**: [Actual] (Target: [Expected])
- **Throughput**: [Actual] (Target: [Expected])
- **Error Rate**: [Actual] (Target: [Expected])
- **Status**: [Pass/Fail]

### API Tests
- **Total Tests**: [X]
- **Passed**: [X]
- **Failed**: [X]
- **Status**: [Pass/Fail/N/A]

### Additional Tests
- **E2E Tests**: [Pass/Fail/N/A]
- **Security Tests**: [Pass/Fail/N/A]
- **Contract Tests**: [Pass/Fail/N/A]

## Overall Status
- **Build**: [Success/Failed]
- **All Tests**: [Pass/Fail]
- **Ready for Operations**: [Yes/No]

## Next Steps
[If all pass]: Ready to proceed to Operations phase for deployment planning
[If failures]: Address failing tests and rebuild
```

---

## Step 9: Update State Tracking

Update `aidlc-docs/{initiative-slug}/aidlc-state.md`:
- Mark Build and Test stage as complete
- Update current status

---

## Step 10: Present Results to User

Present completion message in this structure:
     1. **Completion Announcement** (mandatory): Always start with this:

```markdown
# 🔨 Build and Test Complete
```

     2. **AI Summary** (optional): Provide structured bullet-point summary of build and test results
        - Format: "Build and test has completed with the following results:"
        - List build status and artifacts
        - List test results by category (unit, integration, performance, etc.)
        - List generated instruction files
        - DO NOT include workflow instructions ("please review", "let me know", "proceed to next phase", "before we proceed")
        - Keep factual and content-focused
     3. **Formatted Workflow Message** (mandatory): Always end with this exact format:

```markdown
> **📋 <u>**REVIEW REQUIRED:**</u>**  
> Please examine the build and test summary at: `aidlc-docs/{initiative-slug}/construction/build-and-test/build-and-test-summary.md`



> **🚀 <u>**WHAT'S NEXT?**</u>**
>
> **You may:**
>
> 🔧 **Request Changes** - Ask for modifications to the build and test instructions based on your review
> ✅ **Approve & Continue** - Approve build and test results and proceed to **Operations**

---
```

---

## Step 11: Log Interaction

**MANDATORY**: Log the stage completion in `aidlc-docs/{initiative-slug}/audit.md`:

```markdown
## Build and Test Stage
**Timestamp**: [ISO timestamp]
**Build Status**: [Success/Failed]
**Test Status**: [Pass/Fail]
**Files Generated**:
- build-instructions.md
- unit-test-instructions.md
- api-test-instructions.md (if API tests exist or were selected)
- integration-test-instructions.md
- e2e-test-instructions.md (if E2E tests exist or were selected)
- performance-test-instructions.md (if applicable)
- build-and-test-summary.md

---
```

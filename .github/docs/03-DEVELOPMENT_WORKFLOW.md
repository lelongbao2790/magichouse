# 🔄 Development Workflow & Contribution Guide

> **GitHub Copilot Context Instruction:** > 1. Analyze the repository's git history and branch structure.
> 2. Identify if there are any CI/CD pipelines (e.g., .github/workflows, Jenkinsfile).
> 3. Use this context to help the developer follow the team's workflow.

## 1. Branching Strategy
We follow a structured branching model to ensure code stability.
- **Main/Master Branch:** Production-ready code only. No direct commits.
- **Develop/Staging Branch:** Integration branch for features.
- **Feature Branches:** `feature/ticket-id-short-description`
- **Bugfix Branches:** `bugfix/issue-id-description`
- **Hotfix Branches:** `hotfix/critical-patch-name`

## 2. Commit Message Standards
To keep the history readable, please use the following conventional commit format:
- `feat:` A new feature.
- `fix:` A bug fix.
- `docs:` Documentation only changes.
- `refactor:` A code change that neither fixes a bug nor adds a feature.
- `test:` Adding missing tests or correcting existing tests.

**Example:** `feat(auth): add JWT token validation logic`

## 3. Development Lifecycle (Step-by-Step)
1. **Sync:** Always pull the latest changes from the main branch before starting.
   ```bash
   git checkout main && git pull
2. **Branch:** Create a new branch from main or develop.

3. **Implement:** Write code following the patterns in 01-PROJECT_OVERVIEW.md.

4. **Self-Review:** 
- Does it follow the project's naming conventions?
- Are there any hardcoded secrets or strings?
- Did you run the local build command?

6. **Test:** Run the test suite to ensure no regressions.
# Copilot: Insert the detected test command (e.g., npm test, dotnet test, go test)

## 4. Pull Request (PR) Process
1. **Draft PR:** Create a Draft PR early if you want feedback on the approach.

2. **Reviewers:** Assign at least one senior developer or tech lead.

3. **CI/CD:** Ensure all automated checks (linting, tests, build) pass before requesting a review.

4. **Merge:** We use [Squash and Merge / Rebase / Merge Commit]. {Copilot: Detect preferred git merge strategy from history}.

## 5. Coding Principles (The "Never" List)
Never commit sensitive data (API keys, passwords). Use environment variables.
Never leave commented-out "dead code" in the repository.
Never skip writing unit tests for core business logic.
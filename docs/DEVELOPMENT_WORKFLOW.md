# 🔄 Development Workflow & Contribution Guide

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
   ```
2. **Branch:** Create a new branch from main or develop.

3. **Implement:** Write code following the patterns in PROJECT_GUIDE.md.

4. **Self-Review:** 
- Does it follow the project's naming conventions?
- Are there any hardcoded secrets or strings?
- Did you run the local build command?

5. **Test:** No test suite defined yet. Add tests for new features.

## 4. Pull Request (PR) Process
1. **Draft PR:** Create a Draft PR early if you want feedback on the approach.

2. **Reviewers:** Assign at least one senior developer or tech lead.

3. **CI/CD:** No automated checks are currently enforced. Please run lint and build locally before requesting review.

4. **Merge:** We use **Squash and Merge** as the preferred merge strategy.

## 5. Coding Principles (The "Never" List)
Never commit sensitive data (API keys, passwords). Use environment variables.
Never leave commented-out "dead code" in the repository.
Never skip writing unit tests for core business logic.

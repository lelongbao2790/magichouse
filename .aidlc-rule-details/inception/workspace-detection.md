# Workspace Detection

**Purpose**: Determine workspace state and check for existing AI-DLC projects

## Step 0: Resolve Initiative Slug and Folder

**Every AI-DLC engagement lives in its own folder**: `aidlc-docs/{initiative-slug}/`, containing that
initiative's INCEPTION, CONSTRUCTION, and OPERATIONS artifacts together. A single repo may host
multiple, unrelated AI-DLC initiatives over time (e.g. a repo used for several distinct feature
efforts) — each gets its own `{initiative-slug}` folder. This step determines which folder applies
to the current request, or creates a new one.

### 0.1 Derive a Candidate Slug

From the user's opening request, derive a short kebab-case slug (2-4 words capturing the core
subject, e.g. "add invoice reconciliation" → `invoice-reconciliation`, "migrate auth to OAuth" →
`auth-oauth-migration`). This is the candidate `{initiative-slug}`.

### 0.2 Scan for Existing Initiatives

List existing subfolders of `aidlc-docs/` (each one is a prior or in-progress initiative,
identifiable by containing its own `aidlc-state.md`).

**IF `aidlc-docs/` does not exist or has no subfolders**: This is the first initiative in this repo.
Proceed to 0.4 (auto-create).

**IF one or more initiative folders exist**: Compare the candidate slug and the request's key terms
against each existing folder's name and against the `## Project Information` summary in its
`aidlc-state.md`.

### 0.3 Decide: New Initiative, Resume, or Ambiguous

- **No meaningful overlap with any existing folder**: This is a new, distinct initiative. Proceed to
  0.4 (auto-create).
- **Clear overlap with exactly one existing folder** (the request is plainly a continuation of that
  initiative's subject): Treat this as a resume of that initiative. Set `{initiative-slug}` to the
  existing folder's name and proceed directly to [session-continuity.md](../common/session-continuity.md)
  instead of the rest of this file.
- **Ambiguous** (overlaps partially with one or more folders, or it's unclear whether this is a new
  thread or a continuation): Create `classification-questions.md` (per
  [question-format-guide.md](../common/question-format-guide.md)) listing each candidate existing
  initiative plus a "start a new initiative" option, and wait for the user's answer before
  proceeding. Do not guess.

### 0.4 Auto-Create the Initiative Folder

If the candidate slug collides with an existing folder name that is actually a **different**
initiative (coincidental name overlap resolved as "new" in 0.3), append a numeric suffix (`-2`,
`-3`, ...) to keep folder names unique.

Create the initiative skeleton:
```
aidlc-docs/{initiative-slug}/
├── inception/
├── construction/
└── operations/
```

Mention the created folder name to the user in the Workspace Detection completion message (Step 5
below) — no confirmation gate is required; proceed with the derived name.

All subsequent steps in this file, and all other rule files in this workflow, operate within this
resolved `aidlc-docs/{initiative-slug}/` folder.

## Step 1: Check for Existing AI-DLC Project

Check if `aidlc-docs/{initiative-slug}/aidlc-state.md` exists:
- **If exists**: Resume from last phase (load context from previous phases)
- **If not exists**: Continue with new project assessment

## Step 2: Scan Workspace for Existing Code

**Determine if workspace has existing code:**
- Scan workspace for source code files (.java, .py, .js, .ts, .jsx, .tsx, .kt, .kts, .scala, .groovy, .go, .rs, .rb, .php, .c, .h, .cpp, .hpp, .cc, .cs, .fs, etc.)
- Check for build files (pom.xml, package.json, build.gradle, etc.)
- Look for project structure indicators
- Identify workspace root directory (NOT aidlc-docs/{initiative-slug}/)

**Record findings:**
```markdown
## Workspace State
- **Existing Code**: [Yes/No]
- **Programming Languages**: [List if found]
- **Build System**: [Maven/Gradle/npm/etc. if found]
- **Project Structure**: [Monolith/Microservices/Library/Empty]
- **Workspace Root**: [Absolute path]
```

## Step 3: Determine Next Phase

**IF workspace is empty (no existing code)**:
- Set flag: `brownfield = false`
- Next phase: Requirements Analysis

**IF workspace has existing code**:
- Set flag: `brownfield = true`
- Check for existing reverse engineering artifacts in `aidlc-docs/{initiative-slug}/inception/reverse-engineering/`
- **IF reverse engineering artifacts exist**:
    - Check if artifacts are stale (compare artifact timestamps against codebase's last significant modification)
    - **IF artifacts are current**: Load them, skip to Requirements Analysis
    - **IF artifacts are stale**: Next phase is Reverse Engineering (rerun to refresh artifacts)
    - **IF user explicitly requests rerun**: Next phase is Reverse Engineering regardless of staleness
- **IF no reverse engineering artifacts**: Next phase is Reverse Engineering

## Step 4: Create Initial State File

Create `aidlc-docs/{initiative-slug}/aidlc-state.md`. Also create
`aidlc-docs/{initiative-slug}/HANDOVER.md` alongside it — see
[session-continuity.md](../common/session-continuity.md) for the mandate and template (this pairing
applies every time `aidlc-state.md` is created or updated, at every stage, not just here).

```markdown
# AI-DLC State Tracking

## Project Information
- **Project Type**: [Greenfield/Brownfield]
- **Start Date**: [ISO timestamp]
- **Current Stage**: INCEPTION - Workspace Detection

## Workspace State
- **Existing Code**: [Yes/No]
- **Reverse Engineering Needed**: [Yes/No]
- **Workspace Root**: [Absolute path]

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/{initiative-slug}/)
- **Documentation**: aidlc-docs/{initiative-slug}/ only
- **Structure patterns**: See code-generation.md Critical Rules

## Stage Progress
[Will be populated as workflow progresses]
```

## Step 5: Present Completion Message

**For Brownfield Projects:**
```markdown
# 🔍 Workspace Detection Complete

Workspace analysis findings:
• **Project Type**: Brownfield project
• [AI-generated summary of workspace findings in bullet points]
• **Next Step**: Proceeding to **Reverse Engineering** to analyze existing codebase...
```

**For Greenfield Projects:**
```markdown
# 🔍 Workspace Detection Complete

Workspace analysis findings:
• **Project Type**: Greenfield project
• **Next Step**: Proceeding to **Requirements Analysis**...
```

## Step 6: Automatically Proceed

- **No user approval required** - this is informational only
- Automatically proceed to next phase:
  - **Brownfield**: Reverse Engineering (if no existing artifacts) or Requirements Analysis (if artifacts exist)
  - **Greenfield**: Requirements Analysis

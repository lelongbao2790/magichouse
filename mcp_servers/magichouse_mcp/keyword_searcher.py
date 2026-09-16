import os
import fnmatch
from pathlib import Path
from typing import List


IGNORE_DIRS = {
    ".git", ".next", "node_modules", "bin", "obj", "dist", "build",
    "coverage", ".idea", ".vscode", "__pycache__", ".venv", "venv",
    "packages", "out", "logs", "temp", "tmp", "worktrees",
    "rag_cache", "migrations", "TestResults"
}

IGNORE_FILES = {
    ".DS_Store", "package-lock.json", "yarn.lock", "pnpm-lock.yaml"
}

ALLOWED_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".js", ".jsx", ".cs", ".java", ".kt",
    ".go", ".php", ".rb", ".rs", ".sql", ".html", ".css", ".scss",
    ".json", ".yaml", ".yml", ".md", ".txt", ".csproj", ".sln"
}

IMPORTANT_PATTERNS = [
    "*controller*", "*service*", "*repository*", "*hook*", "*store*",
    "*api*", "*page*", "*component*", "*modal*", "*dto*",
    "*validator*", "*entity*", "*model*", "*config*", "*route*", "*context*"
]

IMPORTANT_FOLDERS = {
    "controller", "service", "repository", "component", "page", "api"
}


def _extract_keywords(title: str, description: str) -> List[str]:
    combined = f"{title} {description}".lower()
    stop_words = {
        "the", "a", "an", "to", "for", "of", "and", "or", "in", "on",
        "with", "by", "from", "is", "are", "be", "should", "need",
        "fix", "bug", "task", "feature", "update", "create", "add",
        "remove", "error", "issue", "when", "after", "before", "user",
        "system", "screen", "page", "button", "field"
    }
    words = []
    for word in combined.replace("\n", " ").split():
        cleaned = "".join(c for c in word if c.isalnum() or c in ("_", "-"))
        if len(cleaned) < 3 or cleaned in stop_words:
            continue
        words.append(cleaned)
    return list(dict.fromkeys(words))[:20]


def search(workspace_path: str, title: str, description: str, max_files: int = 15) -> List[str]:
    root = Path(workspace_path)
    keywords = _extract_keywords(title, description)
    scored: list[dict] = []

    for dirpath, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file_name in files:
            file_path = Path(dirpath) / file_name
            if file_name in IGNORE_FILES:
                continue
            if file_path.suffix.lower() not in ALLOWED_EXTENSIONS:
                continue

            relative = str(file_path.relative_to(root)).replace("\\", "/")
            lower = relative.lower()
            score = 0

            for kw in keywords:
                kw_lower = kw.lower()
                if kw_lower in lower:
                    score += 10
                if kw_lower in file_name.lower():
                    score += 15

            for pattern in IMPORTANT_PATTERNS:
                if fnmatch.fnmatch(lower, pattern):
                    score += 2

            if any(folder in lower for folder in IMPORTANT_FOLDERS):
                score += 3

            if score > 0:
                scored.append({"path": relative, "score": score})

    scored.sort(key=lambda x: x["score"], reverse=True)

    seen = set()
    result = []
    for item in scored:
        if item["path"] not in seen:
            result.append(item["path"])
            seen.add(item["path"])
        if len(result) >= max_files:
            break

    return result

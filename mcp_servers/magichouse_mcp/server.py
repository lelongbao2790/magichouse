import logging
import sys
from pathlib import Path

from fastmcp import FastMCP

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stderr,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

WORKSPACE = Path(__file__).resolve().parent.parent.parent  # magichouse repo root

sys.path.insert(0, str(Path(__file__).parent))
import keyword_searcher

mcp = FastMCP("magichouse_mcp")


@mcp.tool()
def get_relevant_files(title: str, description: str) -> dict:
    """
    Given a Jira ticket title and description, return a ranked list of
    relevant file paths in the magichouse workspace. Returns file paths only —
    no file content — to minimize token usage. Read individual files as needed.

    Args:
        title: Jira ticket title (e.g. "Quiz score not saving after completing a subject")
        description: Jira ticket description or acceptance criteria

    Returns:
        dict with keys:
          - search_type: "keyword"
          - files: list of relative file paths (max 15)
          - total_found: number of files returned
          - query_used: keywords extracted from title+description
    """
    logging.info(f"[get_relevant_files] title={title!r}")

    files = keyword_searcher.search(
        workspace_path=str(WORKSPACE),
        title=title,
        description=description,
        max_files=15,
    )

    query_keywords = _build_query_string(title, description)
    logging.info(f"[get_relevant_files] found {len(files)} files via keyword search")

    return {
        "search_type": "keyword",
        "files": files,
        "total_found": len(files),
        "query_used": query_keywords,
    }


def _build_query_string(title: str, description: str) -> str:
    combined = f"{title} {description}"
    words = combined.split()[:10]
    return " ".join(words)


if __name__ == "__main__":
    mcp.run()

"""Mount the exported Next.js frontend at '/' with SPA-style fallback.

Files matching a real path under ``static_dir`` are served directly.
Anything else (that isn't an API route) falls back to ``index.html`` so
client-side routing works.
"""

from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import FileResponse


def mount_spa(app: FastAPI, static_dir: Path) -> None:
    if not static_dir.is_dir():
        return

    index = static_dir / "index.html"
    not_found = static_dir / "404.html"
    root = static_dir.resolve()

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(request: Request, full_path: str) -> FileResponse:
        if full_path.startswith("api/"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        candidate = (static_dir / full_path).resolve()
        try:
            candidate.relative_to(root)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        if candidate.is_file():
            return FileResponse(candidate)
        if candidate.is_dir() and (candidate / "index.html").is_file():
            return FileResponse(candidate / "index.html")
        if not_found.is_file():
            return FileResponse(not_found, status_code=status.HTTP_404_NOT_FOUND)
        return FileResponse(index)

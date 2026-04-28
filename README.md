# eddonner-prelegal

A platform to draft common legal agreements from templates.

## Status

In progress. Target completion: **May 2, 2026**.

## Run

Requires Docker.

```bash
# Mac
scripts/start-mac.sh
scripts/stop-mac.sh

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

Then open <http://localhost:8000>.

## Layout

```
backend/    FastAPI app (uv project) — auth, SQLite, serves the static frontend
frontend/   Next.js 16 app — Mutual NDA generator, login/signup pages
templates/  Common Paper markdown templates (CC BY 4.0)
scripts/    Start/stop scripts wrapping `docker compose`
catalog.json  Index of available document templates
Dockerfile, docker-compose.yml  Single-image build
```

See `backend/README.md` for backend dev workflow and `frontend/README.md` for frontend dev workflow.

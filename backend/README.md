# Prelegal backend

FastAPI app: minimal auth (signup/login/logout/me) over SQLite, plus a SPA
mount that serves the exported Next.js frontend on the same port.

## Run

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

The frontend dev server runs separately on port 3000 and proxies `/api/*`
to port 8000 via `next.config.ts` rewrites.

## Test

```bash
uv run pytest
```

## Endpoints

- `GET /api/health` → `{"status":"ok"}`
- `POST /api/auth/signup` `{email,password}` → `{id,email}` + sets session cookie
- `POST /api/auth/login` `{email,password}` → `{id,email}` + sets session cookie
- `POST /api/auth/logout` → 204, clears session cookie
- `GET /api/auth/me` → `{id,email}` from session cookie, or 401

## Configuration

Environment variables (read from repo-root `.env` in dev):

| Var | Default | Purpose |
| --- | --- | --- |
| `SECRET_KEY` | `dev-secret-change-me` | Signs session cookies |
| `DB_PATH` | `backend/dev.db` | SQLite file path |
| `WIPE_DB` | `false` | Delete DB on startup (set in Docker) |
| `STATIC_DIR` | unset | If set, mount this dir as the SPA at `/` |

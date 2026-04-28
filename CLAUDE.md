# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The full V1 vision is to support all 12 templates via AI chat with user authentication and document persistence. See "Implementation status" at the bottom of this file for what's actually built today.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

### Windows scripts (local dev mode)

`scripts/start-windows.ps1` and `scripts/stop-windows.ps1` run the app in
local dev mode (not Docker) so the chat feature can be iterated with hot
reload. The start script frees ports 8000/3000, launches `uv run uvicorn
app.main:app --reload --port 8000` and `npm run dev` in minimized
PowerShell windows, waits for the backend health endpoint, then runs
smoke tests (auth signup, one real `/api/chat` call against Cerebras).

Run them from the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-windows.ps1
powershell -ExecutionPolicy Bypass -File scripts\stop-windows.ps1
```

Skip the `-ExecutionPolicy Bypass` prefix by running once:
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. The Mac/Linux
scripts still drive Docker (`docker compose up -d --build` / `down`).

Backend available at http://localhost:8000; the dev frontend is at
http://localhost:3000 and proxies `/api/*` to the backend via
`next.config.ts` rewrites.

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

These are exposed as Tailwind v4 tokens in `frontend/app/globals.css` (`text-brand-yellow`, `bg-brand-purple`, etc.).

## Implementation status

**Built (PL-4 foundation):**
- `backend/` — uv project, FastAPI app. Endpoints: `/api/health`, `/api/auth/{signup,login,logout,me}`, `/api/chat`. SQLite users table wiped and recreated on Docker startup (`WIPE_DB=1`). Cookie sessions signed with `itsdangerous`, passwords hashed with `bcrypt`. Tests via pytest + httpx (`uv run pytest`).
- `frontend/` — Next.js 16 + Tailwind v4. Mutual NDA chat at `/` (auth-gated AI conversation that fills the live preview), plus `/login` and `/signup`. `next.config.ts` toggles `output: 'export'` under `NEXT_OUTPUT=export`.
- Docker — multi-stage `Dockerfile` (node-alpine builds the static frontend, python-slim assembles the backend with the export bundled at `/app/static`). `docker-compose.yml` exposes `:8000`. The `scripts/start-*` and `scripts/stop-*` wrappers call `docker compose up -d --build` / `down`.
- Local dev — run backend via `uv run uvicorn app.main:app --reload --port 8000` and frontend via `npm run dev`; `next.config.ts` rewrites proxy `/api/*` from `:3000` to `:8000`.

**Built (PL-5):**
- `POST /api/chat` (auth-gated) — single-shot LiteLLM call to `openrouter/openai/gpt-oss-120b` via Cerebras, structured-output schema returning `{reply, fieldsPatch}`. Frontend deep-merges the patch into the NDA form snapshot, skipping null fields.

**Not yet built:**
- Document persistence (no `documents` table, no save/load endpoints).
- Templates beyond Mutual NDA — the other 11 in `catalog.json` are unused.
- Production hardening (HTTPS, cookie `Secure` flag toggle, CORS lockdown).

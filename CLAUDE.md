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

**Built (PL-6):**
- Multi-template chat. `/api/chat` request shape is now `{templateSlug, messages, currentFields}`; response is `{mode: "draft" | "suggest", reply, fieldsPatch?, suggestedSlug?}`. Backend dispatches by slug to a per-template Pydantic schema + system prompt; `pydantic.create_model` builds the LLM's structured-output schema per slug (cached). Unsupported slugs short-circuit to a deterministic suggest reply with no LLM call. Each supported template's prompt also instructs the LLM to return `mode: "suggest"` if the user asks for a different document type mid-chat.
- Per-template backend layout: `backend/app/chat/templates/{slug}/{schema,prompt}.py` + `backend/app/chat/templates/registry.py` (slug-keyed `TemplateConfig` dataclass with `supported`, `nearest_slug`).
- Per-template frontend layout: `frontend/lib/templates/{slug}/{types,defaults,coverpage,builder,applyPatch}.ts` + `frontend/lib/templates/registry.ts` (`makeSupported<T,P>()` helper concentrates the type casts to the erased `Record<string, unknown>` registry shape).
- Routing: `/` is the 12-card picker (`<TemplatePicker />`), `/draft?t={slug}` is the chat+preview page (uses `useSearchParams` wrapped in `<Suspense>` for static-export compat). `<DocChat>`/`<DocPreview>` replace `<NdaChat>`/`<NdaPreview>`. The shared markdown CSS class is `.legal-document` (was `.nda-document`).
- Standard-terms loading: `frontend/scripts/generate-terms.mjs` reads `templates/*.md` at build time, strips Common Paper's `<span class="*_link">` tags into bold field markers, normalizes curly quotes, and emits `lib/templates/{slug}/standard-terms.ts`. Wired to `predev`/`prebuild`/`pretest`. Output is gitignored — the `.md` files are the single source of truth.
- Templates fully supported by AI drafting: **Mutual NDA**, **AI Addendum**. The other 10 (`csa`, `design-partner-agreement`, `sla`, `psa`, `dpa`, `software-license-agreement`, `partnership-agreement`, `pilot-agreement`, `baa`) appear on the picker with a "Coming soon" badge and route to a notice page that links to the nearest supported template. Adding a new supported template = one folder per side + one registry entry per side + one entry in `generate-terms.mjs` + one test.

**Built (PL-7):**
- Document persistence. New `documents` table (`id, user_id FK CASCADE, template_slug, title, fields_json, messages_json, created_at, updated_at`) created in `app/db.py`'s SCHEMA. Wiped on container start by the existing `WIPE_DB=1` flag, so no migration logic.
- Auth-gated CRUD endpoints under `/api/documents`: `GET` (list summaries, newest first), `POST` (create), `GET /{id}`, `PUT /{id}`, `DELETE /{id}`. Owner enforcement is structural — every query keys on both `id` and `user_id`, so cross-user reads/writes return 404 (no IDs leak). Lives in `app/documents/{router,schemas,storage}.py`.
- Auto-save UX. The draft page POSTs on the first chat turn (capturing the new id into `?doc={id}`), then PUTs on every subsequent turn. A promise-chain ref serializes saves so rapid turns don't double-create. Loading `/draft?t={slug}&doc={id}` rehydrates the form data + chat history; mismatched slugs surface a "use My documents" hint instead of clobbering state.
- Per-template `summarize(data)` lives next to the other helpers (`mutual-nda/summarize.ts`, `ai-addendum/summarize.ts`) and produces the saved-doc title (e.g. `NDA: Acme ↔ Globex`, `AI Addendum: Customer ↔ Provider`, falling back to template default). Adding a new supported template now also requires a `summarize.ts`.
- New `/documents` page lists drafts in a table (title links to `/draft?t=…&doc=…`, delete with optimistic update + rollback on failure).
- Shared shell: `<AppHeader>` (brand wordmark + "My documents" link + auth controls), `<Footer>` (disclaimer + copyright). Used by `/`, `/documents`, `/draft`, login/signup. The login/signup `AuthForm` was rewrapped in this shell. `lib/useAuth.ts` is the shared session hook.
- Logged-out `/` shows `<Hero>` (gradient banner + 3-step "How it works" + sign-up CTA). Logged-in `/` keeps the picker.
- Disclaimer: `<Disclaimer>` is a yellow callout above the document preview (`showInPrint` keeps it in PDF output). The full text lives in `lib/disclaimer.ts` (single source of truth for both the banner and the footer).
- Tests: `backend/tests/test_documents.py` covers auth, CRUD, 404, and cross-user isolation. Frontend `summarize.test.ts` per supported template.

**Not yet built:**
- Full AI drafting for the 10 "Coming soon" templates (CSA, DPA, BAA, etc.) — they currently show suggest replies only.
- Production hardening (HTTPS, cookie `Secure` flag toggle, CORS lockdown).

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Project Management MVP: single-user Kanban board with an AI chat sidebar that can create/edit/move cards. NextJS frontend, Python FastAPI backend that also serves the built frontend as static files. See `docs/PLAN.md` for the full step-by-step build plan and status, and `docs/DB_SCHEMA.md` for schema rationale.

## Commands

### Backend (`backend/`)

```bash
uv sync --dev
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload   # dev server
uv run pytest                                                      # all tests
uv run pytest tests/test_main.py::test_name                        # single test
```

### Frontend (`frontend/`)

```bash
npm install
npm run dev                # dev server (localhost:3000)
npm run build               # static export to frontend/out (required before backend can serve it)
npm run lint
npm run test:unit           # Vitest
npm run test:unit:watch
npm run test:e2e            # Playwright
npm run test:all            # unit + e2e
```

### Full local dev

Backend and frontend run as two separate dev processes (see `docs/DEV_SETUP.md`):
- Cross-platform scripts in `scripts/`: `start-mac.sh`/`stop-mac.sh`, `start-linux.sh`/`stop-linux.sh`, `start-windows.ps1`/`stop-windows.ps1`. They launch both processes and write PIDs/logs to `.run/`.
- Or `docker compose -f docker-compose.dev.yml up --build` (frontend on :3000, backend on :8000).
- To view the Kanban app served *through* the backend (production-like path), build the frontend export first (`npm run build` in `frontend/`), then run the backend — it serves `frontend/out` at `/`.
- Frontend dev mode talks to the backend at `http://127.0.0.1:8000` by default; override with `NEXT_PUBLIC_API_BASE_URL`.

## Architecture

- **Backend serves the frontend.** There is no separate frontend production server — `backend/app/main.py` serves the Next.js static export (`frontend/out`) at `/` and handles `/api/*` routes itself. Any frontend change intended for backend-served testing needs a rebuild (`npm run build`).
- **One board per user, stored as a JSON blob.** `backend/app/store.py` is a SQLite repository with `users` and `boards` tables; `boards.board_json` holds the entire board (columns + cards) as one TEXT column, not normalized rows. This is a deliberate MVP tradeoff (see `docs/DB_SCHEMA.md`) — don't normalize into separate `columns`/`cards` tables without discussing it first. DB auto-creates at `backend/data/pm.db` on first use, seeded from `backend/app/default_board.py`.
- **Kanban columns are fixed.** Column count/order (`col-backlog`, `col-discovery`, `col-progress`, `col-review`, `col-done`) is enforced on both client and server; only column titles are editable. Each column id has a fixed color in the frontend (see `frontend/AGENTS.md`) — preserve that mapping.
- **Auth is a frontend-only demo gate.** Hardcoded `user`/`password` in `AuthGate.tsx`, no backend session/auth yet. Backend already models board access by username so real auth can replace the gate later without changing storage.
- **AI chat goes through a strict schema.** `backend/app/openrouter.py` calls OpenRouter (model pinned to `openai/gpt-oss-120b`, no fallback, key from root `.env` as `OPENROUTER_API_KEY`) and requires the response to validate against a schema (`assistantMessage` + optional `board`). If validation fails, the backend must return a fallback message and leave the board untouched — never let unvalidated AI output touch persisted state. Chat history is in-memory only (lost on backend restart), not persisted to SQLite.
- **Frontend/backend contract:** `frontend/src/lib/api.ts` (board CRUD) and `frontend/src/lib/ai.ts` (chat) are the only places that talk to the backend. When the AI chat response has `boardUpdated=true`, the frontend re-syncs board state from the backend rather than trusting local optimistic state.

## Conventions

- Keep it simple — no speculative abstraction, no defensive programming for cases that can't occur, no features beyond current plan scope (this is repeated strongly in `AGENTS.md`).
- Use latest/idiomatic versions of libraries as of the current date.
- No emojis anywhere (code, docs, commits, UI).
- When debugging, find root cause before attempting a fix — don't guess-and-check.
- Docs live in `docs/`; each of `backend/`, `frontend/`, and `scripts/` has its own `AGENTS.md` describing that area's current implementation state in more detail than this file — check those when working deeply in one area.

# Backend

## Run

`uv` is invoked as `python3 -m uv` because it is installed as a Python package
rather than a standalone binary on PATH.

```bash
python3 -m uv sync --dev
python3 -m uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Before running backend for UI serving, build the frontend export:

```bash
cd ../frontend
npm install
npm run build
```

Then backend serves the built frontend at `/`.

## Test

```bash
python3 -m uv run pytest
```

## Endpoints

- `GET /` serves built frontend (`frontend/out/index.html`)
- `GET /api/health` health status
- `GET /api/hello` demo API response
- `GET /api/board/{username}` get board JSON for a user
- `PUT /api/board/{username}` replace board JSON for a user
- `GET /api/ai/ping` OpenRouter connectivity check (model pinned to `openai/gpt-oss-120b`)
- `POST /api/ai/chat` structured AI chat response with optional board update

## Persistence

- SQLite database is created automatically if missing.
- Default database path: `backend/data/pm.db`.
- Set `PM_DB_PATH` to use a different database file. The Playwright e2e suite
  uses this to run against `backend/data/e2e.db` instead of the dev database.
- Schema includes `users` and `boards` tables.
- MVP stores one board JSON blob per user.

## AI Chat Notes

- Chat history is stored in memory per user for MVP runtime only.
- AI response must match strict schema: `assistantMessage` and optional `board`.
- If AI schema validation fails, backend returns fallback assistant message and keeps board unchanged.

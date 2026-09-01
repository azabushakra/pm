# Dev Setup

## Run the MVP (Single Container)

This is the default way to run the whole app. One command builds the frontend
export and starts the backend serving it alongside the API:

```bash
docker compose up --build
```

Open `http://localhost:8000`, then sign in with `user` / `password`.

- Requires port 8000 to be free.
- `OPENROUTER_API_KEY` is read from `.env` in the repo root. Without it the app
  still runs and only the AI endpoints return 503.
- The database lives in the `app_data` Docker volume, so board state survives
  container restarts and rebuilds. `docker compose down -v` discards it.

## Local Two-Process Dev

For active frontend development with hot reload. Run backend and frontend
separately.

Locally, `uv` is invoked as `python3 -m uv` because it is installed as a Python
package rather than a standalone binary on PATH. Inside the Docker image, `uv`
is on PATH and used directly.

### Backend

```bash
cd backend
python3 -m uv sync --dev
python3 -m uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

## Backend Serves Built Frontend at /

Build frontend static export first:

```bash
cd frontend
npm install
npm run build
```

Then run backend:

```bash
cd backend
python3 -m uv sync --dev
python3 -m uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Open `http://localhost:8000` to load the Kanban app via backend static serving.

## Cross-Platform Scripts

From repo root:

- macOS:
  - `bash scripts/start-mac.sh`
  - `bash scripts/stop-mac.sh`
- Linux:
  - `bash scripts/start-linux.sh`
  - `bash scripts/stop-linux.sh`
- Windows PowerShell:
  - `powershell -ExecutionPolicy Bypass -File scripts/start-windows.ps1`
  - `powershell -ExecutionPolicy Bypass -File scripts/stop-windows.ps1`

## Docker Two-Process Dev

Optional. Only for working on the frontend against a containerized backend;
`docker compose up` above is the default path.

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

Backend root (`/`) serves the built frontend output from `frontend/out`.

## Configuration

Both are optional and mainly used by the container and the test suite.

- `PM_DB_PATH`: SQLite file path. Defaults to `backend/data/pm.db`.
- `PM_FRONTEND_DIR`: directory holding the built frontend. Defaults to
  `frontend/out` relative to the repo.

## Tests

```bash
cd backend && python3 -m uv run pytest
cd frontend && npm run test:unit
cd frontend && npm run test:e2e
cd frontend && npm run lint
```

The e2e suite builds the frontend and starts its own backend on port 8123
against `backend/data/e2e.db`, so it does not affect the dev database.

# Dev Setup

## Local Two-Process Dev

Run backend and frontend separately for active frontend development.

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

From repo root:

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

Backend root (`/`) serves the built frontend output from `frontend/out`.

## Tests

```bash
cd backend && python3 -m uv run pytest
cd frontend && npm run test:unit
cd frontend && npm run test:e2e
cd frontend && npm run lint
```

The e2e suite builds the frontend and starts its own backend on port 8123
against `backend/data/e2e.db`, so it does not affect the dev database.

# Dev Setup (Step 3)

## Local Two-Process Dev

Run backend and frontend separately for active frontend development.

### Backend

```bash
cd backend
uv sync --dev
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
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
uv sync --dev
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
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

In Step 3, backend root (`/`) is intended to serve built frontend output.

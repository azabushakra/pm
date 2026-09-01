# Backend (Step 3)

## Run

```bash
uv sync --dev
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
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
uv run pytest
```

## Endpoints

- `GET /` serves built frontend (`frontend/out/index.html`)
- `GET /api/health` health status
- `GET /api/hello` demo API response

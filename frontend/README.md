# Kanban Studio

## Run

```bash
npm install
npm run dev
```

In local frontend development, `/api/*` calls use `http://127.0.0.1:8000` by default.
Start backend in a second terminal:

```bash
cd ../backend
python3 -m uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

When running on `localhost:3000` or `127.0.0.1:3000`, the app automatically calls
the backend at `http://127.0.0.1:8000` unless `NEXT_PUBLIC_API_BASE_URL` is set.

## Tests

```bash
npm run test:unit
npm run test:e2e
```

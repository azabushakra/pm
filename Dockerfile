# Stage 1: build the Next.js static export.
FROM node:22-alpine AS frontend

WORKDIR /build

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: backend runtime, serving the built frontend and the API.
FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

# Dependencies are installed from the lockfile so image builds match local runs.
COPY backend/pyproject.toml backend/uv.lock backend/README.md ./
RUN uv sync --no-dev --frozen

COPY backend/app ./app
COPY --from=frontend /build/out /frontend/out

ENV PM_DB_PATH=/app/data/pm.db
ENV PM_FRONTEND_DIR=/frontend/out

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

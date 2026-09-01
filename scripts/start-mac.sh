#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
mkdir -p "$RUN_DIR"

if command -v uv >/dev/null 2>&1; then
  UV_BIN=(uv)
else
  UV_BIN=(python3 -m uv)
fi

if lsof -iTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port 8000 is already in use."
  exit 1
fi

if lsof -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port 3000 is already in use."
  exit 1
fi

cd "$ROOT_DIR/backend"
"${UV_BIN[@]}" run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload >"$RUN_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" >"$RUN_DIR/backend.pid"

cd "$ROOT_DIR/frontend"
npm run dev -- --hostname 0.0.0.0 --port 3000 >"$RUN_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" >"$RUN_DIR/frontend.pid"

echo "Started backend (PID $BACKEND_PID) and frontend (PID $FRONTEND_PID)."
echo "Logs: $RUN_DIR/backend.log and $RUN_DIR/frontend.log"

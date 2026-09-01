#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"

stop_pid_file() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid"
      echo "Stopped process $pid"
    fi
    rm -f "$pid_file"
  fi
}

stop_pid_file "$RUN_DIR/backend.pid"
stop_pid_file "$RUN_DIR/frontend.pid"

echo "Stop script completed."

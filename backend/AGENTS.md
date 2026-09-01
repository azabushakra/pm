# Backend Agent Guide

## Scope

This directory contains the FastAPI backend for the Project Management MVP.

## Current Baseline

Parts 2-10 of `docs/PLAN.md` are implemented. Single-container consolidation
is the remaining step.

- Framework: FastAPI
- Package manager: `uv`, invoked locally as `python3 -m uv` because it is
  installed as a Python package rather than a binary on PATH. Inside the
  Docker image `uv` is on PATH and used directly.
- Dev server command: `python3 -m uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- Test command: `python3 -m uv run pytest`
- API endpoints:
	- `GET /api/health`
	- `GET /api/hello`
	- `GET /api/board/{username}`
	- `PUT /api/board/{username}`
	- `GET /api/ai/ping`
	- `POST /api/ai/chat`
- Frontend serving:
	- `GET /` and other non-API paths serve built frontend files from `frontend/out`.

## Structure

- `app/main.py`: app definition, API routes, board endpoints, and frontend static-file serving.
- `app/models.py`: Pydantic request/response models for board payload validation.
- `app/store.py`: SQLite repository (auto-init DB, users, boards tables).
- `app/openrouter.py`: OpenRouter client + structured chat helper and schema parsing.
- `app/default_board.py`: default board JSON used to seed new users.
- `tests/test_main.py`: API tests covering health, hello, board read/write,
  column validation, static serving, and AI chat behavior.
- `tests/test_openrouter.py`: OpenRouter client tests with mocked HTTP.
- `pyproject.toml`: runtime and dev dependencies, pytest configuration.
- `Dockerfile.dev`: development image used by two-process docker setup.

## Constraints

- Keep backend simple and explicit.
- Login remains frontend-only until later auth step.
- Board persistence currently stores one JSON blob per user.
- Chat history is in-memory only for MVP.
- Database path defaults to `backend/data/pm.db` and can be overridden with
  the `PM_DB_PATH` environment variable. The e2e suite uses this to avoid
  touching the dev database.
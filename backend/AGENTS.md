# Backend Agent Guide

## Scope

This directory contains the FastAPI backend for the Project Management MVP.

## Current Step 3 Baseline

- Framework: FastAPI
- Package manager: `uv`
- Dev server command: `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- API endpoints:
	- `GET /api/health`
	- `GET /api/hello`
- Frontend serving:
	- `GET /` and other non-API paths serve built frontend files from `frontend/out`.

## Structure

- `app/main.py`: app definition, API routes, and frontend static-file serving.
- `tests/test_main.py`: backend tests for health, hello, and root HTML response.
- `pyproject.toml`: runtime and dev dependencies, pytest configuration.
- `Dockerfile.dev`: development image used by two-process docker setup.

## Constraints

- Keep this backend minimal in Step 3.
- Do not introduce persistence or auth here yet.
- Frontend serving depends on `frontend/out` existing.
# Backend Agent Guide

## Scope

This directory contains the FastAPI backend for the Project Management MVP.

## Current Step 6 Baseline

- Framework: FastAPI
- Package manager: `uv`
- Dev server command: `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- API endpoints:
	- `GET /api/health`
	- `GET /api/hello`
	- `GET /api/board/{username}`
	- `PUT /api/board/{username}`
- Frontend serving:
	- `GET /` and other non-API paths serve built frontend files from `frontend/out`.

## Structure

- `app/main.py`: app definition, API routes, board endpoints, and frontend static-file serving.
- `app/models.py`: Pydantic request/response models for board payload validation.
- `app/store.py`: SQLite repository (auto-init DB, users, boards tables).
- `app/default_board.py`: default board JSON used to seed new users.
- `tests/test_main.py`: backend tests for health, hello, and root HTML response.
- `pyproject.toml`: runtime and dev dependencies, pytest configuration.
- `Dockerfile.dev`: development image used by two-process docker setup.

## Constraints

- Keep backend simple and explicit.
- Login remains frontend-only until later auth step.
- Board persistence currently stores one JSON blob per user.
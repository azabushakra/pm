# Scripts Agent Guide

## Scope

This directory contains start/stop scripts for local development on macOS, Linux, and Windows.

## Current Scripts

- macOS:
	- `start-mac.sh`
	- `stop-mac.sh`
- Linux:
	- `start-linux.sh`
	- `stop-linux.sh`
- Windows:
	- `start-windows.ps1`
	- `stop-windows.ps1`

## Behavior

- Start scripts launch backend and frontend dev servers as separate processes.
- PID files are written under `.run/`:
	- `.run/backend.pid`
	- `.run/frontend.pid`
- Logs are written under `.run/`:
	- `.run/backend.log`
	- `.run/frontend.log`
- Stop scripts terminate processes referenced by those PID files.

## Constraints

- Keep scripts simple and explicit.
- Avoid adding process managers or extra tooling unless required later.
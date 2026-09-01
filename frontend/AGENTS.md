# Frontend Agent Guide

## Scope

This document describes the current frontend implementation in `frontend/`.

## Current Architecture

- Framework: Next.js App Router
- Language: TypeScript + React
- Styling: Tailwind CSS v4 with CSS variables in `src/app/globals.css`
- Drag-and-drop: `@dnd-kit/core`
- Data source: backend API (`/api/board/*` and `/api/ai/chat`)
- Auth: frontend-only demo gate (`user` / `password`)

## Entry Points

- App route `src/app/page.tsx` renders `AuthGate`.
- Global styles are in `src/app/globals.css`.
- Main board logic is in `src/components/KanbanBoard.tsx`.

## Board + Chat Behavior

- Board data is loaded/saved through backend API in `src/lib/api.ts`.
- AI chat requests are sent to backend in `src/lib/ai.ts`.
- Chat replies may return `boardUpdated=true`; when true, board UI is synced from backend response.
- Chat history in frontend is presentation-only for the current session.
- Backend keeps authoritative in-memory history for MVP.

## UI Conventions

- Remove-card action uses icon-only button with accessible `aria-label`.
- Card description text must wrap safely (`break-words` + `overflow-wrap:anywhere`).
- Board layout should use available width on desktop and avoid unnecessary side whitespace.
- Stage color coding is fixed and unique by column id:
  - `col-backlog`: amber
  - `col-discovery`: sky
  - `col-progress`: violet
  - `col-review`: rose
  - `col-done`: emerald
- AI sidebar should keep strong hierarchy: header, message stream, composer, and explicit loading/error states.

## Component Map

- `AuthGate.tsx`: login gate and logout action.
- `KanbanBoard.tsx`: board state, DnD, persistence calls, and AI sidebar integration.
- `KanbanColumn.tsx`: column rendering, stage color styling, rename/add controls.
- `KanbanCard.tsx`: card display and icon delete action.
- `AIChatSidebar.tsx`: chat UI and input composer.
- `KanbanCardPreview.tsx`: drag overlay preview.
- `NewCardForm.tsx`: inline card creation form.

## Testing

- Unit/integration: Vitest + Testing Library.
- E2E: Playwright.
- Core test commands:
  - `npm run test:unit`
  - `npm run test:e2e`

## Constraints

- Keep MVP simple and focused.
- Preserve fixed column count/order; only titles are editable.
- Do not add features beyond plan scope.

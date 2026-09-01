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

- Design tokens live in `src/app/globals.css`. Use `--ink` for headings,
  `--ink-soft` for body copy, and `--muted` for secondary text. The brand
  `--gray-text` (#888888) is too light for small body copy on white, so it is
  reserved for decorative labels.
- The app shell is full height and does not scroll as a page on desktop.
  Columns scroll internally; the board strip scrolls sideways below its
  minimum width rather than squeezing columns to an unreadable size.
- Chrome stays out of the way: a single compact top bar holds the product
  name, card total, save status, user, and logout. Avoid reintroducing large
  headers or marketing copy, which push the board below the fold.
- Prefer sentence case. Uppercase with wide letter-spacing is hard to read and
  should stay rare.
- Remove-card action uses an icon-only button with an accessible `aria-label`.
  It is revealed on card hover and on keyboard focus, never permanently
  visible, so cards stay quiet at rest.
- Card description text must wrap safely (`break-words` +
  `overflow-wrap:anywhere`).
- Stage color coding is fixed and unique by column id, defined once in
  `src/lib/kanban.ts` as `STAGE_COLOR` and passed to CSS as a `--stage`
  custom property:
  - `col-backlog`: amber
  - `col-discovery`: brand blue
  - `col-progress`: brand purple
  - `col-review`: rose
  - `col-done`: green
- During a drag, the destination column highlights. Hovering a card resolves
  the collision to that card rather than the column, so `KanbanBoard` tracks
  the target column in `onDragOver` and passes `isTarget` to the column.
- AI sidebar should keep strong hierarchy: header, message stream, composer,
  and explicit loading/error states.

## Component Map

- `AuthGate.tsx`: login gate and logout action. Auth state itself lives in
  `src/lib/auth.ts` and is read via `useSyncExternalStore`, which keeps the
  static-export prerender and client hydration consistent.
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

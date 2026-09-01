# Project Plan

## Approval Gate

- [x] This document is approved by the user before any implementation starts.
- [x] After approval, implementation proceeds part-by-part in order unless the user asks to reorder.

## Fixed Decisions for MVP

- Frontend AGENTS file is created during planning as a baseline and can be updated later only if implementation reveals real needs.
- Backend tests use pytest with FastAPI TestClient/httpx.
- Frontend tests use Vitest + Playwright.
- Docker strategy is temporary two-process dev setup first, then consolidation to a single container.
- Login is frontend-only gate first, backend auth later.
- Kanban columns have fixed count/order; titles are editable.
- SQLite schema is one board JSON blob per user for MVP.
- AI output handling uses strict schema validation. Invalid output never updates board state and returns a fallback message.
- Chat history is in-memory only for MVP.
- OpenRouter model is pinned to `openai/gpt-oss-120b` with no fallback.

## Part 1: Planning and Documentation

### Checklist

- [x] Rewrite this plan with detailed substeps, tests, and success criteria.
- [x] Create frontend AGENTS baseline document describing existing frontend code.
- [x] User review and approval of this plan.

### Tests

- Manual check: all project decisions above are reflected exactly.
- Manual check: each part includes actionable tasks and explicit success criteria.

### Success Criteria

- Plan is approved with no ambiguity on sequence, scope, or MVP constraints.

## Part 2: Scaffolding (Two-Process Dev First)

### Checklist

- [x] Create backend FastAPI app scaffold in `backend/`.
- [x] Add minimal API route (health/status) and one demo route.
- [x] Add temporary static hello-world response from backend root or dedicated path for smoke testing.
- [x] Add Python project/dependency config using `uv`.
- [x] Add scripts in `scripts/` for Mac, Linux, and Windows to start/stop local dev processes.
- [x] Add Docker assets for the two-process dev setup (frontend dev + backend dev) with clear commands.
- [x] Document run flow in concise README/docs updates.

### Tests

- Backend unit test: health endpoint returns 200 and expected payload.
- Backend unit test: demo endpoint returns expected response.
- Script smoke test: each OS start script launches expected services/commands.
- Docker smoke test: containerized dev setup starts and exposes expected ports.

### Success Criteria

- Local and Docker dev environments both run.
- Backend returns hello-world and API response reliably.
- Start/stop scripts work as documented.

## Part 3: Serve Built Frontend from Backend

### Checklist

- [x] Configure frontend build output for static serving.
- [x] Update backend to serve built frontend at `/`.
- [x] Wire static asset routing so CSS/JS/image paths resolve.
- [x] Remove temporary hello-world root response once Kanban page is served.
- [x] Keep two-process dev ergonomics while enabling production-like single-service serving path.

### Tests

- Frontend unit/integration tests (existing + updated) pass under Vitest.
- End-to-end test verifies `/` renders Kanban board through backend-served app.
- Backend test verifies unknown app route behavior (serve app shell or 404, as defined).

### Success Criteria

- Visiting `/` shows the existing Kanban UI served by FastAPI-hosted static frontend build.
- All current frontend behavior remains functional.

## Part 4: Frontend-Only MVP Login Gate

### Checklist

- [x] Add login screen shown before Kanban access.
- [x] Hardcode accepted credentials: username `user`, password `password`.
- [x] Store authenticated state client-side for session continuity during tab lifetime.
- [x] Add logout action returning user to login screen.
- [x] Keep auth implementation isolated so backend auth can replace it later without major refactor.

### Tests

- Vitest: login form validation and success path.
- Vitest: invalid credentials show error and block access.
- Vitest: logout clears client auth state.
- Playwright: end-to-end login -> board visible -> logout -> login screen visible.

### Success Criteria

- Unauthenticated users cannot access board UI.
- Correct dummy credentials grant access and logout works.

## Part 5: Database Modeling and Sign-Off

### Checklist

- [x] Define SQLite schema for users and one board JSON blob per user.
- [x] Include migration/init behavior that creates DB if missing.
- [x] Document schema, constraints, and tradeoffs in `docs/` (`docs/DB_SCHEMA.md`).
- [x] Include explicit note that schema is MVP-focused and intentionally denormalized.
- [x] Request user sign-off before implementing backend persistence logic.

### Tests

- Manual schema review against business requirements.
- Automated init test: database file and required tables are created from empty state.

### Success Criteria

- Schema is approved and documented.
- Clear path exists to normalize later without blocking MVP.

## Part 6: Backend Kanban API + Persistence

### Checklist

- [x] Implement repository/storage layer for board JSON by user.
- [x] Add API route(s) to fetch board for a user.
- [x] Add API route(s) to update board for a user.
- [x] Validate payload shape and handle invalid requests cleanly.
- [x] Ensure DB auto-creation on first run.
- [x] Keep API surface minimal and version-ready (prefixing or modular routing).

### Tests

- pytest: DB initialization from no-file state.
- pytest: read returns seeded/default board when expected.
- pytest: write persists board and subsequent read returns updated value.
- pytest: invalid payload returns 4xx with useful error.

### Success Criteria

- Backend can reliably read/write board state per user.
- Persistence survives process restarts.

## Part 7: Frontend Uses Backend API

### Checklist

- [ ] Replace frontend in-memory board source with backend API fetch/update flow.
- [ ] Keep UX responsive when saving (optimistic or explicit loading, decided during implementation).
- [ ] Handle API errors with concise user-visible feedback.
- [ ] Preserve existing board features: rename columns, add/delete/move cards.
- [ ] Ensure fixed column order/count is enforced client and server side.

### Tests

- Vitest: API client functions for get/update board.
- Vitest integration: board actions call API and update UI.
- Playwright: reload preserves board changes.
- Backend tests: contract coverage for frontend-used endpoints.

### Success Criteria

- Board state is persistent and consistent across refresh/restart.
- Existing Kanban interactions remain stable.

## Part 8: OpenRouter Connectivity

### Checklist

- [ ] Add backend OpenRouter client integration using `OPENROUTER_API_KEY` from root `.env`.
- [ ] Pin model to `openai/gpt-oss-120b` with no fallback.
- [ ] Add minimal backend endpoint/service method for connectivity check.
- [ ] Implement robust error mapping for missing key, network error, and non-2xx responses.

### Tests

- Unit test with mocked HTTP: request uses pinned model.
- Unit test with mocked HTTP: successful `2+2` style response path.
- Unit test with mocked HTTP: error paths return controlled backend errors.
- Optional manual smoke test with real key in local env.

### Success Criteria

- Backend can complete a basic OpenRouter call using required model.
- Failures are surfaced safely and clearly.

## Part 9: Structured Output for Chat + Optional Board Update

### Checklist

- [ ] Define strict structured response schema (assistant text + optional board update payload).
- [ ] Send current board JSON, user message, and in-memory conversation history to AI.
- [ ] Validate AI output strictly against schema.
- [ ] If schema validation fails, do not update board and return fallback message.
- [ ] If schema passes and includes update, persist updated board via same backend storage flow.
- [ ] Keep chat history in memory only for MVP.

### Tests

- Unit test: valid structured output without board update returns assistant text only.
- Unit test: valid structured output with board update persists board.
- Unit test: invalid structured output triggers fallback and no persistence.
- Unit test: conversation history inclusion behavior.

### Success Criteria

- AI-driven board updates are deterministic, validated, and safe.
- Invalid AI responses cannot corrupt board state.

## Part 10: Frontend AI Sidebar Integration

### Checklist

- [ ] Add sidebar chat UI integrated into existing page layout.
- [ ] Send user prompts to backend AI endpoint and render assistant responses.
- [ ] If backend reports board update applied, refresh/sync board UI automatically.
- [ ] Show loading, error, and fallback states clearly.
- [ ] Keep interaction simple and focused for MVP.

### Tests

- Vitest: chat component state transitions (idle/loading/success/error).
- Vitest integration: successful AI response renders message.
- Vitest integration: board update response refreshes Kanban state.
- Playwright: end-to-end chat prompt -> response visible -> optional board change reflected.

### Success Criteria

- Sidebar supports full MVP chat flow.
- Board and chat remain in sync when AI-driven updates occur.

## Consolidation Step: Single Container Packaging

This happens after Parts 2-10 are functionally stable.

### Checklist

- [ ] Consolidate runtime into one Docker container serving backend + built frontend.
- [ ] Remove temporary two-process container orchestration from default path.
- [ ] Keep local scripts straightforward and minimal.

### Tests

- Docker build test from clean checkout.
- Container run test: login, board operations, backend persistence, and AI endpoint path all accessible.

### Success Criteria

- One-command container startup runs complete MVP locally.

## Global Definition of Done

- [ ] All required tests pass for changed areas.
- [ ] No regressions in existing Kanban interactions.
- [ ] Docs remain concise and current.
- [ ] Scope matches MVP only; no unnecessary features added.
- [ ] User approves transition from planning to implementation.
# Database Schema

This schema is implemented in `backend/app/store.py`.

## Goal

Store one Kanban board per user in SQLite using a single JSON blob for MVP simplicity.

## Why this approach

- It is the fastest path to persistence.
- It matches current app shape: one board per user.
- It keeps migration and backend logic small for MVP.

## Tables

### users

Purpose: represent users now and allow real auth later.

Fields:
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `username` TEXT NOT NULL UNIQUE
- `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

### boards

Purpose: store one board JSON payload per user.

Fields:
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id` INTEGER NOT NULL UNIQUE
- `board_json` TEXT NOT NULL
- `updated_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`

Notes:
- `user_id` is `UNIQUE` to enforce one board per user.
- `board_json` stores the complete board object including columns and cards.

## SQL Draft

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  board_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Initialization behavior

On backend startup (or first repository call):
- Create database file if it does not exist.
- Create `users` and `boards` tables using `CREATE TABLE IF NOT EXISTS`.
- Ensure MVP demo user `user` exists.
- If `user` has no board row, insert one row initialized from the current default board JSON.

## Read/write behavior

- Read board:
  - Find user by username.
  - Return `board_json` for that user.
- Update board:
  - Validate payload shape before saving.
  - Replace `board_json` for that user.
  - Update `updated_at`.

## Constraints and tradeoffs

- This is intentionally denormalized for MVP.
- Querying individual cards or columns in SQL is limited.
- Multi-user collaboration and analytics will require a future normalized schema.

## Future normalization path

When needed, move from one JSON blob to relational tables:
- `boards`
- `columns`
- `cards`
- `card_positions`

A migration can read each `board_json` row and fan out records.

## Security and data scope in MVP

- Login is currently frontend-only gate (by design in Step 4).
- Backend still stores board by user identity abstraction so backend auth can replace frontend gate in later steps.

## Sign-off checklist

- [x] SQLite schema defined.
- [x] One board JSON blob per user enforced.
- [x] DB creation/init behavior documented.
- [x] Denormalized MVP tradeoff documented.
- [x] User sign-off received and schema implemented in `backend/app/store.py`.

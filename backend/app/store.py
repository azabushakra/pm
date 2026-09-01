import json
import sqlite3
from pathlib import Path
from typing import Any


class BoardStore:
    def __init__(self, db_path: Path, default_board: dict[str, Any]) -> None:
        self.db_path = db_path
        self.default_board = default_board
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def init_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("PRAGMA foreign_keys = ON")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS boards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    board_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
                """
            )
            conn.commit()

    def _get_or_create_user_id(self, conn: sqlite3.Connection, username: str) -> int:
        row = conn.execute(
            "SELECT id FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        if row:
            return int(row[0])

        cursor = conn.execute(
            "INSERT INTO users (username) VALUES (?)",
            (username,),
        )
        conn.commit()
        return int(cursor.lastrowid)

    def _default_board_copy(self) -> dict[str, Any]:
        return json.loads(json.dumps(self.default_board))

    def get_board(self, username: str) -> dict[str, Any]:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("PRAGMA foreign_keys = ON")
            user_id = self._get_or_create_user_id(conn, username)
            row = conn.execute(
                "SELECT board_json FROM boards WHERE user_id = ?",
                (user_id,),
            ).fetchone()

            if row:
                return json.loads(str(row[0]))

            board = self._default_board_copy()
            conn.execute(
                "INSERT INTO boards (user_id, board_json) VALUES (?, ?)",
                (user_id, json.dumps(board)),
            )
            conn.commit()
            return board

    def set_board(self, username: str, board: dict[str, Any]) -> dict[str, Any]:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("PRAGMA foreign_keys = ON")
            user_id = self._get_or_create_user_id(conn, username)
            conn.execute(
                """
                INSERT INTO boards (user_id, board_json)
                VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    board_json = excluded.board_json,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (user_id, json.dumps(board)),
            )
            conn.commit()
        return board

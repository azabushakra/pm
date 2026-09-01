import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from starlette.responses import Response

from app.default_board import DEFAULT_BOARD
from app.models import (
    AIChatRequestModel,
    AIChatResponseModel,
    BoardModel,
    BoardResponseModel,
    ChatHistoryMessageModel,
)
from app.openrouter import (
    OpenRouterError,
    run_openrouter_connectivity_check,
    run_openrouter_structured_chat,
)
from app.store import BoardStore


EXPECTED_COLUMN_IDS = [column["id"] for column in DEFAULT_BOARD["columns"]]
SCHEMA_FALLBACK_MESSAGE = (
    "I could not safely apply that update. I kept your board unchanged."
)


def create_app(frontend_out_dir: Path | None = None, db_path: Path | None = None) -> FastAPI:
    app = FastAPI(title="PM MVP Backend")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3100",
            "http://127.0.0.1:3100",
            "http://localhost:8123",
            "http://127.0.0.1:8123",
        ],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    env_frontend_dir = os.getenv("PM_FRONTEND_DIR")
    if frontend_out_dir is not None:
        out_dir = frontend_out_dir
    elif env_frontend_dir:
        out_dir = Path(env_frontend_dir)
    else:
        out_dir = Path(__file__).resolve().parents[2] / "frontend" / "out"
    env_db_path = os.getenv("PM_DB_PATH")
    default_db_path = (
        Path(env_db_path)
        if env_db_path
        else Path(__file__).resolve().parents[1] / "data" / "pm.db"
    )
    store = BoardStore(db_path=db_path or default_db_path, default_board=DEFAULT_BOARD)
    chat_history_by_user: dict[str, list[ChatHistoryMessageModel]] = {}

    def _has_expected_columns(board: BoardModel) -> bool:
        return [column.id for column in board.columns] == EXPECTED_COLUMN_IDS

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/hello")
    def hello() -> dict[str, str]:
        return {"message": "hello from backend"}

    @app.get("/api/board/{username}", response_model=BoardResponseModel)
    def get_board(username: str) -> BoardResponseModel:
        board = store.get_board(username)
        return BoardResponseModel(username=username, board=BoardModel.model_validate(board))

    @app.put("/api/board/{username}", response_model=BoardResponseModel)
    def update_board(username: str, board: BoardModel) -> BoardResponseModel:
        received_column_ids = [column.id for column in board.columns]
        if received_column_ids != EXPECTED_COLUMN_IDS:
            raise HTTPException(
                status_code=422,
                detail="Columns must keep fixed ids and order.",
            )

        updated = store.set_board(username, board.model_dump())
        return BoardResponseModel(
            username=username,
            board=BoardModel.model_validate(updated),
        )

    @app.get("/api/ai/ping")
    def ai_ping() -> dict[str, str]:
        try:
            result = run_openrouter_connectivity_check()
        except OpenRouterError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

        return {
            "status": "ok",
            "model": result["model"],
            "reply": result["reply"],
        }

    @app.post("/api/ai/chat", response_model=AIChatResponseModel)
    def ai_chat(request: AIChatRequestModel) -> AIChatResponseModel:
        current_board_dict = store.get_board(request.username)
        current_board = BoardModel.model_validate(current_board_dict)
        history = chat_history_by_user.setdefault(request.username, [])

        try:
            ai_output = run_openrouter_structured_chat(
                user_message=request.message,
                current_board=current_board.model_dump(),
                conversation_history=history,
            )
        except OpenRouterError as exc:
            if exc.kind == "invalid_response":
                fallback = AIChatResponseModel(
                    username=request.username,
                    assistantMessage=SCHEMA_FALLBACK_MESSAGE,
                    boardUpdated=False,
                    usedFallback=True,
                    board=current_board,
                )
                history.append(ChatHistoryMessageModel(role="user", content=request.message))
                history.append(
                    ChatHistoryMessageModel(
                        role="assistant",
                        content=fallback.assistantMessage,
                    )
                )
                return fallback

            raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

        next_board = ai_output.board
        board_updated = False
        final_board = current_board
        used_fallback = False
        assistant_message = ai_output.assistantMessage

        if next_board is not None:
            if _has_expected_columns(next_board):
                persisted = store.set_board(request.username, next_board.model_dump())
                final_board = BoardModel.model_validate(persisted)
                board_updated = True
            else:
                assistant_message = SCHEMA_FALLBACK_MESSAGE
                used_fallback = True
                board_updated = False

        response = AIChatResponseModel(
            username=request.username,
            assistantMessage=assistant_message,
            boardUpdated=board_updated,
            usedFallback=used_fallback,
            board=final_board,
        )

        history.append(ChatHistoryMessageModel(role="user", content=request.message))
        history.append(
            ChatHistoryMessageModel(
                role="assistant",
                content=response.assistantMessage,
            )
        )

        return response

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str) -> Response:
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")

        index_path = out_dir / "index.html"
        if not index_path.exists():
            if full_path in {"", "/"}:
                return HTMLResponse(
                    """<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>Frontend Build Missing</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem; color: #032147; }
      .card { max-width: 760px; padding: 1rem 1.2rem; border: 1px solid #d9e2f0; border-radius: 12px; }
      code { background: #f5f7fc; padding: 0.1rem 0.3rem; border-radius: 4px; }
    </style>
  </head>
  <body>
    <div class=\"card\">
      <h1>Backend is running</h1>
      <p>The frontend static build was not found at <code>frontend/out</code>.</p>
      <p>Build the frontend, then refresh this page:</p>
      <pre>cd frontend\nnpm install\nnpm run build</pre>
    </div>
  </body>
</html>""",
                    status_code=200,
                )

            raise HTTPException(
                status_code=404,
                detail="Frontend build not found. Build frontend/out first.",
            )

        if full_path in {"", "/"}:
            return FileResponse(index_path)

        requested = full_path.lstrip("/")
        candidate = out_dir / requested
        if candidate.is_file():
            return FileResponse(candidate)

        html_candidate = out_dir / f"{requested}.html"
        if html_candidate.is_file():
            return FileResponse(html_candidate)

        nested_index = out_dir / requested / "index.html"
        if nested_index.is_file():
            return FileResponse(nested_index)

        return FileResponse(index_path)

    return app


app = create_app()

from pathlib import Path
import sqlite3

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.openrouter import OpenRouterError


def _write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def _make_client(tmp_path: Path) -> TestClient:
    out_dir = tmp_path / "out"
    db_path = tmp_path / "data" / "pm.db"
    _write_file(out_dir / "index.html", "<h1>Kanban Studio</h1>")
    _write_file(out_dir / "about" / "index.html", "<h1>About</h1>")
    _write_file(out_dir / "_next" / "static" / "chunk.js", "console.log('ok');")
    app = create_app(frontend_out_dir=out_dir, db_path=db_path)
    return TestClient(app)


def test_health(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_hello(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    response = client.get("/api/hello")
    assert response.status_code == 200
    assert response.json() == {"message": "hello from backend"}


def test_root_serves_index_html(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Kanban Studio" in response.text


def test_serves_static_asset(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    response = client.get("/_next/static/chunk.js")
    assert response.status_code == 200
    assert "console.log('ok');" in response.text


def test_serves_nested_page(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    response = client.get("/about")
    assert response.status_code == 200
    assert "About" in response.text


def test_falls_back_to_index_when_route_missing(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    response = client.get("/unknown/route")
    assert response.status_code == 200
    assert "Kanban Studio" in response.text


def test_root_fallback_when_frontend_build_missing(tmp_path: Path) -> None:
    app = create_app(frontend_out_dir=tmp_path / "missing-out")
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert "Backend is running" in response.text


def test_404_asset_when_frontend_build_missing(tmp_path: Path) -> None:
    app = create_app(
        frontend_out_dir=tmp_path / "missing-out",
        db_path=tmp_path / "data" / "pm.db",
    )
    client = TestClient(app)
    response = client.get("/_next/static/chunk.js")
    assert response.status_code == 404
    assert response.json() == {
        "detail": "Frontend build not found. Build frontend/out first."
    }


def test_db_created_with_required_tables(tmp_path: Path) -> None:
    db_path = tmp_path / "data" / "pm.db"
    create_app(frontend_out_dir=tmp_path / "missing-out", db_path=db_path)

    assert db_path.exists()

    with sqlite3.connect(db_path) as conn:
        table_names = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            ).fetchall()
        }

    assert "users" in table_names
    assert "boards" in table_names


def test_get_board_seeds_default_for_user(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    response = client.get("/api/board/user")

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "user"
    assert len(data["board"]["columns"]) == 5
    assert "card-1" in data["board"]["cards"]


def test_put_board_persists_for_user(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    payload = {
        "columns": [
            {
                "id": "col-backlog",
                "title": "Backlog",
                "cardIds": ["card-1"],
            },
            {
                "id": "col-discovery",
                "title": "Discovery",
                "cardIds": ["card-2", "card-3"],
            },
            {
                "id": "col-progress",
                "title": "In Progress",
                "cardIds": ["card-4"],
            },
            {
                "id": "col-review",
                "title": "Review",
                "cardIds": ["card-5"],
            },
            {
                "id": "col-done",
                "title": "Done",
                "cardIds": ["card-6"],
            },
        ],
        "cards": {
            "card-1": {
                "id": "card-1",
                "title": "Updated title",
                "details": "Updated details",
            },
            "card-2": {
                "id": "card-2",
                "title": "Team kickoff notes",
                "details": "Collect assumptions and owners.",
            },
            "card-3": {
                "id": "card-3",
                "title": "Interview pilot users",
                "details": "Run 5 interviews and synthesize blockers.",
            },
            "card-4": {
                "id": "card-4",
                "title": "Build auth page",
                "details": "Implement sign-in flow with basic validation.",
            },
            "card-5": {
                "id": "card-5",
                "title": "Review API contract",
                "details": "Confirm response envelope before release.",
            },
            "card-6": {
                "id": "card-6",
                "title": "Publish release notes",
                "details": "Summarize shipped work for stakeholders.",
            },
        },
    }

    put_response = client.put("/api/board/user", json=payload)
    assert put_response.status_code == 200
    assert put_response.json()["board"] == payload

    get_response = client.get("/api/board/user")
    assert get_response.status_code == 200
    assert get_response.json()["board"] == payload


def test_put_board_isolated_between_users(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    payload = {
        "columns": [
            {
                "id": "col-backlog",
                "title": "Alice Backlog",
                "cardIds": ["alice-card-1"],
            },
            {
                "id": "col-discovery",
                "title": "Discovery",
                "cardIds": [],
            },
            {
                "id": "col-progress",
                "title": "In Progress",
                "cardIds": [],
            },
            {
                "id": "col-review",
                "title": "Review",
                "cardIds": [],
            },
            {
                "id": "col-done",
                "title": "Done",
                "cardIds": [],
            },
        ],
        "cards": {
            "alice-card-1": {
                "id": "alice-card-1",
                "title": "Alice only",
                "details": "Private card",
            }
        },
    }

    assert client.put("/api/board/alice", json=payload).status_code == 200
    alice = client.get("/api/board/alice").json()["board"]
    bob = client.get("/api/board/bob").json()["board"]

    assert alice == payload
    assert bob != payload


def test_put_board_rejects_invalid_payload(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    invalid_payload = {
        "columns": [
            {
                "id": "col-backlog",
                "title": "Backlog",
                "cardIds": ["card-1"],
            }
        ]
    }

    response = client.put("/api/board/user", json=invalid_payload)
    assert response.status_code == 422


def test_put_board_rejects_column_id_order_changes(tmp_path: Path):
    client = _make_client(tmp_path)
    board = {
        "columns": [
            {
                "id": "col-discovery",
                "title": "Discovery",
                "cardIds": ["card-2", "card-3"],
            },
            {
                "id": "col-backlog",
                "title": "Backlog",
                "cardIds": ["card-1"],
            },
            {
                "id": "col-progress",
                "title": "In Progress",
                "cardIds": ["card-4"],
            },
            {
                "id": "col-review",
                "title": "Review",
                "cardIds": ["card-5"],
            },
            {
                "id": "col-done",
                "title": "Done",
                "cardIds": ["card-6"],
            },
        ],
        "cards": {
            "card-1": {
                "id": "card-1",
                "title": "A",
                "details": "A",
            },
            "card-2": {
                "id": "card-2",
                "title": "B",
                "details": "B",
            },
            "card-3": {
                "id": "card-3",
                "title": "C",
                "details": "C",
            },
            "card-4": {
                "id": "card-4",
                "title": "D",
                "details": "D",
            },
            "card-5": {
                "id": "card-5",
                "title": "E",
                "details": "E",
            },
            "card-6": {
                "id": "card-6",
                "title": "F",
                "details": "F",
            },
        },
    }

    response = client.put("/api/board/user", json=board)

    assert response.status_code == 422
    assert response.json()["detail"] == "Columns must keep fixed ids and order."


def test_board_endpoint_allows_cors_preflight(tmp_path: Path) -> None:
    client = _make_client(tmp_path)
    response = client.options(
        "/api/board/user",
        headers={
            "Origin": "http://127.0.0.1:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:3000"


def test_ai_ping_success(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    from app import main as main_module

    monkeypatch.setattr(
        main_module,
        "run_openrouter_connectivity_check",
        lambda: {"model": "openai/gpt-oss-120b", "reply": "4"},
    )
    client = _make_client(tmp_path)

    response = client.get("/api/ai/ping")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "model": "openai/gpt-oss-120b",
        "reply": "4",
    }


def test_ai_ping_missing_key_maps_to_503(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app import main as main_module

    def raise_missing_key() -> dict[str, str]:
        raise OpenRouterError("missing_key", "OPENROUTER_API_KEY is not configured.")

    monkeypatch.setattr(
        main_module,
        "run_openrouter_connectivity_check",
        raise_missing_key,
    )
    client = _make_client(tmp_path)

    response = client.get("/api/ai/ping")

    assert response.status_code == 503
    assert response.json() == {"detail": "OPENROUTER_API_KEY is not configured."}


def test_ai_ping_network_error_maps_to_502(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app import main as main_module

    def raise_network_error() -> dict[str, str]:
        raise OpenRouterError("network", "Unable to reach OpenRouter.")

    monkeypatch.setattr(
        main_module,
        "run_openrouter_connectivity_check",
        raise_network_error,
    )
    client = _make_client(tmp_path)

    response = client.get("/api/ai/ping")

    assert response.status_code == 502
    assert response.json() == {"detail": "Unable to reach OpenRouter."}


def test_ai_ping_non_2xx_maps_to_502(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app import main as main_module

    def raise_non_2xx() -> dict[str, str]:
        raise OpenRouterError("upstream_status", "OpenRouter returned non-2xx status: 401.")

    monkeypatch.setattr(
        main_module,
        "run_openrouter_connectivity_check",
        raise_non_2xx,
    )
    client = _make_client(tmp_path)

    response = client.get("/api/ai/ping")

    assert response.status_code == 502
    assert response.json() == {"detail": "OpenRouter returned non-2xx status: 401."}


def test_ai_chat_valid_output_without_board_update(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app import main as main_module

    def fake_chat(**_kwargs):
        from app.models import AIModelOutputModel

        return AIModelOutputModel(assistantMessage="No changes needed.", board=None)

    monkeypatch.setattr(main_module, "run_openrouter_structured_chat", fake_chat)
    client = _make_client(tmp_path)

    before = client.get("/api/board/user").json()["board"]
    response = client.post(
        "/api/ai/chat",
        json={"username": "user", "message": "Summarize my board."},
    )
    after = client.get("/api/board/user").json()["board"]

    assert response.status_code == 200
    body = response.json()
    assert body["assistantMessage"] == "No changes needed."
    assert body["boardUpdated"] is False
    assert body["usedFallback"] is False
    assert body["board"] == before
    assert after == before


def test_ai_chat_valid_output_with_board_update_persists(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app import main as main_module

    def fake_chat(**kwargs):
        from app.models import AIModelOutputModel, BoardModel

        current = kwargs["current_board"]
        current["columns"][0]["title"] = "Ideas"
        return AIModelOutputModel(
            assistantMessage="Renamed backlog to Ideas.",
            board=BoardModel.model_validate(current),
        )

    monkeypatch.setattr(main_module, "run_openrouter_structured_chat", fake_chat)
    client = _make_client(tmp_path)

    response = client.post(
        "/api/ai/chat",
        json={"username": "user", "message": "Rename Backlog to Ideas."},
    )
    persisted = client.get("/api/board/user").json()["board"]

    assert response.status_code == 200
    body = response.json()
    assert body["assistantMessage"] == "Renamed backlog to Ideas."
    assert body["boardUpdated"] is True
    assert body["usedFallback"] is False
    assert body["board"]["columns"][0]["title"] == "Ideas"
    assert persisted["columns"][0]["title"] == "Ideas"


def test_ai_chat_invalid_schema_falls_back_without_persisting(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app import main as main_module

    def fake_chat_invalid(**_kwargs):
        raise OpenRouterError("invalid_response", "AI response schema was invalid.")

    monkeypatch.setattr(main_module, "run_openrouter_structured_chat", fake_chat_invalid)
    client = _make_client(tmp_path)

    before = client.get("/api/board/user").json()["board"]
    response = client.post(
        "/api/ai/chat",
        json={"username": "user", "message": "Do a risky change."},
    )
    after = client.get("/api/board/user").json()["board"]

    assert response.status_code == 200
    body = response.json()
    assert body["boardUpdated"] is False
    assert body["usedFallback"] is True
    assert body["assistantMessage"] == "I could not safely apply that update. I kept your board unchanged."
    assert body["board"] == before
    assert after == before


def test_ai_chat_includes_conversation_history(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app import main as main_module

    captured_histories: list[list[dict[str, str]]] = []

    def fake_chat(**kwargs):
        from app.models import AIModelOutputModel

        history = [entry.model_dump() for entry in kwargs["conversation_history"]]
        captured_histories.append(history)
        return AIModelOutputModel(assistantMessage="ack", board=None)

    monkeypatch.setattr(main_module, "run_openrouter_structured_chat", fake_chat)
    client = _make_client(tmp_path)

    first = client.post(
        "/api/ai/chat",
        json={"username": "user", "message": "First prompt"},
    )
    second = client.post(
        "/api/ai/chat",
        json={"username": "user", "message": "Second prompt"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert captured_histories[0] == []
    assert captured_histories[1] == [
        {"role": "user", "content": "First prompt"},
        {"role": "assistant", "content": "ack"},
    ]


def test_ai_chat_card_count_is_deterministic_without_model_call(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app import main as main_module

    def fail_if_called(**_kwargs):
        raise AssertionError("Model call should not happen for card count questions")

    monkeypatch.setattr(main_module, "run_openrouter_structured_chat", fail_if_called)
    client = _make_client(tmp_path)

    response = client.post(
        "/api/ai/chat",
        json={"username": "user", "message": "How many cards are on this board?"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["boardUpdated"] is False
    assert body["usedFallback"] is False
    assert body["assistantMessage"].startswith("Total cards: 8.")
    assert "Backlog: 2" in body["assistantMessage"]
    assert "Discovery: 1" in body["assistantMessage"]
    assert "In Progress: 2" in body["assistantMessage"]
    assert "Review: 1" in body["assistantMessage"]
    assert "Done: 2" in body["assistantMessage"]

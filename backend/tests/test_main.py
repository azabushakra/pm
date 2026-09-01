from pathlib import Path
import sqlite3

from fastapi.testclient import TestClient

from app.main import create_app


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
            }
        ],
        "cards": {
            "card-1": {
                "id": "card-1",
                "title": "Updated title",
                "details": "Updated details",
            }
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
                "id": "col-custom",
                "title": "Custom",
                "cardIds": [],
            }
        ],
        "cards": {},
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

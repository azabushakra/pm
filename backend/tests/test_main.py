from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app


def _write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def _make_client(tmp_path: Path) -> TestClient:
    out_dir = tmp_path / "out"
    _write_file(out_dir / "index.html", "<h1>Kanban Studio</h1>")
    _write_file(out_dir / "about" / "index.html", "<h1>About</h1>")
    _write_file(out_dir / "_next" / "static" / "chunk.js", "console.log('ok');")
    app = create_app(frontend_out_dir=out_dir)
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
    app = create_app(frontend_out_dir=tmp_path / "missing-out")
    client = TestClient(app)
    response = client.get("/_next/static/chunk.js")
    assert response.status_code == 404
    assert response.json() == {
        "detail": "Frontend build not found. Build frontend/out first."
    }

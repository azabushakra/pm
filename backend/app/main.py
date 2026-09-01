from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from starlette.responses import Response


def create_app(frontend_out_dir: Path | None = None) -> FastAPI:
    app = FastAPI(title="PM MVP Backend")
    out_dir = (
        frontend_out_dir
        if frontend_out_dir is not None
        else Path(__file__).resolve().parents[2] / "frontend" / "out"
    )

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/hello")
    def hello() -> dict[str, str]:
        return {"message": "hello from backend"}

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

import json

import httpx
import pytest

from app.openrouter import OPENROUTER_MODEL, OpenRouterClient, OpenRouterError


def test_openrouter_ping_uses_pinned_model() -> None:
    captured_model: dict[str, str] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content.decode("utf-8"))
        captured_model["value"] = payload["model"]
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "4"}}]},
        )

    transport = httpx.MockTransport(handler)
    with httpx.Client(transport=transport) as http_client:
        reply = OpenRouterClient(api_key="test-key", http_client=http_client).ping()

    assert captured_model["value"] == OPENROUTER_MODEL
    assert reply == "4"


def test_openrouter_ping_success_response() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "4"}}]},
        )

    with httpx.Client(transport=httpx.MockTransport(handler)) as http_client:
        reply = OpenRouterClient(api_key="test-key", http_client=http_client).ping()

    assert reply == "4"


def test_openrouter_ping_network_error_maps_cleanly() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("network down", request=request)

    with httpx.Client(transport=httpx.MockTransport(handler)) as http_client:
        with pytest.raises(OpenRouterError) as exc:
            OpenRouterClient(api_key="test-key", http_client=http_client).ping()

    assert exc.value.kind == "network"
    assert exc.value.status_code == 502
    assert exc.value.message == "Unable to reach OpenRouter."


def test_openrouter_ping_non_2xx_maps_cleanly() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"error": "unauthorized"})

    with httpx.Client(transport=httpx.MockTransport(handler)) as http_client:
        with pytest.raises(OpenRouterError) as exc:
            OpenRouterClient(api_key="test-key", http_client=http_client).ping()

    assert exc.value.kind == "upstream_status"
    assert exc.value.status_code == 502
    assert "401" in exc.value.message

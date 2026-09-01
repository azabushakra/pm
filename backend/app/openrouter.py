from __future__ import annotations

import os
from pathlib import Path
from typing import Any
import json

import httpx

from app.models import AIModelOutputModel, ChatHistoryMessageModel

OPENROUTER_MODEL = "openai/gpt-oss-120b"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class OpenRouterError(Exception):
    def __init__(self, kind: str, message: str) -> None:
        super().__init__(message)
        self.kind = kind
        self.message = message

    @property
    def status_code(self) -> int:
        if self.kind == "missing_key":
            return 503
        return 502


def load_openrouter_api_key() -> str | None:
    env_value = os.getenv("OPENROUTER_API_KEY")
    if env_value:
        return env_value.strip()

    root_env_path = Path(__file__).resolve().parents[2] / ".env"
    if not root_env_path.exists():
        return None

    for raw_line in root_env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if not line.startswith("OPENROUTER_API_KEY="):
            continue
        _, value = line.split("=", 1)
        parsed = value.strip().strip('"').strip("'")
        return parsed or None

    return None


class OpenRouterClient:
    def __init__(self, api_key: str, http_client: httpx.Client | None = None) -> None:
        self.api_key = api_key
        self.http_client = http_client

    def ping(self) -> str:
        payload = _base_chat_payload(
            [
                {
                    "role": "user",
                    "content": "What is 2+2? Reply with only the number.",
                }
            ]
        )

        response = self._post_chat(payload)
        data = _parse_json_response(response)
        reply = _extract_reply_text(data)
        return reply

    def chat(self, messages: list[dict[str, str]]) -> str:
        payload = _base_chat_payload(messages)
        response = self._post_chat(payload)
        data = _parse_json_response(response)
        return _extract_reply_text(data)

    def _post_chat(self, payload: dict[str, Any]) -> httpx.Response:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            if self.http_client is not None:
                response = self.http_client.post(
                    OPENROUTER_URL,
                    headers=headers,
                    json=payload,
                    timeout=15.0,
                )
            else:
                with httpx.Client(timeout=15.0) as client:
                    response = client.post(
                        OPENROUTER_URL,
                        headers=headers,
                        json=payload,
                    )
        except httpx.RequestError as exc:
            raise OpenRouterError("network", "Unable to reach OpenRouter.") from exc

        if response.status_code < 200 or response.status_code >= 300:
            raise OpenRouterError(
                "upstream_status",
                f"OpenRouter returned non-2xx status: {response.status_code}.",
            )

        return response


def _base_chat_payload(messages: list[dict[str, str]]) -> dict[str, Any]:
    return {
        "model": OPENROUTER_MODEL,
        "messages": messages,
    }


def _parse_json_response(response: httpx.Response) -> dict[str, Any]:
    try:
        data = response.json()
    except ValueError as exc:
        raise OpenRouterError("invalid_response", "OpenRouter response was not valid JSON.") from exc

    if not isinstance(data, dict):
        raise OpenRouterError("invalid_response", "OpenRouter response JSON root was not an object.")

    return data


def _extract_reply_text(data: dict[str, Any]) -> str:
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise OpenRouterError("invalid_response", "OpenRouter response missing choices.")

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise OpenRouterError("invalid_response", "OpenRouter response choice was invalid.")

    message = first_choice.get("message")
    if not isinstance(message, dict):
        raise OpenRouterError("invalid_response", "OpenRouter response missing message.")

    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise OpenRouterError("invalid_response", "OpenRouter response missing content.")

    return content.strip()


def run_openrouter_connectivity_check(http_client: httpx.Client | None = None) -> dict[str, str]:
    api_key = load_openrouter_api_key()
    if not api_key:
        raise OpenRouterError(
            "missing_key",
            "OPENROUTER_API_KEY is not configured.",
        )

    reply = OpenRouterClient(api_key=api_key, http_client=http_client).ping()
    return {
        "model": OPENROUTER_MODEL,
        "reply": reply,
    }


def _card_count_block(current_board: dict[str, Any]) -> str:
    columns = current_board["columns"]
    per_column = " | ".join(
        f"{column['title']}: {len(column['cardIds'])}" for column in columns
    )
    total = sum(len(column["cardIds"]) for column in columns)
    return (
        "Card counts, already computed for you. Use these numbers directly "
        "rather than counting the JSON yourself:\n"
        f"Total cards: {total}. {per_column}"
    )


def run_openrouter_structured_chat(
    *,
    user_message: str,
    current_board: dict[str, Any],
    conversation_history: list[ChatHistoryMessageModel],
    http_client: httpx.Client | None = None,
) -> AIModelOutputModel:
    api_key = load_openrouter_api_key()
    if not api_key:
        raise OpenRouterError(
            "missing_key",
            "OPENROUTER_API_KEY is not configured.",
        )

    system_prompt = (
        "You are a project management assistant. "
        "Return ONLY valid JSON with this exact schema: "
        '{"assistantMessage": string, "board": BoardObjectOrNull}. '
        "If no board changes are needed, set board to null. "
        "Never include markdown or prose outside JSON."
    )

    history_lines = [f"- {msg.role}: {msg.content}" for msg in conversation_history]
    history_block = "\n".join(history_lines) if history_lines else "- none"
    user_prompt = (
        "Current board JSON:\n"
        f"{json.dumps(current_board)}\n\n"
        f"{_card_count_block(current_board)}\n\n"
        "Conversation history:\n"
        f"{history_block}\n\n"
        "Latest user message:\n"
        f"{user_message}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    raw_reply = OpenRouterClient(api_key=api_key, http_client=http_client).chat(messages)

    try:
        parsed_reply = json.loads(raw_reply)
    except ValueError as exc:
        raise OpenRouterError(
            "invalid_response",
            "AI response was not valid JSON for the required schema.",
        ) from exc

    if not isinstance(parsed_reply, dict):
        raise OpenRouterError(
            "invalid_response",
            "AI response schema was invalid.",
        )

    try:
        return AIModelOutputModel.model_validate(parsed_reply)
    except Exception as exc:
        raise OpenRouterError(
            "invalid_response",
            "AI response schema was invalid.",
        ) from exc

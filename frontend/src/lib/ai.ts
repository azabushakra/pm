import type { BoardData } from "@/lib/kanban";

type AIChatResponse = {
  username: string;
  assistantMessage: string;
  boardUpdated: boolean;
  usedFallback: boolean;
  board: BoardData;
};

const ENV_API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
  /\/$/,
  ""
);

const resolveApiBaseUrl = () => {
  if (ENV_API_BASE_URL) {
    return ENV_API_BASE_URL;
  }

  if (typeof window === "undefined") {
    return "";
  }

  const { hostname, port } = window.location;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
  const isNextDevPort = /^3\d{3}$/.test(port);
  if (isLocalHost && isNextDevPort) {
    return "http://127.0.0.1:8000";
  }

  return "";
};

const chatUrl = () => `${resolveApiBaseUrl()}/api/ai/chat`;

export const sendChatMessage = async (
  username: string,
  message: string
): Promise<AIChatResponse> => {
  const response = await fetch(chatUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, message }),
  });

  if (!response.ok) {
    const raw = await response.text();
    try {
      const errorBody = JSON.parse(raw) as { detail?: string };
      if (errorBody?.detail) {
        throw new Error(errorBody.detail);
      }
    } catch {
      if (raw.trim()) {
        throw new Error(raw.trim());
      }
    }

    throw new Error(`Chat request failed with status ${response.status}`);
  }

  const body = (await response.json()) as AIChatResponse;
  if (!body || typeof body !== "object" || typeof body.assistantMessage !== "string") {
    throw new Error("Invalid chat response payload");
  }

  return body;
};

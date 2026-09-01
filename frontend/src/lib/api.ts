import type { BoardData } from "@/lib/kanban";

type BoardEnvelope = {
  username: string;
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

const boardUrl = (username: string) =>
  `${resolveApiBaseUrl()}/api/board/${encodeURIComponent(username)}`;

const parseBoardEnvelope = async (response: Response): Promise<BoardEnvelope> => {
  if (!response.ok) {
    throw new Error(`Board request failed with status ${response.status}`);
  }

  const body = (await response.json()) as BoardEnvelope;
  if (!body || typeof body !== "object" || !body.board) {
    throw new Error("Invalid board response payload");
  }

  return body;
};

export const fetchBoard = async (username: string): Promise<BoardData> => {
  const response = await fetch(boardUrl(username), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const payload = await parseBoardEnvelope(response);
  return payload.board;
};

export const saveBoard = async (
  username: string,
  board: BoardData
): Promise<BoardData> => {
  const response = await fetch(boardUrl(username), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(board),
  });
  const payload = await parseBoardEnvelope(response);
  return payload.board;
};

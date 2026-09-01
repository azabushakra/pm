"use client";

import { FormEvent, useState } from "react";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AIChatSidebarProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (message: string) => Promise<void>;
};

export const AIChatSidebar = ({ messages, isLoading, error, onSend }: AIChatSidebarProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    setInput("");
    await onSend(trimmed);
  };

  return (
    <aside className="flex h-[640px] max-h-[calc(100vh-5rem)] min-h-[560px] flex-col overflow-hidden rounded-3xl border border-[var(--stroke)] bg-white shadow-[var(--shadow)]">
      <div className="border-b border-[var(--stroke)] bg-[linear-gradient(145deg,#032147_0%,#0a3c76_58%,#209dd7_100%)] px-5 py-5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/80">
          AI Assistant
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-white">
          Board Copilot
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/85">
          Ask for card creation, edits, and moves. Replies can apply board updates instantly.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#f4f8ff_0%,#f8f9fc_100%)] px-4 py-4" data-testid="chat-messages">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--stroke)] bg-white/70 px-4 py-3 text-sm text-[var(--gray-text)]">
            Try: Move card-1 to Review and rename Backlog to Ideas.
          </div>
        ) : null}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "user"
                ? "ml-8 rounded-2xl rounded-br-md bg-[var(--navy-dark)] px-3 py-2 text-sm leading-6 text-white shadow-[0_10px_20px_rgba(3,33,71,0.16)]"
                : "mr-8 rounded-2xl rounded-bl-md border border-[var(--stroke)] bg-white px-3 py-2 text-sm leading-6 text-[var(--navy-dark)] shadow-[0_6px_16px_rgba(3,33,71,0.08)]"
            }
          >
            {message.content}
          </div>
        ))}
        {isLoading ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary-blue)]">
            Thinking...
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <form className="mt-3 border-t border-[var(--stroke)] bg-white px-4 pb-4 pt-3" onSubmit={handleSubmit}>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]" htmlFor="chat-input">
          Message
        </label>
        <div className="mt-2 flex items-end gap-2 rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] p-2">
          <textarea
            id="chat-input"
            rows={3}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Tell AI what to update on the board"
            className="min-h-[84px] flex-1 resize-none rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]"
          />
          <button
            type="submit"
            disabled={isLoading || input.trim().length === 0}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--secondary-purple)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </aside>
  );
};

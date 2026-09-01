"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import clsx from "clsx";

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

const SUGGESTIONS = [
  "Move card-1 to Review",
  "Rename Backlog to Ideas",
  "Add a card to Discovery",
];

export const AIChatSidebar = ({ messages, isLoading, error, onSend }: AIChatSidebarProps) => {
  const [input, setInput] = useState("");
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.scrollTop = stream.scrollHeight;
    }
  }, [messages, isLoading]);

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }
    setInput("");
    await onSend(trimmed);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit();
  };

  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--stroke)] bg-white shadow-[var(--shadow-md)]">
      <header className="flex shrink-0 items-center gap-2.5 border-b border-[var(--stroke)] px-4 py-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--secondary-purple)] text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
          </svg>
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[0.9375rem] font-semibold text-[var(--ink)]">
            Board Copilot
          </h2>
          <p className="text-xs text-[var(--muted)]">Creates, edits, and moves cards</p>
        </div>
      </header>

      <div
        ref={streamRef}
        className="scroll-slim min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4"
        data-testid="chat-messages"
      >
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-[0.8125rem] text-[var(--muted)]">
              Ask for board changes in plain language.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="rounded-full border border-[var(--stroke)] bg-[var(--surface-sunken)] px-2.5 py-1 text-xs font-medium text-[var(--ink-soft)] transition hover:border-[var(--primary-blue)] hover:text-[var(--primary-blue)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={clsx(
              "max-w-[88%] rounded-2xl px-3 py-2 text-[0.8125rem] leading-5 break-words [overflow-wrap:anywhere]",
              message.role === "user"
                ? "ml-auto rounded-br-sm bg-[var(--navy-dark)] text-white"
                : "mr-auto rounded-bl-sm border border-[var(--stroke)] bg-[var(--surface-sunken)] text-[var(--ink)]"
            )}
          >
            {message.content}
          </div>
        ))}

        {isLoading ? (
          <div className="mr-auto inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-[var(--stroke)] bg-[var(--surface-sunken)] px-3 py-2">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--primary-blue)] [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--primary-blue)] [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--primary-blue)]" />
            <span className="ml-1 text-xs font-medium text-[var(--muted)]">Thinking</span>
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          className="mx-4 mb-1 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form className="shrink-0 border-t border-[var(--stroke)] p-3" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="chat-input">
          Message
        </label>
        <div className="flex items-end gap-2 rounded-xl border border-[var(--stroke)] bg-[var(--surface-sunken)] p-1.5 transition focus-within:border-[var(--primary-blue)] focus-within:bg-white">
          <textarea
            id="chat-input"
            rows={2}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            placeholder="Ask the assistant"
            className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[0.8125rem] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
          />
          <button
            type="submit"
            disabled={isLoading || input.trim().length === 0}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary-purple)] px-3 text-[0.8125rem] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isLoading ? "Sending" : "Send"}
          </button>
        </div>
      </form>
    </aside>
  );
};

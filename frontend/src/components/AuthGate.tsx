"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import {
  DEMO_USERNAME,
  getAuthSnapshot,
  getServerAuthSnapshot,
  signIn,
  signOut,
  subscribeToAuth,
} from "@/lib/auth";

export const AuthGate = () => {
  const isAuthenticated = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getServerAuthSnapshot
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (signIn(username, password)) {
      setError(null);
      return;
    }

    setError("Incorrect username or password.");
  };

  const handleLogout = () => {
    signOut();
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setError(null);
  };

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[var(--surface)] px-6 py-12">
        <section className="w-full max-w-[400px] rounded-2xl border border-[var(--stroke)] bg-white p-8 shadow-[var(--shadow-lg)]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--navy-dark)]">
            <span className="grid grid-cols-2 gap-1">
              <span className="h-2 w-2 rounded-[3px] bg-[var(--accent-yellow)]" />
              <span className="h-2 w-2 rounded-[3px] bg-[var(--primary-blue)]" />
              <span className="h-2 w-2 rounded-[3px] bg-[var(--primary-blue)]" />
              <span className="h-2 w-2 rounded-[3px] bg-[#10a37a]" />
            </span>
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-[var(--ink)]">
            Kanban Studio
          </h1>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Sign in to open your board.
          </p>

          <form className="mt-6 flex flex-col gap-1.5" onSubmit={handleSubmit}>
            <label
              className="text-[0.8125rem] font-semibold text-[var(--ink)]"
              htmlFor="username"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mb-2 rounded-lg border border-[var(--stroke)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--primary-blue)]"
              autoComplete="username"
              required
            />

            <label
              className="text-[0.8125rem] font-semibold text-[var(--ink)]"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-[var(--stroke)] px-3 py-2 pr-11 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--primary-blue)]"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0013.42 13.42" />
                    <path d="M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7-1 2.24-2.75 4.11-4.93 5.26" />
                    <path d="M6.61 6.61C4.62 7.89 3 9.77 2 12c1.73 3.89 6 7 10 7 1.31 0 2.58-.27 3.76-.76" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {error ? (
              <p
                className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.8125rem] text-red-700"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-4 rounded-lg bg-[var(--secondary-purple)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Sign In
            </button>
          </form>

          <p className="mt-5 rounded-lg bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--muted)]">
            Demo credentials: <span className="font-semibold text-[var(--ink-soft)]">user</span> /{" "}
            <span className="font-semibold text-[var(--ink-soft)]">password</span>
          </p>
        </section>
      </main>
    );
  }

  return <KanbanBoard username={DEMO_USERNAME} onLogout={handleLogout} />;
};

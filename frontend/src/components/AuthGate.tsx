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
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-12">
        <section className="w-full max-w-md rounded-3xl border border-[var(--stroke)] bg-white p-8 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">
            Sign In
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-[var(--navy-dark)]">
            Kanban Studio
          </h1>
          <p className="mt-2 text-sm text-[var(--gray-text)]">
            Use the demo account to access your board.
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="text-sm font-semibold text-[var(--navy-dark)]" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="rounded-xl border border-[var(--stroke)] px-3 py-2 text-sm outline-none focus:border-[var(--primary-blue)]"
              autoComplete="username"
              required
            />

            <label className="text-sm font-semibold text-[var(--navy-dark)]" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--stroke)] px-3 py-2 pr-11 text-sm outline-none focus:border-[var(--primary-blue)]"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-transparent p-1.5 text-[var(--gray-text)] hover:border-[var(--stroke)] hover:text-[var(--navy-dark)]"
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
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-2 rounded-xl bg-[var(--secondary-purple)] px-4 py-2 text-sm font-semibold text-white"
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 text-xs text-[var(--gray-text)]">
            Demo credentials: user / password
          </p>
        </section>
      </main>
    );
  }

  return (
    <div>
      <div className="fixed right-6 top-5 z-20">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-[var(--stroke)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--navy-dark)] shadow-[var(--shadow)]"
        >
          Log out
        </button>
      </div>
      <KanbanBoard username={DEMO_USERNAME} />
    </div>
  );
};

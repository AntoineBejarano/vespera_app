"use client";

import Link from "next/link";
import { useHexclaveApp, useUser } from "@hexclave/next";

export function AppNav({
  email,
}: {
  email?: string | null;
}) {
  const app = useHexclaveApp();
  const user = useUser();

  return (
    <header className="border-b border-[var(--line)] bg-[var(--bg-elevated)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href={user ? "/personas" : "/"}
          className="font-[family-name:var(--font-display)] text-xl tracking-wide text-[var(--ink)]"
        >
          Vespera{" "}
          <span className="text-xs font-sans tracking-wider text-[var(--muted)]">
            admin
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[var(--muted)]">
          {user ? (
            <>
              <Link href="/personas" className="hover:text-[var(--ink)]">
                Personas
              </Link>
              <Link href="/personas/new" className="hover:text-[var(--ink)]">
                New
              </Link>
              <Link href="/chat" className="hover:text-[var(--ink)]">
                Test chat
              </Link>
              <Link href="/memory" className="hover:text-[var(--ink)]">
                Memory
              </Link>
              <Link href="/settings" className="hover:text-[var(--ink)]">
                Settings
              </Link>
              <button
                type="button"
                className="hover:text-[var(--ink)]"
                onClick={() => app.redirectToSignOut()}
              >
                Sign out
              </button>
              <span className="hidden text-xs sm:inline">
                {email ?? user.primaryEmail}
              </span>
            </>
          ) : (
            <>
              <Link href="/#pipeline" className="hover:text-[var(--ink)]">
                How it works
              </Link>
              <Link href="/#pricing" className="hover:text-[var(--ink)]">
                Pricing
              </Link>
              <button
                type="button"
                className="hover:text-[var(--ink)]"
                onClick={() => app.redirectToSignIn()}
              >
                Sign in
              </button>
              <button
                type="button"
                className="bg-[var(--accent)] px-3 py-1.5 text-[var(--bg)]"
                onClick={() => app.redirectToSignUp()}
              >
                Start free
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

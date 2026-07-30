"use client";

import Link from "next/link";
import { useState } from "react";
import { useHexclaveApp, useUser } from "@hexclave/next";
import { BrandLogo } from "@/components/BrandLogo";

export function AppNav({
  email,
}: {
  email?: string | null;
}) {
  const app = useHexclaveApp();
  const user = useUser({ or: "return-null" });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg-elevated)]/90 backdrop-blur">
      <div className="safe-pad mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <BrandLogo
          href={user ? "/personas" : "/"}
          size="sm"
          onClick={() => setOpen(false)}
          priority
        />

        {/* Desktop */}
        <nav className="hidden items-center gap-4 text-sm text-[var(--muted)] md:flex">
          {user ? (
            <>
              <Link href="/personas" className="hover:text-[var(--ink)]">
                Personas
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
              <span className="max-w-[10rem] truncate text-xs lg:max-w-none">
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
                className="rounded-xl bg-[var(--accent)] px-3 py-1.5 font-medium text-white"
                onClick={() => app.redirectToSignUp()}
              >
                Start free
              </button>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] text-[var(--ink)] md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1.5">
            <span
              className={`block h-0.5 w-4 bg-current transition ${open ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-4 bg-current transition ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-4 bg-current transition ${open ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      {open ? (
        <nav className="safe-pad border-t border-[var(--line)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-base text-[var(--muted)]">
            {user ? (
              <>
                <Link
                  href="/personas"
                  className="py-2 hover:text-[var(--ink)]"
                  onClick={() => setOpen(false)}
                >
                  Personas
                </Link>
                <Link
                  href="/settings"
                  className="py-2 hover:text-[var(--ink)]"
                  onClick={() => setOpen(false)}
                >
                  Settings
                </Link>
                <button
                  type="button"
                  className="py-2 text-left hover:text-[var(--ink)]"
                  onClick={() => {
                    setOpen(false);
                    void app.redirectToSignOut();
                  }}
                >
                  Sign out
                </button>
                <p className="truncate text-xs text-[var(--muted)]">
                  {email ?? user.primaryEmail}
                </p>
              </>
            ) : (
              <>
                <Link
                  href="/#pipeline"
                  className="py-2 hover:text-[var(--ink)]"
                  onClick={() => setOpen(false)}
                >
                  How it works
                </Link>
                <Link
                  href="/#pricing"
                  className="py-2 hover:text-[var(--ink)]"
                  onClick={() => setOpen(false)}
                >
                  Pricing
                </Link>
                <button
                  type="button"
                  className="py-2 text-left hover:text-[var(--ink)]"
                  onClick={() => {
                    setOpen(false);
                    void app.redirectToSignIn();
                  }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className="mt-1 rounded-xl bg-[var(--accent)] px-4 py-3 font-medium text-white"
                  onClick={() => {
                    setOpen(false);
                    void app.redirectToSignUp();
                  }}
                >
                  Start free
                </button>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useHexclaveApp, useUser } from "@hexclave/next";
import { BrandLogo } from "@/components/BrandLogo";

const MARKETING_LINKS = [
  { href: "/#explore", label: "Explore" },
  { href: "/#create", label: "Create" },
  { href: "/voice", label: "Voice" },
  { href: "/bring", label: "Bring a Character" },
  { href: "/#creators", label: "For Creators" },
  { href: "/#studios", label: "For Studios" },
  { href: "/#pricing", label: "Pricing" },
];

const AFTER_DARK_LINKS = [
  { href: "/after-dark#pipeline", label: "How it works" },
  { href: "/after-dark#pricing", label: "Pricing" },
  { href: "/", label: "Main site" },
];

export function AppNav({
  email,
  variant = "app",
}: {
  email?: string | null;
  variant?: "app" | "marketing" | "after-dark";
}) {
  const app = useHexclaveApp();
  const user = useUser({ or: "return-null" });
  const [open, setOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);

  const guestLinks =
    variant === "after-dark"
      ? AFTER_DARK_LINKS
      : variant === "marketing"
        ? MARKETING_LINKS
        : [
            { href: "/#explore", label: "How it works" },
            { href: "/#pricing", label: "Pricing" },
          ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg-elevated)]/90 backdrop-blur">
      <div className="safe-pad mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <BrandLogo
          href={
            user
              ? "/personas"
              : variant === "after-dark"
                ? "/after-dark"
                : "/"
          }
          size="sm"
          onClick={() => setOpen(false)}
          priority
          variant={variant === "after-dark" ? "after-dark" : "default"}
          subtitle={variant === "after-dark" ? "After Dark" : undefined}
        />

        {/* Desktop */}
        <nav className="hidden items-center gap-4 text-sm text-[var(--muted)] lg:flex">
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
              <span className="max-w-[10rem] truncate text-xs xl:max-w-none">
                {email ?? user.primaryEmail}
              </span>
            </>
          ) : (
            <>
              {variant === "marketing" ? (
                <div
                  className="relative"
                  onMouseEnter={() => setExploreOpen(true)}
                  onMouseLeave={() => setExploreOpen(false)}
                >
                  <button
                    type="button"
                    className="hover:text-[var(--ink)]"
                    aria-expanded={exploreOpen}
                  >
                    Explore
                  </button>
                  {exploreOpen ? (
                    <div className="absolute left-0 top-full z-50 min-w-[12rem] pt-2">
                      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] py-2 shadow-xl">
                        {[
                          { href: "/#explore", label: "All categories" },
                          { href: "/c/luna", label: "Companions" },
                          { href: "/after-dark", label: "Companions (18+)" },
                          { href: "/c/einstein", label: "Historical Minds" },
                          { href: "/c/aiko", label: "Roleplay / Anime" },
                          { href: "/c/stoic-mentor", label: "Mentors" },
                          { href: "/#creators", label: "Virtual Creators" },
                        ].map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="block px-4 py-2 hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {guestLinks
                .filter((l) => !(variant === "marketing" && l.label === "Explore"))
                .map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="hover:text-[var(--ink)]"
                  >
                    {link.label}
                  </Link>
                ))}
              <button
                type="button"
                className="hover:text-[var(--ink)]"
                onClick={() => app.redirectToSignIn()}
              >
                Sign in
              </button>
              <button
                type="button"
                className="rounded-xl bg-[var(--accent)] px-3 py-1.5 font-medium text-[var(--accent-ink)]"
                onClick={() => app.redirectToSignUp()}
              >
                {variant === "after-dark" ? "Enter 18+" : "Create a character"}
              </button>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] text-[var(--ink)] lg:hidden"
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
        <nav className="safe-pad border-t border-[var(--line)] px-4 py-4 lg:hidden">
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
                {guestLinks.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="py-2 hover:text-[var(--ink)]"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {variant === "marketing" ? (
                  <Link
                    href="/after-dark"
                    className="py-2 hover:text-[var(--ink)]"
                    onClick={() => setOpen(false)}
                  >
                    18+ Experiences
                  </Link>
                ) : null}
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
                  className="mt-1 rounded-xl bg-[var(--accent)] px-4 py-3 font-medium text-[var(--accent-ink)]"
                  onClick={() => {
                    setOpen(false);
                    void app.redirectToSignUp();
                  }}
                >
                  {variant === "after-dark"
                    ? "Enter 18+"
                    : "Create a character"}
                </button>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useHexclaveApp, useUser, UserButton } from "@hexclave/next";
import {
  redirectToAppSignIn,
  redirectToAppSignUp,
} from "@/lib/auth/redirects";
import { SITE_URL } from "@/lib/site";

const MARKETING_LINKS = [
  { href: "/registry", label: "Registry" },
  { href: "/#live-personas", label: "Live Personas" },
  { href: "/#creators", label: "For Creators" },
  { href: "/business", label: "For Business" },
  { href: "/#pricing", label: "Pricing" },
];

const EXPLORE_LINKS = [
  { href: "/registry", label: "Persona Registry" },
  { href: "/explore", label: "All paths" },
  { href: "/explore?filter=meet", label: "Great minds" },
  { href: "/explore?filter=learn", label: "Learn" },
  { href: "/explore?filter=hire", label: "AI employees" },
  { href: "/explore?filter=create", label: "Create" },
  { href: "/chai-character-creator", label: "Chai-ready creator" },
  { href: "/bring", label: "Bring a character" },
  { href: "/integrations/claude", label: "Claude · vibecode" },
  { href: "/#cli", label: "CLI for agents" },
];

/** Hash-only so section links work on xxx home (/) and localhost (/after-dark). */
const AFTER_DARK_LINKS = [
  { href: "#voice", label: "Voice" },
  { href: "#compete", label: "Compete" },
  { href: "#pipeline", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

function Wordmark({
  href,
  subtitle,
  onClick,
  accentClass,
}: {
  href: string;
  subtitle?: string;
  onClick?: () => void;
  accentClass: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group min-w-0"
      aria-label="Vesperer"
    >
      <span className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-[1.15rem]">
        Vesper
        <span className={accentClass}>er</span>
      </span>
      {subtitle ? (
        <span className="mt-0.5 block text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
          {subtitle}
        </span>
      ) : null}
    </Link>
  );
}

/** Marketing / After Dark chrome only. Authenticated product uses AppShell. */
export function AppNav({
  variant = "marketing",
}: {
  variant?: "marketing" | "after-dark";
}) {
  const app = useHexclaveApp();
  const user = useUser({ or: "return-null" });
  const [open, setOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);

  const guestLinks =
    variant === "after-dark" ? AFTER_DARK_LINKS : MARKETING_LINKS;

  const homeHref =
    variant === "after-dark" ? "/after-dark" : user ? "/personas" : "/";

  const mainSiteHref = SITE_URL;

  const accentClass =
    variant === "after-dark"
      ? "text-[var(--accent)]"
      : "text-[var(--accent-2)]";

  const linkClass =
    "text-[13px] tracking-[0.01em] text-[var(--muted)] transition-colors hover:text-[var(--ink)]";

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--bg)]/70 backdrop-blur-xl">
      <div className="safe-pad mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:h-16 sm:px-6">
        <Wordmark
          href={homeHref}
          onClick={() => setOpen(false)}
          accentClass={accentClass}
          subtitle={variant === "after-dark" ? "After Dark" : undefined}
        />

        <nav
          className={`hidden items-center lg:flex ${
            variant === "marketing" ? "gap-4 xl:gap-6" : "gap-7"
          }`}
        >
          {variant === "marketing" ? (
            <div
              className="relative"
              onMouseEnter={() => setExploreOpen(true)}
              onMouseLeave={() => setExploreOpen(false)}
            >
              <Link
                href="/explore"
                className={linkClass}
                aria-expanded={exploreOpen}
              >
                Explore
              </Link>
              {exploreOpen ? (
                <div className="absolute left-0 top-full z-50 min-w-[11.5rem] pt-3">
                  <div className="border border-white/[0.08] bg-[var(--bg-elevated)]/95 py-2 shadow-2xl backdrop-blur-xl">
                    {EXPLORE_LINKS.map((item, i) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`block px-4 py-2 text-[13px] transition hover:bg-white/[0.03] hover:text-[var(--ink)] ${
                          i === EXPLORE_LINKS.length - 1
                            ? "mt-1 border-t border-white/[0.06] pt-3 text-[var(--muted)]"
                            : "text-[var(--muted)]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {guestLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className={linkClass}
            >
              {link.label}
            </Link>
          ))}

          {variant === "after-dark" ? (
            <a href={mainSiteHref} className={linkClass}>
              Main site
            </a>
          ) : null}

          {user ? (
            <>
              <Link href="/personas" className={linkClass}>
                Open app
              </Link>
              <UserButton showUserInfo={false} />
            </>
          ) : (
            <>
              <button
                type="button"
                className={linkClass}
                onClick={() => void redirectToAppSignIn(app)}
              >
                Sign in
              </button>
              <button
                type="button"
                className="ml-1 border border-[var(--ink)]/20 px-3.5 py-1.5 text-[13px] font-medium tracking-[0.01em] text-[var(--ink)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--accent-soft)]"
                onClick={() => {
                  if (variant === "after-dark") {
                    window.location.href = "/age-gate?zone=adult&intent=signup";
                    return;
                  }
                  void redirectToAppSignUp(app);
                }}
              >
                {variant === "after-dark" ? "Enter 18+" : "Get started"}
              </button>
            </>
          )}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center text-[var(--ink)] lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1.5">
            <span
              className={`block h-px w-5 bg-current transition ${open ? "translate-y-[7px] rotate-45" : ""}`}
            />
            <span
              className={`block h-px w-5 bg-current transition ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-px w-5 bg-current transition ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      {open ? (
        <nav className="safe-pad border-t border-white/[0.06] px-4 py-5 lg:hidden sm:px-6">
          <div className="flex flex-col gap-1 text-[15px] text-[var(--muted)]">
            {variant === "marketing"
              ? EXPLORE_LINKS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="py-2.5 hover:text-[var(--ink)]"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))
              : null}
            {guestLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="py-2.5 hover:text-[var(--ink)]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {variant === "after-dark" ? (
              <a
                href={mainSiteHref}
                className="py-2.5 hover:text-[var(--ink)]"
                onClick={() => setOpen(false)}
              >
                Main site
              </a>
            ) : null}
            {user ? (
              <>
                <Link
                  href="/personas"
                  className="py-2.5 hover:text-[var(--ink)]"
                  onClick={() => setOpen(false)}
                >
                  Open app
                </Link>
                <div className="py-2">
                  <UserButton showUserInfo={false} />
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="py-2.5 text-left hover:text-[var(--ink)]"
                  onClick={() => {
                    setOpen(false);
                    void redirectToAppSignIn(app);
                  }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className="mt-3 border border-[var(--ink)]/20 px-4 py-3 text-left font-medium text-[var(--ink)]"
                  onClick={() => {
                    setOpen(false);
                    if (variant === "after-dark") {
                      window.location.href =
                        "/age-gate?zone=adult&intent=signup";
                      return;
                    }
                    void redirectToAppSignUp(app);
                  }}
                >
                  {variant === "after-dark" ? "Enter 18+" : "Get started"}
                </button>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

"use client";

import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { PARTNERS_MAILTO } from "@/lib/adult/partners";

const MARKETING_LINKS = [
  { href: "/professionals/registry", label: "Find a professional" },
  { href: "/registry", label: "Registry" },
  { href: "/#live-personas", label: "Live Personas" },
  { href: "/#creators", label: "For Creators" },
  { href: "/business", label: "For Business" },
  { href: "/#pricing", label: "Pricing" },
];

const EXPLORE_LINKS = [
  { href: "/professionals", label: "Professionals" },
  { href: "/registry", label: "Persona Registry" },
  { href: "/explore", label: "All paths" },
  { href: "/ai-characters", label: "AI characters" },
  { href: "/historical-ai", label: "Historical AI" },
  { href: "/ai-tutors", label: "AI tutors" },
  { href: "/ai-employees", label: "AI employees" },
  { href: "/character-tools", label: "Character tools" },
  { href: "/explore?filter=meet", label: "Great minds" },
  { href: "/explore?filter=learn", label: "Learn" },
  { href: "/explore?filter=hire", label: "AI employees" },
  { href: "/explore?filter=create", label: "Create" },
  { href: "/chai-character-creator", label: "Chai-ready creator" },
  { href: "/bring", label: "Bring a character" },
  { href: "/integrations/claude", label: "Claude · vibecode" },
  { href: "/#cli", label: "CLI for agents" },
];

const AFTER_DARK_LINKS = [
  { href: "#voice", label: "Voice" },
  { href: "#compete", label: "Compete" },
  { href: "#pipeline", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

/**
 * Marketing chrome with zero Hexclave/auth hooks (plain <a>).
 * It can be used by both Server and Client Components without suspending.
 */
export function MarketingNav({
  variant = "marketing",
}: {
  variant?: "marketing" | "after-dark";
}) {
  const guestLinks =
    variant === "after-dark" ? AFTER_DARK_LINKS : MARKETING_LINKS;
  const homeHref = variant === "after-dark" ? "/after-dark" : "/";
  const accentClass =
    variant === "after-dark"
      ? "text-[var(--accent)]"
      : "text-[var(--accent-2)]";
  const linkClass =
    "text-[13px] tracking-[0.01em] text-[var(--muted)] transition-colors hover:text-[var(--ink)]";
  const signUpHref =
    variant === "after-dark" ? PARTNERS_MAILTO : "/handler/sign-up";

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--bg)]/70 backdrop-blur-xl">
      <div className="safe-pad mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:h-16 sm:px-6">
        <a href={homeHref} className="group min-w-0" aria-label="Vesperer">
          <span className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-[1.15rem]">
            Vesper
            <span className={accentClass}>er</span>
          </span>
          {variant === "after-dark" ? (
            <span className="mt-0.5 block text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              After Dark
            </span>
          ) : null}
        </a>

        <nav
          className={`hidden items-center lg:flex ${
            variant === "marketing" ? "gap-4 xl:gap-6" : "gap-7"
          }`}
          aria-label="Primary"
        >
          {variant === "marketing" ? (
            <div className="group relative">
              <a href="/explore" className={linkClass}>
                Explore
              </a>
              <div className="invisible absolute left-0 top-full z-50 min-w-[11.5rem] pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="border border-white/[0.08] bg-[var(--bg-elevated)]/95 py-2 shadow-2xl backdrop-blur-xl">
                  {EXPLORE_LINKS.map((item, i) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className={`block px-4 py-2 text-[13px] transition hover:bg-white/[0.03] hover:text-[var(--ink)] ${
                        i === EXPLORE_LINKS.length - 1
                          ? "mt-1 border-t border-white/[0.06] pt-3 text-[var(--muted)]"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {guestLinks.map((link) => (
            <a
              key={link.href + link.label}
              href={link.href}
              className={linkClass}
            >
              {link.label}
            </a>
          ))}

          {variant === "after-dark" ? (
            <a href={SITE_URL} className={linkClass}>
              Main site
            </a>
          ) : null}

          <Link href="/handler/sign-in" className={linkClass}>
            Sign in
          </Link>
          <a
            href={signUpHref}
            className="ml-1 border border-[var(--ink)]/20 px-3.5 py-1.5 text-[13px] font-medium tracking-[0.01em] text-[var(--ink)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--accent-soft)]"
          >
            {variant === "after-dark" ? "Apply for partner access" : "Get started"}
          </a>
        </nav>

        <details className="relative lg:hidden">
          <summary
            className="flex h-10 w-10 cursor-pointer list-none items-center justify-center text-[var(--ink)] [&::-webkit-details-marker]:hidden"
            aria-label="Open menu"
          >
            <span className="flex flex-col gap-1.5" aria-hidden="true">
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
            </span>
          </summary>
          <nav
            className="safe-pad absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,20rem)] border border-white/[0.06] bg-[var(--bg)]/95 px-4 py-5 shadow-2xl backdrop-blur-xl sm:px-6"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-1 text-[15px] text-[var(--muted)]">
              {variant === "marketing"
                ? EXPLORE_LINKS.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="py-2.5 hover:text-[var(--ink)]"
                    >
                      {item.label}
                    </a>
                  ))
                : null}
              {guestLinks.map((link) => (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  className="py-2.5 hover:text-[var(--ink)]"
                >
                  {link.label}
                </a>
              ))}
              {variant === "after-dark" ? (
                <a href={SITE_URL} className="py-2.5 hover:text-[var(--ink)]">
                  Main site
                </a>
              ) : null}
              <Link href="/handler/sign-in" className="py-2.5 hover:text-[var(--ink)]">
                Sign in
              </Link>
              <a
                href={signUpHref}
                className="mt-3 border border-[var(--ink)]/20 px-4 py-3 text-left font-medium text-[var(--ink)]"
              >
                {variant === "after-dark" ? "Apply for partner access" : "Get started"}
              </a>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}

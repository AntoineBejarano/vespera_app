"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@hexclave/next";
import { getAppBreadcrumbs } from "./breadcrumbs";

export function AppHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  const pathname = usePathname() || "/personas";
  const crumbs = getAppBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-[var(--bg)]/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-[var(--ink)] lg:hidden"
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <span className="flex flex-col gap-1">
            <span className="block h-px w-4 bg-current" />
            <span className="block h-px w-4 bg-current" />
            <span className="block h-px w-4 bg-current" />
          </span>
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-[13px] text-[var(--muted)]">
            {crumbs.map((crumb, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                  {i > 0 ? (
                    <span className="text-[var(--muted)]/50" aria-hidden>
                      /
                    </span>
                  ) : null}
                  {last || !crumb.href ? (
                    <span
                      className={
                        last
                          ? "truncate font-medium text-[var(--ink)]"
                          : "truncate"
                      }
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="truncate transition hover:text-[var(--ink)]"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <UserButton showUserInfo={false} />
      </div>
    </header>
  );
}

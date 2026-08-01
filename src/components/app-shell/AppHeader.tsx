"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { UserButton } from "@hexclave/next";
import { Button } from "@/components/ui/button";
import { getAppBreadcrumbs } from "./breadcrumbs";

export function AppHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  const pathname = usePathname() || "/personas";
  const crumbs = getAppBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/75 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="lg:hidden"
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </Button>

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
            {crumbs.map((crumb, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li
                  key={`${crumb.label}-${i}`}
                  className="flex min-w-0 items-center gap-1.5"
                >
                  {i > 0 ? (
                    <span className="text-muted-foreground/40" aria-hidden>
                      /
                    </span>
                  ) : null}
                  {last || !crumb.href ? (
                    <span
                      className={
                        last
                          ? "truncate font-medium text-foreground"
                          : "truncate"
                      }
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="truncate transition hover:text-foreground"
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

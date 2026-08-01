"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { DebugRoleSwitcher } from "@/components/DebugRoleSwitcher";
import { APP_NAV_GROUPS } from "./nav-items";

export function AppSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname() || "/personas";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[16.5rem] flex-col border-r border-white/[0.06] bg-[var(--bg-elevated)] transition-transform lg:static lg:z-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-4">
          <Link
            href="/personas"
            onClick={onClose}
            className="min-w-0"
            aria-label="Vesperer"
          >
            <span className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Vesper<span className="text-[var(--accent-2)]">er</span>
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center text-[var(--muted)] lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-white/[0.06] px-3 py-3">
          <WorkspaceSwitcher />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {APP_NAV_GROUPS.map((group) => (
            <div key={group.id} className="mb-5">
              <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]/70">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.match?.(pathname) ?? false;

                  if (item.soon || !item.href) {
                    return (
                      <li key={item.id}>
                        <span className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-[var(--muted)]/50">
                          {item.label}
                          <span className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                            Soon
                          </span>
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={
                          active
                            ? "flex items-center rounded-lg bg-white/[0.06] px-2.5 py-2 text-[13px] font-medium text-[var(--ink)]"
                            : "flex items-center rounded-lg px-2.5 py-2 text-[13px] text-[var(--muted)] transition hover:bg-white/[0.03] hover:text-[var(--ink)]"
                        }
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/[0.06] px-3 py-4">
          <Link
            href="/personas/new"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-lg border border-[var(--ink)]/15 bg-[var(--accent)]/15 px-3 py-2.5 text-[13px] font-medium text-[var(--ink)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/25"
          >
            New persona
          </Link>
          <DebugRoleSwitcher />
        </div>
      </aside>
    </>
  );
}

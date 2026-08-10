"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarPath, setSidebarPath] = useState<string | null>(null);
  const pathname = usePathname();
  const sidebarOpen = sidebarPath === pathname;

  if (pathname === "/professionals/session") {
    return <main className="h-dvh overflow-hidden">{children}</main>;
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-transparent text-[var(--ink)]">
      <Suspense fallback={null}>
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarPath(null)} />
      </Suspense>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppHeader onMenuOpen={() => setSidebarPath(pathname)} />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

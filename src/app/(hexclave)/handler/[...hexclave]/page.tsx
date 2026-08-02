import Link from "next/link";
import { Suspense } from "react";
import { HexclaveHandler } from "@hexclave/next";
import { BrandLogo } from "@/components/BrandLogo";
import { PageSpinner } from "@/components/Spinner";

export default function HexclaveHandlerPage() {
  return (
    <div className="relative min-h-dvh bg-[var(--bg)]">
      <div className="safe-pad pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="pointer-events-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/90 px-2.5 py-1.5 shadow-lg backdrop-blur">
          <BrandLogo href="/" size="sm" />
        </div>
        <Link
          href="/"
          className="pointer-events-auto hidden rounded-full border border-[var(--line)] bg-[var(--bg-elevated)]/90 px-3 py-2 text-sm text-[var(--muted)] backdrop-blur hover:text-[var(--ink)] sm:inline-flex"
        >
          Back to landing
        </Link>
      </div>
      <Suspense fallback={<PageSpinner label="Opening auth" />}>
        <div className="pt-16 sm:pt-14">
          <HexclaveHandler fullPage />
        </div>
      </Suspense>
    </div>
  );
}

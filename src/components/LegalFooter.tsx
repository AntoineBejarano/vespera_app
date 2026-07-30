import Link from "next/link";
import { LEGAL_PAGES, LEGAL_VERSION } from "@/lib/legal/constants";

export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer
      className={`border-t border-[var(--line)] px-4 py-8 text-sm text-[var(--muted)] sm:px-6 ${className ?? ""}`}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p>
          vesperer.com · adults only (18+) · legal v{LEGAL_VERSION}
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {LEGAL_PAGES.map((p) => (
            <Link
              key={p.slug}
              href={`/legal/${p.slug}`}
              className="hover:text-[var(--ink)]"
            >
              {p.title}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mx-auto mt-4 max-w-5xl text-xs leading-relaxed text-[var(--muted)]/80">
        Access is restricted to adults. Sexual content involving minors is
        strictly prohibited. Self-attestation gates are not a substitute for
        jurisdiction-specific age-assurance or counsel-reviewed contracts.
      </p>
    </footer>
  );
}

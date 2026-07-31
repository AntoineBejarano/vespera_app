import Link from "next/link";
import { LEGAL_PAGES, LEGAL_VERSION } from "@/lib/legal/constants";

const MARKETING_LINKS = [
  { href: "/technology", label: "Developers" },
  { href: "/voice", label: "Voice AI" },
  { href: "/legal/acceptable-use", label: "Safety" },
  { href: "/#ownership", label: "Ownership" },
  { href: "/bring", label: "Supported Formats" },
  { href: "/#studios", label: "Private Deployment" },
  { href: "/after-dark", label: "18+ Experiences" },
];

export function LegalFooter({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "marketing" | "after-dark";
}) {
  return (
    <footer
      className={`border-t border-[var(--line)] px-4 py-8 text-sm text-[var(--muted)] sm:px-6 ${className ?? ""}`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {variant === "marketing" || variant === "after-dark" ? (
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {(variant === "after-dark"
              ? [
                  { href: "/", label: "Vesperer" },
                  { href: "/after-dark#pipeline", label: "How it works" },
                  { href: "/after-dark#pricing", label: "Pricing" },
                  { href: "/#ownership", label: "Ownership" },
                  { href: "/legal/acceptable-use", label: "Safety" },
                ]
              : MARKETING_LINKS
            ).map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-[var(--ink)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p>
            Vesperer
            {variant === "after-dark" ? " · After Dark" : ""}
            {variant === "after-dark" || variant === "default"
              ? " · adults only (18+)"
              : ""}
            {" · "}legal v{LEGAL_VERSION}
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

        <p className="text-xs leading-relaxed text-[var(--muted)]/80">
          {variant === "marketing"
            ? "Vesperer helps you create AI characters with persistent identity and memory. Adult experiences are offered separately under Vesperer After Dark. Sexual content involving minors is strictly prohibited."
            : "Access is restricted to adults. Sexual content involving minors is strictly prohibited. Self-attestation gates are not a substitute for jurisdiction-specific age-assurance or counsel-reviewed contracts."}
        </p>
      </div>
    </footer>
  );
}

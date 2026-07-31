import Link from "next/link";
import { LEGAL_PAGES } from "@/lib/legal/constants";

const MARKETING_LINKS = [
  { href: "/technology", label: "Developers" },
  { href: "/voice", label: "Voice" },
  { href: "/legal/acceptable-use", label: "Safety" },
  { href: "/#ownership", label: "Ownership" },
  { href: "/bring", label: "Supported Formats" },
  { href: "/#studios", label: "Private Deployment" },
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
            {variant === "after-dark" ? " · adults only (18+)" : ""}
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
            <Link href="/report" className="hover:text-[var(--ink)]">
              Report abuse
            </Link>
            {variant === "marketing" ? (
              <Link href="/after-dark" className="hover:text-[var(--ink)]">
                After Dark (18+)
              </Link>
            ) : null}
          </nav>
        </div>

        <p className="text-xs leading-relaxed text-[var(--muted)]/80">
          {variant === "after-dark"
            ? "After Dark is an adults-only zone. Sexual content involving minors is strictly prohibited."
            : variant === "marketing"
              ? "Vesperer provides AI character infrastructure with identity, memory, and automated-interaction disclosures (EU AI Act transparency). Adult content is only in After Dark, a separate 18+ zone."
              : "Automated AI interactions are disclosed per our Terms and Privacy Policy. Illegal and exploitative content is prohibited."}
        </p>
      </div>
    </footer>
  );
}

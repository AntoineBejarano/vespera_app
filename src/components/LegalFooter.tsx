import Link from "next/link";
import { LEGAL_PAGES } from "@/lib/legal/constants";
import { AFTER_DARK_URL, SITE_URL } from "@/lib/site";

const MARKETING_LINKS = [
  { href: "/docs", label: "API docs" },
  { href: "/help", label: "Help" },
  { href: "/technology", label: "Technology" },
  { href: "/voice", label: "Voice" },
  { href: "/bring", label: "Bring a character" },
  { href: "/legal/acceptable-use", label: "Safety" },
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
                  { href: SITE_URL, label: "Vesperer", external: true },
                  { href: "#pipeline", label: "How it works" },
                  { href: "#pricing", label: "Pricing" },
                  {
                    href: `${SITE_URL}/#ownership`,
                    label: "Ownership",
                    external: true,
                  },
                  { href: "/legal/acceptable-use", label: "Safety" },
                ]
              : MARKETING_LINKS.map((l) => ({ ...l, external: false }))
            ).map((link) =>
              "external" in link && link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="hover:text-[var(--ink)]"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="hover:text-[var(--ink)]"
                >
                  {link.label}
                </Link>
              ),
            )}
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
              <a
                href={AFTER_DARK_URL}
                className="hover:text-[var(--ink)]"
              >
                After Dark (18+)
              </a>
            ) : null}
          </nav>
        </div>

        <p className="text-xs leading-relaxed text-[var(--muted)]/80">
          {variant === "after-dark"
            ? "After Dark is an adults-only zone on xxx.vesperer.com. Sexual content involving minors is strictly prohibited."
            : variant === "marketing"
              ? "Vesperer provides AI character infrastructure with identity, memory, and automated-interaction disclosures (EU AI Act transparency). Adult content is only in After Dark (xxx.vesperer.com), a separate 18+ zone."
              : "Automated AI interactions are disclosed per our Terms and Privacy Policy. Illegal and exploitative content is prohibited."}
        </p>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { LEGAL_PAGES } from "@/lib/legal/constants";
import { AFTER_DARK_URL, SITE_URL } from "@/lib/site";

const MARKETING_COLUMNS: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}[] = [
  {
    title: "Explore",
    links: [
      { href: "/explore", label: "Explore all" },
      { href: "/explore?filter=meet", label: "Great minds" },
      { href: "/explore?filter=learn", label: "Mentors & tutors" },
      { href: "/#voice", label: "Voice" },
    ],
  },
  {
    title: "Create",
    links: [
      { href: "/create/ai-character", label: "Create a persona" },
      { href: "/bring", label: "Bring a character" },
      { href: "/business", label: "For business" },
      { href: "/business/agencies", label: "For agencies" },
      { href: "/#creators", label: "For creators" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/docs", label: "API documentation" },
      { href: "/business/platforms", label: "For platforms" },
      { href: "/#cli", label: "CLI for agents" },
      { href: "/docs#cli", label: "CLI docs" },
      { href: "/technology", label: "Technology" },
      { href: "/help", label: "Help" },
    ],
  },
  {
    title: "Legal",
    links: [
      ...LEGAL_PAGES.map((p) => ({
        href: `/legal/${p.slug}`,
        label: p.title,
      })),
      { href: "/legal/terms", label: "AI Transparency" },
      { href: "/legal/acceptable-use", label: "Safety" },
      { href: "/report", label: "Report abuse" },
    ],
  },
  {
    title: "Private",
    links: [{ href: AFTER_DARK_URL, label: "After Dark 18+", external: true }],
  },
];

export function LegalFooter({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "marketing" | "after-dark";
}) {
  if (variant === "marketing") {
    return (
      <footer
        className={`border-t border-[var(--line)] px-4 py-10 text-sm text-[var(--muted)] sm:px-6 ${className ?? ""}`}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {MARKETING_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--ink)]">
                  {col.title}
                </p>
                <nav className="mt-3 flex flex-col gap-2">
                  {col.links.map((link) =>
                    link.external ? (
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
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-[var(--muted)]/80">
            Vesperer provides tools for creating and operating AI personas with
            persistent identity, memory and automated-interaction disclosure.
            Adult experiences are available only through the separate After Dark
            18+ service.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`border-t border-[var(--line)] px-4 py-8 text-sm text-[var(--muted)] sm:px-6 ${className ?? ""}`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {variant === "after-dark" ? (
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {(
              [
                { href: SITE_URL, label: "Vesperer", external: true },
                { href: "#pipeline", label: "How it works" },
                { href: "#pricing", label: "Pricing" },
                {
                  href: `${SITE_URL}/#ownership`,
                  label: "Ownership",
                  external: true,
                },
                { href: "/legal/acceptable-use", label: "Safety" },
              ] as const
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
          </nav>
        </div>

        <p className="text-xs leading-relaxed text-[var(--muted)]/80">
          {variant === "after-dark"
            ? "After Dark is an adults-only zone on xxx.vesperer.com. Sexual content involving minors is strictly prohibited."
            : "Automated AI interactions are disclosed per our Terms and Privacy Policy. Illegal and exploitative content is prohibited."}
        </p>
      </div>
    </footer>
  );
}

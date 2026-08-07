import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/LegalFooter";
import { MarketingNav } from "@/components/MarketingNav";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const description =
  "Back up a Chai character you own or have rights to. Paste description, prompts, opening messages, and Character Cards into Vesperer — rebuild a portable, versioned canonical persona.";

export const metadata: Metadata = {
  title: "Chai Character Backup",
  description,
  alternates: { canonical: `${SITE_URL}/chai-character-backup` },
  keywords: [
    "Back up a Chai character",
    "How to move a Chai character",
    "Chai character not remembering conversations",
    "How to improve Chai character memory",
    "import Chai character",
  ],
  openGraph: {
    title: `Chai Character Backup · ${SITE_NAME}`,
    description,
    url: `${SITE_URL}/chai-character-backup`,
    type: "website",
  },
};

export default function ChaiCharacterBackupPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <MarketingNav variant="marketing" />

      <header className="relative border-b border-[var(--line)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 70% at 20% 0%, var(--brand-glow), transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Backup & continuity
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">
            Give your Chai character a life outside Chai.
          </h1>
          <p className="mt-5 text-base text-[var(--muted)] sm:text-lg">
            Import what you created — description, prompts, openings, examples,
            Character Cards — and rebuild a versioned master on Vesperer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/bring"
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
            >
              Import your character
            </Link>
            <Link
              href="/chai-character-creator"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Create Chai-ready from scratch
            </Link>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
            Vesperer is not affiliated with or endorsed by Chai AI. We do not
            scrape Chai, access accounts automatically, or reverse-engineer their
            service. Only import content you own or have permission to use.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-4 py-16 sm:px-6">
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            What to bring
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>Description and personality prompt</li>
            <li>Opening / first messages</li>
            <li>Example dialogue</li>
            <li>Exported conversations you own</li>
            <li>Character Card created by you</li>
          </ul>
        </section>
        <section className="rounded-2xl border border-[var(--line)] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            After import
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            You get a portable persona with version history, knowledge packs,
            memory outside any single chat app, and exports back to Chai-ready
            fields when you want to republish.
          </p>
          <p className="mt-4 text-sm text-[var(--ink)]">
            Create the canonical version in Vesperer.
          </p>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}

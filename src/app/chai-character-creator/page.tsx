import type { Metadata } from "next";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const description =
  "Build a better Chai character before you publish it. Create the canonical version on Vesperer — personality, opening message, rules, and Chai-ready export — then paste into Chai manually.";

export const metadata: Metadata = {
  title: "Chai Character Creator",
  description,
  alternates: { canonical: `${SITE_URL}/chai-character-creator` },
  keywords: [
    "Chai character creator",
    "How to make a good Chai character",
    "Chai character prompt generator",
    "Chai character description template",
    "Best Chai character prompts",
    "Chai character alternative for creators",
  ],
  openGraph: {
    title: `Chai Character Creator · ${SITE_NAME}`,
    description,
    url: `${SITE_URL}/chai-character-creator`,
    type: "website",
  },
};

const steps = [
  {
    title: "Define the canonical persona",
    body: "Soul, style, rules, and context — versioned on Vesperer so you never lose the master.",
  },
  {
    title: "Export for Chai",
    body: "Get name, description, opening message, personality prompt, example dialogue, rules, and tags ready to paste.",
  },
  {
    title: "Publish anywhere",
    body: "Keep the original on Vesperer. Publish to Chai, SillyTavern, Telegram, web, or API — without locking identity to one platform.",
  },
];

export default function ChaiCharacterCreatorPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppNav variant="marketing" />

      <header className="relative border-b border-[var(--line)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 70% at 15% 0%, var(--brand-glow), transparent 55%), radial-gradient(ellipse 35% 50% at 85% 20%, var(--brand-glow-2), transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            For creators
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl md:text-6xl">
            Build a better Chai character before publishing it.
          </h1>
          <p className="mt-5 text-base text-[var(--muted)] sm:text-lg">
            Chai is where audiences chat. Vesperer is where you build, version,
            back up, and export the canonical persona.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/personas/new"
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
            >
              Start creating
            </Link>
            <Link
              href="/bring"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Back up an existing character
            </Link>
            <Link
              href="/registry"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Browse registry
            </Link>
          </div>
          <p className="mt-6 text-xs text-[var(--muted)]">
            Vesperer is not affiliated with or endorsed by Chai AI. Export is
            copy-paste ready — there is no automated publish into Chai.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-16 px-4 py-16 sm:px-6">
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            How it works
          </h2>
          <ol className="mt-8 space-y-6">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--accent)]">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg text-[var(--ink)]">{step.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/35 p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            What you get in the Chai-ready export
          </h2>
          <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
            <li>Character name</li>
            <li>Description</li>
            <li>Opening message</li>
            <li>Personality prompt</li>
            <li>Example dialogue</li>
            <li>Behavioral rules</li>
            <li>Suggested tags</li>
          </ul>
          <p className="mt-6 text-sm text-[var(--ink)]">
            Create the canonical version in Vesperer — then share{" "}
            <code className="text-[var(--accent)]">/p/your-slug</code> as the
            lasting identity page.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Keep the original. Publish everywhere.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Platform terms often grant broad licenses to host and redistribute
            what you upload. Vesperer keeps your master character under your
            control: versions, knowledge packs, forks, and exports for Chai,
            Character Card, SillyTavern, Telegram, and more.
          </p>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}

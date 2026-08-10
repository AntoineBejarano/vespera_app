import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";
import { MarketingNav } from "@/components/MarketingNav";
import type { RegistryListItem } from "@/lib/registry/public";

export type RegistryDisplayItem = RegistryListItem & {
  href: string;
  professional: boolean;
};

function PersonaGrid({
  personas,
  owner,
}: {
  personas: RegistryDisplayItem[];
  owner: "vesperer" | "community";
}) {
  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
      {personas.map((persona) => (
        <li key={persona.slug}>
          <Link
            href={persona.href}
            className="group flex h-full gap-4 rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)]/30 p-4 transition hover:border-[var(--accent)]/40"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--bg)]">
              {persona.photoUrl ? (
                <Image
                  src={persona.photoUrl}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover object-top"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-xl text-[var(--accent)]">
                  {(persona.name[0] || "?").toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h4 className="truncate font-[family-name:var(--font-display)] text-xl text-[var(--ink)] group-hover:text-[var(--accent)]">
                      {persona.name}
                    </h4>
                    <span className="text-xs text-[var(--muted)]">v{persona.version}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                    {persona.tagline}
                  </p>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] uppercase text-[var(--muted)]">
                <span className="rounded-full border border-[var(--line)] px-2 py-0.5">
                  {owner === "vesperer" ? "Owned by Vesperer" : `By ${persona.creatorLabel}`}
                </span>
                {persona.professional ? (
                  <span className="rounded-full border border-[var(--accent)]/35 bg-[var(--accent-soft)] px-2 py-0.5 text-[var(--accent)]">
                    Professional
                  </span>
                ) : null}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function RegistryIndex({
  ownedByVesperer,
  community,
}: {
  ownedByVesperer: RegistryDisplayItem[];
  community: RegistryDisplayItem[];
}) {
  const professionals = ownedByVesperer.filter((persona) => persona.professional);
  const characters = ownedByVesperer.filter((persona) => !persona.professional);
  const total = ownedByVesperer.length + community.length;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <MarketingNav variant="marketing" />

      <header className="relative border-b border-[var(--line)]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-18">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Persona Registry
          </p>
          <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--ink)] sm:text-5xl">
            Canonical identities, clearly owned.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-[var(--muted)] sm:text-lg">
            Explore {total} versioned personas maintained by Vesperer and the community.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/personas/new"
              className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
            >
              Create a persona
            </Link>
            <Link
              href="/bring"
              className="rounded-lg border border-[var(--line)] px-5 py-3 text-sm"
            >
              Import a persona
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  <BadgeCheck className="size-4" /> Official collection
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
                  Owned by Vesperer
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                  Built, maintained and versioned directly by Vesperer.
                </p>
              </div>
            </div>

            {professionals.length ? (
              <div className="mt-10">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--ink)]">Professionals</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">Ready for recurring work, voice and text.</p>
                  </div>
                  <Link href="/professionals/registry" className="text-sm text-[var(--accent)]">
                    Open Professional Registry
                  </Link>
                </div>
                <PersonaGrid personas={professionals} owner="vesperer" />
              </div>
            ) : null}

            {characters.length ? (
              <div className="mt-12">
                <div className="border-b border-[var(--line)] pb-3">
                  <h3 className="text-lg font-semibold text-[var(--ink)]">Characters &amp; minds</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">Historical minds, companions and original characters.</p>
                </div>
                <PersonaGrid personas={characters} owner="vesperer" />
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-[var(--bg-elevated)]/20">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-14">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
              Community
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Public personas published and owned by Vesperer creators.
            </p>

            {community.length ? (
              <PersonaGrid personas={community} owner="community" />
            ) : (
              <div className="mt-6 border-y border-[var(--line)] py-10">
                <h3 className="text-lg font-semibold text-[var(--ink)]">No community personas published yet</h3>
                <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                  The first public persona will appear here with its creator and license clearly identified.
                </p>
                <Link href="/personas/new" className="mt-5 inline-flex text-sm font-medium text-[var(--accent)]">
                  Create the first community persona <ArrowRight className="ml-1 size-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}

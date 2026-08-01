import Image from "next/image";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import type { RegistryListItem } from "@/lib/registry/public";

export function RegistryIndex({ personas }: { personas: RegistryListItem[] }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppNav variant="marketing" />

      <header className="relative border-b border-[var(--line)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 70% at 20% 0%, var(--brand-glow), transparent 55%), radial-gradient(ellipse 40% 50% at 90% 30%, var(--brand-glow-2), transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Persona Registry
          </p>
          <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl md:text-6xl">
            Create on Vesperer.
            <br />
            Publish anywhere.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-[var(--muted)] sm:text-lg">
            Canonical identities for creators — versions, licenses, knowledge,
            and exports. Not another chat catalog.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/personas/new"
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
            >
              Create a persona
            </Link>
            <Link
              href="/chai-character-creator"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Chai-ready creator
            </Link>
            <Link
              href="/bring"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Import / backup
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Public personas
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Fork, export, or keep building on the canonical page.
            </p>
          </div>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {personas.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/p/${p.slug}`}
                className="group flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/30 p-4 transition hover:border-[var(--accent)]/40"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg)]">
                  {p.photoUrl ? (
                    <Image
                      src={p.photoUrl}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-xl text-[var(--accent)]">
                      {(p.name[0] || "?").toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] group-hover:text-[var(--accent)]">
                      {p.name}
                    </h3>
                    <span className="text-xs text-[var(--muted)]">
                      v{p.version}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                    {p.tagline}
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--muted)]">
                    by {p.creatorLabel}
                    <span className="mx-1.5">·</span>
                    {p.licenseLabel}
                    {p.forkCount > 0 ? (
                      <>
                        <span className="mx-1.5">·</span>
                        {p.forkCount} forks
                      </>
                    ) : null}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <LegalFooter />
    </div>
  );
}

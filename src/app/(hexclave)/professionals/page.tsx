import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BrainCircuit, GraduationCap, Mic, ShieldCheck } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";
import { MarketingNav } from "@/components/MarketingNav";
import { isProfessionalPersona, professionalRole } from "@/lib/professionals";
import { listRegistryPersonas } from "@/lib/registry/public";
import "@/styles/professionals-public.css";

export const metadata: Metadata = {
  title: "Vesperer Professionals",
  description:
    "Professors, coaches, mentors and experts with persistent memory, voice and auditable evidence.",
};

const capabilities = [
  { icon: BrainCircuit, label: "Continuous memory" },
  { icon: Mic, label: "Voice and text" },
  { icon: ShieldCheck, label: "Inspectable evidence" },
];

export default async function ProfessionalsPage() {
  const all = await listRegistryPersonas({ adult: false, limit: 48 });
  const professionals = all.filter((persona) =>
    isProfessionalPersona(persona.categories),
  );

  return (
    <div className="professionals-theme">
      <MarketingNav />

      <header className="professionals-hero border-b border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
            Vesperer Professionals
          </p>
          <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-display)] text-4xl font-semibold sm:text-6xl">
            Work with a mind that remembers the work.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            Professors, coaches, mentors and specialist advisors with continuity across sessions, voice and channels.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/professionals/registry"
              className="inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
            >
              Open Professionals <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/personas/new"
              className="border border-[var(--line)] px-5 py-3 text-sm"
            >
              Create a professional
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-[var(--line)] pt-5">
            {capabilities.map(({ icon: Icon, label }) => (
              <span key={label} className="professionals-capability flex items-center gap-2 text-sm">
                <Icon className="size-4 text-[var(--accent)]" /> {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">Directory</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold">Choose how you want to grow</h2>
          </div>
          <Link href="/professionals/registry" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">View professional registry</Link>
        </div>

        {professionals.length ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {professionals.map((professional) => (
              <li key={professional.slug} className="professionals-directory-item overflow-hidden border border-[var(--line)]">
                <Link href={`/p/${professional.slug}`} className="group block">
                  <div className="relative aspect-[16/9] overflow-hidden border-b border-[var(--line)] bg-[var(--bg-elevated)]">
                    {professional.photoUrl ? (
                      <Image src={professional.photoUrl} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover object-top transition duration-300 group-hover:scale-[1.02]" />
                    ) : (
                      <div className="grid h-full place-items-center"><GraduationCap className="size-9 text-[var(--accent)]" /></div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold group-hover:text-[var(--accent)]">{professional.name}</h3>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">{professionalRole(professional.categories)}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--muted)]">{professional.tagline}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Professors", "Coaches", "Mentors", "Advisors"].map((role) => (
              <Link key={role} href="/professionals/registry" className="border-y border-[var(--line)] py-8">
                <GraduationCap className="size-5 text-[var(--accent)]" />
                <h3 className="mt-4 text-lg font-semibold">{role}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">Persistent expertise with a relationship that develops over time.</p>
              </Link>
            ))}
          </div>
        )}
      </main>

      <LegalFooter />
    </div>
  );
}

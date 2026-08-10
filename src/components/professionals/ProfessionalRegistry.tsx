"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

export type ProfessionalRegistryEntry = {
  slug: string;
  href: string;
  name: string;
  tagline: string;
  role: "Professor" | "Coach" | "Mentor" | "Advisor" | "Professional";
  categories: string[];
  photoUrl: string | null;
  creatorLabel: string;
  channelLabels: string[];
  curated: boolean;
};

const filters = ["All", "Professor", "Coach", "Mentor", "Advisor"] as const;
type Filter = (typeof filters)[number];

export function ProfessionalRegistry({
  professionals,
}: {
  professionals: ProfessionalRegistryEntry[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const counts = useMemo(
    () =>
      Object.fromEntries(
        filters.map((item) => [
          item,
          item === "All"
            ? professionals.length
            : professionals.filter((professional) => professional.role === item)
                .length,
        ]),
      ),
    [professionals],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("en");
    return professionals.filter((professional) => {
      if (filter !== "All" && professional.role !== filter) return false;
      if (!needle) return true;
      return [
        professional.name,
        professional.tagline,
        professional.role,
        professional.creatorLabel,
        ...professional.categories,
      ]
        .join(" ")
        .toLocaleLowerCase("en")
        .includes(needle);
    });
  }, [filter, professionals, query]);

  return (
    <main id="registry" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="professional-registry-controls">
        <label className="professional-registry-search">
          <Search className="size-4" aria-hidden="true" />
          <span className="sr-only">Search professionals</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, role or expertise"
          />
        </label>

        <div className="professional-registry-filters" aria-label="Filter by role">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
              className={filter === item ? "is-active" : undefined}
            >
              <span>{item}</span>
              <small>{counts[item]}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <p className="text-sm text-[var(--muted)]">
          {visible.length} {visible.length === 1 ? "professional" : "professionals"}
        </p>
        <p className="hidden items-center gap-1.5 text-xs text-[var(--muted)] sm:flex">
          <CheckCircle2 className="size-3.5 text-[var(--accent)]" /> Ready for conversations
        </p>
      </div>

      {visible.length ? (
        <ul className="professional-registry-grid">
          {visible.map((professional) => (
            <li key={professional.slug} className="professional-registry-card">
              <Link href={professional.href} className="group block h-full">
                <div className="professional-registry-photo">
                  {professional.photoUrl ? (
                    <Image
                      src={professional.photoUrl}
                      alt=""
                      fill
                      sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
                      className="object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <Users className="size-8 text-[var(--accent)]" />
                    </div>
                  )}
                  <span className="professional-ready-label">
                    <span aria-hidden="true" /> Ready
                  </span>
                </div>

                <div className="professional-registry-body">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase text-[var(--accent)]">
                        {professional.role}
                      </p>
                      <h2 className="mt-1 truncate text-xl font-semibold">{professional.name}</h2>
                    </div>
                    {professional.curated ? (
                      <span className="professional-curated-label">Vesperer curated</span>
                    ) : null}
                  </div>

                  <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--muted)]">
                    {professional.tagline}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {professional.channelLabels.slice(0, 3).map((channel) => (
                      <span key={channel} className="professional-channel-label">{channel}</span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">
                    <span className="truncate">By {professional.creatorLabel}</span>
                    <span className="flex shrink-0 items-center gap-1 font-medium text-[var(--ink)]">
                      View profile <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="professional-registry-empty">
          <Search className="mx-auto size-6 text-[var(--accent)]" />
          <h2 className="mt-4 text-xl font-semibold">No professionals match this search</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Try another role or a broader search.</p>
          <button type="button" onClick={() => { setFilter("All"); setQuery(""); }}>
            Clear filters
          </button>
        </div>
      )}
    </main>
  );
}

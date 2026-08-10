"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { MindGraphData } from "@/lib/persona/mind-graph";

const ObsidianMindGraph = dynamic(
  () =>
    import("@/components/persona/ObsidianMindGraph").then(
      (m) => m.ObsidianMindGraph,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0b0d10]">
        <p className="text-sm text-[var(--muted)]">Loading mind graph…</p>
      </div>
    ),
  },
);

export function PublicMindPreview({
  slug,
  theme = "dark",
}: {
  slug: string;
  theme?: "dark" | "light";
}) {
  const [graph, setGraph] = useState<MindGraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/public/characters/${encodeURIComponent(slug)}/graph`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load mind");
        if (cancelled) return;
        setGraph(data.graph ?? { nodes: [], links: [] });
        setError(null);
        setLoadedFor(slug);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Graph error");
        setGraph({ nodes: [], links: [] });
        setLoadedFor(slug);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loadedFor !== slug) {
    return (
      <div
        className={`flex h-[480px] items-center justify-center rounded-2xl border border-[var(--line)] ${
          theme === "light" ? "bg-[#f3f7f5]" : "bg-[#0b0d10]"
        }`}
      >
        <p className="text-sm text-[var(--muted)]">Mapping their mind…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-[var(--line)]">
        <p className="text-sm text-[var(--danger)]">{error}</p>
      </div>
    );
  }

  return (
    <ObsidianMindGraph
      data={graph ?? { nodes: [], links: [] }}
      height={520}
      emptyHint="This mind has no public layers yet."
      theme={theme}
    />
  );
}

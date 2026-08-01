"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
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

type GraphPayload = {
  personaId: string;
  graph: MindGraphData;
  stats: {
    nodeCount: number;
    linkCount: number;
    memoryTotal: number;
    relationshipTotal: number;
    obsidianNotes: number;
  } | null;
  error: string | null;
};

export function PersonaMindGraph({ personaId }: { personaId: string }) {
  const [payload, setPayload] = useState<GraphPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/characters/${personaId}/graph`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load mind graph");
        if (cancelled) return;
        setPayload({
          personaId,
          graph: data.graph ?? { nodes: [], links: [] },
          stats: data.stats ?? null,
          error: null,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setPayload({
          personaId,
          graph: { nodes: [], links: [] },
          stats: null,
          error: e instanceof Error ? e.message : "Graph error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [personaId]);

  const ready = payload?.personaId === personaId ? payload : null;
  const loading = !ready;

  if (loading) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0b0d10]">
        <p className="text-sm text-[var(--muted)]">Opening her mind…</p>
      </div>
    );
  }

  if (ready.error) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-[var(--line)]">
        <p className="text-sm text-[var(--danger)]">{ready.error}</p>
      </div>
    );
  }

  const sparse = ready.graph.nodes.length <= 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
            Mind graph
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Sigma + ForceAtlas2 map of soul, knowledge, beliefs and channels —
            built from real mind documents and vault structure.
          </p>
        </div>
        {ready.stats ? (
          <p className="text-xs text-[var(--muted)]">
            {ready.stats.nodeCount} nodes · {ready.stats.linkCount} links ·{" "}
            {ready.stats.obsidianNotes} Obsidian notes ·{" "}
            {ready.stats.memoryTotal} memories
          </p>
        ) : null}
      </div>

      {sparse ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-elevated)]/40 px-6 py-8 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Her mind is still waking up
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Fill Soul / Style / Rules / Context, connect Obsidian, or start
            chatting — the graph grows from real content.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href={`/chat?characterId=${personaId}`}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-ink)]"
            >
              Test chat
            </Link>
          </div>
        </div>
      ) : null}

      <ObsidianMindGraph
        data={ready.graph}
        height={560}
        emptyHint="Write identity layers or sync an Obsidian vault to populate the mind."
      />
    </div>
  );
}

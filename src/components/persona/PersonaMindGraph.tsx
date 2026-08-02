"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MindActivityHit } from "@/lib/chat/mind-context";
import type { MindGraphData, MindUniverse } from "@/lib/persona/mind-graph";

const NeuralMindGraph = dynamic(
  () =>
    import("@/components/persona/NeuralMindGraph").then(
      (m) => m.NeuralMindGraph,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-sm text-muted-foreground">Loading mind graph…</p>
      </div>
    ),
  },
);

type SubjectOption = {
  id: string;
  displayName: string;
};

type GraphPayload = {
  personaId: string;
  subjectId: string | null;
  graph: MindGraphData;
  subjects: SubjectOption[];
  stats: {
    nodeCount: number;
    linkCount: number;
    memoryTotal: number;
    relationshipTotal: number;
    obsidianNotes: number;
    subjectScoped?: boolean;
  } | null;
  error: string | null;
};

export function PersonaMindGraph({
  personaId,
  activity = [],
}: {
  personaId: string;
  activity?: MindActivityHit[];
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | "">("");
  const [universe, setUniverse] = useState<MindUniverse | "all">("all");
  const [payload, setPayload] = useState<GraphPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    const qs = selectedSubjectId
      ? `?subjectId=${encodeURIComponent(selectedSubjectId)}`
      : "";
    void fetch(`/api/characters/${personaId}/graph${qs}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load mind graph");
        if (cancelled) return;
        setPayload({
          personaId,
          subjectId: selectedSubjectId || null,
          graph: data.graph ?? { nodes: [], links: [] },
          subjects: data.subjects ?? [],
          stats: data.stats ?? null,
          error: null,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setPayload({
          personaId,
          subjectId: selectedSubjectId || null,
          graph: { nodes: [], links: [] },
          subjects: [],
          stats: null,
          error: e instanceof Error ? e.message : "Graph error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [personaId, selectedSubjectId]);

  const ready =
    payload?.personaId === personaId &&
    payload.subjectId === (selectedSubjectId || null)
      ? payload
      : null;
  const loading = !ready;

  if (loading) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-sm text-muted-foreground">Opening her mind…</p>
      </div>
    );
  }

  if (ready.error) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-border">
        <p className="text-sm text-destructive">{ready.error}</p>
      </div>
    );
  }

  const pulseUniverses: MindUniverse[] = [];
  for (const hit of activity) {
    if (hit.kind === "memory") pulseUniverses.push("memory");
    if (hit.kind === "knowledge") pulseUniverses.push("knowledge");
    if (hit.kind === "affect" || hit.kind === "relationship")
      pulseUniverses.push("affect");
    if (hit.kind === "intention") pulseUniverses.push("intentions");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Living mind
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            See who they are, what they know, who they remember, how
            relationships evolve, what they want and what they can do.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/personas/${personaId}/memory`}>Memory</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/knowledge?characterId=${personaId}`}>Sources</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Viewing
        </label>
        <select
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground"
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
        >
          <option value="">General persona</option>
          {ready.subjects.map((s) => (
            <option key={s.id} value={s.id}>
              Relationship with {s.displayName}
            </option>
          ))}
        </select>
        {!selectedSubjectId ? (
          <span className="text-[11px] text-muted-foreground">
            Select a relationship to see Affect & Intentions
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <NeuralMindGraph
            data={ready.graph}
            activeUniverse={universe}
            onUniverseChange={setUniverse}
            pulseUniverses={[...new Set(pulseUniverses)]}
            activityActive={activity.length > 0}
            height={520}
            emptyHint="Add soul layers, knowledge packs, or chat to grow this mind."
          />
        </div>
        <div className="flex min-h-[320px] flex-col rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Mind Activity
          </h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Retrieved context and relationship state — not model chain-of-thought.
          </p>
          <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Chat with this persona to see memories, knowledge hits, and open
                intentions used in a turn.
              </p>
            ) : (
              activity.map((hit, i) => (
                <div
                  key={`${hit.kind}-${i}`}
                  className="rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                >
                  <p className="text-[11px] font-medium capitalize text-foreground">
                    {hit.label}
                  </p>
                  {hit.detail ? (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {hit.detail}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
          {ready.stats ? (
            <p className="mt-3 border-t border-border pt-3 text-[10px] text-muted-foreground">
              {ready.stats.nodeCount} nodes · {ready.stats.linkCount} links
              {ready.stats.subjectScoped ? " · relationship view" : ""}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
